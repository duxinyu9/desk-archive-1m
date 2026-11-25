/* Shared interaction sounds. Existing SFX.play/go/toggle calls remain supported. */
(function(){
 'use strict';
 var script=document.currentScript,base=new URL('./assets/sfx/',script&&script.src||location.href).href;
 var files={click:'click.mp3',drawer:'drawer.mp3',boot:'boot.mp3',toggle:'toggle.mp3',book:'book.mp3'};
 var volume={click:.2,drawer:.85,boot:.8,toggle:.17,book:.8};
 var delay={click:90,toggle:90,drawer:480,boot:550,book:380};
 var pool={},playing=new Set(),muted=false,lastPlayed=-Infinity,navigationTimer;
 var storageKey='desk-archive-sound-muted';
 try{muted=localStorage.getItem(storageKey)==='1';}catch(e){}
 Object.keys(files).forEach(function(name){var audio=new Audio(base+files[name]);audio.preload=name==='click'||name==='toggle'?'auto':'metadata';pool[name]=audio;});
 function syncButtons(){
  document.querySelectorAll('#sound-btn,[data-sfx-toggle]').forEach(function(button){
   button.classList.toggle('muted',muted);button.setAttribute('aria-pressed',String(!muted));
   button.title=muted?'开启音效 / Enable sound':'关闭音效 / Mute sound';button.setAttribute('aria-label',button.title);
  });
 }
 function stop(){playing.forEach(function(audio){audio.pause();});playing.clear();}
 function play(name){
  if(muted||!pool[name])return false;
  var now=performance.now();if(now-lastPlayed<70)return false;lastPlayed=now;
  try{
   var audio=pool[name].cloneNode();audio.volume=volume[name]==null ? .2 : volume[name];playing.add(audio);
   var clear=function(){playing.delete(audio);};audio.addEventListener('ended',clear,{once:true});audio.addEventListener('error',clear,{once:true});
   var promise=audio.play();if(promise&&promise.catch)promise.catch(clear);return true;
  }catch(e){return false;}
 }
 function go(url,name){
  clearTimeout(navigationTimer);
  if(muted){location.href=url;return;}
  play(name||'click');navigationTimer=setTimeout(function(){location.href=url;},delay[name]||90);
 }
 function toggle(){
  muted=!muted;if(muted)stop();else lastPlayed=-Infinity;
  try{localStorage.setItem(storageKey,muted?'1':'0');}catch(e){}
  syncButtons();return muted;
 }
 window.SFX={play:play,go:go,toggle:toggle,get muted(){return muted;}};
 var controls='button,a[href],[role="button"],[role="menuitem"],input[type="button"],input[type="submit"],.desktop-icon,.thumb,.dl-file-item,.start-menu-list li,.qq-file-link,.lv-row,#arc-list li,.card,.spawn';
 document.addEventListener('click',function(event){
  if(!(event.target instanceof Element)||event.button!==0)return;
  var control=event.target.closest(controls);if(!control||control.matches(':disabled,[aria-disabled="true"]'))return;
  if(control.matches('[data-sfx-toggle]')){if(!toggle())play('toggle');return;}
  // The library's existing button already calls SFX.toggle().
  if(control.id==='sound-btn'||control.closest('.chair-sticker'))return;
  play(control.matches('#vt-desk,#vt-list')?'toggle':'click');
  var anchor=control.closest('a[href]');
  if(!anchor||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return;
  var url=new URL(anchor.href,location.href);
  if(url.origin===location.origin&&(url.pathname!==location.pathname||url.search!==location.search)&&!muted){event.preventDefault();go(url.href,'click');}
 });
 document.addEventListener('pointerdown',function(event){
  if(event.button!==0||!(event.target instanceof Element))return;
  var chair=event.target.closest('.chair-sticker');if(chair&&chair.getAttribute('aria-disabled')!=='true')play('click');
 },true);
 addEventListener('storage',function(event){if(event.key!==storageKey)return;muted=event.newValue==='1';if(muted)stop();syncButtons();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncButtons,{once:true});else syncButtons();
})();
