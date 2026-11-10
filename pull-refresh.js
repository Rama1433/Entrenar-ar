'use strict';
// Refresh records with a downward pull at the top; never reload a workout or form.
(() => {
 const threshold=56,maxDistance=76;
 const indicator=document.createElement('div');
 indicator.className='pull-refresh';indicator.hidden=true;indicator.setAttribute('role','status');indicator.setAttribute('aria-live','polite');
 indicator.innerHTML='<span class="pull-refresh-icon" aria-hidden="true">↓</span><span class="pull-refresh-label"></span>';
 document.body.append(indicator);
 const label=indicator.querySelector('.pull-refresh-label'),symbol=indicator.querySelector('.pull-refresh-icon');
 let gesture=null,pulling=false,pending=false,hideTimer=null,revision=0;
 const atTop=()=>Math.max(window.scrollY||0,document.scrollingElement?.scrollTop||0)<=0;
 const cloud=()=>window.EntrenarCloud;
 function available(){return cloud()?.canRefresh&&!document.body.classList.contains('access-open')&&!document.querySelector('#modal')?.open;}
 function text(value){if(label.textContent!==value)label.textContent=value;}
 function reset(){gesture=null;pulling=false;indicator.hidden=true;indicator.classList.remove('loading','ready');symbol.style.transform='';symbol.textContent='↓';}
 function later(delay){clearTimeout(hideTimer);hideTimer=setTimeout(reset,delay);}
 function nestedScroll(target){
  for(let el=target;el&&el!==document.body;el=el.parentElement){
   if(el.scrollHeight>el.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(el).overflowY))return true;
  }
  return false;
 }
 document.addEventListener('touchstart',e=>{
  if(pending)return;reset();if(!available()||!atTop()||e.touches.length!==1)return;
  const point=e.touches[0],target=e.target;
  // Leave screen-edge navigation, controls and nested scrolling to the browser.
  if(point.clientX<=24||target.closest('input,textarea,select,button,a,form,[contenteditable="true"],.table-wrap,.days-picker')||nestedScroll(target))return;
  if(document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))return;
  clearTimeout(hideTimer);reset();gesture={x:point.clientX,y:point.clientY,distance:0,ready:false};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!gesture)return;
  if(e.touches.length!==1||!available()||!atTop()){reset();return;}
  const point=e.touches[0],dx=point.clientX-gesture.x,dy=point.clientY-gesture.y;
  if(dy< -6||Math.abs(dx)>12&&Math.abs(dx)>Math.max(0,dy)*.8){reset();return;}
  if(!pulling&&(dy<12||dy<Math.abs(dx)*1.5))return;
  if(!e.cancelable){reset();return;}
  e.preventDefault();pulling=true;
  gesture.distance=Math.min(maxDistance,Math.max(0,dy*.45));gesture.ready=gesture.distance>=threshold;
  indicator.hidden=false;indicator.classList.toggle('ready',gesture.ready);
  symbol.style.transform=`rotate(${gesture.ready?180:0}deg)`;
  text(gesture.ready?'Soltá para actualizar':'Deslizá para actualizar');
 },{passive:false});
 document.addEventListener('touchend',()=>{
  if(!gesture)return;
  const ready=gesture.ready;gesture=null;pulling=false;
  if(!ready||!available()){reset();return;}
  const token=++revision,account=cloud().accountId;pending=true;
  indicator.hidden=false;indicator.classList.remove('ready');indicator.classList.add('loading');symbol.style.transform='';symbol.textContent='↻';text('Actualizando…');
  let timeout;
  Promise.race([cloud().refresh(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('La conexión está tardando. Intentá nuevamente.')),20000);})])
   .then(()=>{if(token!==revision||cloud()?.accountId!==account)return;text('Datos actualizados');indicator.classList.remove('loading');symbol.textContent='✓';later(1000);})
   .catch(error=>{if(token!==revision||cloud()?.accountId!==account)return;text('No se pudo actualizar');indicator.classList.remove('loading');symbol.textContent='!';toast(cloud().friendly(error));later(1800);})
   .finally(()=>{clearTimeout(timeout);if(token===revision)pending=false;});
 },{passive:true});
 document.addEventListener('touchcancel',()=>{if(!pending)reset();},{passive:true});
 // Never leave a gesture or the previous account's status on a new screen.
 window.addEventListener('popstate',()=>{if(!pending)reset();});
 window.addEventListener('entrenar:access-view',()=>{if(!pending)reset();});
 window.addEventListener('entrenar:account-changed',()=>{++revision;pending=false;clearTimeout(hideTimer);reset();});
})();
