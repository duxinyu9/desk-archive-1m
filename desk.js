import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { recolorModel, classify } from './palette.js';
import { InkRenderer } from './ink-renderer.js?v=5';

const stage = document.getElementById('stage');
// The terminal intro is now owned by the About entry page.
function failLoader(error) {
 let status=document.getElementById('status');
 if(!status){status=document.createElement('div');status.id='status';stage.appendChild(status);}
 const message=document.createElement('p');message.textContent='桌面模型加载失败，请重试。 / Desk model failed to load. Please retry.';
 const retry=document.createElement('button');retry.textContent='重新加载 / Reload';retry.onclick=()=>location.reload();
 status.replaceChildren(message,retry);status.hidden=false;
}
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
window.deskScene = scene; // debug/inspection hook
const camera = new THREE.PerspectiveCamera(34, stage.clientWidth / stage.clientHeight, .05, 500);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1); renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);
const ink = new InkRenderer(renderer, scene, camera); ink.setSize(stage.clientWidth, stage.clientHeight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .075;
scene.add(new THREE.HemisphereLight('#ffffff', '#ffffff', .65));
const key = new THREE.DirectionalLight('#ffffff', 2.6); key.position.set(-5, 9, -4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .1, far: 30 });
key.shadow.normalBias = .035; scene.add(key);
const fill = new THREE.DirectionalLight('#ffffff', .25); fill.position.set(4, 5, -6); scene.add(fill);

// One accent color for everything interactive, matching the pixel UI.
const ACCENT = '#49b248';
const HOVER_COLOR = '#a6a6a6';
// The original assets remain available for comparison at ?models=original.
const USE_EXHIBITS = new URLSearchParams(location.search).get('models') !== 'original';
const OBJECT_INDEX = {
 desk: { num: '05', name: '电脑桌 COMPUTER DESK', desc: "桌面围绕中轴管转动，在水平的实体工作台与竖直的信息界面之间切换。通过转动与观看，体验现实与虚拟桌面的不同使用方式，以及信息如何被分类、组织和调用。", descEn: "The tabletop rotates around a central tube, switching between a horizontal physical work surface and a vertical information interface. Rotating and viewing it reveals different ways of using physical and virtual desktops, and how information is classified, organized and retrieved.", type: '桌面类型学', material: '木材、金属、玻璃', added: '—', tags: "实体桌面、虚拟界面、旋转、信息管理", tagsEn: "Physical desktop, virtual interface, rotation, information management" },
 book: { num: '01', name: '书本 BOOKS', desc: '文学中的桌面意象，以及关于桌面的语言表达。\nThe desk as it appears in literature, and the language used to describe it.', type: '文学与书写', material: '纸张', added: '2023-11-14', tags: '文学意象, 书写, 阅读' },
 phone: { num: '02', name: '电话 TELEPHONE', desc: '通往外界的直线：灵感刚开始涌现，电话往往就响了。\nA direct line to the outside world. Mostly rings exactly when an idea starts flowing.', type: '实体物品', material: '塑料', added: '2024-01-09', tags: '通讯, 复古' },
 computer: { num: '03', name: '电脑 COMPUTER', desc: '桌面的运转核心：每一次实验、每一份草稿和每一个原型，都在这里完成。\nThe engine of the desk. Every experiment, draft and prototype passes through here.', type: '实体物品', material: '金属、玻璃', added: '2023-08-21', tags: '工作, 编程, 设计' },
 note: { num: '04', name: '便签 NOTES', desc: '尚未成形的计划，散落在一张张便签上。纸张便宜，想法珍贵。\nSticky fragments of half-formed plans. Cheap paper, expensive thoughts.', type: '实体物品', material: '纸张', added: '2024-03-02', tags: '想法, 草图' },
 frame: { num: '05', name: '相框 FRAME', desc: '通向别处的一扇小窗：提醒我们，桌子在房间里，房间也在世界之中。\nA small window into somewhere else. A reminder that desks sit in rooms, and rooms in the world.', type: '实体物品', material: '木材、玻璃', added: '2023-06-17', tags: '记忆, 艺术' },
 lamp: { num: '06', name: '灯 LAMP', desc: '天黑之后点亮灵感：每晚最后熄灭的那盏灯。\nKeeps the ideas lit after dark. The last thing switched off at night.', type: '实体物品', material: '金属', added: '2023-09-30', tags: '照明, 专注' },
 greenCabinet: { num: '09', name: '文件柜 CABINET', desc: '归档的秩序：分类、收纳的桌面。\nThe order of archiving: classification, storage, and institutional desks.', type: '归档与秩序', material: '—', added: '—', tags: '归档, 收纳, 制度' },
 dining: { num: '02', name: '餐桌 DINING TABLE', desc: "共食也包含协商与博弈。展具通过弹簧结构，使两侧座椅能够上下移动。参与者坐下并改变重心，在起伏中感受彼此的影响与平衡，同时阅读桌面上的展览信息。", descEn: "Sharing a meal also involves negotiation and competing interests. A spring mechanism allows the seats on either side to move vertically. Participants sit down and shift their weight, feeling their influence on one another and their changing balance while reading the exhibition material on the tabletop.", type: '桌面类型学', material: '木材、玻璃', added: '—', tags: "共食、协商、博弈、平衡", tagsEn: "Shared meals, negotiation, competing interests, balance" },
 drafting: { num: '04', name: '绘图桌 DRAWING TABLE', desc: "倾斜、对称的桌面连接测量与创造，桌面上方的信息架与结构相互关联。观众面向斜面阅读，观察倾角、对称与尺度，思考人如何理解空间并展开创造。", descEn: "An inclined, symmetrical tabletop connects measurement with creation, while an information rack above it relates the content to the structure. Visitors read from the sloping surface and observe its angle, symmetry and scale, considering how people understand space and create within it.", type: '桌面类型学', material: '木材、金属', added: '—', tags: "测量、创造、倾角、对称", tagsEn: "Measurement, creation, tilt, symmetry" },
 school: { num: '03', name: '课桌 SCHOOL DESK', desc: "约四米长的连续木板坡面由高约一米延伸至近地面，替代一排被分配的课桌。参与者按身高与姿态选择位置，让物件从高处依次滑过三人的位置，体验由桌面形态自然促成的传递与秩序。", descEn: "A continuous wooden slope, about four meters long, descends from roughly one meter high to near the floor, replacing a row of assigned desks. Participants choose positions according to their height and posture. Objects slide down through three participants’ positions, allowing passing and order to emerge from the tabletop’s form.", type: '桌面类型学', material: '木材、金属', added: '—', tags: "教育、位置选择、传递、秩序", tagsEn: "Education, choosing positions, passing objects, order" },
 altar: { num: '01', name: '祭坛 ALTAR', desc: "祭坛以带有可开启小门的台形结构，承载信仰、愿望与希望。观众打开小门、俯身进入，从外部观看者成为内部参与者，以身体感受寄托与承载的关系。", descEn: "A tapered structure with a small opening door holds faith, wishes and hope. Visitors open the door and bend down to enter, moving from outside observers to participants within. The body becomes a way to explore the relationship between what is entrusted and what carries it.", type: '桌面类型学', material: '石材、木材', added: '—', tags: "信仰、希望、寄托、身体参与", tagsEn: "Faith, hope, entrusting, bodily participation" },
 candle: { num: '07', name: '蜡烛 CANDLES', desc: '祭坛上的火：光是第一份抵达另一重世界的供品。\nFire on the altar: light is the first offering to reach the other world.', type: '仪式与供品', material: '蜡', added: '—', tags: '火, 光, 供奉' },
 prayer: { num: '08', name: '祝辞 PRAYER', desc: '摊开的书页写着送往他处的文字：祈祷是被朗读的地址。\nAn open book of words sent elsewhere: a prayer is an address read aloud.', type: '仪式与供品', material: '纸张', added: '—', tags: '祈祷, 文字, 祝辞' },
 curtain: { num: '10', name: '帷布 ALTAR CLOTH', desc: '覆盖祭坛的布：划分神圣与日常的边界。\nThe cloth over the altar: a border between the sacred and the everyday.', type: '仪式与供品', material: '织物', added: '—', tags: '帷布, 覆盖, 圣域' },
 stationery: { num: '11', name: '文具 STATIONERY', desc: '铅笔与钢笔：一代人写下的第一行字。\nPencils and pens: the first line a generation ever wrote.', type: '教育与书写', material: '木材、金属', added: '—', tags: '书写, 学习, 工具' },
 penholder: { num: '12', name: '笔筒 PEN HOLDER', desc: '铅笔与橡皮的营地：课桌上最拥挤的角落。\nA camp for pencils and erasers: the most crowded corner of a school desk.', type: '教育与书写', material: '塑料', added: '—', tags: '文具, 收纳, 课间' },
 exampaper: { num: '15', name: '试卷 EXAM PAPER', desc: '被打分的平面：一代人的紧张都印在折叠的纸上。\nThe graded surface: a generation’s nerves printed on folded sheets.', type: '教育与书写', material: '纸张', added: '—', tags: '考试, 规训, 分数' },
 textbook: { num: '16', name: '课本 TEXTBOOKS', desc: '被翻旧的标准答案：知识按学期切分。\nWell-worn standard answers: knowledge sliced by semester.', type: '教育与书写', material: '纸张', added: '—', tags: '教材, 学习, 记忆' },
 ruler: { num: '17', name: '尺子 RULER', desc: '图板上唯一的直线：所有倾斜都从它开始。\nThe only straight line on the board: every tilt begins with it.', type: '工作与工作台', material: '木材', added: '—', tags: '测量, 直线, 工具' },
 stool: { num: '13', name: '凳子 STOOL', desc: '绘图者的座位：高度决定视线的角度。\nThe drafter’s seat: height sets the angle of looking.', type: '工作与工作台', material: '木材、金属', added: '—', tags: '坐具, 工作, 姿势' },
 draftpaper: { num: '14', name: '图纸 DRAWINGS', desc: '摊开的图纸：尚未建成的世界。\nSheets spread out: worlds not yet built.', type: '工作与工作台', material: '纸张', added: '—', tags: '绘图, 设计, 纸' },
 plate: { num: '18', name: '盘子 PLATES', desc: '每人面前的圆：盛宴被切分成均等的一份。\nA circle before each seat: the feast divided into equal portions.', type: '饮食与仪式', material: '陶瓷', added: '—', tags: '餐具, 圆, 盛放' },
 cutlery: { num: '19', name: '餐具 CUTLERY', desc: '刀叉的顺序就是餐桌的礼仪：谁先动手，谁后动手。\nThe order of knife and fork is table manners itself: who starts, who waits.', type: '饮食与仪式', material: '金属', added: '—', tags: '刀叉, 礼仪, 秩序' },
 wineglass: { num: '20', name: '酒杯 WINE GLASSES', desc: '举起的瞬间，桌面变成仪式：碰杯是最短的祝辞。\nThe moment it is raised, the table becomes a ritual: a toast is the shortest prayer.', type: '饮食与仪式', material: '玻璃', added: '—', tags: '碰杯, 仪式, 欢庆' }
};

// ---- 点击各展具的桌面进入对应的「桌面坐标系」页面 ----
const COORD_PAGE = './coordinates/index.html';
const JUMP_ROLE = { desk: 'computer', altar: 'prayer', dining: 'plate', school: 'textbook', drafting: 'draftpaper' };
let coordinateTimer = null;
// 半透明覆盖层打开坐标系：底下的档案站场景隐约可见，点返回键或 Esc 关闭
function openCoordOverlay(unit) {
 if (window.SFX) SFX.play('click');
 let ov = document.getElementById('coord-overlay');
 if (!ov) {
  ov = document.createElement('div');
  ov.id = 'coord-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:100;background:transparent;';
  const f = document.createElement('iframe');
  f.id = 'coord-frame';
  f.style.cssText = 'width:100%;height:100%;border:0;display:block;opacity:.93;background:transparent;';
  f.setAttribute('allowtransparency', 'true');
  ov.appendChild(f);
  document.body.appendChild(ov);
 }
 ov.querySelector('iframe').src = COORD_PAGE + '?unit=' + unit;
 ov.hidden = false;
}
function closeCoordOverlay() {
 clearTimeout(coordinateTimer); coordinateTimer = null;
 clearObjectFeedback();
 const ov = document.getElementById('coord-overlay');
 if (!ov || ov.hidden) return;
 ov.hidden = true;
 ov.querySelector('iframe').src = 'about:blank';
 if (window.SFX) SFX.play('click');
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeCoordOverlay(); });
window.addEventListener('message', e => { if (e.data && e.data.type === 'coord-close') closeCoordOverlay(); });
function goCoordinates() {
 const unit = viewMode === 'desk' ? 'computer' : viewMode;
 openCoordOverlay(unit);
}

const meshGroup = new Map();
let hoverGroup = null, selectedRole = null;
let activeListRecord = window.deskActiveRecord || null;
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
window.deskDebug = { state: 'loading', modelUrl: new URL(USE_EXHIBITS ? './assets/exhibits/05-computer.glb' : './assets/desktop.glb', import.meta.url).href };
let model, deskModel = null, deskWrapper = null;
// Match the original SketchUp tabletop components, excluding stools and supports.
const EXHIBIT_TABLETOPS = {
 altar: /^高展台玻璃$/,
 dining: /^宴席长桌玻璃/,
 school: /^齐边玻璃/,
 drafting: /^双斜连脊玻璃$/,
 desk: /^[正背]面｜电子屏(?:占位|｜正面显示区)/
};
const TABLETOP_MIN_UP = .5;
function buildExhibitHoverGroup(view) {
 if (!model || !model.userData.exhibitUnit) return false;
 const group = { role: JUMP_ROLE[view], meshes: [], minWorldUp: view === 'desk' ? -1 : TABLETOP_MIN_UP };
 const pattern = EXHIBIT_TABLETOPS[view];
 model.traverse(node => {
  if (!node.isMesh) return;
  for (let part = node; part && part !== model; part = part.parent) {
   if (pattern && pattern.test(part.userData.sketchupName || part.name)) {
    group.meshes.push(node); meshGroup.set(node, group); break;
   }
  }
 });
 window.deskDebug = { ...window.deskDebug, exhibitUnit: model.userData.exhibitUnit, viewRoles: group.meshes.length ? [group.role] : [], pickSurface: view === 'desk' ? 'computer-screen' : 'tabletop', tabletopMeshCount: group.meshes.length };
 return true;
}
function recolorExhibitModel(root) {
 const cache = new Map(); let meshes = 0;
 root.traverse(node => {
  if (!node.isMesh) return;
  meshes++; node.castShadow = true; node.receiveShadow = true;
  const convert = original => {
   if (cache.has(original)) return cache.get(original);
   const material = original.clone();
   material.color.set(/显示面/.test(original.name) ? '#a6a6a6' : /边框/.test(original.name) ? '#4f4f4f' : /封边绿/.test(original.name) ? '#b8b8b8' : '#ffffff');
   material.roughness = .95; material.metalness = 0; material.flatShading = true;
   // Keep the real glass transparent, including the visible joints below it.
   if (material.transparent) { material.depthWrite = false; node.castShadow = false; }
   cache.set(original, material); return material;
  };
  node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material);
 });
 return { meshes, exhibitUnit: root.userData.exhibitUnit, modelSource: 'provided-sketchup' };
}
// Initial and reset views follow the five approved screenshots.
const EXHIBIT_CAMERA_PRESETS = {
 "altar": {
  "camera": [
   -1.3213077,
   3.0663647,
   1.7570111
  ],
  "target": [
   0.2029921,
   1.0086061,
   -0.3800439
  ],
  "referenceAspect": 1.075356415478615
 },
 "dining": {
  "camera": [
   0.0067634,
   2.3157763,
   3.6491122
  ],
  "target": [
   0.0150267,
   0.6092397,
   -0.0884271
  ],
  "referenceAspect": 1.0735294117647058
 },
 "school": {
  "camera": [
   -1.3054665,
   2.0158693,
   0.7273994
  ],
  "target": [
   0.8830273,
   0.4213249,
   -0.6245361
  ],
  "referenceAspect": 1.0773042616451933
 },
 "drafting": {
  "camera": [
   -0.5948265,
   2.4492714,
   1.9609101
  ],
  "target": [
   1.5991656,
   0.6640511,
   -1.1335684
  ],
  "referenceAspect": 1.057199211045365
 },
 "desk": {
  "camera": [
   -1.4912664,
   3.2605374,
   -2.5597125
  ],
  "target": [
   -0.0490105,
   0.9867963,
   0.0157887
  ],
  "referenceAspect": 1.0621865596790372
 }
};
function frameExhibitModel() {
 model.updateWorldMatrix(true, true);
 const preset = EXHIBIT_CAMERA_PRESETS[model.userData.exhibitUnit];
 if (!preset) return;
 // Consume any previous orbit/pan damping before applying the saved view.
 const damping = controls.enableDamping;
 controls.enableDamping = false; controls.update();
 const target = model.localToWorld(new THREE.Vector3().fromArray(preset.target));
 const eye = model.localToWorld(new THREE.Vector3().fromArray(preset.camera));
 const rect = stage.getBoundingClientRect();
 const fit = Math.max(1, preset.referenceAspect / Math.max(rect.width / rect.height, .1));
 eye.sub(target).multiplyScalar(fit).add(target);
 controls.target.copy(target); camera.position.copy(eye);
 camera.lookAt(target); controls.update(); controls.enableDamping = damping;
 window.deskCam = { camera, controls };
 const bounds = new THREE.Box3().setFromObject(model);
 window.deskDebug = { ...window.deskDebug, framed: 'exhibit-' + model.userData.exhibitUnit, cameraPreset: model.userData.exhibitUnit, frameDist: camera.position.distanceTo(target), exhibitSize: bounds.getSize(new THREE.Vector3()).toArray() };
}
function buildHoverGroups() {
 if (buildExhibitHoverGroup('desk')) return;
 const groups = new Map();
 model.traverse(node => {
  if (!node.isMesh) return;
  const { role, node: anchor } = classify(node, model);
  if (role === 'floor' || role === 'wall') return;
  let group = groups.get(anchor);
  if (!group) { group = { role, meshes: [] }; groups.set(anchor, group); }
  group.meshes.push(node);
 });
 for (const group of groups.values()) group.meshes.forEach(mesh => meshGroup.set(mesh, group));
 // Books piled on the file cabinets (model-local x < -6.5) are pure scenery:
 // no hover fill, no pointer cursor, no click archive. The desk's own books
 // stay interactive. Note: anchors sit inside a scaled/recentered wrapper,
 // so compare in model-local (raw GLB) coordinates.
 model.updateMatrixWorld(true);
 const wp = new THREE.Vector3();
 for (const [anchor, group] of groups) {
  if (group.role !== 'book') continue;
  anchor.getWorldPosition(wp);
  model.worldToLocal(wp);
  if (wp.x < -6.5) group.role = 'bookStatic';
 }
}
function roleMeshes(role) {
 const meshes = [];
 for (const [mesh, group] of meshGroup) if (group.role === role) meshes.push(mesh);
 return meshes;
}
// Hover dims the ink drawing; clicks briefly flash green, then restore it.
// Desk and chair are scenery: never color-filled.
const NOFILL = { desk: 1, chair: 1, chairFrame: 1, bookStatic: 1, paperStatic: 1 };
// Legacy scenery roles; exhibit picking stops at the nearest visible surface.
const STATIC = { bookStatic: 1, paperStatic: 1 };
function refreshHighlight() {
 const role = hoverGroup ? hoverGroup.role : selectedRole;
 const meshes = role ? roleMeshes(role) : null;
 const filled = !!(meshes && meshes.length && !NOFILL[role]);
 const color = role === selectedRole ? ACCENT : HOVER_COLOR;
 if (filled) ink.setHover(meshes, color, model?.userData.exhibitUnit && viewMode !== 'desk' ? TABLETOP_MIN_UP : -1); else ink.setHover(null);
 window.deskDebug = { ...window.deskDebug, selectedRole, fillRole: filled ? role : null, fillCount: filled ? meshes.length : 0, fillColor: filled ? color : null, fillState: filled ? (role === selectedRole ? 'selected' : 'hover') : null };
}
function writePanel(info,secondLabel='MATERIAL',thirdLabel='ADDED'){
 const B=window.DeskBilingual;
 document.getElementById('obj-num').textContent=info.num;
 window.DeskSidebar.render(info);
 B.set(document.getElementById('obj-type'),info.type,info.typeEn||B.term(info.type));
 B.set(document.getElementById('obj-material'),info.material,info.materialEn||B.term(info.material));
 B.set(document.getElementById('obj-added'),info.added,info.addedEn||B.date(info.added));
 B.set(document.getElementById('obj-tags'),info.tags,info.tagsEn||B.term(info.tags));
 const labels=document.querySelectorAll('#obj-meta tr td:first-child');
 ['TYPE',secondLabel,thirdLabel,'TAGS'].forEach((label,i)=>B.set(labels[i],B.ui[label],label));
}
function showPanel(role) {
 if (stage.classList.contains('list-mode') && activeListRecord) { showListRecord(activeListRecord); return; }
 if (model && model.userData.exhibitUnit && role === JUMP_ROLE[viewMode]) role = viewMode;
 const info = OBJECT_INDEX[role]; if (!info) return;
 writePanel(info);
 const icon = document.getElementById('icon-' + role);
 const preview = document.getElementById('obj-preview');
 preview.removeAttribute('data-entry-id');
 preview.innerHTML = icon ? icon.outerHTML : '';
 window.deskDebug = { ...window.deskDebug, sidebarRecord: null };
}
function showListRecord(record) {
 activeListRecord = record;
 window.deskActiveRecord = record;
 writePanel({num: record.id, name: record.title, nameZh:record.titleZh, nameEn:record.titleEn, descEn:record.noteEn, typeEn:record.categoryEn, materialEn:record.authorEn, addedEn:record.yearEn, tagsEn:record.tagsEn, desc: record.note || '原资料未提供说明。',
  type: record.category || '—', material: record.author || '—', added: record.year || record.field || '—', tags: record.tags || '—'}, 'AUTHOR', 'YEAR');
 const preview = document.getElementById('obj-preview');
 preview.dataset.entryId = record.id;
 if (record.img) {
  const image = document.createElement('img');
  image.alt = record.imgAlt || record.title;
  if (record.imgAlt) image.title = record.imgAlt;
  image.addEventListener('error', () => { if (image.isConnected) preview.textContent = '图片暂不可用 / Image unavailable'; }, {once: true});
  preview.replaceChildren(image);
  image.src = record.img;
 } else {
  preview.textContent = '暂无图片 / No image available';
 }
 window.deskDebug = { ...window.deskDebug, sidebarRecord: record.id };
}
window.deskShowRecord = showListRecord;
window.deskSyncPanel = () => {
 if (stage.classList.contains('list-mode') && activeListRecord) showListRecord(activeListRecord);
 else showPanel(hoverGroup ? hoverGroup.role : viewMode);
};
if (activeListRecord && stage.classList.contains('list-mode')) showListRecord(activeListRecord);
function select(role) {
 selectedRole = role;
 showPanel(role);
 refreshHighlight();
 window.deskDebug = { ...window.deskDebug, selectedRole: role };
}
function clearObjectFeedback() {
 selectedRole = null; hoverGroup = null;
 renderer.domElement.style.cursor = '';
 refreshHighlight();
 window.deskDebug = { ...window.deskDebug, hoverRole: null };
}
// Bottom bar is now a link bar to the stage sub-page; it no longer selects 3D objects.
let unitSelectionRequest = 0;
for (const cell of document.querySelectorAll('#carousel .cell')) cell.addEventListener('click', () => {
 if (cell.dataset.view) {
  const view = cell.dataset.view, request = ++unitSelectionRequest;
  switchView(view).then(() => {
   if (request === unitSelectionRequest && window.deskFlashListUnit) window.deskFlashListUnit(view);
  });
  return;
 }
 if (cell.dataset.link) { if (window.SFX) SFX.go(cell.dataset.link, 'click'); else location.href = cell.dataset.link; }
});
function updateHover() {
 raycaster.setFromCamera(pointer, camera);
 let group = null;
 for (const hit of raycaster.intersectObject(model, true)) {
  const found = meshGroup.get(hit.object);
  if (model.userData.exhibitUnit) {
   // Only the nearest visible face can trigger; the computer uses its black monitor.
   const normal = hit.face?.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
   if (found && found.role === JUMP_ROLE[viewMode] && normal && (found.minWorldUp < 0 || normal.y > found.minWorldUp)) group = found;
   break;
  }
  if (found && !STATIC[found.role] && found.role === JUMP_ROLE[viewMode]) { group = found; break; }
 }
 if (group === hoverGroup) return;
 hoverGroup = group;
 if (group) { showPanel(group.role); renderer.domElement.style.cursor = 'pointer'; }
 else renderer.domElement.style.cursor = selectedRole ? '' : '';
 refreshHighlight();
 window.deskDebug = { ...window.deskDebug, hoverRole: group ? group.role : null };
}
function updatePointer(event) {
 const rect = renderer.domElement.getBoundingClientRect();
 pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
 pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
renderer.domElement.addEventListener('pointermove', event => {
 if (!model) return;
 updatePointer(event); updateHover();
});
renderer.domElement.addEventListener('pointerleave', () => {
 if (!hoverGroup) return;
 hoverGroup = null; renderer.domElement.style.cursor = ''; refreshHighlight();
 window.deskDebug = { ...window.deskDebug, hoverRole: null };
});
// ---- archive overlay: click an object to open its archive sub-page ----
const ARCHIVES = {
 book: { title: '书本 BOOKS', theme: '文学与书写', data: () => window.BOOK_ARCHIVE },
 candle: { title: '蜡烛 CANDLES', theme: '仪式与供品', data: () => window.ALTAR_CANDLE_ARCHIVE },
 prayer: { title: '祝辞 PRAYER', theme: '仪式与供品', data: () => window.ALTAR_PRAYER_ARCHIVE },
 curtain: { title: '帷布 ALTAR CLOTH', theme: '仪式与供品', data: () => window.ALTAR_CURTAIN_ARCHIVE },
 plate: { title: '盘子 PLATES', theme: '饮食与仪式', data: () => window.DINING_PLATE_ARCHIVE },
 cutlery: { title: '餐具 CUTLERY', theme: '饮食与仪式', data: () => window.DINING_CUTLERY_ARCHIVE },
 wineglass: { title: '酒杯 WINE GLASSES', theme: '饮食与仪式', data: () => window.DINING_WINEGLASS_ARCHIVE },
 textbook: { title: '课本 TEXTBOOKS', theme: '教育与书写', data: () => window.SCHOOL_TEXTBOOK_ARCHIVE },
 penholder: { title: '笔筒 PEN HOLDER', theme: '教育与书写', data: () => window.SCHOOL_PENHOLDER_ARCHIVE },
 exampaper: { title: '试卷 EXAM PAPER', theme: '教育与书写', data: () => window.SCHOOL_EXAMPAPER_ARCHIVE },
 draftpaper: { title: '图纸 DRAWINGS', theme: '工作与工作台', data: () => window.DRAFTING_DRAFTPAPER_ARCHIVE },
 // 灯也出现在电脑桌场景：档案只在绘图桌视图打开，电脑桌保持原样。
 lamp: { title: '灯 LAMP', theme: '光与观看', view: 'drafting', data: () => window.DRAFTING_LAMP_ARCHIVE },
 ruler: { title: '尺子 RULER', theme: '工作与工作台', data: () => window.DRAFTING_RULER_ARCHIVE }
};
const archiveEl = document.getElementById('archive');
const arcList = document.getElementById('arc-list');
function showArcDetail(entry, idx, total) {
 document.getElementById('arc-d-id').textContent = entry.id + ' — ' + String(idx + 1).padStart(2, '0') + ' / ' + total;
 document.getElementById('arc-d-title').textContent = entry.title;
 document.getElementById('arc-d-meta').innerHTML = '<b>年代 YEAR</b>' + (entry.year || '—') + '<br><b>标签 TAGS</b>' + entry.tags;
 document.getElementById('arc-d-note').textContent = entry.note;
 // Entries from the spreadsheet carry a photo (原图 column); show it above
 // the caption. Older text-only entries keep the plain 图像建议 line.
 const imgEl = document.getElementById('arc-d-photo');
 if (entry.img) { imgEl.src = entry.img; imgEl.style.display = 'block'; }
 else { imgEl.removeAttribute('src'); imgEl.style.display = 'none'; }
 document.getElementById('arc-d-image').textContent = entry.image ? '图像建议：' + entry.image : '';
}
function openArchive(role) {
 const a = ARCHIVES[role];
 if (a && a.view && a.view !== viewMode) return;
 const data = a && a.data();
 if (!data || !data.length) return;
 document.getElementById('arc-title').textContent = a.title;
 document.getElementById('arc-theme').textContent = a.theme;
 document.getElementById('arc-count').textContent = data.length + ' 条档案';
 arcList.innerHTML = '';
 data.forEach((e, i) => {
  const li = document.createElement('li');
  const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1).padStart(2, '0');
  const t = document.createElement('span'); t.className = 't'; t.textContent = e.title;
  const y = document.createElement('span'); y.className = 'y'; y.textContent = e.year;
  li.append(n, t, y);
  li.addEventListener('click', () => {
   if (window.SFX) SFX.play('click');
   for (const x of arcList.querySelectorAll('li.active')) x.classList.remove('active');
   li.classList.add('active'); showArcDetail(e, i, data.length);
  });
  arcList.append(li);
 });
 arcList.firstChild.classList.add('active'); showArcDetail(data[0], 0, data.length);
 archiveEl.hidden = false;
 window.deskDebug = { ...window.deskDebug, archive: role };
}
function closeArchive() { archiveEl.hidden = true; window.deskDebug = { ...window.deskDebug, archive: null }; }
document.getElementById('arc-close').addEventListener('click', () => { if (window.SFX) SFX.play('click'); closeArchive(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeArchive(); });
// Click (not drag) on a scene object opens its archive.
let downPos = null;
renderer.domElement.addEventListener('pointerdown', e => { downPos = e.button === 0 ? [e.clientX, e.clientY] : null; });
renderer.domElement.addEventListener('pointercancel', () => { downPos = null; });
renderer.domElement.addEventListener('pointerup', e => {
 if (!downPos) return;
 const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1]; downPos = null;
 if (dx * dx + dy * dy > 25 || !model) return;
 // Re-pick at release for touch, a stationary pointer, and a changed camera.
 updatePointer(e); updateHover();
 if (!hoverGroup) return;
 // Briefly tint only the tabletop before opening its coordinate overlay.
 if (hoverGroup.role === JUMP_ROLE[viewMode]) {
  const role = hoverGroup.role, clickedView = viewMode;
  select(role);
  clearTimeout(coordinateTimer);
  coordinateTimer = setTimeout(() => {
   coordinateTimer = null;
   if (viewMode !== clickedView || selectedRole !== role) return;
   clearObjectFeedback();
   goCoordinates();
  }, 180);
 }
});
window.deskOpenArchive = openArchive;
function dolly(factor) {
 camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
 controls.update();
}
document.getElementById('zoom-in').addEventListener('click', () => { if (window.SFX) SFX.play('click'); dolly(.8); });
document.getElementById('zoom-out').addEventListener('click', () => { if (window.SFX) SFX.play('click'); dolly(1.25); });
document.getElementById('reset-view').addEventListener('click', () => { if (window.SFX) SFX.play('click'); if (model) (viewMode === 'desk' ? frameDesk() : frameView(viewMode)); });
// Sound on/off toggle in the top nav.
const soundBtn = document.getElementById('sound-btn');
if (soundBtn) soundBtn.addEventListener('click', () => {
 const m = window.SFX ? SFX.toggle() : false;
 soundBtn.classList.toggle('muted', m);
 if (!m && window.SFX) SFX.play('click');
});
// Test hooks.
window.deskHoverAt = role => {
 for (const [mesh, group] of meshGroup) {
  if (group.role !== role) continue;
  const p = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return { x: (p.x + 1) / 2 * rect.width + rect.left, y: (1 - p.y) / 2 * rect.height + rect.top };
 }
 return null;
};
// All screen-space centers of a role's meshes (for picking a visible one).
window.deskHoverPoints = role => {
 const rect = renderer.domElement.getBoundingClientRect(), pts = [];
 for (const [mesh, group] of meshGroup) {
  if (group.role !== role) continue;
  const p = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).project(camera);
  pts.push({ x: (p.x + 1) / 2 * rect.width + rect.left, y: (1 - p.y) / 2 * rect.height + rect.top });
 }
 return pts;
};
window.deskSelect = select;
// Debug hook: meshes of a hover role with their ancestor chain and world
// size — used to split mis-grouped objects (e.g. the ruler on the drafting
// desk was lumped in with the drawings).
window.deskRoleMeshes = role => [...meshGroup].filter(([m, g]) => g.role === role).map(([m]) => {
 const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3());
 const chain = [];
 for (let n = m; n && n !== scene; n = n.parent) chain.push(n.name);
 return { chain: chain.join(' < '), size: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)] };
});
// Debug hook: every mesh in the current view with its ancestor chain, world
// size and projected screen center — used to identify unlabeled objects
// (e.g. the drafting-desk lamp) from a screenshot.
window.deskSceneMeshes = () => {
 const rect = renderer.domElement.getBoundingClientRect(), out = [];
 model.traverse(m => {
  if (!m.isMesh) return;
  const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3());
  const p = b.getCenter(new THREE.Vector3()).project(camera);
  const chain = [];
  for (let n = m; n && n !== scene; n = n.parent) chain.push(n.name);
  out.push({
   chain: chain.join(' < '), size: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)],
   x: Math.round((p.x + 1) / 2 * rect.width + rect.left), y: Math.round((1 - p.y) / 2 * rect.height + rect.top)
  });
 });
 return out;
};
// Debug hook: render only meshes whose ancestor chain contains the substring
// (visual identification of a single object against a user screenshot).
window.deskIsolate = sub => {
 let shown = 0;
 model.traverse(m => {
  if (!m.isMesh) return;
  const chain = [];
  for (let n = m; n && n !== scene; n = n.parent) chain.push(n.name);
  const hit = chain.join(' < ').toLowerCase().includes(String(sub).toLowerCase());
  m.visible = hit; if (hit) shown++;
 });
 return shown;
};
window.deskShowAll = () => { model.traverse(m => { if (m.isMesh) m.visible = true; }); };
function frameModel() {
 // Force-refresh world matrices: freshly added view wrappers can carry stale
 // matrices at framing time, which inflates the measured bounds and pushes
 // the camera beyond the far plane (black screen).
 model.updateWorldMatrix(true, true);
 const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
 controls.target.copy(center);
 const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
 // Live stage aspect: camera.aspect is rewritten by the ink renderer and
 // goes degenerate while the tab is hidden.
 const rect = stage.getBoundingClientRect();
 const aspect = rect.width > 200 && rect.height > 200 ? THREE.MathUtils.clamp(rect.width / rect.height, .75, 2) : 1;
 const distance = Math.max(size.y / 2 / Math.tan(halfFov), Math.max(size.x, size.z) / 2 / (Math.tan(halfFov) * aspect)) * (aspect < 1 ? 1.5 : 1.85);
 camera.position.copy(center).add(new THREE.Vector3(-.78, .68, -1).normalize().multiplyScalar(distance));
 camera.lookAt(center); controls.update();
}
// Dining-table framing: near top-down view so the place settings read as a
// plan, with a slight tilt to keep a hint of depth (and avoid a degenerate
// straight-down orbit). Distance fits the table's footprint, not its height.
function frameDining() {
 model.updateWorldMatrix(true, true); // see frameModel: avoid stale-matrix bounds
 const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
 controls.target.copy(center);
 const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
 // Use the live stage aspect: camera.aspect is rewritten by the ink renderer
 // and goes degenerate while the tab is hidden.
 const rect = stage.getBoundingClientRect();
 const aspect = rect.width > 200 && rect.height > 200 ? THREE.MathUtils.clamp(rect.width / rect.height, .75, 2) : 1;
 const distance = Math.max(size.x, size.z) / 2 / (Math.tan(halfFov) * Math.min(aspect, 1)) * .85;
 camera.position.copy(center).add(new THREE.Vector3(0, 1, -.12).normalize().multiplyScalar(distance));
 camera.lookAt(center); controls.update();
 window.deskCam = { camera, controls };
}
// Drafting-desk framing: a hand-framed close-up along the tilted board,
// frozen as the initial camera (position/target captured from a live session).
function frameDrafting() {
 controls.target.set(.2302, -.3134, .0613);
 camera.position.set(5.8913, 2.7556, -5.5096);
 camera.lookAt(controls.target); controls.update();
 window.deskCam = { camera, controls };
}
// Orbit framing for typology views: pure math from the stored world size
// (ensureView measured it from the raw bounds at load time). The wrapper is
// centered at the origin, so the target is fixed — no setFromObject involved.
function frameOrbit(view) {
 const st = viewState[view];
 const size = st && st.worldSize ? st.worldSize : new THREE.Vector3(7.6, 4, 7.6);
 controls.target.set(0, 0, 0);
 const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
 // Clamp the stage aspect: a hidden/collapsed panel reports a degenerate
 // rect (e.g. 32px wide), which would throw the camera hundreds of units
 // away and leave a black screen.
 const rect = stage.getBoundingClientRect();
 const aspect = rect.width > 200 && rect.height > 200 ? THREE.MathUtils.clamp(rect.width / rect.height, .75, 2) : 1;
 const distance = Math.max(size.y / 2 / Math.tan(halfFov), Math.max(size.x, size.z) / 2 / (Math.tan(halfFov) * aspect)) * (aspect < 1 ? 1.5 : 1.85);
 camera.position.copy(new THREE.Vector3(-.78, .68, -1).normalize().multiplyScalar(distance));
 camera.lookAt(0, 0, 0); controls.update();
 window.deskCam = { camera, controls };
 window.deskDebug = { ...window.deskDebug, framed: view, frameDist: distance };
}
// Dispatch the initial/reset framing for a typology view.
function frameView(view) {
 if (model.userData.exhibitUnit) { frameExhibitModel(); return; }
 const kind = VIEW_MODELS[view].frame;
 if (kind === 'topdown') frameDining();
 else if (kind === 'fixed') frameDrafting();
 else frameOrbit(view);
}
function roleBox(roles) {
 const box = new THREE.Box3(); let found = false;
 model.traverse(node => {
  if (!node.isMesh) return;
  if (roles.includes(classify(node, model).role)) { box.expandByObject(node); found = true; }
 });
 return found ? box : null;
}
// Initial / reset view: close-up of the desk surface from the chair side,
// instead of the whole-room overview.
function frameDesk() {
 if (model.userData.exhibitUnit) { frameExhibitModel(); return; }
 const box = roleBox(['computer', 'phone', 'note']);
 if (!box) { frameModel(); return; }
 const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
 center.y -= .25; // aim between the monitor and the desktop surface
 controls.target.copy(center);
 const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
 const distance = Math.max(size.y / 2 / Math.tan(halfFov), Math.max(size.x, size.z) / 2 / (Math.tan(halfFov) * camera.aspect)) * 1.25;
 const chair = roleBox(['chair', 'chairFrame']);
 const dir = chair ? chair.getCenter(new THREE.Vector3()).sub(center).setY(0).normalize() : new THREE.Vector3(-.6, 0, -1).normalize();
 dir.y = .55; dir.normalize();
 camera.position.copy(center).add(dir.multiplyScalar(distance));
 camera.lookAt(center); controls.update();
 window.deskCam = { camera, controls };
 window.deskRoleBox = roleBox;
}
async function load() {
 try {
  const requestedView = location.hash.slice(1);
  const initialView = requestedView === 'desk' || VIEW_MODELS[requestedView] ? requestedView : 'altar';
  // Prepare the requested first view before dismissing the boot screen.
  const [gltf] = await Promise.all([new GLTFLoader().loadAsync(window.deskDebug.modelUrl, xhr => {
    if (xhr.total) {
      window.deskDebug = { ...window.deskDebug, loadPct: Math.round(Math.min(xhr.loaded / xhr.total, 1) * 100) };
    }
  }), initialView === 'desk' ? Promise.resolve() : ensureView(initialView)]);
  model = gltf.scene; model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const scale = 7.6 / Math.max(size.x, size.z), wrapper = new THREE.Group();
  wrapper.add(model); wrapper.scale.setScalar(scale); wrapper.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  const report = model.userData.exhibitUnit ? recolorExhibitModel(model) : recolorModel(model);
  model.traverse(node => {
    if (node.isLight) {
      node.color.set('#ffffff'); node.intensity = .45;
      node.distance = 2.6; node.decay = 2;
    }
  });
  wrapper.visible = initialView === 'desk';
  scene.add(wrapper); wrapper.updateMatrixWorld(true); frameDesk(); buildHoverGroups();
  deskModel = model; deskWrapper = wrapper;
  window.deskDebug = { ...window.deskDebug, state: 'ready', loadPct: 100, ...report };
  setView(initialView);
  if (initialView !== 'desk') viewLoading('');
 } catch (error) {
  console.error('Desk model failed:', error); window.deskDebug.state = 'error'; window.deskDebug.error = error.message;
  failLoader(error);
 }
}
// ---- in-place typology views: the center 3D stage swaps to another desk ----
// model while all the surrounding chrome (top bar, side panel, bottom bar,
// zoom buttons) stays exactly where it is.
const VIEW_MODELS = {
 dining: { url: new URL(USE_EXHIBITS ? './assets/exhibits/02-dining.glb' : './assets/dining-table.glb', import.meta.url).href, label: 'DINING TABLE', frame: 'topdown' },
 drafting: { url: new URL(USE_EXHIBITS ? './assets/exhibits/04-drafting.glb' : './assets/drafting-desk.glb', import.meta.url).href, label: 'DRAWING TABLE', frame: 'fixed' },
 school: { url: new URL(USE_EXHIBITS ? './assets/exhibits/03-school.glb' : './assets/school-desk.glb', import.meta.url).href, label: 'SCHOOL DESK', frame: 'orbit' },
 altar: { url: new URL(USE_EXHIBITS ? './assets/exhibits/01-altar.glb' : './assets/altar.glb', import.meta.url).href, label: 'ALTAR', frame: 'orbit' }
};
const viewState = {}; // view -> { model, wrapper, promise }
let viewMode = 'desk';
// Same grayscale quantization as dining.html: every material becomes a flat
// shade of gray derived from its texture's average luminance (5 levels).
const GRAYS = ['#ffffff', '#e2e2e2', '#a6a6a6', '#4f4f4f', '#131313'];
function grayFor(l) { return l > .78 ? GRAYS[0] : l > .60 ? GRAYS[1] : l > .44 ? GRAYS[2] : l > .27 ? GRAYS[3] : GRAYS[4]; }
function averageLuminance(image) {
 const canvas = document.createElement('canvas');
 const w = canvas.width = Math.min(64, image.width), h = canvas.height = Math.min(64, image.height);
 const ctx = canvas.getContext('2d', { willReadFrequently: true });
 ctx.drawImage(image, 0, 0, w, h);
 const data = ctx.getImageData(0, 0, w, h).data;
 let sum = 0;
 for (let i = 0; i < data.length; i += 4) sum += (data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722) / 255;
 return sum / (data.length / 4);
}
function recolorGrayscale(root) {
 // All volumes are pure white against the black void: darker materials would
 // disappear into the background. The ink renderer supplies the black
 // outlines, so form still reads clearly.
 const cache = new Map();
 root.traverse(node => {
  if (!node.isMesh) return;
  node.castShadow = true; node.receiveShadow = true;
  const source = Array.isArray(node.material) ? node.material[0] : node.material;
  if (!cache.has(source)) cache.set(source, new THREE.MeshStandardMaterial({ color: GRAYS[0], roughness: .95, metalness: 0, flatShading: true }));
  node.material = cache.get(source);
 });
}
// Typology object hover: per-view rules match ancestor node names (the same
// walk-up scheme as palette.classify). Hovering an object on the altar,
// school desk or drafting desk fills it blue and updates the side panel,
// exactly like the computer-desk scene. Meshes that match nothing (the table
// bodies themselves) get no group, so the raycast passes through them.
const VIEW_RULES = {
 altar: [[/candle|flame/i, 'candle'], [/bookopen/i, 'prayer'], [/simply_cloth/i, 'curtain']],
 school: [[/book/i, 'textbook'], [/paper_file/i, 'exampaper'], [/pen|pencil/i, 'stationery'], [/empty_cup/i, 'penholder']],
 drafting: [[/tonone|defintion/i, 'lamp'], [/^object_2$/i, 'ruler'], [/stool/i, 'stool'], [/object_\d/i, 'draftpaper']],
 dining: [[/^box00[6-9]/i, 'plate'], [/对象02[12]|对象03[4-9]/, 'cutlery'], [/cylinder|对象0(?:02|52|53|55)/i, 'wineglass']]
};
function classifyView(node, root, rules) {
 for (let n = node; n && n !== root; n = n.parent) {
  const name = n.name || '';
  for (const [re, role] of rules) if (re.test(name)) return { role, node: n };
 }
 return null;
}
function buildViewHoverGroups(view) {
 if (buildExhibitHoverGroup(view)) return;
 const rules = VIEW_RULES[view];
 if (!rules) return;
 const groups = new Map();
 model.traverse(node => {
  if (!node.isMesh) return;
  const hit = classifyView(node, model, rules);
  if (!hit) return;
  let group = groups.get(hit.node);
  if (!group) { group = { role: hit.role, meshes: [] }; groups.set(hit.node, group); }
  group.meshes.push(node);
 });
 for (const group of groups.values()) group.meshes.forEach(mesh => meshGroup.set(mesh, group));
 window.deskDebug = { ...window.deskDebug, viewRoles: [...new Set([...groups.values()].map(g => g.role))] };
}
function viewLoading(text) {
 let el = document.getElementById('view-loading');
 if (!el) {
  el = document.createElement('div'); el.id = 'view-loading';
  el.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62);color:#fff;font-family:VT323,"Courier New",monospace;font-size:24px;letter-spacing:.22em;z-index:30;pointer-events:none;';
  document.getElementById('app').appendChild(el);
 }
 el.textContent = text;
 el.style.display = text ? 'flex' : 'none';
}
function ensureView(view) {
 const cfg = VIEW_MODELS[view];
 const st = viewState[view] || (viewState[view] = {});
 if (st.promise) return st.promise;
 st.promise = new GLTFLoader().loadAsync(cfg.url, xhr => {
  if (xhr.total) viewLoading('LOADING ' + cfg.label + ' ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
 }).then(gltf => {
  st.model = gltf.scene; st.model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(st.model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const scale = 7.6 / Math.max(size.x, size.z);
  // Store the post-scale world size: orbit framing uses this instead of
  // re-measuring setFromObject, which can return stale/inflated bounds.
  st.worldSize = size.clone().multiplyScalar(scale);
  st.wrapper = new THREE.Group();
  st.wrapper.add(st.model);
  st.wrapper.scale.setScalar(scale);
  // No floor in these views: center the model vertically in the black void.
  st.wrapper.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  if (st.model.userData.exhibitUnit) recolorExhibitModel(st.model); else recolorGrayscale(st.model);
  st.wrapper.visible = false;
  scene.add(st.wrapper); st.wrapper.updateMatrixWorld(true);
 });
 return st.promise;
}
function setView(mode) {
 clearTimeout(coordinateTimer); coordinateTimer = null;
 viewMode = mode;
 const isDesk = mode === 'desk';
 const st = viewState[mode];
 if (deskWrapper) deskWrapper.visible = isDesk;
 for (const [v, s] of Object.entries(viewState)) if (s.wrapper) s.wrapper.visible = v === mode;
 model = isDesk ? deskModel : st && st.model;
 hoverGroup = null; selectedRole = null;
 renderer.domElement.style.cursor = '';
 meshGroup.clear();
 if (isDesk) buildHoverGroups(); else buildViewHoverGroups(mode);
 refreshHighlight();
 for (const cell of document.querySelectorAll('#carousel .cell')) cell.classList.toggle('selected', cell.dataset.view === mode);
 if (isDesk) { frameDesk(); showPanel('desk'); }
 else { frameView(mode); showPanel(mode); }
 window.deskDebug = { ...window.deskDebug, view: viewMode, exhibitUnit: model.userData.exhibitUnit || null };
}
// Bottom bar view switcher: 电脑桌 shows the desk scene, 餐桌 the dining
// table, 绘图桌 the drafting desk. Clicking the active view's cell is a no-op.
async function switchView(view) {
 if (window.SFX) SFX.play('click');
 if (view === viewMode) return;
 if (view === 'desk') { setView('desk'); return; }
 const cfg = VIEW_MODELS[view];
 if (!cfg) return;
 viewLoading('LOADING ' + cfg.label + ' …');
 try {
  await ensureView(view);
  setView(view);
  viewLoading('');
 } catch (error) {
  console.error(view + ' model failed:', error);
  if (viewState[view]) viewState[view].promise = null;
  viewLoading('模型加载失败 FAILED');
  setTimeout(() => viewLoading(''), 1600);
 }
}
new ResizeObserver(() => {
 renderer.setSize(stage.clientWidth, stage.clientHeight);
 ink.setSize(stage.clientWidth, stage.clientHeight);
}).observe(stage);
renderer.setAnimationLoop(() => { controls.update(); const report = ink.render(); if (window.deskDebug.state === 'ready') Object.assign(window.deskDebug, report); });
window.deskTick = () => { controls.update(); ink.render(); };
load();
