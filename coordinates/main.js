/* 桌面坐标系 · 一平方米的文明
 * 网格标准：展厅地面方格网（1 格 = 1 ㎡，线色 #434343）
 * 横轴 X：代表时期（右 → 左：古代 → 1980—1990年代）
 * 纵轴 Y：桌面承载尺度（下 → 上：个人活动 → 社会关系）
 */
(function () {
  'use strict';
  var B=window.DeskBilingual;
  function enText(node,text){var t=el('tspan',{'class':'en-inline','lang':'en'});t.textContent=text;node.appendChild(t);}
  function biAxis(node,cn,x){var t=el('tspan',{x:x,dy:15,'class':'axis-en'});t.textContent=B.term(cn);node.appendChild(t);}

  /* ---------- 数据：五个展具单元 + 原点参照物（按「展品布置与坐标」最新分布） ---------- */
  /* rect：[x1, y1, x2, y2] 展具占地范围（格），与《展品布置与坐标》图中虚线框一致 */
  var UNITS = [
    { id: '01', key: 'altar',    cn: '祭坛',   en: 'ALTAR',          x: -8.5, y: -4,
      rect: [-9.5, -5, -7.5, -2.5],
      era: '古代', scale: '人群共望',
      desc: "祭坛以带有可开启小门的台形结构，承载信仰、愿望与希望。观众打开小门、俯身进入，从外部观看者成为内部参与者，以身体感受寄托与承载的关系。", descEn: "A tapered structure with a small opening door holds faith, wishes and hope. Visitors open the door and bend down to enter, moving from outside observers to participants within. The body becomes a way to explore the relationship between what is entrusted and what carries it." },
    { id: '02', key: 'dining',   cn: '餐桌',   en: 'DINING TABLE',   x: -5.25, y: 5.5,
      rect: [-8, 4.5, -2.5, 6.75],
      era: '17世纪', scale: '各有其席',
      desc: "共食也包含协商与博弈。展具通过弹簧结构，使两侧座椅能够上下移动。参与者坐下并改变重心，在起伏中感受彼此的影响与平衡，同时阅读桌面上的展览信息。", descEn: "Sharing a meal also involves negotiation and competing interests. A spring mechanism allows the seats on either side to move vertically. Participants sit down and shift their weight, feeling their influence on one another and their changing balance while reading the exhibition material on the tabletop." },
    { id: '03', key: 'school',   cn: '课桌',   en: 'SCHOOL DESK',    x: -1.9, y: -7,
      rect: [-3.75, -7.75, 0, -6],
      era: '19世纪后半叶', scale: '集体规则',
      desc: "约四米长的连续木板坡面由高约一米延伸至近地面，替代一排被分配的课桌。参与者按身高与姿态选择位置，让物件从高处依次滑过三人的位置，体验由桌面形态自然促成的传递与秩序。", descEn: "A continuous wooden slope, about four meters long, descends from roughly one meter high to near the floor, replacing a row of assigned desks. Participants choose positions according to their height and posture. Objects slide down through three participants’ positions, allowing passing and order to emerge from the tabletop’s form." },
    { id: '04', key: 'drafting', cn: '绘图桌', en: 'DRAFTING TABLE', x: 7, y: -2.5,
      rect: [5.5, -5, 8.5, -0.5],
      era: '20世纪上半叶', scale: '组织协作',
      desc: "倾斜、对称的桌面连接测量与创造，桌面上方的信息架与结构相互关联。观众面向斜面阅读，观察倾角、对称与尺度，思考人如何理解空间并展开创造。", descEn: "An inclined, symmetrical tabletop connects measurement with creation, while an information rack above it relates the content to the structure. Visitors read from the sloping surface and observe its angle, symmetry and scale, considering how people understand space and create within it." },
    { id: '05', key: 'computer', cn: '电脑桌', en: 'COMPUTER DESK',  x: 7.5, y: 4,
      rect: [5.5, 3, 9.5, 5],
      era: '1980—1990年代', scale: '关系边界',
      desc: "桌面围绕中轴管转动，在水平的实体工作台与竖直的信息界面之间切换。通过转动与观看，体验现实与虚拟桌面的不同使用方式，以及信息如何被分类、组织和调用。", descEn: "The tabletop rotates around a central tube, switching between a horizontal physical work surface and a vertical information interface. Rotating and viewing it reveals different ways of using physical and virtual desktops, and how information is classified, organized and retrieved." }
  ];
  var ZERO = { cn: '0号桌', en: '1㎡ 参照物', x: 0, y: 0,
    desc: '展览的概念中心：以 1 ㎡ 桌面连接五个主题，呈现人与人、人与物、人与世界的关系。' };

  /* 轴刻度（与坐标标准图一致：横轴左古右今，纵轴关系范围由小到大） */
  var ERAS   = [ { x: -8.5,  t: '古代' }, { x: -5.25, t: '17世纪' },
                 { x: -3,    t: '19世纪后半叶' }, { x: 7,    t: '20世纪上半叶' },
                 { x: 8.75,  t: '1980—1990年代' } ];
  var SCALES = [ { y: -7,   t: '集体规则' }, { y: -4,   t: '人群共望' },
                 { y: -2.5, t: '组织协作' }, { y: 4,    t: '关系边界' },
                 { y: 5.5,  t: '各有其席' } ];

  var XR = { min: -10, max: 10 };   /* 网格坐标范围（格） */
  var YR = { min: -8,  max: 7 };

  /* ---------- DOM ---------- */
  var plane   = document.getElementById('plane');
  var svg     = document.getElementById('grid-svg');
  var markers = document.getElementById('markers');
  var card    = document.getElementById('card');
  var readout = document.getElementById('readout');
  var SVGNS = 'http://www.w3.org/2000/svg';

  var cell = 43.5;   /* 1 格 = 1 ㎡，网格标准 43.5px */
  var cx = 0, cy = 0; /* 原点屏幕坐标 */
  var GRID = { l: 0, t: 0, r: 0, b: 0 }; /* 网格区屏幕边界 */

  function px(gx) { return cx + gx * cell; }
  function py(gy) { return cy - gy * cell; }
  function fmt(n) { return (n > 0 ? '+' : '') + n; }

  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------- 布局：网格居中成图，四周留白放刻度文字 ---------- */
  function layout() {
    var w = plane.clientWidth || window.innerWidth || 1440;
    var h = plane.clientHeight || (window.innerHeight - 120) || 700;
    /* 四周留白：刚好放下刻度文字即可，图面尽量大 */
    var ml = w < 960 ? 184 : 126, mr = w >= 960 ? Math.max(222, Math.min(254, w * .18)) : 44, mt = 58, mb = 122;
    var gw = XR.max - XR.min, gh = YR.max - YR.min;
    cell = Math.min(43.5, (w - ml - mr) / gw, (h - mt - mb) / gh);
    cell = Math.max(18, cell);
    /* 网格区边界（尽量居中，但保证四周留白够放刻度文字） */
    var gwPx = gw * cell, ghPx = gh * cell;
    GRID.l = Math.min(Math.max(ml, (w - gwPx) / 2), w - mr - gwPx);
    GRID.t = Math.min(Math.max(mt, (h - ghPx) / 2), h - mb - ghPx);
    GRID.r = GRID.l + gwPx;
    GRID.b = GRID.t + ghPx;
    plane.style.setProperty('--reference-width', Math.max(144, Math.min(280, w - GRID.r - 44)) + 'px');
    plane.style.setProperty('--assembly-width', Math.max(96, Math.min(184, GRID.l - 92)) + 'px');
    cx = GRID.l + (-XR.min) * cell;   /* 原点 x */
    cy = GRID.t + YR.max * cell;
    plane.style.setProperty('--assembly-width',Math.min(128,Math.max(52,GRID.l-170,py(5.5)-42))+'px');      /* 原点 y（Y 向上为正） */
    markers.style.setProperty('--cell', cell + 'px');
    /* 网格线宽随格距走：大格线 ≈ 格距 3.5%，细分线 ≈ 1.2% */
    plane.style.setProperty('--grid-w', Math.max(0.8, cell * 0.035) + 'px');
    plane.style.setProperty('--grid-w-fine', Math.max(0.3, cell * 0.012) + 'px');
    drawGrid(w, h);
    placeMarkers();
  }

  /* ---------- 网格 + 坐标轴（网格限于图面内，文字标四周） ---------- */
  function drawGrid(w, h) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var k, x, y;
    /* 细分小格：每 1 ㎡ 大格内 10×10，极细线 */
    var step = cell / 10, fx, fy;
    for (fx = GRID.l + step; fx < GRID.r - 0.5; fx += step) {
      if (Math.abs(((fx - cx) % cell + cell) % cell) < 0.6) continue; /* 跳过大格线 */
      x = Math.round(fx * 2) / 2;
      svg.appendChild(el('line', { x1: x, y1: GRID.t, x2: x, y2: GRID.b, 'class': 'grid-fine' }));
    }
    for (fy = GRID.t + step; fy < GRID.b - 0.5; fy += step) {
      if (Math.abs(((fy - cy) % cell + cell) % cell) < 0.6) continue;
      y = Math.round(fy * 2) / 2;
      svg.appendChild(el('line', { x1: GRID.l, y1: y, x2: GRID.r, y2: y, 'class': 'grid-fine' }));
    }
    /* 大格线：只画在网格区内，与展厅原图一致（全部同粗） */
    for (k = XR.min; k <= XR.max; k++) {
      x = Math.round(cx + k * cell) + 0.5;
      svg.appendChild(el('line', {
        x1: x, y1: GRID.t, x2: x, y2: GRID.b, 'class': 'grid-line'
      }));
    }
    /* 横线 */
    for (k = YR.min; k <= YR.max; k++) {
      y = Math.round(cy - k * cell) + 0.5;
      svg.appendChild(el('line', {
        x1: GRID.l, y1: y, x2: GRID.r, y2: y, 'class': 'grid-line'
      }));
    }

    /* 网格外框（图面边界） */
    svg.appendChild(el('rect', {
      x: GRID.l, y: GRID.t, width: GRID.r - GRID.l, height: GRID.b - GRID.t,
      fill: 'none', 'class': 'grid-border'
    }));

    /* X 轴（y=0）：贯穿网格，右端箭头伸出图面 */
    var ay = py(0);
    svg.appendChild(el('line', { x1: GRID.l, y1: ay, x2: GRID.r + 22, y2: ay, 'class': 'axis' }));
    svg.appendChild(el('path', {
      d: 'M' + (GRID.r + 22) + ' ' + (ay - 6) + ' L' + (GRID.r + 38) + ' ' + ay + ' L' + (GRID.r + 22) + ' ' + (ay + 6) + ' Z',
      'class': 'axis-arrow'
    }));
    var xn = el('text', { x: GRID.r + 46, y: ay + 5, 'class': 'axis-label axis-name' });
    xn.textContent = 'X'; svg.appendChild(xn);

    /* Y 轴（x=0）：贯穿网格，顶端箭头伸出图面 */
    var ax = px(0);
    svg.appendChild(el('line', { x1: ax, y1: GRID.b, x2: ax, y2: GRID.t - 22, 'class': 'axis' }));
    svg.appendChild(el('path', {
      d: 'M' + (ax - 6) + ' ' + (GRID.t - 22) + ' L' + ax + ' ' + (GRID.t - 38) + ' L' + (ax + 6) + ' ' + (GRID.t - 22) + ' Z',
      'class': 'axis-arrow'
    }));
    var yn = el('text', { x: ax + 12, y: GRID.t - 44, 'class': 'axis-label axis-name' });
    yn.textContent = 'Y'; svg.appendChild(yn);

    /* 时期刻度：文字标在网格下方留白；间距不足时双排错开防重叠 */
    var stagger = ERAS.some(function(e,i){return i && (e.x-ERAS[i-1].x)*cell<144;});
    ERAS.forEach(function (e, i) {
      var ex = px(e.x);
      svg.appendChild(el('line', { x1: ex, y1: GRID.b, x2: ex, y2: GRID.b + 7, 'class': 'tick' }));
      var t = el('text', {
        x: ex, y: GRID.b + 24 + (stagger && i % 2 === 1 ? 34 : 0),
        'class': 'axis-label era-label'
      });
      t.textContent = e.t; biAxis(t,e.t,ex); svg.appendChild(t);
    });
    var xt = el('text', {
      x: (GRID.l + GRID.r) / 2, y: GRID.b + (stagger ? 100 : 58),
      'class': 'axis-label axis-caption'
    });
    xt.textContent = '代表时期 '; enText(xt,'TIME'); xt.appendChild(document.createTextNode(' · 左古右今 / ')); enText(xt,'Antiquity to modernity'); svg.appendChild(xt);

    /* 尺度刻度：文字标在网格左侧留白 */
    SCALES.forEach(function (s) {
      var sy = py(s.y);
      svg.appendChild(el('line', { x1: GRID.l - 7, y1: sy, x2: GRID.l, y2: sy, 'class': 'tick' }));
      var t = el('text', { x: GRID.l - 14, y: sy + 4, 'class': 'axis-label scale-label' });
      t.textContent = s.t; biAxis(t,s.t,GRID.l - 14); svg.appendChild(t);
    });
    /* 尺度轴说明放网格上方横排，避免与左侧刻度字重叠 */
    var yt = el('text', { x: GRID.l, y: GRID.t - 14, 'class': 'axis-label axis-caption-l' });
    yt.textContent = '桌面组织关系范围 '; enText(yt,'SCALE'); yt.appendChild(document.createTextNode(' · 向上扩大 / ')); enText(yt,'Scope grows upward'); svg.appendChild(yt);

    /* 原点标注：放在 0 号桌方块的右下角之外，避免被方块遮挡 */
    var o = el('text', { x: ax + cell / 2 + 8, y: ay + cell / 2 + 14, 'class': 'axis-label origin-label' });
    o.textContent = 'O (0,0)'; svg.appendChild(o);
  }

  /* ---------- 隐形热区（矩形，按各展具占地范围）：鼠标划过逐张弹出该分类小图 ---------- */
  var STEP = 34;   /* 鼠标每移动多少 px 弹出一张 */
  var LIFE = 4200; /* 每张图停留 ms，之后缓慢消退 */
  var activeZone = null, lastSpawnX = 0, lastSpawnY = 0;
  var spawns = [], MAX_SPAWNS = 22;
  /* 从某单元跳入时（?unit=xx）：只保留该单元的热区，其余区域不响应 */
  var enterUnit = new URLSearchParams(location.search).get('unit');

  /* 左上方自动播放当前展具的组装动画，资料图片仍由网格热区触发。 */
  var assemblyPreview = document.getElementById('assembly-preview');
  var assemblyImage = document.getElementById('assembly-gif');
  var assemblyFiles = { prototype: '00-prototype', altar: '01-altar', dining: '02-dining', school: '03-school', drafting: '04-drafting', computer: '05-computer' };
  function showAssembly(unit) {
    var key = unit.key || 'prototype', file = assemblyFiles[key];
    if (!file) return;
    if (assemblyPreview.hidden || assemblyPreview.dataset.unit !== key) {
      assemblyImage.src = './assets/assembly/' + file + '.gif?v=2';
      assemblyImage.alt = unit.cn + '展具的白线拆解、组装与360度旋转动画';
    }
    assemblyPreview.dataset.unit = key;
    assemblyPreview.hidden = false;
  }



  function placeMarkers() {
    markers.innerHTML = '';
    UNITS.forEach(function (u) {
      if (enterUnit && u.key !== enterUnit) return;
      var z = document.createElement('button');
      z.className = 'hotzone';
      z.setAttribute('aria-label', u.id + ' ' + u.cn+' / '+u.en);
      /* 矩形热区：与布置图中该展具的占地范围一致 */
      var rc = u.rect;
      z.style.width = (rc[2] - rc[0]) * cell + 'px';
      z.style.height = (rc[3] - rc[1]) * cell + 'px';
      z.style.left = px(rc[0]) + 'px';
      z.style.top = py(rc[3]) + 'px';
      z.addEventListener('mouseenter', function (ev) {
        activeZone = u;
        showAssembly(u);
        lastSpawnX = ev.clientX; lastSpawnY = ev.clientY;
        spawn(u, ev);
      });
      z.addEventListener('mousemove', function (ev) {
        if (activeZone !== u) return;
        if (Math.hypot(ev.clientX - lastSpawnX, ev.clientY - lastSpawnY) > STEP) {
          lastSpawnX = ev.clientX; lastSpawnY = ev.clientY;
          spawn(u, ev);
        }
      });
      z.addEventListener('mouseleave', function () {
        if (activeZone === u) activeZone = null;
        fadeSpawns();
      });
      z.addEventListener('focus', function () { if (z.matches(':focus-visible')) showAssembly(u); });
      markers.appendChild(z);
    });
    if (!enterUnit) markers.appendChild(makeZero());
  }

  /* 右侧预览与被鼠标触发/悬停的小图共用同一份资料。 */
  var referencePreview = document.getElementById('reference-preview');
  var referenceImage = document.getElementById('reference-image');
  var referenceTitle = document.getElementById('reference-title');
  var referenceKeywords = document.getElementById('reference-keywords');
  var hoveredPhoto = null;
  function showReference(unit, src) {
    var key = unit.key + '|' + src;
    if (referencePreview.dataset.reference === key) return;
    var record = ((window.UNIT_REFERENCES || {})[unit.key] || {})[src];
    var base = src.split('/').pop().replace(/\.[^.]+$/, '');
    var title = record ? record.title : unit.cn + ' · ' + base;
    referenceImage.src = src;
    referenceImage.alt = title;
    B.set(referenceTitle,record ? record.titleZh : title,record ? record.titleEn : unit.en+' · '+base);
    referenceKeywords.textContent = '';
    (record ? record.keywords : [unit.scale]).forEach(function (keyword) {
      var li = document.createElement('li'); var zh=keyword==='GUI'?'图形用户界面':keyword==='net art'?'网络艺术':keyword; B.set(li,zh,B.term(keyword)); referenceKeywords.appendChild(li);
    });
    referencePreview.dataset.reference = key;
    referencePreview.dataset.unit = unit.key;
    referencePreview.dataset.image = src;
    referencePreview.dataset.recordId = record ? record.id : base;
    referencePreview.hidden = false;
  }
  function setHoveredPhoto(box) {
    if (hoveredPhoto === box) return;
    if (hoveredPhoto) {
      var previous = hoveredPhoto; previous._previewHovered = false;
      if (previous._pendingRemoval) removeSpawn(previous);
    }
    hoveredPhoto = box;
    if (box) { box._previewHovered = true; showReference(box._referenceUnit, box._referenceSrc); }
  }
  // 小图继续穿透鼠标，使用变换后的实际范围识别悬停，避免中断原来的滑动弹图。
  function photoAt(ev) {
    var list = plane.querySelectorAll('.spawn'), pr = plane.getBoundingClientRect();
    for (var i = list.length - 1; i >= 0; i--) {
      var box = list[i], rect = box.getBoundingClientRect();
      if (box._dying || ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom) continue;
      var style = getComputedStyle(box);
      if (parseFloat(style.opacity) < .08) continue;
      var origin = style.transformOrigin.split(' ').map(parseFloat);
      var local = new DOMPoint(ev.clientX - pr.left - box.offsetLeft - origin[0], ev.clientY - pr.top - box.offsetTop - origin[1]);
      local = local.matrixTransform(new DOMMatrix(style.transform).inverse());
      var x = local.x + origin[0], y = local.y + origin[1];
      if (x >= 0 && x <= box.offsetWidth && y >= 0 && y <= box.offsetHeight) return box;
    }
    return null;
  }
  plane.addEventListener('mousemove', function (ev) { setHoveredPhoto(photoAt(ev)); });
  plane.addEventListener('mouseleave', function () { setHoveredPhoto(null); });

  /* 在光标处弹出一张该分类的小图 */
  function spawn(u, ev) {
    var imgs = (window.UNIT_IMAGES || {})[u.key] || [];
    if (!imgs.length) return;
    var r = plane.getBoundingClientRect();
    var mx = ev.clientX - r.left, my = ev.clientY - r.top;
    var src = imgs[Math.floor(Math.random() * imgs.length)];
    var box = document.createElement('div');
    box.className = 'spawn';
    box._referenceUnit = u; box._referenceSrc = src;
    box.dataset.referenceImage = src;
    var im = document.createElement('img');
    im.src = src;
    im.alt = u.cn+' / '+u.en;
    var cap = document.createElement('div');
    cap.className = 'spawn-cap';
    var base = src.split('/').pop().replace(/\.[^.]+$/, '');
    cap.textContent = u.id + ' ' + u.cn + ' / '+u.en+' · ' + base;
    box.appendChild(im); box.appendChild(cap);
    /* 位置：光标附近随机偏移，防止完全重叠；旋转一点点 */
    var W = 190, H = 168;
    var lx = Math.min(Math.max(mx - W / 2 + (Math.random() * 56 - 28), 6), r.width - W - 6);
    var ly = Math.min(Math.max(my - 100 + (Math.random() * 56 - 28), 6), r.height - H - 6);
    box.style.left = lx + 'px';
    box.style.top = ly + 'px';
    box.style.transform = 'rotate(' + (Math.random() * 6 - 3) + 'deg) scale(.6)';
    box.style.opacity = '0';
    plane.appendChild(box);
    showReference(u, src);
    requestAnimationFrame(function () {
      box.style.opacity = '1';
      box.style.transform = box.style.transform.replace('scale(.6)', 'scale(1)');
    });
    spawns.push(box);
    /* 停留 LIFE 后缓慢消退（若已被移除则跳过） */
    setTimeout(function () {
      var i = spawns.indexOf(box);
      if (i !== -1) { spawns.splice(i, 1); removeSpawn(box); }
    }, LIFE);
    while (spawns.length > MAX_SPAWNS) removeSpawn(spawns.shift());
  }
  function removeSpawn(box) {
    if (!box.parentNode || box._dying) return;
    if (box._previewHovered) { box._pendingRemoval = true; return; }
    box._pendingRemoval = false;
    box._dying = true;
    box.style.transition = 'opacity 1.15s ease, transform 1.15s ease';
    box.style.opacity = '0';
    box.style.transform += ' scale(.85)';
    setTimeout(function () { box.remove(); }, 1200);
  }
  function fadeSpawns() {
    /* 离开后不是瞬间消失，而是一张接一张缓慢退场 */
    var delay = 0;
    while (spawns.length) {
      (function (box, d) {
        setTimeout(function () { removeSpawn(box); }, d);
      })(spawns.shift(), delay);
      delay += 130;
    }
  }

  function makeZero() {
    var b = document.createElement('button');
    b.className = 'marker zero';
    b.style.left = px(0) + 'px';
    b.style.top = py(0) + 'px';
    b.setAttribute('aria-label', '0号桌 1㎡ 参照物');
    b.innerHTML = '<span class="sq"></span>';
    b.addEventListener('mouseenter', function (ev) { showCard(ZERO, ev); showAssembly({ key: 'prototype', id: '00', cn: '原型桌' }); });
    b.addEventListener('mousemove', moveCard);
    b.addEventListener('mouseleave', hideCard);
    b.addEventListener('click', function (ev) {
      if (cardFor === ZERO) { hideCard(); } else { showCard(ZERO, ev); }
    });
    return b;
  }

  /* ---------- 0 号桌：原点文字卡 ---------- */
  var cardFor = null;
  function showCard(u, ev) {
    cardFor = u;
    card.classList.add('text-only');
    document.getElementById('card-cap').innerHTML =
      '<b>' + ZERO.cn + ' · ' + ZERO.en + ' / Prototype table</b><br>' + B.pair(ZERO.desc,'The exhibition’s conceptual center: a one-square-meter tabletop connects five themes and reveals relationships between people, objects and the world.');
    card.hidden = false;
    if (ev) moveCard(ev);
  }
  function hideCard() {
    cardFor = null; card.hidden = true;
  }
  function moveCard(ev) {
    var r = plane.getBoundingClientRect();
    var mx = ev.clientX - r.left, my = ev.clientY - r.top;
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var lx = mx + 24, ly = my - ch - 16;
    if (lx + cw > r.width - 10) lx = mx - cw - 24;
    if (ly < 10) ly = my + 24;
    card.style.left = lx + 'px';
    card.style.top = ly + 'px';
  }

  /* ---------- 实时坐标读数 ---------- */
  function nearest(list, v, key) {
    var best = list[0], d = Math.abs(list[0][key] - v);
    for (var i = 1; i < list.length; i++) {
      var nd = Math.abs(list[i][key] - v);
      if (nd < d) { d = nd; best = list[i]; }
    }
    return best.t;
  }
  plane.addEventListener('mousemove', function (ev) {
    var r = plane.getBoundingClientRect();
    var gx = Math.round((ev.clientX - r.left - cx) / cell);
    var gy = Math.round((cy - (ev.clientY - r.top)) / cell);
    var line = 'X ' + fmt(gx) + ' · ' + nearest(ERAS, gx, 'x')+' / '+B.term(nearest(ERAS, gx, 'x')) +
      ' ｜ Y ' + fmt(gy) + ' · ' + nearest(SCALES, gy, 'y')+' / '+B.term(nearest(SCALES, gy, 'y'));
    /* 光标落入某单元占地范围时，在 Y 轴读数后补上该资料单元名 */
    var u = null, i;
    for (i = 0; i < UNITS.length; i++) {
      var rc = UNITS[i].rect;
      if (gx >= Math.ceil(rc[0]) && gx <= Math.floor(rc[2]) &&
          gy >= Math.ceil(rc[1]) && gy <= Math.floor(rc[3])) { u = UNITS[i]; break; }
    }
    if (!u && Math.hypot(gx, gy) <= 0.5) u = { id: '00', cn: ZERO.cn, key: null };
    if (u) {
      var n = u.key && window.UNIT_IMAGES ? (window.UNIT_IMAGES[u.key] || []).length : 0;
      line += ' ｜ ' + u.id + ' ' + u.cn + (n ? '（' + n + ' 条资料 / records）' : '');
    }
    readout.textContent = line;
  });
  plane.addEventListener('mouseleave', function () {
    readout.textContent = 'X — · — ｜ Y — · —';
  });

  window.addEventListener('resize', layout);
  if(window.ResizeObserver)new ResizeObserver(layout).observe(plane);
  layout();

  var initialAssembly = UNITS.find(function (unit) { return unit.key === enterUnit; });
  showAssembly(initialAssembly || { key: 'prototype', id: '00', cn: '原型桌' });

  /* ---------- 点击空白处返回；资料热区、图片与文字保留原有交互 ---------- */
  function closeCoordinates() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'coord-close' }, '*');
    } else if (history.length > 1) {
      history.back();
    } else {
      location.href = '../desktop.html';
    }
  }

  function hasContentAt(ev) {
    if (ev.target.closest('button, a, input, select, textarea, [contenteditable], .brand, .meta, #readout, #hint, text, #reference-preview')) return true;
    // 图片卡不接收鼠标事件，按实际可见范围保护，避免穿透到背景后退出。
    return Array.prototype.some.call(document.querySelectorAll('.spawn, #card:not([hidden]), .marker .sq, #assembly-preview:not([hidden])'), function (node) {
      var r = node.getBoundingClientRect();
      return parseFloat(getComputedStyle(node).opacity) > 0.05 &&
        ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    });
  }

  var blankPress = null;
  document.addEventListener('pointerdown', function (ev) {
    blankPress = ev.button === 0 ? { x: ev.clientX, y: ev.clientY, moved: false, onContent: hasContentAt(ev) } : null;
  });
  document.addEventListener('pointermove', function (ev) {
    if (blankPress && Math.hypot(ev.clientX - blankPress.x, ev.clientY - blankPress.y) > 6) blankPress.moved = true;
  });
  document.addEventListener('pointercancel', function () { blankPress = null; });
  document.addEventListener('click', function (ev) {
    var press = blankPress;
    blankPress = null;
    if (ev.button !== 0 || ev.detail === 0 || !press || press.moved || press.onContent || hasContentAt(ev)) return;
    closeCoordinates();
  });
  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') closeCoordinates();
  });

  /* ---------- 从某单元跳入：该单元的占地范围闪几下绿色 ---------- */
  function flashZone(key) {
    var u = null;
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].key === key) u = UNITS[i];
    if (!u) return;
    var rc = u.rect;
    var f = document.createElement('div');
    f.className = 'zone-flash';
    f.style.width = (rc[2] - rc[0]) * cell + 'px';
    f.style.height = (rc[3] - rc[1]) * cell + 'px';
    f.style.left = px(rc[0]) + 'px';
    f.style.top = py(rc[3]) + 'px';
    plane.appendChild(f);
    setTimeout(function () { f.remove(); }, 2600);
  }
  if (enterUnit) setTimeout(function () { flashZone(enterUnit); }, 300);
})();
