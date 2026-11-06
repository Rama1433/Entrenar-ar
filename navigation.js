'use strict';
// In-page history; never authentication. No form contents or credentials are stored.
(() => {
 if(!window.history?.pushState)return;
 const history=window.history;
 let restoring=false,depth=0,current=null,gesture=null;
 const token=id();
 const rootKey='entrenarNavigation';
 const baseRender=render,baseNavigate=navigate;
 const isAccess=()=>document.body.classList.contains('access-open');
 function snapshot(){
  if(isAccess())return {mode:'access',access:window.EntrenarAccessNavigation?.snapshot()||{screen:'welcome'},scroll:window.scrollY||0};
  return {mode:'app',role,page,detailId,studentId,search,filter,admin:role==='admin'?window.EntrenarAdminNavigation?.snapshot():null,scroll:window.scrollY||0};
 }
 function routeKey(v){return v.mode==='access'?JSON.stringify([v.mode,v.access.screen,v.access.accountRole]):JSON.stringify([v.mode,v.role,v.page,v.detailId,v.studentId]);}
 function write(view,replace){
  const entry={...((history.state&&typeof history.state==='object')?history.state:{}),[rootKey]:{token,depth,view}};
  if(replace)history.replaceState(entry,'');else history.pushState(entry,'');
  current=view;
 }
 function remember(){if(current)write(snapshot(),true);}
 function commit(){
  if(restoring)return;
  const view=snapshot();
  if(!current){depth=0;write(view,true);return;}
  // Changing the demo account starts a new logical root for the edge gesture.
  if(view.mode==='app'&&current.mode==='app'&&(view.role!==current.role||view.studentId!==current.studentId)){depth=0;write(view,true);return;}
  const changed=routeKey(view)!==routeKey(current);
  if(changed){depth++;view.scroll=0;write(view,false);}else write(view,true);
 }
 navigate=function(...args){remember();return baseNavigate(...args);};
 render=function(...args){const result=baseRender(...args);if(!isAccess())commit();return result;};
 window.addEventListener('entrenar:access-view',commit);
 // Preserve the source scroll/filter before access buttons change their view.
 document.addEventListener('click',e=>{if(e.target.closest('[data-access-back]')&&depth>0){e.preventDefault();e.stopImmediatePropagation();history.back();return;}if(e.target.closest('[data-access]'))remember();},true);
 window.addEventListener('popstate',e=>{
  const entry=e.state?.[rootKey];
  if(!entry||entry.token!==token||!entry.view)return;
  restoring=true;
  try{
   if(modal.open)modal.close();
   depth=entry.depth;current=entry.view;
   const v=entry.view;
   if(v.mode==='access')window.EntrenarAccessNavigation?.restore(v.access);
   else{
    window.EntrenarAccessNavigation?.hide();
    role=['coach','student','admin'].includes(v.role)?v.role:'coach';
    page=typeof v.page==='string'?v.page:(role==='admin'?'Resumen':'Inicio');
    detailId=typeof v.detailId==='string'?v.detailId:null;
    studentId=state.students.some(s=>s.id===v.studentId)?v.studentId:(state.students[0]?.id||'');
    search=typeof v.search==='string'?v.search:'';
    filter=['all','active','inactive'].includes(v.filter)?v.filter:'all';
    if(role==='admin')window.EntrenarAdminNavigation?.restore(v.admin);
    render();
    if(page==='Alumnos'&&!detailId){const select=$('#student-filter');if(select)select.value=filter;}
    main.focus({preventScroll:true});
   }
   window.scrollTo({top:Number.isFinite(v.scroll)?v.scroll:0,behavior:'instant'});
  }finally{restoring=false;}
 });
 // Safari uses native browser history. Installed iOS PWAs get an edge gesture.
 document.addEventListener('touchstart',e=>{
  gesture=null;
  if(navigator.standalone!==true||depth<1||modal.open||e.touches.length!==1)return;
  const t=e.touches[0];
  if(t.clientX>24||e.target.closest('input,textarea,select,button,a,form,[contenteditable],.table-wrap,.days-picker'))return;
  gesture={x:t.clientX,y:t.clientY,lastX:t.clientX,lastY:t.clientY,started:Date.now(),active:false};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!gesture)return;
  if(e.touches.length!==1){gesture=null;return;}
  const t=e.touches[0],dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
  if(dx< -8||Math.abs(dy)>45){gesture=null;return;}
  gesture.lastX=t.clientX;gesture.lastY=t.clientY;
  if(dx>16&&dx>Math.abs(dy)*1.7){gesture.active=true;if(e.cancelable)e.preventDefault();}
 },{passive:false});
 document.addEventListener('touchend',e=>{
  const g=gesture;gesture=null;if(!g||!g.active||modal.open||depth<1)return;
  const t=e.changedTouches?.[0];const dx=(t?.clientX??g.lastX)-g.x,dy=(t?.clientY??g.lastY)-g.y;
  if(dx>=90&&Math.abs(dy)<=45&&Date.now()-g.started<=1200)history.back();
 },{passive:true});
 document.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
})();
