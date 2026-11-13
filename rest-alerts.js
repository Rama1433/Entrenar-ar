/* Descansos: Wake Lock local y avisos Web Push opcionales por dispositivo. */
(()=>{
 'use strict';
 let epoch=0,config=null,subscriptionId=null,busy=false,problem='',job=null,adminStatus='';
 let wake=null,wakePending=false,wakeFailure=false,queue=Promise.resolve();
 const cloud=()=>window.EntrenarCloud;
 const realStudent=()=>cloud()?.live&&cloud().role==='student';
 const key=()=>`entrenar-rest-settings:${cloud()?.accountId||'demo'}`;
 const settings=()=>{try{return JSON.parse(localStorage.getItem(key())||'{}')||{};}catch{return {};}};
 const put=(name,value)=>{try{localStorage.setItem(key(),JSON.stringify({...settings(),[name]:value}));}catch{}};
 const enabled=()=>settings().notifications===true;
 const awake=()=>settings().awake!==false;
 const localRestVisible=()=>!document.hidden&&role==='student'&&page==='Mi rutina'&&!!detailId&&restSoundEnabled;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const installed=()=>navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)').matches;
 const pushSupported=()=>window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
 const timeout=(p,ms=6000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error('La conexión está tardando. Volvé a intentar.')),ms))]);
 function message(){
  if(!realStudent())return 'En la demo funciona la pantalla encendida. Los avisos requieren tu cuenta.';
  if(ios()&&!installed())return 'En iPhone, agregá Entrenar a la pantalla de inicio y abrila desde su ícono.';
  if(!pushSupported())return 'Este navegador no permite avisos de descanso.';
  if(Notification.permission==='denied')return 'Las notificaciones están bloqueadas. Podés habilitarlas desde los ajustes del navegador o del celular.';
  if(problem)return problem;
  if(!config)return 'Consultando disponibilidad de los avisos…';
  if(!config.enabled)return 'Los avisos con la app cerrada todavía no están habilitados.';
  return enabled()&&subscriptionId?'Avisos activados en este dispositivo. Pueden demorar unos segundos.':'Recibí un aviso al terminar el descanso, aunque cambies de app.';
 }
 function paint(){
  document.querySelectorAll('[data-rest-status]').forEach(el=>{el.textContent=message();});
  document.querySelectorAll('[data-rest-enable]').forEach(el=>{el.disabled=busy||!realStudent()||!config?.enabled||!pushSupported()||ios()&&!installed()||Notification.permission==='denied';if(!el.classList.contains('button-loading'))el.textContent=busy?'Un momento…':enabled()&&subscriptionId?'Desactivar avisos':'Activar avisos';});
  document.querySelectorAll('[data-rest-awake]').forEach(el=>{el.checked=awake();el.disabled=!navigator.wakeLock;});
  document.querySelectorAll('[data-rest-screen]').forEach(el=>{el.textContent=!navigator.wakeLock?'Tu navegador no permite mantener la pantalla encendida.':!awake()?'La pantalla sigue el bloqueo habitual de tu celular.':wake?'Pantalla encendida mientras entrenás.':wakeFailure?'El celular no permitió mantener la pantalla encendida.':'Mantiene la pantalla encendida durante la rutina.';});
  document.querySelectorAll('[data-rest-brief]').forEach(el=>{el.textContent=problem||(!realStudent()||!config?.enabled?'':enabled()&&subscriptionId?'Aviso de descanso activado para este dispositivo.':'Avisos fuera de la app: activalos desde tu perfil.');});
 }
 function markup(){return `<section class="panel rest-preferences"><div class="panel-heading"><h2>Durante mi entrenamiento</h2></div><div class="panel-content"><label class="rest-awake-option"><input type="checkbox" data-rest-awake ${awake()?'checked':''}><span>Mantener pantalla encendida</span></label><p class="note-text" data-rest-screen></p><hr><h3>Avisos de descanso</h3><p class="note-text" data-rest-status></p><button type="button" class="btn outline" data-rest-enable>Activar avisos</button><p class="note-text">El sonido depende del celular y de sus ajustes. No funciona como una alarma continua con la pantalla bloqueada.</p></div></section>`;}
 function inWorkout(){return role==='student'&&page==='Mi rutina'&&!!detailId&&!document.body.classList.contains('access-open')&&!state.drafts[draftKey(studentId,detailId)]?.finishedAt;}
 function releaseWake(){const old=wake;wake=null;if(old)Promise.resolve(old.release()).catch(()=>{});}
 async function syncWake(){
  if(!inWorkout()||!awake()||document.hidden){releaseWake();paint();return;}
  if(!navigator.wakeLock||wake||wakePending){paint();return;}
  const e=epoch;wakePending=true;
  try{const lock=await navigator.wakeLock.request('screen');if(e!==epoch||!inWorkout()||!awake()||document.hidden){await lock.release();return;}wake=lock;wakeFailure=false;lock.addEventListener('release',()=>{if(wake===lock){wake=null;paint();}});}
  catch{wakeFailure=true;}finally{wakePending=false;paint();}
 }
 function repaint(){
  if(role==='student'&&page==='Perfil'&&!main.querySelector('.rest-preferences'))main.insertAdjacentHTML('beforeend',markup());
  const panel=document.querySelector('#timer-panel');if(panel&&!panel.querySelector('[data-rest-brief]'))panel.insertAdjacentHTML('beforeend','<small class="rest-background-status note-text" data-rest-brief></small>');
  if(cloud()?.live&&role==='admin'&&page==='Ajustes'&&!main.querySelector('[data-rest-admin]')){
   main.insertAdjacentHTML('beforeend','<section class="panel rest-preferences" data-rest-admin><div class="panel-heading"><h2>Avisos de descanso</h2></div><div class="panel-content"><p class="note-text">Habilitá las notificaciones opcionales para que los alumnos reciban el aviso al cambiar de app.</p><button type="button" class="btn outline" data-rest-initialize>Habilitar avisos de descanso</button><p class="note-text" data-rest-admin-status></p></div></section>');
   main.querySelector('[data-rest-admin-status]').textContent=adminStatus;
  }
  syncWake();paint();
 }
 const baseRender=render;render=function(...args){const result=baseRender(...args);repaint();return result;};
 async function refreshConfig(){
  if(!realStudent())return;const e=epoch;
  try{const value=await cloud().restRpc('ent_rest_push_config');if(e!==epoch)return;config=value&&typeof value==='object'?value:{enabled:false};}
  catch{if(e===epoch){config={enabled:false};problem='Los avisos con la app cerrada todavía no están habilitados.';}}
  paint();
 }
 function bytes(value){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,x=>x.charCodeAt(0));}
 async function registerExisting(){
  const e=epoch;if(!realStudent()||!enabled()||!pushSupported()||Notification.permission!=='granted')return;
  try{const reg=await timeout(navigator.serviceWorker.ready),sub=await reg.pushManager.getSubscription();if(!sub||e!==epoch)return;const id=await cloud().restRpc('ent_register_rest_push',{p_subscription:sub.toJSON()});if(e===epoch){subscriptionId=id;problem='';}}
  catch{if(e===epoch)problem='No pudimos conectar los avisos. Tocá Activar avisos para reintentar.';}paint();
 }
 async function enable(){
  if(busy||!realStudent()||!config?.enabled)return;
  if(enabled()&&subscriptionId){busy=true;const finishLoading=window.EntrenarLoading?.begin(undefined,'Desactivando…');paint();try{await revoke();put('notifications',false);problem='';}catch{problem='No pudimos desactivar los avisos. Volvé a intentar.';}finally{busy=false;finishLoading?.();paint();}return;}
  busy=true;problem='';const finishLoading=window.EntrenarLoading?.begin(undefined,'Activando…');paint();const e=epoch;
  try{
   // El permiso se solicita directamente desde el toque del alumno (necesario en iOS).
   const permission=await Notification.requestPermission();if(e!==epoch)return;
   if(permission!=='granted'){problem='No se activaron las notificaciones. Podés cambiar el permiso desde los ajustes.';return;}
   const reg=await timeout(navigator.serviceWorker.ready);if(e!==epoch)return;
   const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(config.publicKey)});
   if(e!==epoch){await sub.unsubscribe();return;}
   const registered=await cloud().restRpc('ent_register_rest_push',{p_subscription:sub.toJSON()});
   if(e!==epoch)return;subscriptionId=registered;put('notifications',true);problem='';
   if(timerEnd>Date.now())start(Math.ceil((timerEnd-Date.now())/1000));
  }catch{if(e===epoch)problem='No pudimos activar los avisos. Revisá tu conexión y volvé a intentar.';}
  finally{if(e===epoch){busy=false;paint();}finishLoading?.();paint();}
 }
 function serialize(task){queue=queue.catch(()=>{}).then(task).catch(()=>{});return queue;}
 function cancel(){
  const previous=job;job=null;if(!previous)return;
  serialize(async()=>{if(cloud()?.accountId!==previous.owner)return;await cloud().restRpc('ent_cancel_rest_push',{p_id:previous.id});});
 }
 function start(seconds){
  cancel();if(!realStudent()||!enabled()||!subscriptionId)return;
  const record={id:crypto.randomUUID(),owner:cloud().accountId,device:subscriptionId,endsAt:Date.now()+seconds*1000},e=epoch;job=record;
  serialize(async()=>{
   if(e!==epoch||job!==record)return;
   const remaining=Math.ceil((record.endsAt-Date.now())/1000);if(remaining<=0)return;
   try{await cloud().restRpc('ent_schedule_rest_push',{p_id:record.id,p_subscription:record.device,p_seconds:remaining});if(e===epoch)problem='';}
   catch{if(e===epoch){problem='El aviso fuera de la app no se pudo programar. La campana sigue disponible con Entrenar abierta.';paint();}}
  });
 }
 async function revoke(){
  cancel();const id=subscriptionId;subscriptionId=null;
  const reg='serviceWorker' in navigator?await timeout(navigator.serviceWorker.getRegistration?navigator.serviceWorker.getRegistration('/'):navigator.serviceWorker.ready,1500).catch(()=>null):null;
  await Promise.allSettled([queue,id&&realStudent()?cloud().restRpc('ent_revoke_rest_push',{p_subscription:id}):Promise.resolve(),(async()=>{const sub=await reg?.pushManager.getSubscription();if(sub)await sub.unsubscribe();const notices=await reg?.getNotifications?.();for(const n of notices||[])if(n.tag?.startsWith('entrenar-rest-'))n.close();})()]);
 }
 async function beforeLogout(){releaseWake();await timeout(revoke(),2500).catch(()=>{});++epoch;}
 function accountChanged(){
  ++epoch;config=null;subscriptionId=null;job=null;problem='';busy=false;adminStatus='';releaseWake();
  refreshConfig().then(()=>{if(config?.enabled)registerExisting();});repaint();
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-rest-enable]'))enable();});
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-rest-initialize]');if(!button||button.disabled)return;
  const finishLoading=window.EntrenarLoading?.begin(button,'Habilitando…');button.disabled=true;adminStatus='Habilitando…';const label=main.querySelector('[data-rest-admin-status]');if(label)label.textContent=adminStatus;
  try{await cloud().initializeRestPush();adminStatus='Avisos habilitados. Cada alumno puede activarlos desde su perfil.';button.textContent='Avisos habilitados';}
  catch{adminStatus='Falta configurar el SQL 13 y la función rest-reminders en Supabase. Consultá la guía incluida.';button.disabled=false;}
  finishLoading?.();if(adminStatus.startsWith('Avisos habilitados')){button.textContent='Avisos habilitados';button.disabled=true;}if(label?.isConnected)label.textContent=adminStatus;
 });
 document.addEventListener('change',event=>{if(event.target.matches('[data-rest-awake]')){put('awake',event.target.checked);wakeFailure=false;syncWake();}});
 document.addEventListener('visibilitychange',()=>{syncWake();if(!document.hidden){if(timerCompleted&&localRestVisible())cancel();if(realStudent()&&!config?.enabled)refreshConfig();}});
 window.addEventListener('pagehide',releaseWake);
 window.addEventListener('entrenar:account-changed',accountChanged);
 window.EntrenarRestAlerts={start,cancel,completed(){if(localRestVisible())cancel();},beforeLogout};
 accountChanged();
})();
