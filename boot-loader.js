(function bootLoader(){
 const html=document.documentElement,loader=document.getElementById('loader');
 const debug=window.deskBootDebug={state:html.dataset.bootStatus,location:'about'};
 if(!loader)return;
 if(!html.classList.contains('archive-boot-pending')){loader.remove();return;}
 const fill=document.getElementById('loader-fill'),pct=document.getElementById('loader-pct'),copy=document.getElementById('loader-copy'),steps=[...document.querySelectorAll('#loader-steps li')];
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 let completed=0;
 function progress(){const value=Math.round(completed/steps.length*100);fill.style.width=value+'%';pct.textContent=value+'%';debug.progress=value;}
 function status(index,done){const step=steps[index];step.querySelector('.st').textContent=done?'[ OK ]':'[ ... ]';step.classList.toggle('active',!done);step.classList.toggle('done',done);}
 function sceneReady(){return new Promise((resolve,reject)=>{const started=Date.now();const timer=setInterval(()=>{const scene=window.exhibitDebug;if(scene?.state==='error'){clearInterval(timer);reject(new Error(scene.error||'Scene failed to load.'));}else if(scene?.state==='ready'&&scene.drawCalls>0){clearInterval(timer);resolve();}else if(Date.now()-started>45000){clearInterval(timer);reject(new Error('Scene loading timed out.'));}},60);});}
 function fail(error){debug.state='error';html.dataset.bootStatus='error';copy.textContent='SETUP FAILED';pct.textContent='Scene loading failed. Reload to retry.';const retry=document.createElement('button');retry.id='loader-error';retry.textContent='Reload';retry.onclick=()=>location.reload();copy.after(retry);}
 async function start(){
  try{
   for(let i=0;i<4;i++){status(i,false);await pause(320);status(i,true);completed=i+1;progress();}
   status(4,false);await sceneReady();status(4,true);completed=5;progress();
   for(let i=5;i<steps.length;i++){status(i,false);await pause(280);status(i,true);completed=i+1;progress();}
   copy.textContent='Setup complete.';await pause(500);
   loader.style.opacity='0';await pause(550);loader.remove();html.classList.remove('archive-boot-pending');html.dataset.bootStatus='complete';debug.state='complete';
   try{sessionStorage.setItem('deskArchiveIntroComplete','1');sessionStorage.setItem('deskLoaded','1');}catch(e){}
  }catch(error){fail(error);}
 }
 start();
})();
