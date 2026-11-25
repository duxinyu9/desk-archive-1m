(function(){
 'use strict';
 var B=window.DeskBilingual;
 var stage=document.getElementById('stage');
 var lv=document.getElementById('list-view');
 var vtDesk=document.getElementById('vt-desk'),vtList=document.getElementById('vt-list');
 function syncPanel(){if(window.deskSyncPanel)window.deskSyncPanel();}
 vtDesk.addEventListener('click',function(){
  if(window.SFX)SFX.play('toggle');
  stage.classList.remove('list-mode');vtDesk.classList.add('on');vtList.classList.remove('on');syncPanel();
 });
 vtList.addEventListener('click',function(){
  if(window.SFX)SFX.play('toggle');
  stage.classList.add('list-mode');vtList.classList.add('on');vtDesk.classList.remove('on');
  syncPanel();refreshIndex();
 });

 var alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 var collator=new Intl.Collator('zh-Hans-CN-u-co-pinyin',{numeric:true,sensitivity:'base'});
 var bounds=['阿','八','擦','搭','蛾','发','噶','哈','击','喀','垃','妈','拿','哦','啪','期','然','撒','塌','挖','昔','压','匝'];
 var hanLetters='ABCDEFGHJKLMNOPQRSTWXYZ';
 // Unit links use existing categories, matching unit photos and explicit topic terms.
 var unitMembership={"A-001":["drafting"],"A-002":["dining"],"A-003":["dining"],"A-004":["dining"],"A-005":[],"A-006":["altar"],"A-007":["dining"],"A-008":["dining"],"A-009":["dining"],"A-010":["dining"],"A-011":["dining"],"A-012":["dining"],"A-013":["dining"],"A-014":["dining"],"A-015":["dining"],"A-016":["dining"],"A-017":["dining"],"A-018":["drafting"],"A-019":["drafting"],"A-020":["dining"],"A-021":["dining"],"A-022":["dining"],"A-023":[],"A-024":["dining"],"A-025":["dining"],"A-026":["dining"],"A-027":["dining"],"A-028":["dining"],"A-029":["dining"],"A-030":["dining"],"A-031":["dining"],"A-032":["dining"],"A-033":["dining"],"A-034":["dining"],"A-035":[],"A-036":["dining"],"A-037":["dining"],"A-038":[],"A-039":["dining"],"A-040":["dining"],"A-041":["dining"],"A-042":["drafting"],"A-043":["dining"],"A-044":["dining"],"A-045":["dining"],"A-046":["dining"],"A-047":["dining"],"A-048":["drafting"],"A-049":["dining"],"A-050":["dining"],"B-001":["dining"],"B-002":["dining"],"B-003":[],"B-004":[],"B-005":["altar","dining"],"B-006":["drafting"],"B-007":[],"B-008":[],"B-009":["altar","dining"],"B-010":[],"B-011":["dining"],"B-012":["dining"],"B-013":[],"B-014":["dining"],"B-015":["dining"],"B-016":[],"B-017":["dining"],"B-018":["dining"],"B-019":["dining"],"B-020":["dining"],"B-021":["dining"],"B-022":[],"B-023":["drafting"],"B-024":["dining"],"B-025":["dining"],"B-026":["dining"],"B-027":["dining"],"B-028":[],"B-029":["dining"],"B-030":["dining"],"B-031":[],"B-032":[],"B-033":[],"B-034":["altar"],"B-035":[],"B-036":[],"B-037":["dining"],"B-038":[],"B-039":[],"B-040":[],"B-041":[],"B-042":["dining"],"B-043":["altar"],"B-044":["dining"],"B-045":["dining"],"B-046":["dining"],"B-047":[],"B-048":[],"B-049":[],"B-050":["drafting"],"C-001":["desk"],"C-002":[],"C-003":[],"C-004":["school"],"C-005":[],"C-006":[],"C-007":["desk"],"C-008":[],"C-009":["desk"],"C-010":["desk"],"C-011":["desk"],"C-012":["desk"],"C-013":["desk"],"C-014":["desk"],"C-015":["desk"],"C-016":[],"C-017":[],"C-018":["dining","desk"],"C-019":[],"C-020":[],"C-021":["dining"],"C-022":["desk"],"C-023":[],"C-024":[],"C-025":[],"C-026":[],"C-027":["desk"],"C-028":[],"C-029":[],"C-030":["dining"],"C-031":["desk"],"C-032":[],"C-033":[],"C-034":[],"C-035":[],"C-036":["desk"],"C-037":[],"C-038":[],"C-039":[],"C-040":["school"],"C-041":["desk"],"C-042":[],"C-043":[],"C-044":["dining","drafting"],"C-045":[],"C-046":[],"C-047":[],"C-048":["school"],"C-049":["school"],"C-050":[],"D-001":["drafting"],"D-002":["dining"],"D-003":[],"D-004":[],"D-005":["dining"],"D-006":["drafting"],"D-007":["dining"],"D-008":["dining"],"D-009":[],"D-010":["dining"],"D-011":[],"D-012":[],"D-013":["school"],"D-014":["drafting"],"D-015":[],"D-016":[],"D-017":[],"D-018":[],"D-019":["dining"],"D-020":[],"D-021":["school"],"D-022":[],"D-023":[],"D-024":[],"D-025":[],"D-026":["desk"],"D-027":[],"D-028":[],"D-029":[],"D-030":[],"D-031":[],"D-032":[],"D-033":[],"D-034":["dining"],"D-035":["dining"],"D-036":["dining"],"D-037":[],"D-038":["drafting"],"D-039":[],"D-040":["drafting"],"D-041":["drafting"],"D-042":["drafting"],"D-043":[],"D-044":[],"D-045":["drafting"],"D-046":["drafting"],"D-047":["desk"],"D-048":["desk"],"D-049":["desk"],"D-050":["desk"]};
 var records=Object.create(null),buckets=Object.create(null);
 alphabet.split('').forEach(function(letter){buckets[letter]=[];});
 function esc(text){return String(text==null?'':text).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function sortKey(title){
  var key=String(title||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/^[^\p{L}]+/u,'');
  // Context-sensitive readings: chang hen ge and liao bu qi, rather than the isolated-character defaults.
  return key.replace(/^长恨歌/,'常恨歌').replace(/^了不起/,'瞭不起');
 }
 function initialFor(key){
  if(/^[a-z]/i.test(key))return key.charAt(0).toUpperCase();
  var first=Array.from(key)[0]||'';
  if(!/^\p{Script=Han}$/u.test(first))return '#';
  for(var i=bounds.length-1;i>=0;i--)if(collator.compare(first,bounds[i])>=0)return hanLetters.charAt(i);
  return 'A';
 }
 (window.LIST_DATA||[]).forEach(function(group){group.items.forEach(function(item){
  var key=sortKey(item.title),letter=initialFor(key);
  records[item.id]=item;
  if(!buckets[letter])buckets[letter]=[];
  buckets[letter].push({record:item,key:key});
 });});
 Object.keys(buckets).forEach(function(letter){buckets[letter].sort(function(a,b){
  return collator.compare(a.key,b.key)||a.record.id.localeCompare(b.record.id);
 });});
 var total=Object.keys(records).length;
 var h='<div class="lv-index-tools"><div class="lv-index-caption"><span class="px">字母索引 / <span class="en-inline" lang="en">a–z index</span></span><span class="lv-total">'+total+' 条资料 / <span class="en-inline" lang="en">records</span></span></div>'+
  '<nav class="lv-alphabet" aria-label="按资料标题首字母查找">';
 alphabet.split('').forEach(function(letter){
  var count=buckets[letter].length;
  h+='<button type="button" class="lv-letter" data-letter="'+letter+'" aria-controls="lv-group-'+letter+'" aria-label="跳转到 '+letter+'（'+count+' 条资料 / records）" title="'+letter+' · '+count+' 条资料 / records"'+(count?'':' disabled')+'>'+letter.toLowerCase()+'</button>';
 });
 h+='</nav></div><div class="lv-head"><h2 class="px">资料索引 / INDEX OF ARCHIVE ('+total+')</h2>'+
  '<div class="lv-sub">按资料标题 A–Z 排列，中文按拼音首字母，忽略开头的书名号与引号。点击上方字母快速定位，悬停条目查看图片与资料。<br><span lang="en">Titles follow A–Z order; Chinese titles use pinyin initials, ignoring opening punctuation. Select a letter to jump; hover over an entry to view its image and details.</span></div></div>'+
  '<div class="lv-cols"><span>编号<br><span lang="en">ID</span></span><span>标题<br><span lang="en">TITLE</span></span><span style="text-align:right">年代<br><span lang="en">PERIOD</span></span></div>';
 var sectionLetters=alphabet.split('');
 if(buckets['#']&&buckets['#'].length)sectionLetters.push('#');
 sectionLetters.forEach(function(letter){
  var entries=buckets[letter];
  if(!entries.length)return;
  var sectionId=letter==='#'?'other':letter;
  h+='<section class="lv-group" id="lv-group-'+sectionId+'" data-letter="'+letter+'" aria-labelledby="lv-heading-'+sectionId+'">'+
   '<div class="lv-sec" role="heading" aria-level="3" id="lv-heading-'+sectionId+'"><span class="lv-letter-heading">'+letter+'</span><span class="cn">'+(letter==='#'?'其他 / <span lang="en">Other</span>':'首字母 / <span lang="en">Initial</span>')+'</span><span class="cnt">('+entries.length+')</span></div>';
  entries.forEach(function(entry){
   var item=entry.record;
   h+='<div class="lv-row" role="button" tabindex="0" data-entry-id="'+esc(item.id)+'" data-units="'+esc((unitMembership[item.id]||[]).join(' '))+'"><span class="lid">'+esc(item.id)+'</span><span class="ltitle">'+B.pair(item.titleZh,item.titleEn)+'</span><span class="lfield">'+B.pair(item.field,item.fieldEn)+'</span></div>';
  });
  h+='</section>';
 });
 lv.innerHTML=h;
 var pulseRows=[],pulseTimer=null;
 function stopUnitPulse(){
  if(pulseTimer!==null)clearTimeout(pulseTimer);pulseTimer=null;
  pulseRows.forEach(function(row){row.classList.remove('is-unit-flashing');});pulseRows=[];
  delete lv.dataset.flashUnit;
 }
 window.deskFlashListUnit=function(unit){
  stopUnitPulse();
  if(!stage.classList.contains('list-mode'))return;
  pulseRows=Array.from(lv.querySelectorAll('.lv-row')).filter(function(row){
   return !row.hidden&&!row.closest('.lv-group').hidden&&(row.dataset.units||'').split(' ').indexOf(unit)!==-1;
  });
  if(!pulseRows.length)return;
  // One style flush restarts every matching row on the same animation frame.
  void lv.offsetWidth;
  lv.dataset.flashUnit=unit;
  pulseRows.forEach(function(row){row.classList.add('is-unit-flashing');});
  pulseTimer=setTimeout(stopUnitPulse,3250);
 };
 vtDesk.addEventListener('click',stopUnitPulse);
 lv.addEventListener('archive:index-filter',stopUnitPulse);
 var toolbar=lv.querySelector('.lv-index-tools');
 var columns=lv.querySelector('.lv-cols');
 var nav=lv.querySelector('.lv-alphabet');
 var sections=Array.from(lv.querySelectorAll('.lv-group'));
 var currentLetter='';
 function indexInset(){var header=lv.querySelector('.lv-cols');return toolbar.offsetHeight+(parseFloat(getComputedStyle(toolbar).top)||0)+(header?header.offsetHeight:0)+8;}
 function updateCurrentLetter(){
  if(!stage.classList.contains('list-mode')||!sections.length)return;
  var visible=sections.filter(function(section){return !section.hidden;});
  if(!visible.length){
   currentLetter='';nav.querySelectorAll('.lv-letter').forEach(function(button){button.classList.remove('is-current');button.removeAttribute('aria-current');});return;
  }
  var top=lv.getBoundingClientRect().top+indexInset()+16;
  var current=visible[0];
  for(var i=0;i<visible.length;i++){
   if(visible[i].getBoundingClientRect().top>top)break;
   current=visible[i];
  }
  var letter=current.dataset.letter;
  if(currentLetter===letter)return;
  currentLetter=letter;
  nav.querySelectorAll('.lv-letter').forEach(function(button){
   var active=button.dataset.letter===letter;
   button.classList.toggle('is-current',active);
   if(active)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');
  });
 }
 function refreshIndex(){
  if(!stage.classList.contains('list-mode'))return;
  lv.style.setProperty('--lv-tools-height',toolbar.offsetHeight+'px');
  lv.style.setProperty('--lv-cols-height',columns.offsetHeight+'px');
  var visible=sections.filter(function(section){return !section.hidden;});
  var last=visible[visible.length-1];
  lv.style.setProperty('--lv-bottom-space',last?Math.max(60,lv.clientHeight-indexInset()-last.offsetHeight-12)+'px':'60px');
  updateCurrentLetter();
 }
 nav.addEventListener('click',function(event){
  var button=event.target.closest('.lv-letter');
  if(!button||button.disabled)return;
  var section=document.getElementById('lv-group-'+button.dataset.letter);
  if(!section||section.hidden)return;
  if(window.SFX)SFX.play('click');
  refreshIndex();
  lv.scrollTo({top:Math.max(0,section.offsetTop-indexInset()-12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 });
 nav.addEventListener('keydown',function(event){
  var keys=['ArrowLeft','ArrowRight','Home','End'];
  if(keys.indexOf(event.key)===-1)return;
  var buttons=Array.from(nav.querySelectorAll('.lv-letter:not(:disabled)'));
  var index=buttons.indexOf(event.target);
  if(index<0)return;
  event.preventDefault();
  if(event.key==='Home')index=0;
  else if(event.key==='End')index=buttons.length-1;
  else index=(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
  buttons[index].focus({preventScroll:true});
  buttons[index].scrollIntoView({block:'nearest',inline:'nearest'});
 });
 lv.addEventListener('scroll',function(){
  if(lv.scrollLeft)lv.scrollLeft=0;
  updateCurrentLetter();
 },{passive:true});
 lv.addEventListener('archive:index-filter',refreshIndex);
 window.addEventListener('resize',refreshIndex);
 if(window.ResizeObserver)new ResizeObserver(refreshIndex).observe(toolbar);

 function showRow(row){
  if(!row||!lv.contains(row))return;
  var record=records[row.dataset.entryId];
  if(!record)return;
  if(window.deskActiveRecord===record&&window.deskDebug&&window.deskDebug.sidebarRecord===record.id)return;
  window.deskActiveRecord=record;
  if(window.deskShowRecord)window.deskShowRecord(record);
 }
 lv.addEventListener('pointerover',function(event){
  var row=event.target.closest('.lv-row[data-entry-id]');
  if(row&&event.relatedTarget&&row.contains(event.relatedTarget))return;
  showRow(row);
 });
 lv.addEventListener('focusin',function(event){showRow(event.target.closest('.lv-row[data-entry-id]'));});
 lv.addEventListener('click',function(event){
  var row=event.target.closest('.lv-row[data-entry-id]');
  if(!row||!lv.contains(row))return;
  if(window.SFX)SFX.play('click');showRow(row);
 });
 lv.addEventListener('keydown',function(event){
  if(event.repeat||(event.key!=='Enter'&&event.key!==' '))return;
  var row=event.target.closest('.lv-row[data-entry-id]');
  if(!row)return;
  event.preventDefault();row.click();
 });

 var lvItems=[].slice.call(lv.querySelectorAll('.lv-row,.lv-sec'));
 var lvHeader=lv.querySelector('.lv-cols');
 var LV_AMP=130, LV_RANGE=240, lvApplied=false;
 function lvStep(){
  if(!stage.classList.contains('list-mode')){
   if(lvApplied){ for(var j=0;j<lvItems.length;j++) {lvItems[j].style.transform='';lvItems[j].style.maskImage='';lvItems[j].style.pointerEvents='';}; lvApplied=false; }
   return;
  }
  var s=lv.scrollTop, lvr=lv.getBoundingClientRect();
  // Keep column labels directly below the index controls during scrolling.
  var toolbarHeight=toolbar.offsetHeight;
  if(lv.style.getPropertyValue('--lv-toolbar-height')!==toolbarHeight+'px')lv.style.setProperty('--lv-toolbar-height',toolbarHeight+'px');
  lvHeader.style.transform='';
  var headerRect=lvHeader.getBoundingClientRect(), hy=headerRect.bottom;
  var covered=[toolbar.getBoundingClientRect(),headerRect,vtList.getBoundingClientRect()];
  var amp=lv.clientWidth<700?Math.round(lv.clientWidth*.15):LV_AMP;
  lv.style.setProperty("--lv-wave-space",amp+"px");
  var any=false;
  for(var i=0;i<lvItems.length;i++){
   var el=lvItems[i], r=el.getBoundingClientRect();
   if(r.bottom<lvr.top||r.top>lvr.bottom) continue;
   var bands=covered.filter(function(b){return b.bottom>r.top&&b.top<r.bottom;}).map(function(b){return [Math.max(0,b.top-r.top-2),Math.min(r.height,b.bottom-r.top+2)];}).sort(function(a,b){return a[0]-b[0];});
   var stops=["#000 0px"],end=0;
   bands.forEach(function(b){if(b[0]<end)b[0]=end;if(b[1]<=b[0])return;stops.push("#000 "+b[0]+"px","transparent "+b[0]+"px","transparent "+b[1]+"px","#000 "+b[1]+"px");end=b[1];});
   el.style.maskImage=bands.length?"linear-gradient(to bottom,"+stops.join(",")+",#000 100%)":"";
   el.style.pointerEvents=bands.some(function(b){return b[0]<=0&&b[1]>=r.height;})?"none":"";
   var d=(r.top+r.height/2)-hy;
   var t=Math.max(-1,Math.min(1,d/LV_RANGE));
   var x=Math.round(amp*Math.pow(Math.cos(t*Math.PI/2),2));
   if(x>0){ el.style.transform='translateX('+x+'px)'; any=true; }
   else if(el.style.transform) el.style.transform='';
  }
  lvApplied=any;
 }
 function lvTick(){ lvStep(); requestAnimationFrame(lvTick); }
 lvTick();
 window.lvDebug={ amp:function(v){if(v)LV_AMP=v;return LV_AMP;}, range:function(v){if(v)LV_RANGE=v;return LV_RANGE;}, pump:function(n){for(var i=0;i<n;i++)lvStep();} };
})();
