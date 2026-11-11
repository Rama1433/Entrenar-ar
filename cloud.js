'use strict';
// Supabase Auth + RLS. The publishable key identifies the app, never a user's role.
(() => {
 const client=window.EntrenarSupabaseSDK.createClient('https://tsmgmsiigkdhrwwkbpyj.supabase.co','sb_publishable_6ZuSWOnM8cATkxHzpjPD6A_93M4Iyzc',{
  auth:{storageKey:'entrenar-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
  global:{fetch:(url,options)=>fetch(url,{...options,cache:'no-store'})}
 });
 let user=null,live=false,checking=true,started=false,authBusy=false,busy=false,recovery=false,generation=0;
 let myRole=null,subscription=null,memberships=[],pendingCode='',invitation=null;
 const publicPrices={};
 let personal=null,refreshTask=null,refreshAgain=false,lastRefresh=0,lastRefreshDay='',openingPlayed=false;
 // Automatic synchronization: private invalidations, coalesced reads, no page reload.
 let syncChannel=null,syncTimer=null,syncPending=false,syncConnected=false,syncRevision=null,syncRetryAt=0;
 function automaticBlocked(){const active=document.activeElement,dialog=active?.closest('dialog');const editing=active?.matches('input,textarea,select,[contenteditable=true]')&&(!dialog||dialog.open);return checking||busy||document.hidden||modal.open||editing||(role==='student'&&page==='Mi rutina'&&!!detailId);}
 function stopSync(){const previous=syncChannel;syncChannel=null;syncConnected=false;clearTimeout(syncTimer);syncTimer=null;if(previous&&typeof client.removeChannel==='function')Promise.resolve(client.removeChannel(previous)).catch(()=>{});}
 function scheduleSync(delay=700){
  if(!live||!user||!syncPending||syncTimer||automaticBlocked())return;
  const g=generation;
  syncTimer=setTimeout(async()=>{syncTimer=null;if(g!==generation||!live||automaticBlocked())return;if(refreshTask){scheduleSync(1000);return;}
   syncPending=false;try{await refresh({automatic:true});syncRetryAt=0;}catch{syncPending=true;syncRetryAt=Date.now()+30000;}
  },Math.max(delay,2000-(Date.now()-lastRefresh),syncRetryAt-Date.now()));
 }
 function requestSync(){if(!live)return;syncPending=true;scheduleSync();}
 function startSync(){
  if(syncChannel||!live||checking||document.hidden||!user||typeof client.channel!=='function')return;
  const g=generation,uid=user.id;
  try{
   const channel=client.channel('entrenar-account-'+uid+'-'+g);syncChannel=channel;
   const changed=payload=>{if(g!==generation||!live||user?.id!==uid||syncChannel!==channel||(payload.new?.id&&payload.new.id!==uid))return;const revision=payload.new?.revision;if(revision!==undefined){if(String(revision)===syncRevision)return;syncRevision=String(revision);}requestSync();};
   for(const event of ['INSERT','UPDATE'])channel.on('postgres_changes',{event,schema:'public',table:'ent_sync_signals',filter:'id=eq.'+uid},changed);
   channel.subscribe(status=>{if(g!==generation||syncChannel!==channel)return;syncConnected=status==='SUBSCRIBED';if(syncConnected)requestSync();});
  }catch{stopSync();}
 }
 async function checkSync(){
  if(!live||automaticBlocked()||refreshTask)return;
  if(lastRefreshDay!==today()){requestSync();return;}
  const g=generation,uid=user?.id;
  try{const rows=check(await client.from('ent_sync_signals').select('revision').eq('id',uid));if(g!==generation||!live||user?.id!==uid)return;
   const revision=rows?.[0]?.revision;if(revision===undefined){if(Date.now()-lastRefresh>=120000)requestSync();return;}
   if(String(revision)!==syncRevision){syncRevision=String(revision);requestSync();}
  }catch{if(g===generation&&live&&Date.now()-lastRefresh>=120000)requestSync();}
  if(syncPending)scheduleSync();
 }
 function animateOpening(){if(openingPlayed)return;openingPlayed=true;document.body.classList.add('app-opening');setTimeout(()=>document.body.classList.remove('app-opening'),1100);}
 const demoSave=save,baseRender=render,baseInbox=coachInboxNotices;
 const demoStrip=$('.demo-strip').innerHTML,demoFooter=$('.page-footer').innerHTML;
 const draftStorageKey=uid=>'entrenar-session:'+uid;
 function loadPersonalSession(uid){try{const x=JSON.parse(sessionStorage.getItem(draftStorageKey(uid))||'null');return x&&typeof x.drafts==='object'&&x.drafts&&!Array.isArray(x.drafts)?x:{drafts:{},readStudentNotices:{}};}catch{return {drafts:{},readStudentNotices:{}};}}
 const localDemo=()=>{try{const x=JSON.parse(localStorage.getItem('entrenar-v1')||'null');if(x?.version===1)return x;}catch{}return seed();};
 const blank=()=>({version:1,coach:{name:'Tu profesor',plan:'inicial',email:'',whatsapp:''},coachNotices:[],readCoachNotices:[],measurements:[],readStudentNotices:{},students:[],exercises:[],routines:[],assignments:[],sessions:[],drafts:{},notices:[],adminCoaches:[],adminPrices:{inicial:null,profesional:null,equipo:null},adminPayments:[]});
 const check=({data,error})=>{if(error)throw error;return data;};
 const rpc=async(name,args={})=>check(await client.rpc(name,args));
 async function all(table,order='id'){
  const result=[];for(let offset=0;;offset+=500){const rows=check(await client.from(table).select('*').order(order).range(offset,offset+499));result.push(...rows);if(rows.length<500)return result;}
 }
 const dateAR=value=>new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Argentina/Buenos_Aires'});
 function friendly(e){const m=e?.message||'';if(/ent_(save_student_fee|generate_fee_month|record_fee_payment|void_fee_payment|save_training_block|stop_training_block|save_coach_branding)/i.test(m)&&/schema cache|does not exist|PGRST202/i.test(m))return 'Falta aplicar el SQL 12 de Profesional en Supabase. El formulario conserva tus datos.';if(/ent_admin_save_catalog|ent_catalog_/i.test(m)&&/PGRST20[25]|schema cache|does not exist/i.test(m))return 'Falta aplicar el SQL 10 de catálogo en Supabase.';if(/ent_save_routine_bundle/i.test(m)&&/PGRST202|function|schema cache/i.test(m))return 'Falta aplicar el SQL 09 de plantillas de rutinas en Supabase. Tus cambios siguen en este formulario.';if(/email address not authorized|error sending confirmation email/i.test(m))return 'No pudimos enviar el correo de confirmación. Falta revisar la configuración de correos de Entrenar.';if(/invalid login credentials/i.test(m))return 'Revisá el correo y la contraseña.';if(/email not confirmed/i.test(m))return 'Confirmá tu correo antes de ingresar.';if(/already registered|already been registered/i.test(m))return 'Este correo ya tiene una cuenta. Probá iniciar sesión.';if(/rate limit|too many requests|security purposes/i.test(m))return 'Se hicieron varios intentos. Esperá unos minutos y volvé a probar.';if(/failed to fetch|network|timeout/i.test(m))return 'No pudimos conectar. Revisá tu conexión e intentá de nuevo.';if(/ent_get_invitation/i.test(m)&&/PGRST202|function|schema cache/i.test(m))return 'Falta aplicar el SQL 04 de invitaciones cortas en Supabase.';if(/PGRST202|function .*schema cache/i.test(m))return 'Falta aplicar el SQL 03 de conexión en Supabase.';if(/permission denied|row.level security|not authorized/i.test(m))return 'Tu cuenta no tiene permiso para esa operación. Actualizá los datos e intentá de nuevo.';if(/duplicate key/i.test(m))return 'Ese registro ya existe. Actualizá la pantalla para revisarlo.';if(/duration_seconds/i.test(m)&&/column|schema cache|PGRST204/i.test(m))return 'Falta aplicar el SQL 06 de duración de entrenamientos en Supabase. Tu avance se conserva.';if(/ent_exercises_shorts_only/i.test(m))return 'Solo se aceptan enlaces de YouTube Shorts. Revisá el enlace del ejercicio.';if(/check constraint|invalid input|not.null/i.test(m))return 'Revisá los datos del formulario.';if(/password/i.test(m))return 'La contraseña no cumple los requisitos. Usá al menos 10 caracteres.';return m.slice(0,200)||'No pudimos completar la operación. Intentá de nuevo.';}
 function credentials(data){const email=normalizeEmail(data.get('email')),password=String(data.get('password')||'');if(!email||!password)throw Error('Completá correo y contraseña.');return {email,password};}
 async function saveSexPreference(data){
  const sex=normalizeSex(data.get('sex'));if(sex===normalizeSex(user?.user_metadata?.sex))return;
  const owner=user?.id;const result=check(await client.auth.updateUser({data:{sex}}));
  if(user?.id!==owner)throw Error('La sesión cambió. Volvé a ingresar.');
  if(result?.user)user=result.user;
 }
 function needRole(expected){if(!live||myRole!==expected)throw Error('Tu cuenta no tiene permiso para esa operación.');}
 function isCoachActive(){return subscription&&['trial','active'].includes(subscription.status)&&subscription.ends_on>=today();}
 function preferredMembership(rows){
  const rank={approved:0,pending:1,inactive:2,rejected:3};
  return [...rows].sort((a,b)=>(rank[a.status]??4)-(rank[b.status]??4)||String(b.reviewed_at||b.created_at||'').localeCompare(String(a.reviewed_at||a.created_at||''))||String(a.id).localeCompare(String(b.id)))[0];
 }
 function currentMember(){return preferredMembership(memberships.filter(m=>m.student_id===user?.id));}

 function mapData(t,kind,uid){
  const s=blank(),profiles=new Map(t.ent_profiles.map(p=>[p.id,p]));
  const contact=pid=>{const p=profiles.get(pid);return {name:p?.full_name||'Alumno',email:p?.email||'',whatsapp:p?.whatsapp||'',...(kind==='student'&&pid===uid?{sex:normalizeSex(user?.user_metadata?.sex)}:{})};};
  for(const p of t.ent_plans){s.adminPrices[p.id]=p.price_cents===null?null:Number(p.price_cents);}
  const ms=t.ent_memberships||[];
  // Historical memberships remain on the server; each student has one visible file.
  const studentIds=[...new Set(ms.filter(m=>m.status!=='rejected').map(m=>m.student_id))];
  s.students=studentIds.map(sid=>{
   const m=preferredMembership(ms.filter(x=>x.student_id===sid&&x.status!=='rejected'));
   return {id:sid,membershipId:m.id,...contact(sid),goal:m.goal||'',days:m.days,notes:m.notes||'',joinedOn:m.created_at?.slice(0,10),status:m.status==='approved'?'active':m.status==='pending'?'pending':'inactive'};
  });
  if(kind==='student'&&!s.students.some(x=>x.id===uid))s.students.push({id:uid,...contact(uid),goal:'Tu recorrido personal',days:3,notes:'',status:'pending'});
  const member=preferredMembership(ms.filter(m=>m.student_id===uid));
  const coachId=kind==='coach'?uid:member?.coach_id;
  const sub=(t.ent_subscriptions||[]).find(x=>x.coach_id===coachId);
  if(coachId){const p=profiles.get(coachId);s.coach={name:p?.full_name||'Tu profesor',email:p?.email||'',whatsapp:p?.whatsapp||'',plan:sub?.plan_id||'inicial',id:coachId};}
  const counts=new Map((t.counts||[]).map(c=>[c.coach_id,Number(c.active_students)]));
  s.adminCoaches=(t.ent_coaches||[]).map(c=>{const p=profiles.get(c.user_id),sub=t.ent_subscriptions.find(x=>x.coach_id===c.user_id);return {id:c.user_id,name:p?.full_name||'Profesor',email:p?.email||'',whatsapp:p?.whatsapp||'',plan:sub?.plan_id||'inicial',status:sub?.status==='suspended'?'inactive':sub?.status==='pending'?'pending':'active',subscription:sub?.status==='trial'?'trial':'paid',expiresAt:sub?.ends_on||'',serverStatus:sub?.status||'pending',activeStudents:counts.get(c.user_id)??null};});
  s.exercises=(t.ent_exercises||[]).filter(e=>!e.archived).map(e=>({id:e.id,name:e.name,group:e.muscle_group,video:e.video_url,notes:e.notes,primaryMuscles:e.primary_muscles,secondaryMuscles:e.secondary_muscles}));
  s.routines=(t.ent_routines||[]).filter(r=>!r.archived).map(r=>({id:r.id,name:r.name,description:r.description,days:r.days,exercises:(t.ent_routine_exercises||[]).filter(e=>e.routine_id===r.id).sort((a,b)=>a.position-b.position).map(e=>({exerciseId:e.exercise_id,sets:e.sets,reps:e.reps,rest:e.rest_seconds}))}));
  s.assignments=(t.ent_assignments||[]).map(a=>({id:a.id,studentId:a.student_id,routineId:a.routine_id,membershipId:a.membership_id}));
  s.sessions=(t.ent_sessions||[]).map(x=>({id:x.id,studentId:x.student_id,routineId:x.routine_id,routineName:x.routine_name,durationSeconds:Number.isInteger(x.duration_seconds)?x.duration_seconds:null,completedAt:x.completed_at,date:dateAR(x.completed_at),exercises:x.exercise_log,note:x.note})).sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  s.measurements=(t.ent_measurements||[]).map(x=>({id:x.id,studentId:x.student_id,date:x.recorded_on,weight:x.weight_kg===null?null:Number(x.weight_kg),height:x.height_cm===null?null:Number(x.height_cm)}));
  s.notices=(t.ent_student_notices||[]).map(n=>({id:n.id,title:n.title,body:n.body,date:dateAR(n.created_at)})).reverse();
  const recipients=t.ent_announcement_recipients||[];
  s.coachNotices=(t.ent_announcements||[]).map(n=>({id:n.id,title:n.title,body:n.body,date:dateAR(n.created_at),recipientIds:recipients.filter(r=>r.announcement_id===n.id).map(r=>r.coach_id),audienceLabel:'Profesores seleccionados'})).reverse();
  s.readCoachNotices=recipients.filter(r=>r.coach_id===uid&&r.read_at).map(r=>r.announcement_id);
  s.adminPayments=(t.ent_payments||[]).map(p=>({id:p.id,coachId:p.coach_id,coachName:p.coach_name,planId:p.plan_id,planName:p.plan_name,amountCents:Number(p.amount_cents),paidAt:p.paid_on,start:p.period_start,end:p.period_end,method:p.method,reference:p.reference,note:p.note,recordedAt:p.recorded_at}));
  return s;
 }
 async function refresh({automatic=false}={}){
  if(automatic&&automaticBlocked()){syncPending=true;return;}
  if(refreshTask){refreshAgain=true;return refreshTask;}
  const g=generation,uid=user?.id,kind=myRole;
  refreshTask=(async()=>{
   const names=['ent_profiles','ent_plans','ent_memberships','ent_coaches','ent_subscriptions','ent_payments','ent_announcements','ent_announcement_recipients'];
   if(kind!=='admin')names.push('ent_exercises','ent_routines','ent_routine_exercises','ent_assignments','ent_sessions','ent_student_notices');
   if(kind==='student')names.push('ent_measurements');
   const pairs=await Promise.all(names.map(async n=>[n,await all(n,n==='ent_coaches'?'user_id':n==='ent_subscriptions'?'coach_id':n==='ent_announcement_recipients'?'announcement_id':'id')]));
   let platform=null;
   if(kind==='admin'||kind==='coach')try{platform=await Promise.all([all('ent_catalog_exercises'),all('ent_catalog_routines')]);}catch(error){if(!/42P01|PGRST205|schema cache|does not exist/i.test((error.code||'')+' '+error.message))throw error;}
   let professional=null;
   if(kind!=='admin')try{const tables=kind==='coach'?['ent_student_fees','ent_fee_charges','ent_fee_payments','ent_fee_voids','ent_training_blocks','ent_coach_branding']:['ent_training_blocks','ent_coach_branding'];professional=Object.fromEntries(await Promise.all(tables.map(async table=>[table,await all(table,table==='ent_student_fees'||table==='ent_coach_branding'?'coach_id':'id')])));}catch(error){if(!/42P01|PGRST205|schema cache|does not exist/i.test((error.code||'')+' '+error.message))throw error;}
   const t=Object.fromEntries(pairs);t.counts=kind==='admin'?await rpc('ent_admin_coach_counts'):[];
   if(g!==generation||uid!==user?.id||!live)return;
   if(automatic&&automaticBlocked()){syncPending=true;return;}
   const next=mapData(t,kind,uid);next.drafts=state.drafts||{};next.readStudentNotices=state.readStudentNotices||{};
   next.catalogReady=platform!==null;next.catalogExercises=(platform?.[0]||[]).map(e=>({id:e.id,name:e.name,group:e.muscle_group,video:e.video_url,notes:e.notes,primaryMuscles:e.primary_muscles,secondaryMuscles:e.secondary_muscles,status:e.status}));next.catalogRoutines=platform?.[1]||[];
   next.professional={ready:professional!==null,fees:professional?.ent_student_fees||[],charges:professional?.ent_fee_charges||[],payments:professional?.ent_fee_payments||[],voids:professional?.ent_fee_voids||[],blocks:professional?.ent_training_blocks||[],branding:professional?.ent_coach_branding?.find(b=>b.coach_id===(kind==='coach'?uid:next.coach.id))||null};
   state=next;syncPlatformCatalog(platform?next.catalogExercises:null,next.catalogRoutines);memberships=t.ent_memberships;subscription=t.ent_subscriptions.find(s=>s.coach_id===uid)||null;personal=t.ent_profiles.find(p=>p.id===uid)||null;
   // Auth is the source of the current email, including confirmed email changes.
   if(kind==='coach')state.coach.email=user.email||state.coach.email;
   if(kind==='student'){const me=state.students.find(s=>s.id===uid);if(me)me.email=user.email||me.email;studentId=uid;}
   role=kind;lastRefresh=Date.now();lastRefreshDay=today();render();
  })();
  try{await refreshTask;}finally{refreshTask=null;if(refreshAgain){refreshAgain=false;if(g===generation&&live)setTimeout(()=>refresh().catch(e=>toast(friendly(e))),0);}}
 }
 function accessPanel(title,message,content=''){
  document.body.classList.add('access-open');const root=$('#access');root.hidden=false;
  root.innerHTML=`<div class="access-layout"><aside class="access-story"><div class="access-brand">${embeddedBrandLogo}</div><div class="access-story-copy"><h2>Cada paso<br>cuenta.</h2></div></aside><div class="access-panel"><div class="access-mobile-brand">${embeddedBrandLogo}</div><div class="access-content"><h1>${esc(title)}</h1><p class="access-lead">${esc(message)}</p>${content}<p id="access-error" class="access-error" role="alert"></p></div></div></div>`;
 }
 function registrationRole(){const kind=user?.user_metadata?.requested_role;return ['coach','student'].includes(kind)?kind:null;}
 function updateOnboardPlan(plan){
  const form=$('#cloud-onboard');if(!form||!plans.some(p=>p.id===plan&&!p.comingSoon))return;
  form.elements.plan.value=plan;
  form.querySelectorAll('[data-onboard-plan]').forEach(card=>{const selected=card.dataset.onboardPlan===plan;card.classList.toggle('selected',selected);const button=card.querySelector('button');button.setAttribute('aria-pressed',String(selected));button.textContent=plans.find(p=>p.id===card.dataset.onboardPlan)?.comingSoon?'Próximamente':selected?'Plan seleccionado':'Elegir este plan';});
  $('#onboard-plan-status').textContent='Plan elegido: '+plans.find(p=>p.id===plan).name+'.';
 }
 function gate(){
  const meta=user?.user_metadata||{},kind=registrationRole();
  const selectedPlan=plans.some(p=>p.id===meta.requested_plan&&!p.comingSoon)?meta.requested_plan:'inicial';
  const accountField=kind?`<label>Tipo de cuenta<input value="${kind==='coach'?'Profesor':'Alumno'}" readonly aria-readonly="true"></label><p class="access-hint onboard-role-hint">Es el perfil que elegiste al registrarte.</p>`:`<label>Tipo de cuenta<select name="kind"><option value="student">Alumno</option><option value="coach">Profesor</option></select></label>`;
  const planField=`<section id="onboard-coach-plans" ${kind==='student'||!kind?'hidden':''}><input type="hidden" name="plan" id="onboard-plan" value="${selectedPlan}"><details class="onboard-plan-review"><summary>Ver planes y beneficios</summary><div class="onboard-plan-grid">${plans.map(p=>`<article class="access-plan-card ${selectedPlan===p.id?'selected':''}" data-onboard-plan="${p.id}"><h2>${esc(p.name)}</h2><p class="access-plan-capacity">${esc(planCapacity(p))}</p><ul class="access-plan-features">${planFeatures(p.id).map(text=>`<li>${icon('check')}<span>${text}</span></li>`).join('')}</ul><p class="access-price" data-onboard-price="${p.id}">${api.planPriceLabel(p.id)}</p><p class="access-billing">Abono mensual</p><button type="button" class="access-plan-select" data-cloud="onboard-plan" data-id="${p.id}" ${p.comingSoon?'disabled':''} aria-pressed="${selectedPlan===p.id}">${p.comingSoon?'Próximamente':selectedPlan===p.id?'Plan seleccionado':'Elegir este plan'}</button></article>`).join('')}</div></details><p id="onboard-plan-status" class="access-hint" role="status">Plan elegido: ${esc(plans.find(p=>p.id===selectedPlan).name)}.</p><p class="access-hint">Esta selección no realiza cobros. Estamos revisando tu cuenta para habilitar tu espacio en Entrenar.</p></section>`;
  accessPanel('Completá tu cuenta','Revisá tus datos antes de confirmar. Tu correo ya está vinculado a esta cuenta.',`<form id="cloud-onboard">${accountField}<label>Nombre y apellido<input name="name" value="${esc(meta.full_name||'')}" maxlength="80" required></label><label>WhatsApp con código de país<input name="whatsapp" type="tel" value="${esc(meta.whatsapp||'')}" required></label><section id="onboard-student-sex" ${kind==='coach'?'hidden':''}>${sexPicker(meta.sex)}</section>${planField}<button class="access-btn" type="submit">Completar cuenta</button></form><button class="access-text" data-cloud="logout">Salir</button>${installCallout()}`);
  if(kind==='coach')$('#access .access-layout').classList.add('access-onboarding');
  const g=generation,uid=user.id;
  api.loadPlanPrices().then(()=>{if(g!==generation||uid!==user?.id||!$('#cloud-onboard'))return;document.querySelectorAll('[data-onboard-price]').forEach(el=>{el.textContent=api.planPriceLabel(el.dataset.onboardPrice);});}).catch(()=>{});
 }
 async function enter(session){
  const remembered=window.history.state?.entrenarNavigation?.view;
  stopSync();syncPending=false;syncRevision=null;syncRetryAt=0;syncPlatformCatalog(null,[]);const g=++generation;checking=true;busy=false;invitation=null;state=blank();user=session.user;myRole=null;live=false;
  stopTimer();if(modal.open)modal.close();$('#modal-body').replaceChildren();delete window.pendingBroadcast;accessPanel('Entrando a tu espacio…','Estamos cargando tu cuenta.');
  try{
   const result=await client.auth.getUser();const verified=check(result)?.user;if(!verified||g!==generation)return;
   user=verified;myRole=await rpc('ent_my_role');if(g!==generation)return;
   // Metadata can suggest coach/student onboarding; it never authorizes admin.
   if(!myRole){gate();return;}
   const personalSession=loadPersonalSession(user.id);state.drafts=personalSession.drafts;state.readStudentNotices=personalSession.readStudentNotices||{};
   live=true;role=myRole;page=role==='admin'?'Resumen':'Inicio';detailId=null;studentId=role==='student'?user.id:'';search='';filter='all';
   await refresh();if(g!==generation)return;
   if(role==='student'){
    const code=pendingCode||user.user_metadata?.invite_code;
    if(code&&!memberships.length){
     try{await rpc('ent_request_membership',{p_code:code});pendingCode='';await refresh();}catch(e){toast(friendly(e));}
    }
   }
   checking=false;window.EntrenarAccessNavigation?.hide();sessionStorage.removeItem('entrenar-demo-navigation');
   window.dispatchEvent(new CustomEvent('entrenar:account-changed'));
   render();window.EntrenarAccountResume?.(remembered);animateOpening();window.scrollTo(0,0);startSync();
  }catch(e){if(g===generation)accessPanel('No pudimos cargar tu cuenta',friendly(e),'<button class="access-btn" data-cloud="retry">Reintentar</button><button class="access-text" data-cloud="logout">Salir</button>');}
  finally{if(g===generation)checking=false;}
 }
 async function run(task,message='Cambios guardados.'){
  if(busy)return false;busy=true;const g=generation;
  document.body.classList.add('cloud-busy');
  try{await task();if(g!==generation)return false;await refresh();if(g!==generation)return false;if(modal.open)modal.close();if(message)toast(message);return true;}
  catch(e){if(g===generation){const err=$('#form-error');if(err)err.textContent=friendly(e);else toast(friendly(e));}return false;}
  finally{busy=false;document.body.classList.remove('cloud-busy');if(syncPending)scheduleSync();}
 }
 async function logout(){
  if(user?.id)sessionStorage.removeItem(draftStorageKey(user.id));
  stopSync();syncPending=false;syncRevision=null;syncPlatformCatalog(null,[]);++generation;live=false;checking=true;busy=false;user=null;myRole=null;personal=null;subscription=null;memberships=[];pendingCode='';invitation=null;recovery=false;
  stopTimer();if(modal.open)modal.close();$('#modal-body').replaceChildren();delete window.pendingBroadcast;state=blank();main.replaceChildren();$('#sidebar').replaceChildren();$('#topbar').replaceChildren();$('#mobile-nav').replaceChildren();
  sessionStorage.removeItem('entrenar-demo-navigation');document.body.classList.remove('cloud-live','app-opening');
  try{check(await client.auth.signOut({scope:'local'}));}catch{localStorage.removeItem('entrenar-auth-v1');}
  state=localDemo();upgradeState();role='coach';page='Inicio';detailId=null;studentId=state.students[0]?.id||'';checking=false;
  window.EntrenarAccessNavigation?.restore({screen:'welcome'});window.dispatchEvent(new CustomEvent('entrenar:account-changed'));
 }
 function subscriptionForm(c){
  if(!c)return;openModal('Plan y estado del profesor','La activación y los cupos se controlan en la base.',`<p class="note-text">${esc(c.name)} · ${esc(c.email)}</p><form id="cloud-subscription" data-id="${esc(c.id)}"><label class="field">Plan<select name="plan">${plans.map(p=>`<option value="${p.id}" ${p.id===c.plan?'selected':''}>${p.name}</option>`).join('')}</select></label><label class="field">Estado<select name="status">${[['pending','Pendiente'],['trial','En prueba'],['active','Activo'],['suspended','Suspendido']].map(([v,n])=>`<option value="${v}" ${v===c.serverStatus?'selected':''}>${n}</option>`).join('')}</select></label>${field('Vencimiento','ends_on',c.expiresAt,'date')}${actions('Guardar suscripción')}</form>`);
 }
 function profileForm(){const p=personal||{};openModal('Mis datos','El cambio de correo se confirma desde tu email.',`<form id="cloud-profile">${field('Nombre y apellido','name',p.full_name||'','text','required minlength="2" maxlength="80"')}${field('WhatsApp con código de país','whatsapp',p.whatsapp||'','tel','required maxlength="25"')}${myRole==='student'?sexPicker(user?.user_metadata?.sex):''}${actions('Guardar datos')}</form><hr><form id="cloud-email">${field('Nuevo correo','email',user.email||'','email','required maxlength="254"')}${actions('Solicitar cambio de correo')}</form>`);}
 function linkForm(){openModal('Vincularme con un profesor','Ingresá el código que te compartió.',`<form id="cloud-link">${field('Código del profesor','code',pendingCode,'text','required maxlength="40" autocomplete="off"')}${actions('Revisar profesor')}</form>`);}
 function invitationLinkValue(){const link=new URL('/',window.location.origin);link.searchParams.set('profesor',invitation.code);return link.href;}
 function invitationText(){return invitationMessage(state.coach.name,invitationLinkValue(),invitation.code);}
 function drawInvitation(){
  const link=invitationLinkValue(),text=invitationText();
  openModal('Invitar alumno','Compartí el QR o el código para sumar a tu equipo.',`<div class="invitation-panel"><div class="invitation-methods"><section class="invitation-qr"><div id="cloud-qr" class="cloud-qr"></div></section><section class="invitation-code"><span class="eyebrow">CÓDIGO DE VINCULACIÓN</span><strong class="invitation-code-value cloud-code">${esc(invitation.code)}</strong><button type="button" class="btn outline full" data-cloud="copy-code">Copiar código</button><a class="btn primary full" href="${esc(whatsappShareUrl(text))}" target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a></section></div></div>`);
  $('#cloud-qr').innerHTML=window.EntrenarQR(link).replace('QR de invitación de prueba','QR para sumarte al equipo');
 }
 async function invite(){
  needRole('coach');if(busy)return;
  busy=true;const g=generation;const uid=user.id;
  try{
   const rows=await rpc('ent_get_invitation',{p_renew:false});
   if(g!==generation||uid!==user?.id||!live)return;
   const current=rows?.[0];if(!current||!/^ENT-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(current.code)||!Number.isFinite(Date.parse(current.expires_at)))throw Error('No pudimos obtener una invitación vigente. Intentá nuevamente.');
   invitation=current;drawInvitation();
  }catch(e){if(g===generation)toast(friendly(e));}finally{if(g===generation)busy=false;}
 }
 async function copyLiveCode(){
  if(!invitation)return;
  const value=invitation.code;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);toast('Código copiado.');}
  catch{openModal('Copiar código','Mantené presionado el código para copiarlo.',`<input id="invitation-copy-value" readonly aria-label="Código para copiar" value="${esc(value)}"><div class="form-actions">${btn('Cerrar','close-modal','primary')}</div>`);$('#invitation-copy-value').focus();$('#invitation-copy-value').select();}
 }
 function postRender(){
  document.body.classList.toggle('cloud-live',live);
  if(!live){if($('.demo-strip').textContent.includes('Cuenta conectada')){$('.demo-strip').innerHTML=demoStrip;$('.page-footer').innerHTML=demoFooter;}return;}
  $('#topbar .role-field')?.remove();
  const version=$('#sidebar .version');if(version)version.textContent='Versión 1.10.0 · Cuenta conectada';
  $('#topbar .top-actions')?.insertAdjacentHTML('beforeend','<button class="btn outline cloud-exit" data-cloud="ask-logout">Salir</button>');
  for(const el of document.querySelectorAll('#profile-role,#student-select'))el.closest('section.panel')?.remove();
  const strip=$('.demo-strip');if(strip)strip.innerHTML='<span class="status-dot"></span><span>Cuenta conectada · Guardado en línea</span>';
  $('.page-footer').innerHTML='<span>ENTRENAR · Cada paso cuenta.</span><span>V1.10.0</span>';
  for(const el of main.querySelectorAll('.admin-local-note'))el.remove();
  for(const el of main.querySelectorAll('.note-text')){
   if(/se guardan en este navegador|esta prueba guarda|bloqueo real de acceso/.test(el.textContent.toLowerCase()))el.textContent=el.textContent.startsWith('Estos datos son opcionales')?'Tus medidas son opcionales y personales. Solo vos podés verlas.':'Los cambios se guardan en tu cuenta de Entrenar.';
  }
  for(const el of main.querySelectorAll('.subtle'))if(/demo|prueba|sincronizar|procesan pagos/i.test(el.textContent))el.remove();
  for(const b of main.querySelectorAll('[data-action="select-plan"]')){b.textContent=plans.find(p=>p.id===b.dataset.id)?.comingSoon?'Próximamente':b.dataset.id===state.coach.plan?'Tu plan actual':'Consultar a Entrenar';b.disabled=!!plans.find(p=>p.id===b.dataset.id)?.comingSoon||b.dataset.id===state.coach.plan;}
  if(role==='admin'){
   const sidebar=$('#sidebar .sidebar-card');if(sidebar)sidebar.innerHTML='<div class="eyebrow">TU ADMINISTRACIÓN</div><h3>Configuración</h3><button class="btn outline full" data-page="Planes">Planes y precios</button>';
   const accountSettings=main.querySelector('[data-admin-action="settings"]');if(accountSettings)accountSettings.textContent='Mi cuenta';
   const create=main.querySelector('[data-admin-action="new"]');if(create)create.remove();
   const edit=main.querySelector('[data-admin-action="edit"]');if(edit)edit.textContent='Editar plan y estado';
   if(page==='Profesores'&&!state.adminCoaches.length)main.insertAdjacentHTML('beforeend','<p class="subtle">Los profesores aparecerán acá cuando confirmen su correo y completen su registro. Después podés activar su prueba o plan desde su ficha.</p>');
   if(page==='Ajustes')main.innerHTML=heading('TU CUENTA','Mi cuenta','Tu acceso y los planes de Entrenar.')+`<section class="panel"><div class="panel-content"><h2>${esc(personal?.full_name||'Administrador')}</h2><p>${esc(user.email)}</p><div class="btns"><button class="btn outline" data-cloud="profile">Editar mis datos</button><button class="btn outline" data-page="Planes">Planes y precios</button></div></div></section>`;
  }
  if(role==='coach'){
   if(!isCoachActive()&&!['Perfil','Mi plan','Notificaciones'].includes(page))main.innerHTML=heading('TU CUENTA',subscription?.status==='suspended'?'Tu cuenta está en pausa':subscription?.ends_on&&subscription.ends_on<today()?'Tu plan necesita renovación':'Estamos revisando tu cuenta',subscription?.status==='suspended'?'Contactá al equipo de Entrenar para revisar tu cuenta.':subscription?.ends_on&&subscription.ends_on<today()?'Revisaremos tu suscripción para que puedas seguir acompañando a tus alumnos.':'Estamos revisando tus datos para habilitar tu espacio en Entrenar.')+`<section class="panel"><div class="panel-content"><p>Estado: ${esc(subscription?.status==='suspended'?'Suspendido':subscription?.ends_on&&subscription.ends_on<today()?'Vencido':'Pendiente')}</p><button class="btn outline" data-page="Perfil">Ver mi perfil</button><button class="btn primary" data-cloud="refresh">Comprobar estado</button></div></section>${installCallout()}`;
   if(page==='Perfil'){
    for(const p of main.querySelectorAll('.note-text')){if(p.textContent.startsWith('Estado:'))p.textContent='Estado: '+({pending:'Pendiente',trial:'En prueba',active:'Activo',suspended:'Suspendido'}[subscription?.status]||'Sin plan');if(p.textContent.startsWith('Vencimiento:'))p.textContent='Vencimiento: '+(subscription?.ends_on?dateLabel(subscription.ends_on):'Sin definir');}
   }
   const pending=memberships.filter(m=>m.status==='pending');
   if(pending.length&&['Inicio','Alumnos'].includes(page)&&!detailId)main.insertAdjacentHTML('afterbegin',`<section class="panel cloud-requests"><div class="panel-heading"><h2>Solicitudes pendientes</h2><span class="badge">${pending.length}</span></div><div class="panel-content">${pending.map(m=>{const s=state.students.find(s=>s.id===m.student_id);return `<div class="list-item"><h3>${esc(s?.name||'Alumno')}</h3><p>${esc(s?.email||'')}</p><div class="btns"><button class="btn primary" data-cloud="approve" data-id="${m.id}">Aprobar</button><button class="btn outline" data-cloud="reject" data-id="${m.id}">Rechazar</button></div></div>`;}).join('')}</div></section>`);
   const s=state.students.find(s=>s.id===detailId);if(s?.status==='pending'){for(const b of main.querySelectorAll('[data-action="toggle-student"],[data-action="assign-to-student"]'))b.remove();}
  }
  if(role==='student'){
   const member=currentMember(),active=member?.status==='approved'&&state.coach.name!=='Tu profesor';
   if(!active&&['Inicio','Mi rutina'].includes(page))main.innerHTML=heading('TU EQUIPO',`Hola, ${esc((personal?.full_name||'').split(' ')[0])} 👋`,member?.status==='pending'?'Estamos revisando tu cuenta y la vinculación con tu profesor.':'Tu entrenamiento está en pausa.')+`<section class="panel"><div class="panel-content"><p>${member?.status==='pending'?'Tu profesor verá la solicitud en Alumnos. Podés volver a comprobar su estado.':'Revisá tu vinculación con el profesor o ingresá un código de invitación.'}</p><button class="btn primary" data-cloud="refresh">Comprobar estado</button>${!member||!['pending','approved'].includes(member.status)?'<button class="btn outline" data-cloud="link">Vincularme con un profesor</button>':''}</div></section>${installCallout()}`;
   if(page==='Progreso'){renderStudentProgress(selectedStudent(),sessionsFor(user.id));for(const p of main.querySelectorAll('.note-text'))if(p.textContent.startsWith('Estos datos son opcionales'))p.textContent='Tus medidas son opcionales y personales. Solo vos podés verlas.';}
   if(page==='Perfil'&&!active)main.insertAdjacentHTML('beforeend','<p class="subtle">La información de contacto del profesor estará disponible con la vinculación aprobada y su plan vigente.</p>');
  }
  const accountCard=role==='admin'&&page==='Ajustes'?main.querySelector('.panel-content'):page==='Perfil'?main.querySelector('.profile-card'):null;
  if(accountCard)accountCard.insertAdjacentHTML('beforeend','<div class="profile-session-actions"><p class="note-text">Tu sesión en Entrenar</p><button type="button" class="btn outline profile-exit" data-cloud="ask-logout">Salir</button></div>');
 }
 render=function(...args){if(live)role=myRole;else if(!['coach','student'].includes(role)){role='coach';page='Inicio';detailId=null;search='';filter='all';}const result=baseRender(...args);postRender();if(syncPending)scheduleSync();return result;};
 coachInboxNotices=function(){return live?state.coachNotices.filter(n=>n.recipientIds.includes(user.id)):baseInbox();};
 save=function(){if(!live)return demoSave();try{sessionStorage.setItem(draftStorageKey(user.id),JSON.stringify({drafts:state.drafts,readStudentNotices:state.readStudentNotices}));return true;}catch{toast('Tu avance queda en esta pestaña. Guardá el entrenamiento antes de cerrarla.');return false;}}; // Remote records never enter the demo's localStorage.
 function adminCommitPayment(p){needRole('admin');return run(()=>rpc('ent_admin_record_payment',{p_operation:p.id,p_coach:p.coachId,p_amount_cents:p.amountCents,p_paid_on:p.paidAt,p_start:p.start,p_end:p.end,p_method:p.method,p_reference:p.reference,p_note:p.note}),'Pago registrado y período renovado.');}
 function adminCommitMessage(n){needRole('admin');return run(()=>rpc('ent_admin_publish',{p_title:n.title,p_body:n.body,p_recipients:n.recipientIds}),'Comunicado publicado para profesores.');}
 function clickLive(b){
  const a=b.dataset.action,aa=b.dataset.adminAction,cid=b.dataset.id;
  if(aa==='detail'){needRole('admin');page='Profesores';detailId=cid;render();refresh().catch(error=>toast(friendly(error)));return true;}
  if(aa==='new'||a==='new-coach'){toast('El profesor debe crear y confirmar su propia cuenta. Aparecerá en Profesores para que actives su plan.');return true;}
  if(aa==='edit'||a==='edit-coach'){subscriptionForm(state.adminCoaches.find(c=>c.id===cid));return true;}
  if(aa==='toggle'){const c=state.adminCoaches.find(c=>c.id===cid);if(c?.serverStatus==='suspended'){subscriptionForm(c);return true;}openModal('Suspender profesor','Conserva el historial y pausa el acceso a los entrenamientos.',`<p>${esc(c?.name)}</p><div class="form-actions">${btn('Cancelar','close-modal','outline')}<button class="btn primary" data-cloud="suspend" data-id="${esc(cid)}">Confirmar suspensión</button></div>`);return true;}
  if(['select-plan','export','import','reset','confirm-reset','confirm-import','coach-name'].includes(a)){toast(a==='select-plan'?'Solicitá el cambio de plan al equipo de Entrenar.':'Esta opción corresponde a la demo. Los datos reales se conservan en Supabase.');return true;}
  if(a==='new-student'){invite();return true;}
  if(['edit-coach-profile','edit-student-profile'].includes(a)){profileForm();return true;}
  if(a==='edit-student'){const s=state.students.find(x=>x.id===cid);if(s)openModal('Ficha del alumno','El alumno administra su nombre y datos de contacto.',`<form id="cloud-member" data-id="${s.membershipId}">${field('Objetivo','goal',s.goal,'text','maxlength="120"')}${field('Días por semana','days',s.days,'number','required min="1" max="7"')}${field('Notas','notes',s.notes,'text','maxlength="1000"')}${actions('Guardar ficha')}</form>`);return true;}
  if(a==='toggle-student'){const s=state.students.find(x=>x.id===cid);if(s)run(()=>rpc('ent_set_member_active',{p_membership:s.membershipId,p_active:s.status!=='active'}),'Estado del alumno actualizado.');return true;}
  if(a==='confirm-unassign'){run(async()=>check(await client.from('ent_assignments').delete().eq('coach_id',user.id).eq('student_id',b.dataset.sid).eq('routine_id',cid).select('id').single()),'Asignación quitada.');return true;}
  if(a==='read-coach-notices'){run(async()=>check(await client.from('ent_announcement_recipients').update({read_at:new Date().toISOString()}).eq('coach_id',user.id)),'Notificaciones marcadas como leídas.');return true;}
  if(a==='confirm-broadcast'){const n=window.pendingBroadcast;if(n?.audience==='students'&&myRole==='coach')run(async()=>{check(await client.from('ent_student_notices').insert({coach_id:user.id,title:n.title,body:n.body}));delete window.pendingBroadcast;},'Aviso publicado para tus alumnos.');return true;}
  if(a==='finish-workout'){
   const r=state.routines.find(r=>r.id===cid),d=r&&ensureDraft(cid),m=currentMember();if(!r||!m||!r.exercises.every((_,i)=>d.done.includes(i)))return true;
   d.operationId??=id();d.finishedAt??=new Date().toISOString();save();const payload={duration_seconds:workoutSeconds(d),id:d.operationId,coach_id:m.coach_id,student_id:user.id,membership_id:m.id,routine_id:r.id,routine_name:r.name,note:d.note,exercise_log:r.exercises.map((x,i)=>({...x,name:getExercise(x.exerciseId)?.name||'Ejercicio',load:d.logs[i]?.load??'',actualReps:d.logs[i]?.actualReps??''}))};
   run(async()=>{const result=await client.from('ent_sessions').insert(payload);if(result.error?.code==='23505'){const old=check(await client.from('ent_sessions').select('id').eq('id',payload.id).single());if(!old)throw result.error;}else check(result);delete state.drafts[draftKey(user.id,cid)];save();stopTimer();page='Progreso';detailId=null;},'¡Entrenamiento guardado!');return true;
  }
  return false;
 }
 async function submitLive(f){
  const data=new FormData(f),v=n=>String(data.get(n)||'').trim(),fid=f.dataset.id;
  if(f.id.startsWith('pro-'))return;
  if(['admin-payment-form','admin-message-form','broadcast-form','catalog-exercise-form','catalog-routine-form'].includes(f.id))return false; // These only open a review; confirmation uses the remote operation.
  const known=['admin-price-form','cloud-subscription','cloud-profile','cloud-email','cloud-link','cloud-link-confirm','cloud-member','exercise-form','routine-form','assign-form','measurement-form'];
  if(!known.includes(f.id))return null;
  await run(async()=>{
   if(f.id==='admin-price-form'){needRole('admin');await rpc('ent_admin_set_price',{p_plan:fid,p_price_cents:window.EntrenarAdminPreview.parseAmount(v('amount'),true)});}
   if(f.id==='cloud-subscription'){needRole('admin');await rpc('ent_admin_set_subscription',{p_coach:fid,p_plan:v('plan'),p_status:v('status'),p_ends_on:v('ends_on')||null});}
   if(f.id==='cloud-profile'){await rpc('ent_update_my_profile',{p_name:v('name'),p_whatsapp:normalizeWhatsapp(v('whatsapp'))||v('whatsapp')});if(myRole==='student')await saveSexPreference(data);}
   if(f.id==='cloud-email'){if(v('email').toLowerCase()===user.email.toLowerCase())throw Error('Ingresá una dirección nueva.');check(await client.auth.updateUser({email:normalizeEmail(v('email'))},{emailRedirectTo:window.location.origin+'/'}));toast('Revisá tu correo actual y el nuevo para confirmar el cambio.');}
   if(f.id==='cloud-member'){needRole('coach');check(await client.from('ent_memberships').update({goal:v('goal'),days:Number(v('days')),notes:v('notes')}).eq('id',fid).eq('coach_id',user.id).select('id').single());}
   if(f.id==='exercise-form'){needRole('coach');const video=youtubeShortUrl(v('video'));exerciseNameAvailable(v('name'),v('group'),fid);const targets=readMuscleFields(data);const x={name:v('name'),muscle_group:v('group'),video_url:video,notes:v('notes'),primary_muscles:targets.primaryMuscles,secondary_muscles:targets.secondaryMuscles};check(await (fid?client.from('ent_exercises').update(x).eq('id',fid).eq('coach_id',user.id):client.from('ent_exercises').insert({...x,coach_id:user.id})).select('id').single());}
   if(f.id==='routine-form'){needRole('coach');const values=readRoutineForm(f);await rpc('ent_save_routine_bundle',{p_id:fid||null,p_operation:f.dataset.operation,p_name:values.name,p_description:values.description,p_days:values.days,p_exercises:routineBundleItems(values.exercises),p_students:values.students});if(fid)for(const k of Object.keys(state.drafts))if(k.endsWith(':'+fid))delete state.drafts[k];routineLibraryTab='mine';}
   if(f.id==='assign-form'){needRole('coach');const s=state.students.find(x=>x.id===v('studentId')&&x.status==='active');if(!s)throw Error('Elegí un alumno aprobado.');check(await client.from('ent_assignments').insert({coach_id:user.id,membership_id:s.membershipId,student_id:s.id,routine_id:v('routineId')}));}
   if(f.id==='measurement-form'){needRole('student');const m=readMeasurement(data,fid);const x={recorded_on:m.date,weight_kg:m.weight,height_cm:m.height};check(await (fid?client.from('ent_measurements').update(x).eq('id',fid).eq('student_id',user.id):client.from('ent_measurements').insert({...x,student_id:user.id})).select('id').single());}
   if(f.id==='cloud-link'){needRole('student');const code=v('code').toUpperCase(),found=await api.preview(code);pendingCode=code;setTimeout(()=>openModal('¿Es tu profesor?','Revisá el nombre antes de solicitar la vinculación.',`<h3>${esc(found.coach_name)}</h3><form id="cloud-link-confirm">${actions('Solicitar vinculación')}</form>`),0);}
   if(f.id==='cloud-link-confirm'){needRole('student');await rpc('ent_request_membership',{p_code:pendingCode});pendingCode='';}
  },f.id==='cloud-email'?'Confirmá el cambio desde tus correos.':f.id==='cloud-link'?'':'Cambios guardados.');
  return true;
 }
 const api={
  saveProfessional(name,args){needRole('coach');const allowed=['ent_save_student_fee','ent_generate_fee_month','ent_record_fee_payment','ent_void_fee_payment','ent_save_training_block','ent_stop_training_block','ent_save_coach_branding'];if(!allowed.includes(name))throw Error('Operación no disponible');return run(()=>rpc(name,args));},
  saveCatalog(kind,recordId,payload){needRole('admin');return run(()=>rpc(kind==='exercise'?'ent_admin_save_catalog_exercise':'ent_admin_save_catalog_routine',{p_id:recordId,p_payload:payload}));},
  get canRefresh(){return live&&!checking&&!busy&&!refreshTask&&!recovery;},get live(){return live;},get checking(){return checking;},get accountId(){return live?user?.id:null;},get role(){return myRole;},get displayName(){return personal?.full_name||'Administrador';},
  mapData,refresh,friendly,adminCommitPayment,adminCommitMessage,animateOpening,
  planPriceLabel(pid){if(plans.find(p=>p.id===pid)?.comingSoon)return 'Próximamente';const cents=publicPrices[pid];return Number.isSafeInteger(cents)&&cents>0?new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(cents/100):'Precio por definir';},
  async loadPlanPrices(){const rows=check(await client.from('ent_plans').select('id,price_cents'));for(const p of rows)publicPrices[p.id]=p.price_cents===null?null:Number(p.price_cents);},
  async preview(code){const rows=await rpc('ent_preview_invitation',{p_code:code});if(!rows?.length)throw Error('No encontramos una invitación vigente con ese código. Pedile una nueva a tu profesor.');return rows[0];},
  setInvite(code){pendingCode=code;},
  async register(data,kind,plan,code){
   if(kind==='coach'&&plans.find(p=>p.id===plan)?.comingSoon)throw Error('El plan Equipo estará disponible próximamente.');const {email,password}=credentials(data);if(password.length<10)throw Error('Usá una contraseña de al menos 10 caracteres.');
   authBusy=true;try{const result=check(await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/',data:{full_name:String(data.get('name')||'').trim(),whatsapp:normalizeWhatsapp(data.get('whatsapp'))||'',requested_role:kind,requested_plan:plan,...(kind==='student'?{sex:normalizeSex(data.get('sex'))}:{}),invite_code:kind==='student'?code:undefined}}}));if(result.user?.identities?.length===0)throw Error('Revisá tu correo o ingresá si ya tenés una cuenta.');if(result.session){await rpc('ent_onboard',{p_kind:kind,p_name:String(data.get('name')||'').trim(),p_whatsapp:normalizeWhatsapp(data.get('whatsapp')),p_plan:plan});pendingCode=code||'';await enter(result.session);return true;}return false;}finally{authBusy=false;}
  },
  async login(data){authBusy=true;try{const result=check(await client.auth.signInWithPassword(credentials(data)));await enter(result.session);}finally{authBusy=false;}},
  async recover(email){check(await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/?recuperar=1'}));},
  async start(){if(started)return;started=true;try{const {session}=check(await client.auth.getSession());if(recovery)return;if(session)await enter(session);else {checking=false;const hasInvite=new URL(window.location.href).searchParams.has('profesor');const saved=!hasInvite&&window.EntrenarDemoResume?.();if(saved)animateOpening();if(!saved&&!hasInvite){if($('#access .access-screen-welcome'))window.dispatchEvent(new CustomEvent('entrenar:access-view'));else window.EntrenarAccessNavigation?.restore({screen:'welcome'});}}}catch(e){checking=false;accessPanel('No pudimos conectar',friendly(e),'<button class="access-btn" data-cloud="retry">Reintentar</button>');}},
  enterDemo(){if(user||live||checking)return false;state=localDemo();upgradeState();return true;},logout
 };
 window.EntrenarCloud=api;
 // Window capture runs before the original demo handlers. Unknown mutations fail closed.
 window.addEventListener('click',e=>{
  const c=e.target.closest('[data-cloud]');
  if(c){e.preventDefault();e.stopImmediatePropagation();const a=c.dataset.cloud,cid=c.dataset.id;
   if(a==='onboard-plan'){if(!$('#cloud-onboard')||registrationRole()==='student'||plans.find(p=>p.id===cid)?.comingSoon)return;updateOnboardPlan(cid);const details=$('.onboard-plan-review');details.open=false;details.querySelector('summary').focus();return;}
   if(a==='ask-logout')return openModal('¿Querés salir?','Tus datos guardados quedan en tu cuenta.',`<div class="form-actions">${btn('Cancelar','close-modal','outline')}<button class="btn primary" data-cloud="logout">Salir</button></div>`);
   if(a==='logout')return logout();
   if(a==='retry')return client.auth.getSession().then(({data})=>data.session?enter(data.session):(started=false,api.start()));
   if(a==='refresh')return run(async()=>{},'Datos actualizados.');
   if(a==='profile')return profileForm();
   if(a==='approve'||a==='reject')return run(()=>rpc('ent_review_membership',{p_membership:cid,p_accept:a==='approve'}),a==='approve'?'Alumno aprobado.':'Solicitud rechazada.');
   if(a==='suspend'){const c=state.adminCoaches.find(c=>c.id===cid);return run(()=>rpc('ent_admin_set_subscription',{p_coach:cid,p_plan:c.plan,p_status:'suspended',p_ends_on:c.expiresAt||null}),'Profesor suspendido.');}
   if(a==='link')return linkForm();
   if(a==='copy-code')return copyLiveCode();
  }
  if(checking){if(e.target.closest('[data-access],[data-page],[data-action],[data-admin-action]')){e.preventDefault();e.stopImmediatePropagation();}return;}
  if(!live)return;
  if(e.target.closest('[data-access]')){e.preventDefault();e.stopImmediatePropagation();toast('Para cambiar de cuenta, primero tocá Salir.');return;}
  const b=e.target.closest('[data-action],[data-admin-action]');if(b&&clickLive(b)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 window.addEventListener('change',e=>{if(e.target.closest('#cloud-onboard')&&e.target.name==='kind'&&!registrationRole()){$('#onboard-coach-plans').hidden=e.target.value!=='coach';$('#onboard-student-sex').hidden=e.target.value!=='student';}if((live||checking)&&['role','profile-role','student-select','mobile-role','import-file'].includes(e.target.id)){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('submit',e=>{
  const f=e.target;if(f.id==='cloud-onboard'){
   e.preventDefault();e.stopImmediatePropagation();if(busy)return;busy=true;const d=new FormData(f);
   Promise.resolve().then(()=>{if((registrationRole()||d.get('kind'))==='student')return saveSexPreference(d);}).then(()=>rpc('ent_onboard',{p_kind:registrationRole()||d.get('kind'),p_name:d.get('name'),p_whatsapp:normalizeWhatsapp(d.get('whatsapp')),p_plan:registrationRole()==='student'?'inicial':d.get('plan')})).then(()=>client.auth.getSession()).then(({data})=>enter(data.session)).catch(err=>{$('#access-error').textContent=friendly(err);}).finally(()=>busy=false);return;
  }
  if(f.id==='cloud-password'){
   e.preventDefault();e.stopImmediatePropagation();const d=new FormData(f),p=String(d.get('password'));if(p.length<10||p!==d.get('repeat')){$('#access-error').textContent='Usá al menos 10 caracteres y repetí la misma contraseña.';return;}if(busy)return;busy=true;
   client.auth.updateUser({password:p}).then(check).then(()=>{recovery=false;return client.auth.getSession();}).then(({data})=>enter(data.session)).catch(err=>{$('#access-error').textContent=friendly(err);}).finally(()=>busy=false);return;
  }
  if(!live)return;
  if(f.id.startsWith('pro-'))return;
  if(['admin-payment-form','admin-message-form','broadcast-form','catalog-exercise-form','catalog-routine-form'].includes(f.id))return;
  e.preventDefault();e.stopImmediatePropagation();submitLive(f).then(result=>{if(result===null)toast('Esta operación no está disponible para tu cuenta.');}).catch(err=>toast(friendly(err)));
 },true);
 function showRecovery(){stopSync();syncPending=false;recovery=true;checking=false;live=false;state=blank();stopTimer();if(modal.open)modal.close();main.replaceChildren();accessPanel('Elegí tu nueva contraseña','Después vas a poder volver a tu espacio.',`<form id="cloud-password"><label>Nueva contraseña<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><label>Repetir contraseña<input name="repeat" type="password" autocomplete="new-password" minlength="10" required></label><button type="submit" class="access-btn">Guardar contraseña</button></form><button class="access-text" data-cloud="logout">Salir</button>`);}
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){recovery=true;++generation;setTimeout(showRecovery,0);return;}
  if(event==='SIGNED_OUT'&&user){setTimeout(logout,0);return;}
  if(!started||authBusy||recovery)return;
  if(session&&(event==='SIGNED_IN'||event==='USER_UPDATED')&&session.user.id!==user?.id)setTimeout(()=>enter(session),0);
  if(event==='USER_UPDATED'&&session?.user.id===user?.id){user=session.user;setTimeout(requestSync,0);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSync();return;}if(live){startSync();if(Date.now()-lastRefresh>15000)requestSync();else if(syncPending)scheduleSync();}});
 window.addEventListener('focus',()=>{if(live&&!document.hidden){startSync();if(Date.now()-lastRefresh>15000)requestSync();else if(syncPending)scheduleSync();}});
 window.addEventListener('online',()=>{if(live&&!document.hidden){startSync();requestSync();}});
 document.addEventListener('focusout',()=>{if(syncPending)setTimeout(()=>scheduleSync(),0);});
 modal.addEventListener('close',()=>{if(syncPending)scheduleSync();});
 window.addEventListener('pagehide',stopSync);
 window.addEventListener('pageshow',()=>{if(live){startSync();requestSync();}});
 setInterval(()=>{if(live&&!document.hidden){startSync();checkSync();}},120000);
})();
