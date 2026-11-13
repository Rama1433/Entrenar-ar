'use strict';
// Avisos temporales y recordatorios de renovación. Nunca inicia un cobro.
(()=>{
 const DAY=86400000;
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
  const unread=role==='student'?state.notices.filter(n=>!(state.readStudentNotices[studentId]||[]).includes(n.id)):role==='coach'?coachInboxNotices().filter(n=>!state.readCoachNotices.includes(n.id)):[];
  if(unread.length)main.insertAdjacentHTML('afterbegin',`<section id="inbox-alert" class="account-alert inbox-alert" role="status"><span class="inbox-alert-icon">${icon('bell')}</span><div><strong>${unread.length===1?'Tenés un mensaje nuevo':'Tenés '+unread.length+' mensajes nuevos'}</strong><p>${role==='student'?'Tu profesor te dejó novedades. Los avisos están disponibles durante 24 horas.':'El equipo de Entrenar te dejó novedades.'}</p></div><button type="button" class="btn primary" data-page="${role==='student'?'Avisos':'Notificaciones'}">Ver mensajes</button></section>`);
 }
 const chrome=renderChrome;
 renderChrome=function(...args){expire();return chrome(...args);};
 const prior=render;
 render=function(...args){expire();const result=prior(...args);banners();return result;};
 function tick(){
  const changed=expire();
  if(changed){if(role==='student'&&page==='Avisos')renderNotices();else renderChrome();}
  banners();
 }
 setInterval(tick,30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 expire();renderChrome();banners();
})();
