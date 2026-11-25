(function(){
 'use strict';
 const B=window.DeskBilingual;
 const normalized=s=>s.replace(/\s+/g,'');
 const map=new Map(Object.entries(B.ui).map(([k,v])=>[normalized(k),v]));
 const nodes=[...document.querySelectorAll('p,h1,h2,h3,h4,dt,dd,a,button,span,small,.loader-sub,.loader-copy,.loader-foot,.meta>div,.drag-hint')].reverse();
 nodes.forEach(node=>{
  if(node.closest('[lang="en"],.bi-en,#loader,script,style,svg,.project-identity,.nav-brand,.brand h1,.intro-copy-en,.intro-copy-cn,#obj-name,#obj-desc,#obj-meta,#obj-num,.lv-row,.lv-cols,.lv-sec'))return;
  if(node.querySelector('[lang="en"],.bi-en,img,svg'))return;
  const en=map.get(normalized(node.textContent));if(!en)return;
  const original=node.innerHTML;
  if(/[\u3400-\u9fff]/.test(node.textContent)){node.innerHTML='<span class="bi-zh" lang="zh-CN">'+original+'</span><span class="bi-en" lang="en">'+B.esc(en)+'</span>';}
  else {node.innerHTML='<span class="bi-zh" lang="zh-CN">'+B.esc(en)+'</span><span class="bi-en" lang="en">'+original+'</span>';}
 });
 const sound=document.getElementById('sound-btn');if(sound){sound.title='声音 / Sound';sound.setAttribute('aria-label','开关声音 / Toggle sound');}
 for(const [id,cn,en]of [['zoom-in','放大','Zoom in'],['zoom-out','缩小','Zoom out'],['reset-view','重置视角','Reset view']]){
  const node=document.getElementById(id);if(node){node.title=cn+' / '+en;node.setAttribute('aria-label',cn+' / '+en);}
 }
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),texts=[];let text;
 while(text=walker.nextNode())if(!text.parentElement.closest('#loader,script,style,svg,[lang="en"],.bi-en,.bi-zh,.nav-brand,.brand h1,.lv-row,.lv-cols,#obj-desc,#obj-name')&&map.has(normalized(text.textContent)))texts.push(text);
 texts.forEach(text=>{const zh=text.textContent.trim(),other=map.get(normalized(zh)),label=document.createElement('span');label.className='bi-label';label.innerHTML=/[\u3400-\u9fff]/.test(zh)?B.pair(zh,other):B.pair(other,zh);text.replaceWith(label);});
 document.documentElement.dataset.bilingual='ready';
})();
