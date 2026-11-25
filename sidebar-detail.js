(function(){
 'use strict';
 const name=document.getElementById('obj-name'),description=document.getElementById('obj-desc'),panel=document.getElementById('right');
 const measure=document.createElement('canvas').getContext('2d');
 function cleanDescription(value){
  return String(value||'').replace(/\\r\\n|\\n|\r\n?/g,'\n')
   .replace(/\[([^\]]+)\]\(https?:\/\/[^\s]+?\)/gi,'$1')
   .replace(/[（(]\s*(?:https?:\/\/|www\.)[^\s<>“”‘’\u3400-\u9fff]*?[）)]+/gi,'')
   .replace(/(?:https?:\/\/|www\.)[A-Za-z0-9\-._~:/?#\[\]@!$&'*+,;=%()+]+/gi,'')
   .replace(/[（(]\s*[）)]/g,'').replace(/[（(]\s*[）)]/g,'')
   .replace(/[：:][ \t]*(?=\n|$)/g,'。')
   .replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim();
 }
 function paragraphs(value,english){
  const source=cleanDescription(value);
  const blocks=source.split(/\n+/).filter(Boolean),result=[];
  for(const block of blocks){
   const sentences=english?block.match(/.*?(?:[.!?](?=\s+[A-Z]|$)|$)/g):block.match(/[^。！？]+[。！？]?[”’」』]?/g);
   if(!sentences||block.length<(english?240:150)){result.push(block);continue;}
   let chunk='',count=0;for(const raw of sentences){const sentence=raw.trim();if(!sentence)continue;if(chunk.length>=(english?200:85)||english&&count>=2){result.push(chunk);chunk='';count=0;}chunk+=(chunk&&english?' ':'')+sentence;count++;}if(chunk)result.push(chunk);
  }
  return result;
 }
 function fit(){
  if(!name||!name.clientWidth)return;
  const width=name.clientWidth;
  for(const line of name.children){
   const english=line.lang==='en',base=english?12:16,min=english?12:14;
   line.style.setProperty('--sidebar-title-size',base+'px');
   const style=getComputedStyle(line);measure.font=style.font;
   const natural=measure.measureText(line.textContent).width+Math.max(0,line.textContent.length-1)*(parseFloat(style.letterSpacing)||0);
   const size=Math.max(min,Math.min(base,Math.floor(base*(width-2)/Math.max(1,natural)*10)/10));
   line.style.setProperty('--sidebar-title-size',size+'px');line.dataset.singleLine=String(natural*size/base<=width-1);
  }
 }
 function render(info){
  const B=window.DeskBilingual;
  B.set(name,info.nameZh||info.name,info.nameEn);
  if(!name.children.length){const span=document.createElement('span');span.className='bi-zh';span.lang='zh-CN';span.textContent=name.textContent;name.replaceChildren(span);}
  description.replaceChildren();
  const zh=cleanDescription(info.desc),en=cleanDescription(info.descEn);
  for(const [text,english]of [[zh,false],[en,true]]){
   if(!text||english&&text===zh)continue;
   const group=document.createElement('div');group.className=english?'bi-en':'bi-zh';group.lang=english?'en':'zh-CN';
   for(const part of paragraphs(text,english)){const p=document.createElement('p');p.textContent=part;group.appendChild(p);}
   description.appendChild(group);
  }
  fit();
 }
 let previousWidth=-1;
 if(window.ResizeObserver)new ResizeObserver(()=>{const width=panel.clientWidth;if(width!==previousWidth){previousWidth=width;fit();}}).observe(panel);
 else window.addEventListener('resize',fit);
 if(document.fonts)document.fonts.ready.then(fit);
 window.DeskSidebar={render,fit,cleanDescription,paragraphs};
})();
