'use strict';
// Cobros de Entrenar a profesores. Sin SDK de tarjetas ni secretos en el navegador.
(()=>{
 let pending=false,shown=5,returnHandled=false;
 const returned=new URL(location.href).searchParams.get('mp_return');
 const money=n=>n===null||n===undefined?'Pendiente de liquidación':new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(Number(n)/100);
 const uuid=v=>typeof v==='string'&&/^[0-9a-f-]{36}$/i.test(v);
 const button=(text,action,id='',cls='outline')=>`<button type="button" class="btn ${cls}" data-payment="${action}" data-id="${esc(id)}">${text}</button>`;
 function label(o){if(o.needs_review)return 'Revisar pago';if(o.paid_on)return o.environment==='test'?'Prueba aprobada':'Pagado';return ({creating:'Preparando',created:'Esperando pago',processed:'En verificación',failed:'No aprobado',cancelled:'Cancelado',expired:'Vencido',refunded:'Reembolsado',charged_back:'Contracargo'})[o.status]||'Pendiente';}
 function cards(rows){return rows.length?`<div class="mp-orders">${rows.slice(0,shown).map(o=>`<article class="mp-order"><div class="row"><strong>${esc(o.plan_name)} · ${money(o.amount_cents)}</strong><span class="badge ${o.needs_review?'neutral':''}">${label(o)}</span></div><p class="note-text">${esc(state.adminCoaches?.find(c=>c.id===o.coach_id)?.name||'Mi plan')} · ${esc(o.created_at?.slice(0,10)||'')}</p><dl class="mp-finance"><div><dt>Comisión MP</dt><dd>${money(o.fee_cents)}</dd></div><div><dt>Neto recibido</dt><dd>${money(o.net_cents)}</dd></div></dl>${o.needs_review?'<p class="mp-warning">Revisá este cobro en Mercado Pago antes de modificar el plan. El historial se conserva.</p>':''}${button('Consultar estado','status',o.id)}<small class="mp-reference">${esc(o.provider_id||o.id)}</small></article>`).join('')}</div>${rows.length>shown?button('Ver más','more'):''}`:'<p class="note-text">Todavía no hay pagos de Mercado Pago.</p>';}
 function attach(){
  const cloud=window.EntrenarCloud;if(!cloud?.live||!['coach','admin'].includes(role)||!state.payments?.ready)return;
  document.getElementById('mp-panel')?.remove();
  if(role==='admin'&&page==='Facturación'){
   const orders=state.payments.orders,live=orders.filter(o=>o.environment==='live'),test=orders.filter(o=>o.environment==='test');
   main.insertAdjacentHTML('beforeend',`<section class="panel mp-panel" id="mp-panel"><div class="panel-heading"><h2>Mercado Pago</h2>${button('Probar un pago','test')}</div><div class="panel-content"><p>Cobros de los planes de Entrenar. Las pruebas no se suman a tu facturación.</p>${cards(live)}<details class="mp-tests"><summary>Pagos de prueba (${test.length})</summary>${cards(test)}</details><p class="note-text">El neto informado por Mercado Pago puede incluir otros descuentos. Si la liquidación aún no está disponible, no mostramos un importe estimado.</p></div></section>`);
  }
  if(role==='coach'&&['Perfil','Mi plan'].includes(page)){
   const sub=cloud.subscription,trial=sub?.status==='trial';
   const canPay=state.payments.available&&sub&&!['pending','suspended'].includes(sub.status);
   main.insertAdjacentHTML('beforeend',`<section class="panel mp-panel" id="mp-panel"><div class="panel-heading"><h2>Mi abono</h2><span class="badge">${trial?'Mes de prueba':'Pago mensual'}</span></div><div class="panel-content"><p>${trial?'Tu prueba gratuita vence el '+esc(sub.ends_on)+'.':sub?.ends_on?'Tu plan vence el '+esc(sub.ends_on)+'.':'Estamos revisando tu cuenta.'}</p><p class="note-text">Pagás un mes por vez. Sin débito automático.</p>${canPay?button('Pagar mi plan','pay',cloud.accountId,'primary'):'<p class="note-text">El pago online todavía no está habilitado para tu cuenta.</p>'}${cards(state.payments.orders.filter(o=>o.environment==='live'))}</div></section>`);
  }
  if(!returnHandled&&uuid(returned)){returnHandled=true;setTimeout(()=>check(returned),0);}
 }
 const prior=render;render=function(...args){const value=prior(...args);attach();return value;};
 function testForm(){if(role!=='admin'||!window.EntrenarCloud?.live)return;openModal('Probar Mercado Pago','Abrí el pago en una ventana de incógnito, sin iniciar sesión en Mercado Pago. No modifica planes ni registra ingresos reales.',`<form id="mp-test-form"><label class="field">Profesor<select name="coach" required>${state.adminCoaches.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><label class="field">Correo para la prueba<input name="email" type="email" autocomplete="off" required maxlength="160" placeholder="Un correo electrónico válido"></label><p class="note-text">El precio se toma del plan del profesor. Si todavía no lo definiste, cargalo en Planes y precios.</p><p id="mp-error" role="alert" class="access-error"></p><div class="btns">${button('Cancelar','close')}<button class="btn primary" type="submit">Preparar pago de prueba</button></div></form>`);}
 async function create(coach,email=''){
  if(pending)return;pending=true;document.body.classList.add('mp-busy');
  try{const operation=crypto.randomUUID();const result=await window.EntrenarCloud.mercadoPago({action:'create',coach,test_email:email,operation});
   const u=new URL(result.checkout_url);if(u.origin!=='https://www.mercadopago.com.ar'||!u.pathname.startsWith('/checkout/'))throw Error('El enlace de pago no es válido');
   await window.EntrenarCloud.refresh();
   openModal(result.environment==='test'?'Pago de prueba':'Pagar mi plan','El plan se renueva cuando Mercado Pago confirme el pago.',`<p>${result.environment==='test'?'Estás en modo de prueba. Este pago no modifica vencimientos ni suma facturación.':'Vas a pagar un mes de tu plan de Entrenar. Sin débito automático.'}</p><div class="btns"><a class="btn primary" href="${esc(u.href)}" rel="noreferrer">Abrir Mercado Pago</a>${button('Volver','close')}</div>`);
  }catch(e){const error=document.getElementById('mp-error');if(error)error.textContent=e.message;else toast(e.message);}finally{pending=false;document.body.classList.remove('mp-busy');}
 }
 async function check(id){
  if(pending||!uuid(id))return;pending=true;const owner=window.EntrenarCloud?.accountId;
  try{const result=await window.EntrenarCloud.mercadoPago({action:'status',id});await window.EntrenarCloud.refresh();if(owner!==window.EntrenarCloud?.accountId)return;
   openModal(result.paid_on?'¡Pago confirmado!':'Estado del pago',result.environment==='test'?'Prueba de Mercado Pago':'Tu abono de Entrenar',`<p>${result.needs_review?'El pago necesita revisión. Conservamos su registro.':result.paid_on?result.environment==='test'?'La prueba fue aprobada. No se modificó ningún plan ni la facturación real.':'Tu pago está confirmado. '+(result.period_end?'Tu plan está vigente hasta el '+esc(result.period_end)+'.':'Estamos revisando la renovación.'):'Todavía no hay un pago aprobado. Podés consultar de nuevo en unos momentos.'}</p><div class="btns">${button('Entendido','close')}${!result.paid_on?button('Consultar de nuevo','status',id):''}</div>`);
   if(returned===id){const url=new URL(location.href);for(const k of ['mp_return','order_id','payment_id','status','collection_id','collection_status','external_reference','payment_type','merchant_order_id','preference_id','site_id','processing_mode','merchant_account_id'])url.searchParams.delete(k);history.replaceState(history.state,'',url);}
  }catch(e){toast(e.message);}finally{pending=false;}
 }
 window.addEventListener('click',e=>{const b=e.target.closest('[data-payment]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(!window.EntrenarCloud?.live)return;switch(b.dataset.payment){case 'test':testForm();break;case 'pay':create(b.dataset.id);break;case 'status':check(b.dataset.id);break;case 'close':modal.close();break;case 'more':shown+=5;attach();break;}},true);
 window.addEventListener('submit',e=>{if(e.target.id!=='mp-test-form')return;e.preventDefault();e.stopImmediatePropagation();if(role!=='admin'||!e.target.reportValidity())return;const d=new FormData(e.target);create(d.get('coach'),d.get('email'));},true);
 window.addEventListener('entrenar:account-changed',()=>{shown=5;pending=false;attach();});
 attach();
})();
