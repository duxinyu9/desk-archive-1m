(function(){
 'use strict';
 const selector='.bi-zh,.bi-en,#about-page .unit-title h3,#about-page .unit-title>.pixel,#about-page .project-facts dd>.pixel,#layout .intro-copy-cn p,#layout .intro-copy-en p,#carousel .label,#carousel .label small,#reference-title';
 const context=document.createElement('canvas').getContext('2d'),metrics=new Map(),pending=new Set();let scheduled=false;
 function firstText(node){const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode()){const value=text.textContent.trimStart();if(value)return value;}return '';}
 function align(node){
  if(!node.isConnected||node.closest('svg,#loader,.bi-inline')||node.querySelector('.bi-zh,.bi-en'))return;
  const style=getComputedStyle(node);if(style.display==='inline'||style.textAlign==='center'||style.textAlign==='right'||style.textAlign==='end')return;
  const text=firstText(node);if(!text)return;
  const font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily,char=Array.from(text)[0],key=font+'|'+char;
  let offset=metrics.get(key);
  if(offset===undefined){context.font=font;offset=context.measureText(char).actualBoundingBoxLeft||0;offset=Math.max(-parseFloat(style.fontSize)*.65,Math.min(parseFloat(style.fontSize)*.65,offset));metrics.set(key,offset);}
  const value=Math.round(offset*100)/100+'px';
  if(node.style.getPropertyValue('--start-indent')!==value)node.style.setProperty('--start-indent',value);
  node.setAttribute('data-align-start','');
 }
 function alignAxis(node,sharedLeft){
  const en=node.querySelector('.axis-en');if(!en)return;
  let zh=node.querySelector('.axis-zh');
  if(!zh){const text=[...node.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(!text)return;zh=document.createElementNS('http://www.w3.org/2000/svg','tspan');zh.setAttribute('class','axis-zh');zh.setAttribute('x',node.getAttribute('x'));zh.textContent=text.textContent;node.replaceChild(zh,text);}
  const a=zh.getBBox(),b=en.getBBox(),left=sharedLeft===undefined?Math.min(a.x,b.x):sharedLeft;
  for(const [span,box]of [[zh,a],[en,b]]){const delta=left-box.x;if(Math.abs(delta)>.1)span.setAttribute('x',+(Number(span.getAttribute('x'))+delta).toFixed(3));}
 }
 function collect(root){if(root.nodeType!==Node.ELEMENT_NODE&&root!==document)return;if(root.matches?.(selector))pending.add(root);for(const n of root.querySelectorAll(selector))pending.add(n);const parent=root.closest?.(selector);if(parent)pending.add(parent);}
 function flush(){scheduled=false;for(const node of pending)align(node);pending.clear();const axes=[...document.querySelectorAll('#grid-svg .era-label,#grid-svg .scale-label')];for(const node of axes)alignAxis(node);const scales=axes.filter(n=>n.classList.contains('scale-label'));if(scales.length){const left=Math.min(...scales.map(n=>n.getBBox().x));for(const node of scales)alignAxis(node,left);}document.documentElement.dataset.textAlignment='ready';}
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(flush);}}
 function all(){collect(document);schedule();}
 new MutationObserver(records=>{for(const record of records){if(record.type==='characterData'){collect(record.target.parentElement);continue;}for(const node of record.addedNodes)if(node.nodeType===Node.ELEMENT_NODE)collect(node);if(record.target.nodeType===Node.ELEMENT_NODE)collect(record.target);}schedule();}).observe(document.body,{childList:true,subtree:true,characterData:true});
 let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(all,100);},{passive:true});
 document.fonts?.ready.then(()=>{metrics.clear();all();});document.fonts?.addEventListener('loadingdone',()=>{metrics.clear();all();});all();
})();
