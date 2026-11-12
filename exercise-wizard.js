/* Profesor: un mismo formulario y un solo guardado, organizado en tres pasos. */
(()=>{
 'use strict';
 const info=new WeakMap();
 const titles=['Datos del ejercicio','Músculos trabajados','Video e indicaciones'];
 const controls=form=>info.get(form);
 const busy=()=>document.body.classList.contains('cloud-busy');
 function error(form,message){const slot=form.querySelector('#form-error');if(slot){slot.textContent=message;if(message)slot.scrollIntoView?.({block:'nearest'});}}
 function basic(form){const input=form.elements.namedItem('name'),name=input.value.trim();if(!name||name.length>100){show(form,0);error(form,'Escribí un nombre de hasta 100 caracteres.');input.focus();return false;}if(!form.elements.namedItem('group').value){show(form,0);error(form,'Elegí un grupo muscular.');return false;}return true;}
 function updateBody(form){
  const targets=readMuscleFields(new FormData(form));
  for(const path of form.querySelectorAll('[data-wizard-body] [data-muscle]')){
   const id=path.dataset.muscle,type=targets.primaryMuscles.includes(id)?'principal':targets.secondaryMuscles.includes(id)?'secundario':'';
   path.classList.remove('muscle-primary','muscle-secondary','muscle-neutral');path.classList.add(type==='principal'?'muscle-primary':type==='secundario'?'muscle-secondary':'muscle-neutral');
   path.setAttribute('aria-pressed',String(!!type));path.setAttribute('aria-label',muscleLabels[id]+(type?', '+type:', sin seleccionar'));
  }
  const label=form.querySelector('[data-wizard-muscle-count]');if(label)label.textContent=targets.primaryMuscles.length+' principales · '+targets.secondaryMuscles.length+' secundarios';
 }
 function show(form,index){
  const state=controls(form);if(!state)return;
  if(state.step===2&&index!==2)window.EntrenarExerciseMedia?.pauseEditor(form);
  state.step=index;form.dataset.wizardStep=String(index);error(form,'');
  state.steps.forEach((section,i)=>section.hidden=i!==index);
  form.querySelectorAll('[data-wizard-step]').forEach((button,i)=>{button.classList.toggle('current',i===index);button.setAttribute('aria-current',i===index?'step':'false');});
  state.back.hidden=index===0;state.next.hidden=index===2;state.submit.hidden=index!==2;
  form.querySelector('[data-wizard-label]').textContent='Paso '+(index+1)+' de 3 · '+titles[index];
  if(index===1)updateBody(form);
  const heading=state.steps[index].querySelector('h3');heading?.focus({preventScroll:true});
  const dialog=document.querySelector('#modal');if(dialog)dialog.scrollTop=0;
 }
 function advance(form){if(busy())return;const state=controls(form);if(!state)return;if(!basic(form))return;if(state.step<2)show(form,state.step+1);}
 function selectMuscle(form,muscle){
  if(!Object.hasOwn(muscleLabels,muscle))return;
  const state=controls(form),input=form.querySelector(`[name="${state.mode}"][value="${muscle}"]`);if(!input)return;
  input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function build(form){
  if(role!=='coach'||!form||form.id!=='exercise-form'||controls(form))return;
  form.noValidate=true;
  const steps=titles.map((title,index)=>{const section=document.createElement('section');section.className='exercise-wizard-step';section.dataset.wizardPanel=String(index);section.innerHTML=`<h3 tabindex="-1">${title}</h3>`;return section;});
  const name=form.elements.namedItem('name').closest('.field'),group=form.elements.namedItem('group').closest('.field'),catalog=form.querySelector('#muscle-catalog')?.closest('.field');
  steps[0].append(name,group);if(catalog)steps[0].append(catalog);
  const intro=document.createElement('p');intro.className='note-text';intro.textContent='Elegí un nombre y un grupo, o empezá con un ejercicio del catálogo.';steps[0].querySelector('h3').after(intro);
  const explanation=document.createElement('p');explanation.className='note-text';explanation.textContent='Tocá la figura o usá la lista. Elegí músculos principales y, si querés, secundarios. Podés completar este paso después.';
  steps[1].append(explanation);
  const picker=document.createElement('div');picker.className='wizard-muscle-picker';picker.innerHTML=`<div class="wizard-muscle-mode" role="group" aria-label="Tipo de músculo"><button type="button" data-wizard-mode="primaryMuscles" class="selected" aria-pressed="true">Principales</button><button type="button" data-wizard-mode="secondaryMuscles" aria-pressed="false">Secundarios</button></div><div data-wizard-body>${neutralMuscleBodySVG(readMuscleFields(new FormData(form)))}</div><p class="note-text" data-wizard-muscle-count aria-live="polite"></p>`;
  const svg=picker.querySelector('svg');svg.setAttribute('role','group');svg.setAttribute('aria-label','Elegí músculos en las vistas de frente y espalda');
  for(const path of picker.querySelectorAll('[data-muscle]')){path.setAttribute('role','button');path.setAttribute('tabindex','0');}
  steps[1].append(picker);
  const list=document.createElement('div');list.className='wizard-muscle-list';for(const fieldset of [...form.querySelectorAll('.muscle-fieldset,.muscle-secondary-picker')])if(!fieldset.closest('.muscle-secondary-picker')||fieldset.matches('.muscle-secondary-picker'))list.append(fieldset);
  steps[1].append(list);
  const video=form.elements.namedItem('video').closest('.field'),help=form.querySelector('#shorts-help'),notes=form.elements.namedItem('notes').closest('.field'),own=form.querySelector('[data-clip-editor]');
  const videoIntro=document.createElement('p');videoIntro.className='note-text';videoIntro.textContent='Agregá un YouTube Short o una demostración propia. El video y las indicaciones son opcionales.';steps[2].append(videoIntro,video);if(help)steps[2].append(help);if(own)steps[2].append(own);steps[2].append(notes);
  const top=document.createElement('div');top.className='exercise-wizard-progress';top.innerHTML=`<p class="eyebrow" data-wizard-label role="status"></p><nav aria-label="Pasos del ejercicio">${['Datos','Músculos','Video'].map((label,i)=>`<button type="button" data-wizard-step="${i}"><span>${i+1}</span>${label}</button>`).join('')}</nav>`;
  form.prepend(top);top.after(...steps);
  const actions=form.querySelector('.form-actions'),submit=actions.querySelector('[type=submit]');
  const back=document.createElement('button');back.type='button';back.className='btn outline';back.dataset.wizardBack='';back.textContent='Atrás';
  const next=document.createElement('button');next.type='button';next.className='btn primary';next.dataset.wizardNext='';next.textContent='Continuar';actions.insertBefore(back,submit);actions.append(next);actions.classList.add('exercise-wizard-actions');
  info.set(form,{step:0,steps,back,next,submit,mode:'primaryMuscles'});
  document.querySelector('#modal').classList.add('exercise-wizard-modal');show(form,0);updateBody(form);
 }
 function beforeSubmit(form){
  const state=controls(form);if(!state)return true;
  if(state.step!==2){advance(form);return false;}
  if(!basic(form))return false;
  try{readMuscleFields(new FormData(form));youtubeShortUrl(form.elements.namedItem('video').value);window.EntrenarExerciseMedia?.validateForm(form);}
  catch(problem){show(form,2);error(form,problem.message);return false;}
  return true;
 }
 const base=exerciseForm;exerciseForm=function(...args){const result=base(...args);build(document.querySelector('#exercise-form'));return result;};
 document.addEventListener('click',event=>{
  const form=event.target.closest('#exercise-form');if(!controls(form)||busy())return;
  if(event.target.closest('[data-wizard-next]'))return advance(form);
  if(event.target.closest('[data-wizard-back]'))return show(form,Math.max(0,controls(form).step-1));
  const step=event.target.closest('button[data-wizard-step]');if(step){const index=Number(step.dataset.wizardStep);if(index>controls(form).step&&!basic(form))return;show(form,index);return;}
  const mode=event.target.closest('[data-wizard-mode]');if(mode){controls(form).mode=mode.dataset.wizardMode;form.querySelectorAll('[data-wizard-mode]').forEach(button=>{const selected=button===mode;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});return;}
  const muscle=event.target.closest('[data-wizard-body] [data-muscle]');if(muscle)selectMuscle(form,muscle.dataset.muscle);
 });
 document.addEventListener('keydown',event=>{const path=event.target.closest('[data-wizard-body] [data-muscle]');if(path&&['Enter',' '].includes(event.key)){event.preventDefault();selectMuscle(path.closest('form'),path.dataset.muscle);}});
 document.addEventListener('change',event=>{const form=event.target.closest('#exercise-form');if(controls(form)&&(['primaryMuscles','secondaryMuscles','name'].includes(event.target.name)||event.target.id==='muscle-catalog'))updateBody(form);});
 window.EntrenarExerciseWizard={beforeSubmit};
})();
