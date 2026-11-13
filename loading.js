'use strict';
// Feedback explícito solo mientras una operación asíncrona está pendiente.
(()=>{
 let trigger=null;
 const active=new Map();
 function remember(button){trigger=button;setTimeout(()=>{if(trigger===button)trigger=null;},0);}
 window.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button&&active.has(button)){event.preventDefault();event.stopImmediatePropagation();return;}
  remember(button);
 },true);
 window.addEventListener('submit',event=>{remember(event.submitter||event.target.querySelector('button[type="submit"],button:not([type])'));},true);
 function labelFor(button){
  const text=button?.textContent||'';
  if(/ingresar|iniciar sesión/i.test(text))return 'Ingresando…';
  if(/guardar|registrar|completar cuenta/i.test(text))return 'Guardando…';
  if(/confirmar|aceptar|aprobar|rechazar|suspender|reactivar|quitar|activar|desactivar/i.test(text))return 'Procesando…';
  return 'Cargando…';
 }
 function begin(button=trigger,label){
  if(!button||button.tagName!=='BUTTON'||!button.isConnected)return ()=>{};
  if(active.has(button))return ()=>{};
  const previous={nodes:[...button.childNodes],disabled:button.disabled,busy:button.getAttribute('aria-busy')};
  const spinner=document.createElement('span');spinner.className='button-spinner';spinner.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.textContent=label||labelFor(button);
  button.replaceChildren(spinner,text);button.classList.add('button-loading');button.setAttribute('aria-busy','true');button.disabled=true;
  active.set(button,previous);
  return ()=>{
   if(active.get(button)!==previous)return;
   active.delete(button);button.replaceChildren(...previous.nodes);button.disabled=previous.disabled;button.classList.remove('button-loading');
   if(previous.busy===null)button.removeAttribute('aria-busy');else button.setAttribute('aria-busy',previous.busy);
  };
 }
 window.addEventListener('entrenar:account-changed',()=>{
  trigger=null;
  for(const [button,old] of active){button.replaceChildren(...old.nodes);button.disabled=old.disabled;button.classList.remove('button-loading');if(old.busy===null)button.removeAttribute('aria-busy');else button.setAttribute('aria-busy',old.busy);}
  active.clear();
 });
 window.EntrenarLoading={begin};
})();
