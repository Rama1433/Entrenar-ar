const CACHE='entrenar-v1.14.0';
const ASSETS=['/','/index.html','/styles.css','/app.js','/money-inputs.js','/supabase.vendor.js','/cloud.js','/payments.js','/rest-alerts.js','/exercise-media.js','/exercise-wizard.js','/professional.js','/pull-refresh.js','/navigation.js','/admin.js','/qr.js','/access.js','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png','/icons/maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('entrenar-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;const path=url.pathname;if(!ASSETS.includes(path))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(()=>caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||(event.request.mode==='navigate'?caches.match('/index.html'):Response.error()))));});

// Los avisos siempre son visibles (requisito de Web Push en iOS). Sin audio oculto.
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let data;try{data=event.data?.json();}catch{return;}
  if(data?.type!=='rest-finished'||!(/^[0-9a-f-]{36}$/i.test(data.id||'')))return;
  await self.registration.showNotification('¡Descanso terminado!',{body:'Seguí a tu ritmo. Volvé a Entrenar para continuar.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:'entrenar-rest-'+data.id,data:{type:'rest-finished'},renotify:false,silent:false});
 })());
});
self.addEventListener('notificationclick',event=>{
 if(event.notification.data?.type!=='rest-finished')return;
 event.notification.close();event.waitUntil((async()=>{
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=clients.find(client=>new URL(client.url).origin===self.location.origin);
  if(existing){await existing.focus();return;}
  await self.clients.openWindow('/#/alumno/mi-rutina');
 })());
});
