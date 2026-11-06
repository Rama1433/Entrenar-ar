'use strict';
// Interface preview only. No authentication, credentials, account or billing storage.
(() => {
  const root = document.querySelector('#access');
  const inviteCode = 'ENT-DEMO';
  let screen = 'welcome', accountRole = 'student', chosenPlan = 'inicial';
  let previewName = '', invitationConfirmed = false;
  const action = (label, target, cls = '') => `<button type="button" class="access-btn ${cls}" data-access="${target}">${label}</button>`;
  const back = target => `<button type="button" class="access-back" data-access="${target}">${icon('back')} Volver</button>`;
  const demoNote = '<p class="access-note">Vista previa · Todavía no se crean cuentas ni se realizan cobros. Usá datos de ejemplo.</p>';
  function display(next) {
    screen = next;
    document.body.classList.add('access-open');
    root.hidden = false;
    let content = '';
    if (screen === 'welcome') content = `<span class="access-eyebrow">TU PRÓXIMO PASO</span><h1>Todo empieza<br>con vos.</h1><p class="access-lead">Tu entrenamiento. Tu equipo.<br>Un espacio para avanzar juntos.</p><div class="access-choices"><button class="access-choice" data-access="student"><span class="access-choice-icon">${icon('activity')}</span><span><strong>Soy alumno</strong><small>Entrená con tu profesor y seguí tu progreso.</small></span>${icon('arrow')}</button><button class="access-choice" data-access="professor"><span class="access-choice-icon">${icon('users')}</span><span><strong>Soy profesor</strong><small>Acompañá a tus alumnos desde un solo lugar.</small></span>${icon('arrow')}</button></div><button class="access-text" data-access="login">Ya tengo cuenta</button><div class="access-demo-links"><span>¿Querés conocer Entrenar?</span><button data-access="demo-student">Demo alumno</button><button data-access="demo-coach">Demo profesor</button></div>`;
    if (screen === 'link') content = `${back('welcome')}<span class="access-eyebrow">SOY ALUMNO · 1 DE 2</span><h1>Encontrá a<br>tu profesor.</h1><p class="access-lead">Ingresá el código que te compartió. Si abrís su enlace QR desde la cámara del celular, este paso ya viene completo.</p><form id="access-link"><label for="invite-code">Código del profesor</label><input id="invite-code" name="code" autocapitalize="characters" autocomplete="off" maxlength="40" required placeholder="Ej.: ENT-DEMO"><p class="access-hint">Para probar este recorrido, usá <strong>ENT-DEMO</strong>.</p><p class="access-error" role="alert" id="access-error"></p><button class="access-btn" type="submit">Buscar profesor ${icon('arrow')}</button></form>`;
    if (screen === 'confirm') content = `${back('link')}<span class="access-eyebrow">TU PROFESOR</span><h1>¿Es tu profe?</h1><p class="access-lead">Revisá los datos antes de continuar.</p><div class="access-person"><span class="access-avatar">${esc(initials(state.coach.name))}</span><div><strong>${esc(state.coach.name)}</strong><small>Profesor · Invitación de demostración</small></div></div><p class="access-hint">El código vincula tu solicitud con el profesor. Tu cuenta será personal y él deberá aprobar la vinculación.</p>${action('Sí, continuar', 'student-register')}`;
    if (screen === 'plans') content = `${back('welcome')}<span class="access-eyebrow">SOY PROFESOR · 1 DE 2</span><h1>Un plan para<br>tu equipo.</h1><p class="access-lead">Elegí según la cantidad de alumnos que acompañás.</p><div class="access-plans">${plans.map(p => `<button class="access-plan ${chosenPlan === p.id ? 'selected' : ''}" aria-pressed="${chosenPlan === p.id}" data-plan-choice="${p.id}"><span><strong>${esc(p.name)}</strong><small>${p.limit ? 'Hasta ' + p.limit + ' alumnos activos' : 'Alumnos sin límite definido'}</small></span><span class="access-plan-price">Precio por definir<br><small>Suscripción mensual</small></span></button>`).join('')}</div><p class="access-hint">Precios y condiciones pendientes de definir. Esta selección no contrata un plan.</p>${action('Continuar', 'coach-register')}`;
    if (screen === 'register') content = `${back(accountRole === 'student' ? 'confirm' : 'plans')}<span class="access-eyebrow">${accountRole === 'student' ? 'SOY ALUMNO' : 'SOY PROFESOR'} · 2 DE 2</span><h1>Tu espacio,<br>tu próximo paso.</h1><p class="access-lead">${accountRole === 'student' ? 'Con ' + esc(state.coach.name) + ' como profesor.' : 'Plan elegido: ' + esc(plans.find(p => p.id === chosenPlan).name) + '.'}</p><form id="access-register"><label for="access-name">Nombre y apellido</label><input id="access-name" name="name" autocomplete="name" maxlength="80" required placeholder="Ej.: Alex García"><label for="access-whatsapp">WhatsApp con código de país</label><input id="access-whatsapp" name="whatsapp" type="tel" autocomplete="tel" maxlength="25" required placeholder="Ej.: +54 9 11 1234 5678"><label for="access-email">Correo electrónico</label><input id="access-email" name="email" type="email" autocomplete="email" maxlength="160" required placeholder="alex@ejemplo.com"><label for="access-password">Contraseña</label><input id="access-password" type="password" disabled placeholder="Disponible al conectar las cuentas"><p class="access-hint">El correo será tu usuario. La contraseña y su recuperación se habilitarán con el acceso real; todavía no ingreses una contraseña.</p><p class="access-error" role="alert" id="access-error"></p><button type="submit" class="access-btn">Previsualizar ${accountRole === 'student' ? 'solicitud' : 'registro'} ${icon('arrow')}</button></form>`;
    if (screen === 'pending') content = `${back('register')}<span class="access-success">${icon('check')}</span><span class="access-eyebrow">ASÍ SE VERÍA EL SIGUIENTE PASO</span><h1>¡Hola, ${esc(previewName.split(/\s+/)[0])}! 👋</h1><p class="access-lead">${accountRole === 'student' ? 'Tu solicitud quedaría pendiente de aprobación por ' + esc(state.coach.name) + '.' : 'Una vez creada tu cuenta y activado tu plan, empezarías a organizar tus alumnos y rutinas.'}</p><div class="access-callout">Esta es una previsualización: no se guardaron tus datos ni se envió una solicitud. La demo abre con los perfiles de ejemplo existentes.</div>${action('Explorar demo de ' + (accountRole === 'student' ? 'alumno' : 'profesor'), accountRole === 'student' ? 'demo-student' : 'demo-coach')}`;
    if (screen === 'login') content = `${back('welcome')}<span class="access-eyebrow">QUÉ BUENO VERTE</span><h1>Volvé a<br>tu espacio.</h1><p class="access-lead">Un mismo acceso para alumnos y profesores. Tu cuenta te llevará a tu perfil.</p><form id="access-login"><label for="login-email">Correo electrónico</label><input id="login-email" type="email" autocomplete="email" placeholder="tu@correo.com" disabled><label for="login-password">Contraseña</label><input id="login-password" type="password" autocomplete="current-password" placeholder="Tu contraseña" disabled><button class="access-btn" type="button" disabled>Ingresar · Próximamente</button></form><button class="access-text" data-access="recovery">Olvidé mi contraseña</button><p class="access-hint">El inicio de sesión se habilitará al conectar las cuentas. Mientras tanto, podés explorar la app.</p><div class="access-demo-buttons">${action('Demo alumno', 'demo-student', 'secondary')}${action('Demo profesor', 'demo-coach', 'secondary')}</div>`;
    if (screen === 'recovery') content = `${back('login')}<span class="access-eyebrow">RECUPERAR ACCESO</span><h1>Volvé a entrar.</h1><p class="access-lead">Con el acceso real, vas a poder recibir un enlace en tu correo para elegir una nueva contraseña.</p><div class="access-callout">La recuperación estará disponible cuando conectemos las cuentas. En esta versión no se envían correos.</div>${action('Volver al acceso', 'login')}`;
    root.innerHTML = `<div class="access-layout"><aside class="access-story"><div class="access-brand">${embeddedBrandLogo}</div><div class="access-story-copy"><span class="access-eyebrow">MOVIMIENTO / CONSTANCIA / PROGRESO</span><h2>Pequeños pasos.<br>Grandes progresos.</h2><p>Entrená con propósito.<br>Acompañá cada avance.</p><div class="access-orbit">${icon('activity')}</div></div><span class="access-story-foot">Cada paso cuenta.</span></aside><div class="access-panel"><div class="access-mobile-brand">${embeddedBrandLogo}</div><div class="access-content">${content}${demoNote}</div><footer>ENTRENAR <span>·</span> Tu próximo paso</footer></div></div>`;
    window.scrollTo(0, 0);
    const title = root.querySelector('h1');
    title.tabIndex = -1;
    title.focus({preventScroll: true});
  }
  function enterDemo(nextRole) {
    role = nextRole; page = 'Inicio'; detailId = null; search = ''; filter = 'all';
    if (nextRole === 'student' && !selectedStudent()) studentId = state.students[0]?.id || '';
    root.hidden = true; root.replaceChildren();
    document.body.classList.remove('access-open'); render(); window.scrollTo(0, 0);
    main.focus({preventScroll: true});
  }
  document.addEventListener('click', event => {
    const planButton = event.target.closest('[data-plan-choice]');
    if (planButton) { chosenPlan = planButton.dataset.planChoice; display('plans'); return; }
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
  root.addEventListener('submit', event => {
    event.preventDefault(); event.stopPropagation();
    const form = event.target, data = new FormData(form);
    const error = root.querySelector('#access-error');
    if (form.id === 'access-link') {
      const code = String(data.get('code') || '').trim().toUpperCase();
      if (code !== inviteCode) { error.textContent = 'No encontramos ese código de prueba. Usá ENT-DEMO para ver el recorrido.'; return; }
      invitationConfirmed = true; display('confirm');
    }
    if (form.id === 'access-register') {
      const name = String(data.get('name') || '').trim();
      const phone = String(data.get('whatsapp') || '').trim();
      if (name.length < 2) { error.textContent = 'Completá tu nombre y apellido.'; return; }
      if (!/^\+?[\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) { error.textContent = 'Revisá el WhatsApp: ingresá entre 8 y 15 dígitos con código de país.'; return; }
      previewName = name; display('pending');
    }
  });
  const params = new URLSearchParams(window.location.search);
  const code = params.get('profesor');
  if (code) {
    accountRole = 'student'; display('link');
    root.querySelector('#invite-code').value = code.slice(0, 40);
    if (code.trim().toUpperCase() === inviteCode) { invitationConfirmed = true; display('confirm'); }
  } else display('welcome');
})();
