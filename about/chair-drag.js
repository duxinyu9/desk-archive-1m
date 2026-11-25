import * as THREE from 'three';
import {GLTFLoader} from 'scene/loader';

export async function createChairDrag({scene,camera,host,roots,ink,recolor,invalidate}){
 const config=await (await fetch(new URL('./assets/chairs/placements.json',import.meta.url))).json();
 const bar=document.getElementById('chair-bar'),stage=document.getElementById('stage');
 const figures=[...bar.querySelectorAll('.chair-sticker')],groups=new Map(),placed=new Set();
 const targets=roots.map(root=>({root,key:root.userData.exhibitUnit||root.children.find(n=>n.userData.exhibitUnit)?.userData.exhibitUnit}));
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),box=new THREE.Box3();
 let active=null,effect=null,settling=false,keyboardKey=null,keyboardIndex=0;
 const debug=window.chairDragDebug={ready:false,placed:[],attempts:0,lastDrop:null,source:'1(2).skp',originalPlacements:true};
 const status=document.createElement('div');status.className='chair-drag-announcement';status.setAttribute('role','status');status.setAttribute('aria-live','polite');stage.appendChild(status);
 function say(zh,en){status.replaceChildren();for(const [lang,text]of [['zh-CN',zh],['en',en]]){const span=document.createElement('span');span.lang=lang;span.textContent=text;status.appendChild(span);}}
 say('拖动上方椅子，放回对应展具','Drag a seat to its matching exhibit');
 for(const figure of figures){figure.tabIndex=-1;figure.setAttribute('role','button');figure.setAttribute('aria-disabled','true');figure.setAttribute('aria-label',figure.querySelector('img').alt+'：拖动到对应展具 / Drag to the matching exhibit');}
 scene.updateMatrixWorld(true);
 const altar=targets.find(t=>t.key==='altar').root;
 for(const item of config.chairs){
  const group=new THREE.Group();group.name='paired-chair-'+item.mark;group.userData.chairMark=item.mark;scene.add(group);
  if(item.mark<=2){
   const nodes=[];altar.traverse(node=>{const name=node.userData.sketchupName||'';if(item.mark===1?name.startsWith('矮展台｜')||name==='中展台玻璃':name.startsWith('低展台｜500'))nodes.push(node);});
   if(nodes.length!==(item.mark===1?4:1))throw Error('Missing original chair parts: '+item.mark);
   for(const node of nodes)group.attach(node);
  }else{
   const gltf=await new GLTFLoader().loadAsync(new URL(item.file,import.meta.url).href);
   for(const placement of item.placements){const copy=gltf.scene.clone(true);copy.applyMatrix4(new THREE.Matrix4().fromArray(placement.matrix).multiply(new THREE.Matrix4().fromArray(item.sourceMatrix).invert()));recolor(copy);copy.userData.sourcePlacement=placement.id;group.add(copy);}
  }
  group.updateMatrixWorld(true);group.userData.originalMatrix=group.matrix.toArray();group.userData.sourcePlacements=item.placements;
  group.visible=false;groups.set(item.mark,group);
 }
 // Pick the actual visible geometry first. The projected body gives narrow legs
 // a modest touch tolerance while preserving the same unit in every view.
 function meshes(root){const list=[];root.traverseVisible(node=>{if(node.isMesh)list.push(node);});return list;}
 function screen(point){const p=point.clone().project(camera),r=host.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
 function cross(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
 function hull(points){points.sort((a,b)=>a.x-b.x||a.y-b.y);const lower=[],upper=[];for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
 function outline(target){box.setFromObject(target.root);const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(screen(new THREE.Vector3(x,y,z)));return hull(points);}
 function contains(p,poly){let sign=0;for(let i=0;i<poly.length;i++){const value=cross(poly[i],poly[(i+1)%poly.length],p);if(Math.abs(value)<.001)continue;if(sign&&Math.sign(value)!==sign)return false;sign=Math.sign(value);}return!!sign;}
 function near(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=THREE.MathUtils.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function pick(x,y){
  const r=host.getBoundingClientRect(),br=bar.getBoundingClientRect();if(x<r.left||x>r.right||y<Math.max(r.top,br.bottom)||y>r.bottom)return null;
  const element=document.elementFromPoint(x,y);if(element?.closest('a,button'))return null;
  camera.updateMatrixWorld(true);pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(targets.flatMap(t=>meshes(t.root)),false)[0];if(hit)return targets.find(t=>{let node=hit.object;while(node){if(node===t.root)return true;node=node.parent;}return false;})||null;
  const p={x,y},candidates=targets.map(t=>({target:t,poly:outline(t),center:screen(new THREE.Box3().setFromObject(t.root).getCenter(new THREE.Vector3()))})).filter(t=>contains(p,t.poly)||t.poly.some((a,i)=>near(p,a,t.poly[(i+1)%t.poly.length])<10));
  candidates.sort((a,b)=>Math.hypot(p.x-a.center.x,p.y-a.center.y)-Math.hypot(p.x-b.center.x,p.y-b.center.y));return candidates[0]?.target||null;
 }
 function tint(target,color){ink.setHover(target?(Array.isArray(target)?target:[target]).flatMap(meshes):null,color);invalidate(false);}
 function clearEffect(){if(!effect)return;effect=null;tint(null);}
 function ghost(figure,x,y){const image=figure.querySelector('img'),r=image.getBoundingClientRect(),node=document.createElement('div');node.className='chair-drag-ghost';node.setAttribute('aria-hidden','true');node.appendChild(image.cloneNode());Object.assign(node.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});node.style.setProperty('--seat-image',`url("${image.src}")`);document.body.appendChild(node);return{node,dx:x-r.left,dy:y-r.top};}
 function begin(figure,x,y,pointerId=null){
  if(active||settling||figure.classList.contains('is-placed'))return false;clearEffect();
  const mark=Number(figure.dataset.sourceMark),item=config.chairs.find(c=>c.mark===mark);if(!item)return false;
  active={figure,item,pointerId,x,y,startX:x,startY:y,moved:false,...ghost(figure,x,y)};figure.classList.add('is-dragging');stage.classList.add('chair-drag-active');debug.dragging=mark;
  say('把椅子拖到对应展具上','Drop the seat on its matching exhibit');return true;
 }
 function move(x,y){if(!active)return;active.x=x;active.y=y;active.moved||=Math.hypot(x-active.startX,y-active.startY)>6;active.node.style.left=x-active.dx+'px';active.node.style.top=y-active.dy+'px';updateHover();}
 function updateHover(){if(!active)return;const target=pick(active.x,active.y);if(active.target!==target){active.target=target;tint(target?.root,'#b7b7b7');}debug.hoverUnit=target?.key||null;}
 let hoverCheckAt=0;
 async function animate(node,frames,options){try{await node.animate(frames,options).finished;}catch{}}
 function releaseFigure(a){if(a.pointerId!==null&&a.figure.hasPointerCapture(a.pointerId))a.figure.releasePointerCapture(a.pointerId);}
 async function finish(cancel=false){
  if(!active)return;const a=active;active=null;settling=true;releaseFigure(a);delete debug.dragging;delete debug.hoverUnit;stage.classList.remove('chair-drag-active');
  const target=cancel?null:pick(a.x,a.y),correct=!!target&&a.item.units.includes(target.key),wasAttempt=!cancel&&a.moved;
  tint(null);if(wasAttempt){debug.attempts++;debug.lastDrop={mark:a.item.mark,unit:target?.key||null,correct};}
  if(wasAttempt&&correct){
   const group=groups.get(a.item.mark);group.visible=true;placed.add(a.item.mark);debug.placed=[...placed];debug.lastDrop.originalPositions=true;
   a.figure.classList.add('is-placed');a.figure.setAttribute('aria-disabled','true');a.figure.tabIndex=-1;
   invalidate(true);tint([group,target.root],'#49b248');effect={until:performance.now()+850,group};
   const destination=screen(new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()));
   a.node.dataset.feedback='correct';await animate(a.node,[{opacity:1,transform:'scale(1)'},{opacity:0,left:destination.x-a.node.offsetWidth/2+'px',top:destination.y-a.node.offsetHeight/2+'px',transform:'scale(.35)'}],{duration:260,easing:'ease-out',fill:'forwards'});
   say(placed.size===config.chairs.length?'椅子已全部归位':'配对正确，已放回模型原位',placed.size===config.chairs.length?'All seats are back in place':'Matched — returned to its original model position');
  }else{
   if(wasAttempt){a.node.dataset.feedback='wrong';if(target)tint(target.root,'#df4141');await animate(a.node,[{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(-5px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:280,easing:'ease-out'});say('位置不匹配，再试一次','That position does not match. Try again.');}
   const home=a.figure.querySelector('img').getBoundingClientRect();await animate(a.node,[{left:a.node.style.left,top:a.node.style.top,opacity:1},{left:home.left+'px',top:home.top+'px',opacity:0.2}],{duration:320,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'});tint(null);
  }
  a.node.remove();a.figure.classList.remove('is-dragging');settling=false;keyboardKey=null;
 }
 for(const figure of figures){
  figure.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.pointerType==='mouse'&&event.button!==0)return;if(begin(figure,event.clientX,event.clientY,event.pointerId)){event.preventDefault();figure.focus({preventScroll:true});figure.setPointerCapture(event.pointerId);}});
  figure.addEventListener('pointermove',event=>{if(active?.pointerId===event.pointerId){event.preventDefault();move(event.clientX,event.clientY);}});
  figure.addEventListener('pointerup',event=>{if(active?.pointerId===event.pointerId){event.preventDefault();move(event.clientX,event.clientY);finish();}});
  figure.addEventListener('pointercancel',event=>{if(active?.pointerId===event.pointerId)finish(true);});
  figure.addEventListener('lostpointercapture',event=>{if(active?.pointerId===event.pointerId)finish(true);});
  figure.addEventListener('dragstart',event=>event.preventDefault());
  figure.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();finish(true);return;}
   if(event.key==='Enter'||event.key===' '){event.preventDefault();if(active&&keyboardKey===figure){finish();return;}if(!active){const r=figure.querySelector('img').getBoundingClientRect();if(begin(figure,r.left+r.width/2,r.top+r.height/2)){keyboardKey=figure;keyboardIndex=0;}}}
   else if(keyboardKey===figure&&/^Arrow/.test(event.key)){event.preventDefault();keyboardIndex=(keyboardIndex+(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)+targets.length)%targets.length;const target=targets[keyboardIndex],p=screen(new THREE.Box3().setFromObject(target.root).getCenter(new THREE.Vector3()));move(p.x,p.y);say('按回车放置，Esc 取消','Press Enter to place, or Escape to cancel');}
  });
  figure.tabIndex=0;figure.setAttribute('aria-disabled','false');figure.setAttribute('aria-keyshortcuts','Enter Space ArrowLeft ArrowRight Escape');
 }
 addEventListener('blur',()=>finish(true));addEventListener('resize',()=>finish(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
 invalidate(true);debug.ready=true;bar.dataset.draggable='ready';
 return{
  update(time){if(active?.moved&&time>=hoverCheckAt){hoverCheckAt=time+80;updateHover();}if(effect&&time>=effect.until){clearEffect();}},
  pick:(x,y)=>pick(x,y)?.key||null,
  targets:()=>targets.map(t=>({key:t.key,outline:outline(t)})),
  placements:()=>config.chairs.map(item=>({mark:item.mark,units:item.units,placed:placed.has(item.mark),positions:item.placements,visible:groups.get(item.mark).visible})),
  cancel:()=>finish(true)
 };
}
