document.documentElement.dataset.pageReady='true';
const sections=[...document.querySelectorAll('#about-content>section')];
const links=[...document.querySelectorAll('.nav-links a')];
for(const control of document.querySelectorAll('.press'))control.addEventListener('click',()=>{control.classList.add('is-pressed');setTimeout(()=>control.classList.remove('is-pressed'),180);});
function currentSection(){
 let active=null;
 for(const section of sections)if(section.getBoundingClientRect().top<=innerHeight*.35)active=section.id;
 for(const link of links){if(link.hash==='#'+active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
}
let scheduled=false;
addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;currentSection();});},{passive:true});
addEventListener('resize',currentSection,{passive:true});currentSection();
