(function(){
 'use strict';
 var lv=document.getElementById('list-view');
 var toolbar=lv&&lv.querySelector('.lv-index-tools');
 var globalOpen=document.getElementById('search-open');
 if(!lv||!toolbar||!globalOpen)return;
 var caption=toolbar.querySelector('.lv-index-caption');
 var totalLabel=caption.querySelector('.lv-total');
 var groups=Array.from(lv.querySelectorAll('.lv-group'));
 var letters=Array.from(toolbar.querySelectorAll('.lv-letter'));
 var icon='<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" shape-rendering="crispEdges"><path d="M3 3h8v2H3zM1 5h2v6H1zM3 11h8v2H3zM11 5h2v6h-2zM12 12h3v3h-3zM15 15h3v3h-3z"/></svg>';
 var localOpen=document.createElement('button');
 localOpen.type='button';localOpen.id='lv-search-open';localOpen.className='lv-search-launch';
 localOpen.setAttribute('aria-controls','archive-search');localOpen.setAttribute('aria-expanded','false');
 localOpen.innerHTML=icon+'<span>搜索 / Search</span>';caption.append(localOpen);
 var form=document.createElement('form');
 form.id='archive-search';form.className='lv-search-form';form.hidden=true;
 form.setAttribute('role','search');form.setAttribute('aria-label','搜索桌面档案 / Search desk archive');
 form.innerHTML='<label class="lv-search-field">'+icon+'<span class="search-sr-only">搜索资料 / Search materials</span><input id="lv-search-input" type="search" placeholder="搜索标题、作者、标签 / Search titles, authors, tags…" autocomplete="off" spellcheck="false" maxlength="160" aria-describedby="lv-search-status"></label>'+
  '<output id="lv-search-status" class="lv-search-status" aria-live="polite"></output>'+
  '<button type="button" class="lv-search-clear">清空 / Clear</button>'+
  '<button type="button" class="lv-search-close" aria-label="关闭搜索 / Close search" title="关闭搜索 / Close search (Esc)">×</button>';
 caption.insertAdjacentElement('afterend',form);
 var input=form.querySelector('input');
 var status=form.querySelector('output');
 var clearButton=form.querySelector('.lv-search-clear');
 var closeButton=form.querySelector('.lv-search-close');
 var empty=document.createElement('div');
 empty.className='lv-search-empty';empty.hidden=true;
 empty.innerHTML='<h3>没有找到相关资料<br>No matching records</h3><p>试试其他关键词，或清空搜索查看全部资料。<br>Try different keywords, or clear the search to view all records.</p><button type="button">清空搜索 / Clear search</button>';
 lv.querySelector('.lv-cols').insertAdjacentElement('afterend',empty);
 function normalize(value){return String(value==null?'':value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();}
 var sources=Object.create(null);
 (window.LIST_DATA||[]).forEach(function(group){group.items.forEach(function(item){
  sources[item.id]=normalize([item.id,item.title,item.author,item.field,item.year,item.tags,item.note,item.category,item.titleZh,item.titleEn,item.authorEn,item.fieldEn,item.yearEn,item.tagsEn,item.noteEn,item.categoryEn,group.name,group.en].join(' '));
 });});
 var rows=Array.from(lv.querySelectorAll('.lv-group .lv-row')).map(function(row){return {node:row,text:sources[row.dataset.entryId]||''};});
 var total=rows.length,opened=false,composing=false,lastQuery='',browseScroll=0,opener=null;
 status.textContent=total+' 条资料 / records';clearButton.disabled=true;
 function refresh(){lv.dispatchEvent(new CustomEvent('archive:index-filter'));}
 function applyQuery(){
  var query=normalize(input.value);
  clearButton.disabled=!input.value;
  if(query===lastQuery)return;
  lastQuery=query;
  var terms=query?query.split(' '):[];
  var counts=Object.create(null),matched=0;
  rows.forEach(function(entry){
   var visible=terms.every(function(term){return entry.text.includes(term);});
   entry.node.hidden=!visible;
   if(visible){matched++;var letter=entry.node.closest('.lv-group').dataset.letter;counts[letter]=(counts[letter]||0)+1;}
  });
  groups.forEach(function(group){
   var count=counts[group.dataset.letter]||0;
   group.hidden=count===0;group.querySelector('.cnt').textContent='('+count+')';
  });
  letters.forEach(function(button){
   var letter=button.dataset.letter,count=counts[letter]||0;
   button.disabled=count===0;
   button.setAttribute('aria-label','跳转到 '+letter+'（'+count+' 条资料 / records）');
   button.title=letter+' · '+count+' 条资料 / records';
  });
  lv.classList.toggle('is-searching',!!query);
  lv.classList.toggle('has-no-search-results',!!query&&matched===0);
  empty.hidden=!query||matched>0;
  status.textContent=query?matched+' / '+total+' 条资料 / records':total+' 条资料 / records';
  totalLabel.textContent=query?matched+' / '+total+' 条资料 / records':total+' 条资料 / records';
  clearButton.disabled=!input.value;
  lv.scrollTop=0;refresh();
 }
 function openSearch(event){
  if(!opened){opener=event&&event.currentTarget||globalOpen;browseScroll=lv.scrollTop;}
  if(!document.getElementById('stage').classList.contains('list-mode'))document.getElementById('vt-list').click();
  opened=true;caption.hidden=true;form.hidden=false;toolbar.classList.add('search-open');
  globalOpen.setAttribute('aria-expanded','true');localOpen.setAttribute('aria-expanded','true');
  refresh();requestAnimationFrame(function(){input.focus({preventScroll:true});input.select();});
 }
 function clearSearch(){input.value='';composing=false;applyQuery();input.focus({preventScroll:true});}
 function closeSearch(restoreFocus){
  if(!opened)return;
  input.value='';composing=false;applyQuery();opened=false;
  form.hidden=true;caption.hidden=false;toolbar.classList.remove('search-open');
  globalOpen.setAttribute('aria-expanded','false');localOpen.setAttribute('aria-expanded','false');
  refresh();lv.scrollTop=browseScroll;
  if(restoreFocus!==false&&opener&&opener.getClientRects().length)opener.focus({preventScroll:true});
 }
 globalOpen.addEventListener('click',openSearch);localOpen.addEventListener('click',openSearch);
 input.addEventListener('compositionstart',function(){composing=true;});
 input.addEventListener('compositionend',function(){composing=false;applyQuery();});
 input.addEventListener('input',function(event){if(!composing&&!event.isComposing)applyQuery();});
 form.addEventListener('submit',function(event){event.preventDefault();if(!composing)applyQuery();});
 clearButton.addEventListener('click',clearSearch);empty.querySelector('button').addEventListener('click',clearSearch);
 closeButton.addEventListener('click',function(){closeSearch();});
 document.getElementById('vt-desk').addEventListener('click',function(){closeSearch(false);});
 document.addEventListener('keydown',function(event){
  if(event.isComposing||composing)return;
  if(event.key==='Escape'&&opened){event.preventDefault();event.stopPropagation();closeSearch();return;}
  var target=event.target;
  if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey||target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(document.getElementById('loader')||document.querySelector('#archive:not([hidden]),#coord-overlay:not([hidden])'))return;
  event.preventDefault();openSearch();
 },true);
})();
