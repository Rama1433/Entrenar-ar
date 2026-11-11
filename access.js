'use strict';
// Public access screens. Real authentication is provided by cloud.js; demo entry stays local.
(() => {
  const root = document.querySelector('#access');
  let inviteCode = '', professorName = '', submitting = false;
  let screen = 'welcome', accountRole = 'student', chosenPlan = 'inicial';
  let previewName = '', invitationConfirmed = false, welcomeSeen = false;
  const action = (label, target, cls = '') => `<button type="button" class="access-btn ${cls}" data-access="${target}">${label}</button>`;
  const back = target => `<button type="button" class="access-back" data-access-back="true" data-access="${target}">${icon('back')} Volver</button>`;
  const demoNote = '<p class="access-note">Las demos usan ejemplos y no modifican las cuentas reales.</p>';
  function display(next) {
    screen = next;
    const animateWelcome = screen === 'welcome' && !welcomeSeen;
    if (screen === 'welcome') welcomeSeen = true;
    document.body.classList.add('access-open');
    root.hidden = false;
    let content = '';
    if (screen === 'welcome') content = `<div class="access-welcome-hero"><span class="access-eyebrow">TU PRÓXIMO PASO</span><h1>Todo empieza<br>con vos.</h1><p class="access-lead">Tu entrenamiento. Tu equipo.<br>Un espacio para avanzar juntos.</p><span class="access-welcome-mark" aria-hidden="true">${icon('activity')}</span></div><div class="access-choices"><button class="access-choice" data-access="student"><span class="access-choice-icon">${icon('activity')}</span><span><strong>Registrarme como alumno</strong><small>Entrená con tu profesor y seguí tu progreso.</small></span>${icon('arrow')}</button><button class="access-choice" data-access="professor"><span class="access-choice-icon">${icon('users')}</span><span><strong>Registrarme como profesor</strong><small>Acompañá a tus alumnos desde un solo lugar.</small></span>${icon('arrow')}</button></div><div class="access-welcome-actions"><button class="access-btn access-login-primary" data-access="login">Ingresar a mi cuenta ${icon('arrow')}</button><div class="access-demo-links"><span>¿Querés conocer Entrenar?</span><button data-access="demo-student">Demo alumno</button><button data-access="demo-coach">Demo profesor</button></div></div>`;
    if (screen === 'link') content = `${back('welcome')}<span class="access-eyebrow">SOY ALUMNO · 1 DE 2</span><h1>Encontrá a<br>tu profesor.</h1><p class="access-lead">Ingresá el código que te compartió. Si abrís su enlace QR desde la cámara del celular, este paso ya viene completo.</p><form id="access-link"><label for="invite-code">Código del profesor</label><input id="invite-code" name="code" autocapitalize="characters" autocomplete="off" maxlength="40" required placeholder="Código que te dio tu profesor"><p class="access-error" role="alert" id="access-error"></p><button class="access-btn" type="submit">Buscar profesor ${icon('arrow')}</button></form>`;
    if (screen === 'confirm') content = `${back('link')}<span class="access-eyebrow">TU PROFESOR</span><h1>¿Es tu profe?</h1><p class="access-lead">Revisá los datos antes de continuar.</p><div class="access-person"><span class="access-avatar">${esc(initials(professorName))}</span><div><strong>${esc(professorName)}</strong><small>Profesor · Equipo de Entrenar</small></div></div><p class="access-hint">El código vincula tu solicitud con el profesor. Tu cuenta será personal y él deberá aprobar la vinculación.</p>${action('Sí, continuar', 'student-register')}<button class="access-text" data-access="login">Ya tengo cuenta · Ingresar</button>`;
    if (screen === 'plans') content = `${back('welcome')}<span class="access-eyebrow">SOY PROFESOR · 1 DE 2</span><h1>Un plan para cada etapa.</h1><p class="access-lead">Elegí cómo querés acompañar a tu equipo. Todo lo esencial para empezar, con espacio para crecer.</p><div class="access-plan-grid" aria-label="Planes disponibles">${plans.map(p => `<article class="access-plan-card ${chosenPlan === p.id ? 'selected' : ''}" data-plan-card="${p.id}" aria-labelledby="plan-title-${p.id}"><span class="access-plan-tag">${p.id === 'inicial' ? 'PARA EMPEZAR' : p.id === 'profesional' ? 'PARA CRECER' : 'PARA TU EQUIPO'}</span><h2 id="plan-title-${p.id}">${esc(p.name)}</h2><p class="access-plan-capacity">${esc(planCapacity(p))}</p><p class="access-plan-description">${p.id === 'inicial' ? 'Tu primer grupo, bien acompañado.' : p.id === 'profesional' ? 'Entrenamiento y gestión de alumnos en un mismo lugar.' : 'Gestión compartida para equipos de entrenadores. Próximamente.'}</p><ul class="access-plan-features">${planFeatures(p.id).map(feature => `<li>${icon('check')}<span>${feature}</span></li>`).join('')}</ul><div class="access-plan-bottom"><p class="access-price">${p.comingSoon?'Próximamente':window.EntrenarCloud.planPriceLabel(p.id)}</p><p class="access-billing">Abono mensual</p><button type="button" class="access-plan-select" aria-pressed="${chosenPlan === p.id}" aria-label="Elegir plan ${esc(p.name)}" data-plan-choice="${p.id}" ${p.comingSoon?'disabled':''}>${p.comingSoon?'Próximamente':chosenPlan === p.id ? 'Plan seleccionado' : 'Elegir este plan'}${icon(chosenPlan === p.id ? 'check' : 'arrow')}</button></div></article>`).join('')}</div><div class="access-plan-next"><div><p id="access-plan-selection" role="status">Elegiste el plan <strong>${esc(plans.find(p => p.id === chosenPlan).name)}</strong>.</p><p class="access-hint">Precios y condiciones por definir. Esta selección no contrata un plan.</p></div>${action('Continuar con este plan', 'coach-register')}</div>`;
    if (screen === 'register') content = `${back(accountRole === 'student' ? 'confirm' : 'plans')}<span class="access-eyebrow">${accountRole === 'student' ? 'SOY ALUMNO' : 'SOY PROFESOR'} · 2 DE 2</span><h1>Tu espacio,<br>tu próximo paso.</h1><p class="access-lead">${accountRole === 'student' ? 'Con ' + esc(professorName) + ' como profesor.' : 'Plan elegido: ' + esc(plans.find(p => p.id === chosenPlan).name) + '.'}</p><form id="access-register"><label for="access-name">Nombre y apellido</label><input id="access-name" name="name" autocomplete="name" maxlength="80" required placeholder="Ej.: Alex García"><label for="access-whatsapp">WhatsApp con código de país</label><input id="access-whatsapp" name="whatsapp" type="tel" autocomplete="tel" maxlength="25" required placeholder="Ej.: +54 9 11 1234 5678">${accountRole==='student'?sexPicker():''}<label for="access-email">Correo electrónico</label><input id="access-email" name="email" type="email" autocomplete="email" maxlength="160" required placeholder="alex@ejemplo.com"><label for="access-password">Contraseña</label><input id="access-password" name="password" type="password" autocomplete="new-password" minlength="10" required placeholder="Al menos 10 caracteres"><p class="access-hint">El correo será tu usuario. Te enviaremos un enlace para confirmar tu cuenta.</p><p class="access-error" role="alert" id="access-error"></p><button type="submit" class="access-btn">Crear mi cuenta ${icon('arrow')}</button></form>`;
    if (screen === 'pending') content = `${back('login')}<span class="access-success">${icon('check')}</span><span class="access-eyebrow">CONFIRMÁ TU CORREO</span><h1>Un paso más.</h1><p class="access-lead">Revisá tu correo y abrí el enlace de confirmación. Después ingresá con tu correo y contraseña.</p><div class="access-callout">${accountRole === 'student' ? 'Al completar tu cuenta, se enviará la solicitud al profesor para que la apruebe.' : 'Después de confirmar tu correo y completar el registro, revisaremos tu cuenta para habilitar tu espacio.'}</div>${action('Ya confirmé mi correo · Ingresar', 'login')}${installCallout()}`;
    if (screen === 'login') content = `${back('welcome')}<span class="access-eyebrow">QUÉ BUENO VERTE</span><h1>Volvé a<br>tu espacio.</h1><p class="access-lead">Ingresá a tu cuenta. Te llevamos al perfil que te corresponde.</p><form id="access-login"><label for="login-email">Correo electrónico</label><input id="login-email" name="email" type="email" autocomplete="username" required placeholder="tu@correo.com"><label for="login-password">Contraseña</label><input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="Tu contraseña"><p class="access-error" role="alert" id="access-error"></p><button class="access-btn" type="submit">Ingresar</button></form><button class="access-text" data-access="recovery">Olvidé mi contraseña</button>`;
    if (screen === 'recovery') content = `${back('login')}<span class="access-eyebrow">RECUPERAR ACCESO</span><h1>Volvé a entrar.</h1><p class="access-lead">Te enviaremos un enlace para elegir una nueva contraseña.</p><form id="access-recovery"><label for="recovery-email">Correo electrónico</label><input id="recovery-email" name="email" type="email" autocomplete="email" required><p class="access-error" role="alert" id="access-error"></p><button class="access-btn" type="submit">Enviar enlace</button></form>`;
    if (screen === 'plans') window.EntrenarCloud.loadPlanPrices().then(()=>{if(screen==='plans')root.querySelectorAll('[data-plan-card]').forEach(card=>{card.querySelector('.access-price').textContent=plans.find(p=>p.id===card.dataset.planCard)?.comingSoon?'Próximamente':window.EntrenarCloud.planPriceLabel(card.dataset.planCard);});}).catch(()=>{});
    root.innerHTML = `<div class="access-layout access-screen-${screen}${animateWelcome ? ' access-enter' : ''}"><aside class="access-story"><div class="access-brand">${embeddedBrandLogo}</div><div class="access-story-copy"><span class="access-eyebrow">MOVIMIENTO / CONSTANCIA / PROGRESO</span><h2>Pequeños pasos.<br>Grandes progresos.</h2><p>Entrená con propósito.<br>Acompañá cada avance.</p><div class="access-orbit">${icon('activity')}</div></div><span class="access-story-foot">Cada paso cuenta.</span></aside><div class="access-panel"><div class="access-mobile-brand">${embeddedBrandLogo}</div><div class="access-content">${content}${demoNote}</div><footer>ENTRENAR <span>·</span> Tu próximo paso</footer></div></div>`;
    window.scrollTo(0, 0);
    const title = root.querySelector('h1');
    title.tabIndex = -1;
    title.focus({preventScroll: true});
    window.dispatchEvent(new CustomEvent('entrenar:access-view'));
  }
  function enterDemo(nextRole) {
    if (!window.EntrenarCloud.enterDemo()) return;
    role = nextRole; page = 'Inicio'; detailId = null; search = ''; filter = 'all';
    if (nextRole === 'student' && !selectedStudent()) studentId = state.students[0]?.id || '';
    root.hidden = true; root.replaceChildren();
    document.body.classList.remove('access-open'); render(); window.EntrenarCloud.animateOpening(); window.scrollTo(0, 0);
    main.focus({preventScroll: true});
  }
  document.addEventListener('click', event => {
    const planButton = event.target.closest('[data-plan-choice]');
    if (planButton) {
      if(plans.find(p=>p.id===planButton.dataset.planChoice)?.comingSoon)return;
      chosenPlan = planButton.dataset.planChoice;
      root.querySelectorAll('[data-plan-card]').forEach(card => {
        const selected = card.dataset.planCard === chosenPlan;
        card.classList.toggle('selected', selected);
        const select = card.querySelector('[data-plan-choice]');
        select.setAttribute('aria-pressed', String(selected));
        select.innerHTML = (plans.find(p=>p.id===card.dataset.planCard)?.comingSoon?'Próximamente':selected ? 'Plan seleccionado' : 'Elegir este plan') + icon(selected ? 'check' : 'arrow');
      });
      root.querySelector('#access-plan-selection').innerHTML = 'Elegiste el plan <strong>' + esc(plans.find(p => p.id === chosenPlan).name) + '</strong>.';
      return;
    }
    const button = event.target.closest('[data-access]');
    if (!button) return;
    const target = button.dataset.access;
    if (target === 'demo-student' || target === 'demo-coach') return enterDemo(target === 'demo-student' ? 'student' : 'coach');
    if (target === 'student') { accountRole = 'student'; invitationConfirmed = false; display('link'); return; }
    if (target === 'professor') { accountRole = 'coach'; display('plans'); return; }
    if (target === 'student-register') { if (!invitationConfirmed) return display('link'); accountRole = 'student'; display('register'); return; }
    if (target === 'coach-register') { accountRole = 'coach'; display('register'); return; }
    display(target);
  });
  root.addEventListener('submit', async event => {
    if (!event.target.id.startsWith('access-')) return;
    event.preventDefault(); event.stopPropagation();
    if (submitting) return; submitting = true;
    const form = event.target, data = new FormData(form), error = root.querySelector('#access-error');
    const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true;
    try {
      if (form.id === 'access-link') {
        const code = String(data.get('code') || '').trim().toUpperCase();
        const found = await window.EntrenarCloud.preview(code);
        inviteCode = code; professorName = found.coach_name;
        window.EntrenarCloud.setInvite(code); invitationConfirmed = true; display('confirm');
      }
      if (form.id === 'access-register') {
        const name = String(data.get('name') || '').trim(), phone = String(data.get('whatsapp') || '').trim();
        if (name.length < 2) throw Error('Completá tu nombre y apellido.');
        if (!normalizeWhatsapp(phone)) throw Error('Revisá el WhatsApp: ingresá 10 dígitos con código de área, sin el 0 ni el 15.');
        if (accountRole === 'student' && !invitationConfirmed) throw Error('Revisá primero la invitación de tu profesor.');
        const entered = await window.EntrenarCloud.register(data, accountRole, chosenPlan, inviteCode);
        form.reset(); if (!entered) display('pending');
      }
      if (form.id === 'access-login') await window.EntrenarCloud.login(data);
      if (form.id === 'access-recovery') {
        await window.EntrenarCloud.recover(String(data.get('email') || '').trim());
        error.textContent = 'Si el correo tiene una cuenta, vas a recibir el enlace. Revisá también el spam.';
      }
    } catch (err) { if (error?.isConnected) error.textContent = window.EntrenarCloud.friendly(err); }
    finally { submitting = false; if (button?.isConnected) button.disabled = false; }
  });
  window.EntrenarAccessNavigation = {
    snapshot: () => ({screen: screen === 'pending' ? 'login' : screen, accountRole, chosenPlan, invitationConfirmed, professorName, inviteCode}),
    restore: view => {
      accountRole = view.accountRole === 'coach' ? 'coach' : 'student';
      chosenPlan = plans.some(p => p.id === view.chosenPlan) ? view.chosenPlan : 'inicial';
      invitationConfirmed = !!view.invitationConfirmed; professorName = view.professorName || professorName; inviteCode = view.inviteCode || inviteCode;
      display(['welcome','link','confirm','plans','register','login','recovery'].includes(view.screen) ? view.screen : 'welcome');
    },
    hide: () => { root.hidden = true; root.replaceChildren(); document.body.classList.remove('access-open'); }
  };
  const params = new URLSearchParams(window.location.search), code = params.get('profesor');
  if (code) {
    accountRole = 'student'; display('link');
    root.querySelector('#invite-code').value = code.slice(0, 40);
    window.EntrenarCloud.setInvite(code.trim().toUpperCase());
  } else display('welcome');
  window.EntrenarCloud.start();
})();
