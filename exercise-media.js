/* Videos propios: cámara con corte automático y archivos privados, sin persistencia en demo. */
(()=>{
 'use strict';
 const MAX=3145728,forms=new WeakMap(),locals=new Map();let stream=null,recorder=null,cutoff=null,countdown=null,generation=0,playing=null,capabilities=null;const previews=new Set();
 const cloud=()=>window.EntrenarCloud;
 const real=()=>cloud()?.live;
 const options=form=>{if(!forms.has(form))forms.set(form,{blob:null,url:null,remove:false,validating:false,recording:false,error:'',selection:0});return forms.get(form);};
 const note=(form,text,isError=false)=>{const el=form?.querySelector('[data-clip-status]');if(el){el.textContent=text;el.classList.toggle('clip-error',isError);el.setAttribute('role',isError?'alert':'status');}};
 function stopTracks(){clearTimeout(cutoff);clearInterval(countdown);cutoff=null;countdown=null;for(const track of stream?.getTracks()||[])track.stop();stream=null;}
 function stopCapture(){if(recorder&&recorder.state!=='inactive'){recorder.aborted=true;try{recorder.stop();}catch{}}recorder=null;stopTracks();}
 function stop(){++generation;stopCapture();for(const url of previews)URL.revokeObjectURL(url);previews.clear();if(playing){playing.video.pause();playing.video.removeAttribute('src');playing.video.load();URL.revokeObjectURL(playing.url);playing=null;}}
 function releasePreview(form){const data=options(form);if(data.url){URL.revokeObjectURL(data.url);previews.delete(data.url);data.url=null;}const video=form.querySelector('[data-clip-preview]');if(video){video.pause();video.srcObject=null;video.removeAttribute('src');video.load();}}
 function attach(form){
  if(!form||form.id!=='exercise-form'||role!=='coach'||form.querySelector('[data-clip-editor]'))return;
  const exercise=getExercise(form.dataset.id),has=!!(exercise?.demoPath||locals.has(form.dataset.id));
  const block=document.createElement('section');block.className='clip-editor';block.dataset.clipEditor='';
  block.innerHTML=`<h3>Demostración propia <span>(opcional)</span></h3><p class="note-text">Grabá la técnica una vez y usala en tus rutinas. Hasta 7 segundos, 3 MB y 720p. Se verá sin sonido y en loop.</p><div class="clip-tools"><button type="button" class="btn outline" data-clip-camera>Grabar demostración</button><label class="btn outline clip-file-label">Elegir video<input type="file" data-clip-file accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm" aria-label="Elegir video de demostración"></label></div><div class="clip-preview" hidden><video data-clip-preview playsinline muted loop preload="metadata"></video><div class="clip-tools"><button type="button" class="btn primary" data-clip-record hidden>Comenzar grabación · 7 s</button><button type="button" class="btn outline" data-clip-cancel-camera hidden>Cancelar cámara</button><button type="button" class="btn outline" data-clip-preview-toggle hidden>Reproducir vista previa</button></div></div><p class="note-text" data-clip-status role="status">${has?'Este ejercicio ya tiene una demostración. Podés reemplazarla o quitarla.':real()?'El video se guarda al tocar Guardar ejercicio.':'En la demo, el video queda solo durante esta sesión.'}</p><button type="button" class="btn outline" data-clip-discard hidden>Descartar selección</button><button type="button" class="btn ghost" data-clip-remove ${has?'':'hidden'}>Quitar demostración</button>`;
  const actions=form.querySelector('.form-actions');form.insertBefore(block,actions||null);options(form);
  if(real()&&capabilities===null)cloud().videoCapabilities().then(value=>{capabilities=value;checkCapabilities(form);}).catch(()=>{capabilities={enabled:false};checkCapabilities(form);});
  else checkCapabilities(form);
 }
 function checkCapabilities(form){if(!real()||!form.isConnected)return;if(capabilities?.enabled===false){for(const control of form.querySelectorAll('[data-clip-camera],[data-clip-file],[data-clip-remove]'))control.disabled=true;note(form,'La carga de demostraciones todavía no está habilitada en tu cuenta.');}}
 async function probe(blob,recordedSeconds=null){
  if(!blob||!blob.size||blob.size>MAX)throw Error('El video debe pesar hasta 3 MB. Probá grabarlo desde Entrenar.');
  if(!['video/mp4','video/webm','video/quicktime'].includes(blob.type.split(';')[0]))throw Error('Elegí un video MP4, MOV o WebM.');
  const video=document.createElement('video'),url=URL.createObjectURL(blob);video.preload='metadata';video.muted=true;video.playsInline=true;
  try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No pudimos leer ese video. Probá grabarlo desde Entrenar.')),10000);video.onloadedmetadata=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(Error('Este navegador no pudo abrir el video. Probá grabarlo desde Entrenar.'));};video.src=url;});
   const duration=Number.isFinite(video.duration)?video.duration:recordedSeconds;
   if(!Number.isFinite(duration)||duration<=0||duration>7.25)throw Error('Elegí un video de hasta 7 segundos o grabalo desde Entrenar.');
   if(!video.videoWidth||!video.videoHeight||Math.min(video.videoWidth,video.videoHeight)>720||Math.max(video.videoWidth,video.videoHeight)>1280)throw Error('Elegí un video de hasta 720p. Para ajustarlo, grabalo desde Entrenar.');
   return {duration,width:video.videoWidth,height:video.videoHeight};
  }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
 }
 async function choose(form,blob,recordedSeconds=null){
  const data=options(form),g=generation,selection=++data.selection;data.validating=true;data.error='';note(form,'Revisando el video…');
  try{const info=await probe(blob,recordedSeconds);if(g!==generation||selection!==data.selection||!form.isConnected)return;
   releasePreview(form);data.blob=blob;data.remove=false;data.url=URL.createObjectURL(blob);previews.add(data.url);
   const video=form.querySelector('[data-clip-preview]');video.srcObject=null;video.src=data.url;video.muted=true;video.loop=true;
   form.querySelector('.clip-preview').hidden=false;form.querySelector('[data-clip-remove]').hidden=false;form.querySelector('[data-clip-preview-toggle]').hidden=false;
   form.querySelector('[data-clip-record]').hidden=true;form.querySelector('[data-clip-cancel-camera]').hidden=true;
   form.querySelector('[data-clip-discard]').hidden=false;note(form,'Video listo: '+info.duration.toLocaleString('es-AR',{maximumFractionDigits:1})+' s · '+(blob.size/1048576).toLocaleString('es-AR',{maximumFractionDigits:2})+' MB. Tocá Guardar ejercicio para confirmarlo.');
  }catch(error){if(g===generation&&selection===data.selection&&form.isConnected){data.error=error.message;form.querySelector('[data-clip-discard]').hidden=false;note(form,error.message+' No se guardó este video.',true);}}
  finally{if(selection===data.selection)data.validating=false;}
 }
 async function camera(form){
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){form.querySelector('[data-clip-file]').setAttribute('capture','environment');form.querySelector('[data-clip-file]').click();return;}
  stopCapture();const data=options(form),g=generation,selection=++data.selection;data.error='';data.validating=false;note(form,'Abriendo cámara…');
  try{
   const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:24,max:30}}});
   if(g!==generation||selection!==data.selection||!form.isConnected||!modal.open){for(const track of acquired.getTracks())track.stop();return;}
   stream=acquired;releasePreview(form);data.blob=null;data.remove=false;const video=form.querySelector('[data-clip-preview]');video.srcObject=stream;video.muted=true;await video.play();
   form.querySelector('.clip-preview').hidden=false;form.querySelector('[data-clip-record]').hidden=false;form.querySelector('[data-clip-cancel-camera]').hidden=false;form.querySelector('[data-clip-preview-toggle]').hidden=true;
   note(form,'Prepará la posición. La grabación empieza cuando tocás Comenzar.');data.recording=false;
  }catch(error){stopCapture();note(form,error.name==='NotAllowedError'?'No se habilitó la cámara. Podés permitirla en los ajustes o elegir un video.':'No pudimos abrir la cámara. Podés elegir un video de tu galería.');}
 }
 function record(form){
  if(!stream||recorder&&recorder.state!=='inactive')return;
  const data=options(form),chunks=[],started=performance.now(),g=generation;
  const mime=['video/mp4;codecs=avc1.42E01F','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp8','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mime){note(form,'Este navegador no permite grabar. Elegí un video de tu galería.');stopCapture();return;}
  try{
   const current=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1500000});recorder=current;data.recording=true;
   current.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);if(chunks.reduce((n,b)=>n+b.size,0)>MAX){current.aborted=true;current.stop();note(form,'El video superó los 3 MB. Probá grabar de nuevo.');}};
   current.onstop=()=>{const seconds=(performance.now()-started)/1000;data.recording=false;stopTracks();if(recorder===current)recorder=null;form.querySelector('[data-clip-record]').hidden=true;form.querySelector('[data-clip-cancel-camera]').hidden=true;if(current.aborted||g!==generation||!form.isConnected)return;choose(form,new Blob(chunks,{type:current.mimeType.split(';')[0]}),seconds);};
   current.onerror=()=>{current.aborted=true;stopCapture();data.recording=false;note(form,'No pudimos completar la grabación. Probá nuevamente.');};
   current.start(200);form.querySelector('[data-clip-record]').hidden=true;note(form,'Grabando… 7 s');
   countdown=setInterval(()=>note(form,'Grabando… '+Math.max(0,Math.ceil((6800-(performance.now()-started))/1000))+' s'),200);
   cutoff=setTimeout(()=>{if(current.state!=='inactive')current.stop();},6800);
  }catch{data.recording=false;stopCapture();note(form,'No pudimos iniciar la grabación. Elegí un video o volvé a intentar.');}
 }
 function remove(form){stopCapture();releasePreview(form);const data=options(form);data.blob=null;data.remove=true;data.error='';data.selection++;data.validating=false;data.recording=false;form.querySelector('[data-clip-discard]').hidden=true;form.querySelector('.clip-preview').hidden=true;form.querySelector('[data-clip-remove]').hidden=true;form.querySelector('[data-clip-file]').value='';note(form,'Se quitará la demostración al guardar. El enlace de YouTube se conserva.');}
 function discard(form){stopCapture();releasePreview(form);const data=options(form);data.selection++;data.blob=null;data.error='';data.remove=false;data.validating=false;data.recording=false;form.querySelector('.clip-preview').hidden=true;form.querySelector('[data-clip-file]').value='';form.querySelector('[data-clip-discard]').hidden=true;const has=!!(getExercise(form.dataset.id)?.demoPath||locals.has(form.dataset.id));form.querySelector('[data-clip-remove]').hidden=!has;note(form,has?'Se conserva la demostración que ya estaba guardada.':'Selección descartada. Podés guardar el ejercicio sin video o elegir otro.');}
 function validateForm(form){const data=options(form);if(data.error)throw Error(data.error+' Elegí otro video o tocá Descartar selección.');if(data.recording||data.validating||stream)throw Error('Terminá o cancelá la grabación y esperá la vista previa antes de guardar.');}
 async function afterSave(exercise,form){validateForm(form);const data=options(form);if(data.blob){note(form,'Guardando demostración…');try{await cloud().uploadExerciseVideo(exercise,data.blob);data.blob=null;}catch(error){note(form,error.message||'No pudimos guardar el video. Volvé a intentar.',true);throw error;}}else if(data.remove){await cloud().removeExerciseVideo(exercise);data.remove=false;}}
 function afterDemoSave(exercise,form){validateForm(form);const data=options(form);if(data.blob)locals.set(exercise,data.blob);else if(data.remove)locals.delete(exercise);}
 async function play(exercise){
  if(!['coach','student'].includes(role))return;
  openModal(esc(exercise.name),'Mirá la técnica y seguí con tu entrenamiento.',`<div class="exercise-media-layout"><div class="exercise-video-stage clip-player"><p class="note-text" data-clip-loading role="status">Cargando demostración…</p></div>${musclePanel(exercise)}</div><div class="video-modal-actions">${btn('Volver al ejercicio','close-modal','primary')}</div>`);modal.classList.add('exercise-video-modal');const g=generation;
  try{
   const blob=real()?await cloud().downloadExerciseVideo(exercise.demoPath):locals.get(exercise.id);if(g!==generation||!modal.open)return;if(!blob)throw Error('La demostración de la demo ya no está disponible.');
   const url=URL.createObjectURL(blob),stage=modal.querySelector('.clip-player');if(!stage){URL.revokeObjectURL(url);return;}
   stage.innerHTML='<video playsinline autoplay muted loop preload="metadata" aria-label="Demostración del ejercicio"></video><button type="button" class="btn outline" data-clip-toggle>Pausar video</button><span class="note-text">Demostración en loop · Sin sonido</span>';
   const video=stage.querySelector('video');video.src=url;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;playing={video,url,paused:false};
   video.onerror=()=>{if(playing?.video===video)stage.querySelector('span').textContent='No pudimos reproducir el video en este dispositivo.';};
   try{await video.play();}catch{stage.querySelector('[data-clip-toggle]').textContent='Reproducir video';playing.paused=true;}
  }catch(error){if(g===generation){const label=modal.querySelector('[data-clip-loading]');if(label)label.textContent=error.message||'No pudimos cargar la demostración. Volvé a intentar.';}}
 }
 const baseForm=exerciseForm;exerciseForm=function(...args){const result=baseForm(...args);attach(document.querySelector('#exercise-form'));return result;};
 // El catálogo de la plataforma conserva enlaces; grabación solo en la biblioteca propia.
 const catalogForm=platformExerciseForm;
 if(typeof catalogForm==='function')platformExerciseForm=function(...args){const result=catalogForm(...args);document.querySelector('#catalog-exercise-form [data-clip-editor]')?.remove();return result;};
 document.addEventListener('change',event=>{if(event.target.matches('[data-clip-file]')){stopCapture();const form=event.target.closest('form'),file=event.target.files[0];if(file)choose(form,file);}});
 document.addEventListener('click',event=>{
  const form=event.target.closest('#exercise-form');
  if(form){if(event.target.closest('[data-clip-discard]'))discard(form);if(event.target.closest('[data-clip-camera]'))camera(form);if(event.target.closest('[data-clip-record]'))record(form);if(event.target.closest('[data-clip-cancel-camera]')){stopCapture();options(form).recording=false;form.querySelector('.clip-preview').hidden=true;note(form,'Cámara cerrada. Podés grabar de nuevo.');}if(event.target.closest('[data-clip-remove]'))remove(form);if(event.target.closest('[data-clip-preview-toggle]')){const video=form.querySelector('[data-clip-preview]');if(video.paused){video.play().catch(()=>{});event.target.textContent='Pausar vista previa';}else{video.pause();event.target.textContent='Reproducir vista previa';}}}
  if(event.target.closest('[data-clip-toggle]')&&playing){if(playing.video.paused){playing.video.play().catch(()=>{});playing.paused=false;event.target.textContent='Pausar video';}else{playing.video.pause();playing.paused=true;event.target.textContent='Reproducir video';}}
 });
 modal.addEventListener('close',()=>{if(!modal.open){const form=modal.querySelector('#exercise-form');if(form)releasePreview(form);stop();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(stream){stopCapture();const form=document.querySelector('#exercise-form');if(form){options(form).recording=false;note(form,'La cámara se cerró al salir de la app. Volvé a grabar cuando estés listo.');}}playing?.video.pause();}else if(playing&&!playing.paused)playing.video.play().catch(()=>{});});
 window.addEventListener('entrenar:account-changed',()=>{stop();locals.clear();capabilities=null;});
 window.EntrenarExerciseMedia={stop,play,afterSave,afterDemoSave,validateForm,hasLocal:exercise=>locals.has(exercise)};
})();
