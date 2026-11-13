'use strict';
// Avisos temporales y recordatorios de renovación. Nunca inicia un cobro.
(()=>{
 const DAY=86400000;
 const seenByAccount=new Map();let floatingTimer;
 function dismissFloating(){clearTimeout(floatingTimer);document.getElementById('message-floating')?.remove();}
 function floatingNotice(){
  if(document.hidden||document.body.classList.contains('access-open')||!['student','coach'].includes(role))return dismissFloating();
  const cloud=window.EntrenarCloud;
  const key='entrenar-notice-shown:'+ (cloud?.live?cloud.accountId:'demo')+':'+role+':'+(role==='student'?studentId:'');
  let seen=seenByAccount.get(key);
  if(!seen){try{const saved=JSON.parse(sessionStorage.getItem(key)||'[]');seen=new Set(Array.isArray(saved)?saved.filter(id=>typeof id==='string'):[]);}catch{seen=new Set();}seenByAccount.set(key,seen);}
  const notices=role==='student'?state.notices:coachInboxNotices();
  const readIds=role==='student'?(state.readStudentNotices[studentId]||[]):state.readCoachNotices;
  const inbox=role==='student'?'Avisos':'Notificaciones';
  const unread=notices.filter(n=>!readIds.includes(n.id));
  const fresh=unread.filter(n=>!seen.has(n.id));
  const active=new Set(notices.map(n=>n.id));
  for(const id of seen)if(!active.has(id))seen.delete(id);
  for(const id of readIds)if(active.has(id))seen.add(id);
  if(page===inbox||!unread.length)dismissFloating();
  if(fresh.length){
   for(const n of fresh)seen.add(n.id);
   if(page!==inbox){
    dismissFloating();
    const el=document.createElement('div');el.id='message-floating';el.className='message-floating';el.setAttribute('role','status');
    el.innerHTML=`<button type="button" data-page="${inbox}" aria-label="Mensaje nuevo. Ver mensajes">${icon('bell')}<span>Mensaje nuevo</span></button>`;
    document.body.append(el);
    floatingTimer=setTimeout(dismissFloating,4000);
   }
  }
  try{sessionStorage.setItem(key,JSON.stringify([...seen]));}catch{}
 }
 function expire(){
  const before=state.notices.length,now=Date.now();
  state.notices=state.notices.filter(n=>{
   const created=Date.parse(n.createdAt||n.date+'T00:00:00-03:00');
   return Number.isFinite(created)&&created+DAY>now;
  });
  const ids=new Set(state.notices.map(n=>n.id));
  for(const key of Object.keys(state.readStudentNotices||{}))state.readStudentNotices[key]=state.readStudentNotices[key].filter(id=>ids.has(id));
  return before!==state.notices.length;
 }
 function banners(){
  document.getElementById('account-expiry')?.remove();
  document.getElementById('inbox-alert')?.remove();
  if(page!=='Inicio')return;
  const cloud=window.EntrenarCloud;
  if(role==='coach'&&cloud?.live){
   const sub=cloud.subscription;
   const arDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const days=sub?.ends_on?Math.round((Date.parse(sub.ends_on+'T00:00:00Z')-Date.parse(arDate+'T00:00:00Z'))/DAY):NaN;
   if(['trial','active'].includes(sub?.status)&&days>=0&&days<=7){
    const subject=sub.status==='trial'?'Tu prueba gratuita':'Tu plan';
    const title=subject+(days===0?(sub.status==='trial'?' termina hoy':' vence hoy'):days===1?(sub.status==='trial'?' termina mañana':' vence mañana'):(sub.status==='trial'?' termina en ':' vence en ')+days+' días');
    main.insertAdjacentHTML('afterbegin',`<section id="account-expiry" class="account-alert expiry-alert" role="status"><div><strong>${title}</strong><p>Vencimiento: ${esc(dateLabel(sub.ends_on))}. Renovás cuando vos decidas, sin débito automático.</p></div><button type="button" class="btn primary" data-page="Perfil">Renovar mi plan</button></section>`);
   }
  }

 }
 const chrome=renderChrome;
 renderChrome=function(...args){expire();return chrome(...args);};
 const prior=render;
 render=function(...args){expire();const result=prior(...args);banners();floatingNotice();return result;};
 function tick(){
  const changed=expire();
  if(changed){if(role==='student'&&page==='Avisos')renderNotices();else renderChrome();}
  banners();floatingNotice();
 }
 setInterval(tick,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 window.addEventListener('entrenar:account-changed',dismissFloating);
 expire();renderChrome();banners();floatingNotice();
})();
