'use strict';
// In-page history; never authentication. No form contents or credentials are stored.
(() => {
 if(!window.history?.pushState)return;
 const history=window.history;
 let restoring=false,depth=0,current=null,gesture=null,appRoot=null;
 let token=id();
 const rootKey='entrenarNavigation';
 const sessionKey='entrenar-demo-navigation';
 let initialAccess=true;
 function loadDemo(){if(window.EntrenarCloud?.live||window.EntrenarCloud?.checking)return null;try{const v=JSON.parse(sessionStorage.getItem(sessionKey)||'null');if(v?.role==='admin'){sessionStorage.removeItem(sessionKey);return null;}return v?.mode==='app'&&!v.accountId&&['coach','student'].includes(v.role)&&typeof v.page==='string'?v:null;}catch{return null;}}
 function storeDemo(v){if(window.EntrenarCloud?.live||window.EntrenarCloud?.checking)return;try{if(v.mode==='app'&&!v.accountId&&['coach','student'].includes(v.role))sessionStorage.setItem(sessionKey,JSON.stringify(v));else sessionStorage.removeItem(sessionKey);}catch{}}
 function viewUrl(v){const url=new URL(window.location.href||window.location.origin+'/');if(v.mode==='app'){url.searchParams.delete('profesor');const roles={coach:'profesor',student:'alumno',admin:'administrador'};url.hash='/'+roles[v.role]+'/'+encodeURIComponent(v.page.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ /g,'-'))+(v.detailId?'/'+encodeURIComponent(v.detailId):'');}else url.hash='';return url.href;}

 const baseRender=render,baseNavigate=navigate;
 const isAccess=()=>document.body.classList.contains('access-open');
 function snapshot(){
  if(isAccess())return {mode:'access',access:window.EntrenarAccessNavigation?.snapshot()||{screen:'welcome'},scroll:window.scrollY||0};
  return {mode:'app',accountId:window.EntrenarCloud?.accountId||null,role,page,detailId,studentId,search,filter,admin:role==='admin'?window.EntrenarAdminNavigation?.snapshot():null,scroll:window.scrollY||0};
 }
 function routeKey(v){return v.mode==='access'?JSON.stringify([v.mode,v.access.screen,v.access.accountRole]):JSON.stringify([v.mode,v.role,v.page,v.detailId,v.studentId]);}
 function write(view,replace){
  const entry={...((history.state&&typeof history.state==='object')?history.state:{}),[rootKey]:{token,depth,view}};
  if(replace)history.replaceState(entry,'',viewUrl(view));else history.pushState(entry,'',viewUrl(view));
  current=view;storeDemo(view);
 }
 function remember(){if(current)write(snapshot(),true);}
 function commit(){
  if(restoring||window.EntrenarCloud?.checking)return;
  const view=snapshot();
  if(!current){depth=0;if(view.mode==='app')appRoot={...view,page:view.role==='admin'?'Resumen':'Inicio',detailId:null,search:'',filter:'all',scroll:0};write(view,true);return;}
  // Access and each demo account have separate history boundaries.
  if(view.mode!==current.mode||(view.mode==='app'&&(view.role!==current.role||view.studentId!==current.studentId||view.accountId!==current.accountId))){token=id();depth=0;gesture=null;view.scroll=0;appRoot=view.mode==='app'?{...view,page:view.role==='admin'?'Resumen':'Inicio',detailId:null,search:'',filter:'all',scroll:0}:null;write(view,true);return;}
  const changed=routeKey(view)!==routeKey(current);
  if(changed){depth++;view.scroll=0;write(view,false);}else write(view,true);
 }
 navigate=function(...args){remember();return baseNavigate(...args);};
 render=function(...args){const result=baseRender(...args);if(!isAccess())commit();return result;};
 function restoreView(v){
  if(window.EntrenarCloud?.live&&(v.mode!=='app'||v.accountId!==window.EntrenarCloud.accountId||v.role!==window.EntrenarCloud.role))return;
  if(!window.EntrenarCloud?.live&&v.mode==='app'&&!['coach','student'].includes(v.role))Object.assign(v,{role:'coach',page:'Inicio',detailId:null,search:'',filter:'all',admin:null,accountId:null});
  if(modal.open)modal.close();
  if(v.mode==='access')window.EntrenarAccessNavigation?.restore(v.access);
  else{
   window.EntrenarAccessNavigation?.hide();
   role=['coach','student','admin'].includes(v.role)?v.role:'coach';
   const allowed={coach:['Inicio','Alumnos','Rutinas','Ejercicios','Perfil','Notificaciones','Mi plan','Avisos'],student:['Inicio','Mi rutina','Progreso','Perfil','Avisos'],admin:['Resumen','Profesores','Facturación','Planes','Comunicados','Ajustes']};
   page=allowed[role].includes(v.page)?v.page:(role==='admin'?'Resumen':'Inicio');
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
 }
 window.addEventListener('entrenar:access-view',()=>{
  if(initialAccess){
   initialAccess=false;
   const saved=loadDemo(),invite=new URL(window.location.href||window.location.origin+'/').searchParams.has('profesor');
   if(saved&&!invite){restoring=true;try{restoreView(saved);}finally{restoring=false;}commit();return;}
  }
  commit();
 });
 window.addEventListener('pageshow',e=>{
  if(!e.persisted||!isAccess())return;
  const saved=loadDemo();if(!saved)return;
  restoring=true;try{restoreView(saved);}finally{restoring=false;}
  token=id();depth=0;current=null;commit();
 });
 // Preserve the source scroll/filter before access buttons change their view.
 document.addEventListener('click',e=>{if(e.target.closest('[data-access-back]')&&depth>0){e.preventDefault();e.stopImmediatePropagation();history.back();return;}if(e.target.closest('[data-access]'))remember();},true);
 window.addEventListener('popstate',e=>{
  gesture=null;
  let entry=e.state?.[rootKey];
  if(!entry||!entry.view)return;
  if(window.EntrenarCloud?.checking)return;
  const matches=entry.token===token&&entry.view.mode===current?.mode&&(current.mode!=='app'||entry.view.role===current.role&&entry.view.studentId===current.studentId&&entry.view.accountId===current.accountId);
  const crossedBoundary=!matches;
  if(crossedBoundary){if(current?.mode!=='app'||!appRoot)return;entry={token,depth:0,view:appRoot};}
  restoring=true;
  try{
   depth=entry.depth;current=entry.view;
   const v=entry.view;
   restoreView(v);
   storeDemo(v);
   if(crossedBoundary)write(v,true);
  }finally{restoring=false;}
 });
 window.addEventListener('entrenar:account-changed',()=>{token=id();depth=0;current=null;appRoot=null;commit();});
 window.EntrenarAccountResume=v=>{if(!v||v.mode!=='app'||!window.EntrenarCloud?.live||v.accountId!==window.EntrenarCloud.accountId||v.role!==window.EntrenarCloud.role)return;restoring=true;try{restoreView(v);}finally{restoring=false;}commit();};
 window.EntrenarDemoResume=()=>{const saved=loadDemo();if(!saved)return false;restoring=true;try{restoreView(saved);}finally{restoring=false;}commit();return true;};
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
