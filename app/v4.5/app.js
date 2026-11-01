(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const store = window.ESKOStore;
  const API = './api';
  const API_ENABLED = false;
  let currentUser = null;
  let currentGroup = null;
  let currentDM = null;
  let pollTimer = null;
  let toastTimer = null;
  let introTimer = null;
  let audioContext = null;
  let introOscillator = null;

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function api(path, options = {}) {
    if (!API_ENABLED) throw new Error('الخدمة الخلفية غير منشورة على الموقع بعد؛ الحسابات والمحادثات والفحص الشبكي غير مفعّلة.');
    const init = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };
    let response;
    try { response = await fetch(`${API}${path}`, init); }
    catch (_) { throw new Error('الخادم المحلي غير متصل. شغّل server.mjs أولًا.'); }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `خطأ اتصال ${response.status}`);
    return payload;
  }

  function showAppNow() {
    $('#intro').classList.add('hidden');
    $('#lockScreen').classList.add('hidden');
    $('#termsScreen').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
  }

  async function showApp() {
    $('#intro').classList.add('hidden');
    $('#lockScreen').classList.add('hidden');
    $('#appShell').classList.add('hidden');
    const accepted = await store.get('settings', 'termsAccepted').catch(() => false);
    if (accepted === true) showAppNow();
    else $('#termsScreen').classList.remove('hidden');
  }

  function showLock() {
    $('#intro').classList.add('hidden');
    $('#appShell').classList.add('hidden');
    $('#lockScreen').classList.remove('hidden');
    $('#unlockPassword').focus();
  }

  async function hashLocalPassword(password, saltBytes) {
    if (!window.crypto?.subtle) throw new Error('التشفير المحلي غير مدعوم هنا؛ افتح الإضافة من localhost.');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 210000, hash: 'SHA-256' }, material, 256);
    return [...new Uint8Array(bits)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function bytesToHex(bytes) { return [...bytes].map(v => v.toString(16).padStart(2, '0')).join(''); }
  function hexToBytes(hex) { return new Uint8Array((hex.match(/.{1,2}/g) || []).map(v => parseInt(v, 16))); }

  async function configureLocalLock() {
    const password = prompt('اكتب كلمة مرور محلية من 6 أحرف على الأقل:');
    if (password === null) return;
    if (password.length < 6) return toast('كلمة المرور قصيرة؛ استخدم 6 أحرف على الأقل.');
    const confirmPassword = prompt('أعد كتابة كلمة المرور للتأكيد:');
    if (password !== confirmPassword) return toast('كلمتا المرور غير متطابقتين.');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const digest = await hashLocalPassword(password, salt);
      await store.set('settings', 'localLock', { salt: bytesToHex(salt), digest, enabled: true });
      toast('تم إعداد القفل المحلي على هذا المتصفح.');
    } catch (error) { toast(error.message); }
  }

  async function unlockLocal(password) {
    const record = await store.get('settings', 'localLock');
    if (!record?.enabled) return true;
    const digest = await hashLocalPassword(password, hexToBytes(record.salt));
    return digest === record.digest;
  }

  async function enterAfterIntro() {
    clearInterval(introTimer);
    if (introOscillator) { try { introOscillator.stop(); } catch (_) {} introOscillator = null; }
    const lock = await store.get('settings', 'localLock').catch(() => null);
    if (lock?.enabled) showLock(); else showApp();
  }

  function startIntro() {
    const intro = $('#intro');
    const soundOn = $('#soundToggle')?.checked;
    let remaining = 10;
    $('#introCount').textContent = remaining;
    intro.classList.remove('hidden');
    introTimer = setInterval(() => {
      remaining -= 1;
      $('#introCount').textContent = Math.max(0, remaining);
      if (remaining <= 0) enterAfterIntro();
    }, 1000);
    if (soundOn) playIntroTone();
  }

  function playIntroTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext ||= new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      introOscillator = oscillator;
      const gain = audioContext.createGain();
      const start = audioContext.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(96, start);
      oscillator.frequency.exponentialRampToValueAtTime(62, start + 9.4);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.018, start + 1.0);
      gain.gain.setValueAtTime(0.018, start + 8.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 10.0);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 10.05);
      oscillator.addEventListener('ended', () => { if (introOscillator === oscillator) introOscillator = null; }, { once:true });
    } catch (_) { /* Audio is optional and may be blocked by the browser. */ }
  }

  async function applySettings() {
    const settings = await store.get('settings', 'ui').catch(() => ({})) || {};
    document.body.dataset.theme = settings.theme || 'nebula';
    $('#edgeSpeed').value = settings.edgeSpeed || 'slow';
    $('#motionToggle').checked = settings.motion !== false;
    $('#soundToggle').checked = settings.sound === true;
    document.documentElement.style.setProperty('--edge-duration', ({ slow: '10s', medium: '5s', fast: '2.5s' })[settings.edgeSpeed || 'slow']);
    document.body.classList.toggle('no-motion', settings.motion === false);
    $$('.theme-choice').forEach(button => button.classList.toggle('selected', button.dataset.themeChoice === (settings.theme || 'nebula')));
    $('#motionState').textContent = settings.motion === false ? 'مخفّضة' : 'مفعّلة';
  }

  async function saveSettings(patch) {
    const current = await store.get('settings', 'ui').catch(() => ({})) || {};
    await store.set('settings', 'ui', { ...current, ...patch });
    await applySettings();
  }

  function openPage(name) {
    const target = $(`#page-${name}`);
    if (!target) return;
    $$('.page').forEach(page => page.classList.toggle('active', page === target));
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === name));
    closeMenu();
    window.scrollTo({ top: 0, behavior: document.body.classList.contains('no-motion') ? 'auto' : 'smooth' });
    if (name === 'processor') updateProcessor();
    if (name === 'memory') refreshMemoryStats();
    if (name === 'discussions') refreshChats();
  }

  function closeMenu() {
    $('#sideMenu').classList.remove('open');
    $('#menuShade').classList.remove('show');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
  }

  function updateProcessor() {
    $('#cpuCores').textContent = navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : 'غير متاح';
    $('#deviceMemory').textContent = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'غير متاحة';
    const platform = navigator.userAgentData?.platform || navigator.platform || 'غير مكشوفة';
    $('#cpuArch').textContent = `${String(platform).slice(0, 24)} · لا يكشف اسم المعالج`;
    $('#motionState').textContent = document.body.classList.contains('no-motion') ? 'مخفّضة' : 'مفعّلة';
  }

  function updateNetwork() {
    $('#netState').textContent = navigator.onLine ? 'واجهة ويب' : 'بدون اتصال';
    $('#netState').style.color = navigator.onLine ? 'var(--good)' : 'var(--muted)';
  }

  function setAccountStatus(user) {
    currentUser = user || null;
    const box = $('#accountStatus');
    if (currentUser) {
      box.innerHTML = `<b>مسجل الدخول: ${escapeHTML(currentUser.displayName)}</b><span>@${escapeHTML(currentUser.username)}</span>`;
    } else {
      box.innerHTML = '<b>الملف المحلي فقط</b><span>الحسابات الأونلاين تحتاج خدمة خلفية آمنة لم تُنشر بعد.</span>';
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  }

  async function checkSession() {
    try {
      const data = await api('/account/me');
      setAccountStatus(data.user);
      return data.user;
    } catch (_) {
      setAccountStatus(null);
      return null;
    }
  }

  async function onRegister(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    data.age = Number(data.age);
    try {
      const result = await api('/account/register', { method: 'POST', body: data });
      setAccountStatus(result.user);
      $('#recoveryReveal').classList.remove('hidden');
      $('#recoveryReveal').textContent = `رمز الاسترجاع لمرة واحدة: ${result.recoveryCode} — احتفظ به خارج الهاتف. لن يظهر مرة أخرى.`;
      event.currentTarget.reset();
      toast('تم إنشاء الحساب على الخادم المحلي.');
    } catch (error) { toast(error.message); }
  }

  async function onLogin(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api('/account/login', { method: 'POST', body: data });
      setAccountStatus(result.user);
      event.currentTarget.reset();
      toast('تم تسجيل الدخول.');
      refreshChats();
    } catch (error) { toast(error.message); }
  }

  async function onRecover(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api('/account/recover', { method: 'POST', body: data });
      $('#recoveryReveal').classList.remove('hidden');
      $('#recoveryReveal').textContent = `تم تغيير كلمة المرور. رمز الاسترجاع الجديد: ${result.recoveryCode} — احفظه فورًا.`;
      event.currentTarget.reset();
      toast('تم استرجاع الحساب.');
    } catch (error) { toast(error.message); }
  }

  async function saveAvatar(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return toast('اختر PNG أو JPG أو WebP بحجم أقل من 2MB.');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
      reader.readAsDataURL(file);
    });
    await store.set('media', 'avatar', dataUrl);
    $('#avatarPreview').src = dataUrl;
    $('#avatarPreview').classList.remove('hidden');
    toast('تم حفظ الصورة على هذا الجهاز.');
  }

  async function loadAvatar() {
    const image = await store.get('media', 'avatar').catch(() => null);
    if (image) { $('#avatarPreview').src = image; $('#avatarPreview').classList.remove('hidden'); }
  }


  async function refreshMemoryStats() {
    const note = await store.get('notes','main').catch(() => '');
    const avatar = await store.get('media','avatar').catch(() => null);
    const ui = await store.get('settings','ui').catch(() => ({})) || {};
    $('#memoryNotes').textContent = note ? `${note.length} حرف` : 'فارغة';
    $('#memoryAvatar').textContent = avatar ? 'موجودة' : 'غير محددة';
    $('#memoryTheme').textContent = ({nebula:'سديم',grid:'شبكة',aurora:'شفق',cyber:'سايبر'})[ui.theme || 'nebula'];
    try {
      const estimate = await navigator.storage?.estimate?.();
      $('#memoryUsage').textContent = estimate?.usage ? `${(estimate.usage/1024/1024).toFixed(1)} MB` : 'غير متاح';
    } catch (_) { $('#memoryUsage').textContent = 'غير متاح'; }
  }

  async function exportLocalBackup() {
    const allowed = confirm('النسخة تشمل الملاحظات والإعدادات والصورة المحلية. هل تريد تنزيلها على الهاتف؟');
    if (!allowed) return;
    const backup = {
      format:'ESKO-LOCAL-BACKUP', version:1, createdAt:new Date().toISOString(),
      settings:await store.get('settings','ui').catch(() => ({})),
      note:await store.get('notes','main').catch(() => ''),
      avatar:await store.get('media','avatar').catch(() => null)
    };
    const blob = new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href=url; link.download=`ESKO-V4.5-LOCAL-BACKUP-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast('تم تجهيز نسخة البيانات المحلية.');
  }

  function runLocalAssistant() {
    const question = $('#assistantQuestion').value.trim();
    if (!question) return toast('اكتب سؤالك الأول.');
    const engine = $('#assistantEngine').value;
    const q = question.toLowerCase();
    let answer;
    if (engine === 'esko') {
      if (/تريمكس|termux/.test(q)) answer = 'مساعد ESKO: افتح قسم تريمكس واكتب help لعرض الأوامر التعليمية المتاحة. تنفيذ أوامر النظام الحقيقي يحتاج ربط Android أصلي.';
      else if (/حساب|استرجاع|كلمة مرور/.test(q)) answer = 'مساعد ESKO: أنشئ اسم مستخدم فريدًا، واحتفظ برمز الاسترجاع خارج الهاتف. لا ترسل كلمة المرور أو الرمز لأي شخص.';
      else if (/ملاحظة|ذاكرة|تخزين/.test(q)) answer = 'مساعد ESKO: الملاحظات والإعدادات والصورة محفوظة في IndexedDB على نفس أصل الموقع. صدّر نسخة احتياطية من وحدة الذاكرة.';
      else if (/خلفية|ثيم|لون/.test(q)) answer = 'مساعد ESKO: افتح الإعدادات واختر واحدة من الخلفيات الأربع، ويمكنك ضبط سرعة خطوط الجوانب.';
      else answer = 'مساعد ESKO: أقدر أوجّهك لأقسام الحساب وتريمكس والملاحظات والإعدادات. هذا محرك قواعد محلي وليس نموذجًا توليديًا.';
    } else {
      if (/console\.log/.test(q)) answer = 'مساعد البرمجة: console.log() تطبع قيمة في وحدة التحكم. ابدأ مثلًا بـ console.log("Hello ESKO");';
      else if (/syntaxerror|خطأ نحوي|syntax error/.test(q)) answer = 'مساعد البرمجة: راجع الأقواس () و{}، وعلامات الاقتباس، والفواصل. شغّل node --check اسم-الملف.js لمعرفة موضع الخطأ النحوي.';
      else if (/termux|node|تشغيل/.test(q)) answer = 'مساعد البرمجة: تأكد من أنك داخل مجلد المشروع، ثم استخدم node اسم-الملف.js. افحص الصياغة أولًا بـ node --check.';
      else if (/متغير|let|const|variable/.test(q)) answer = 'مساعد البرمجة: استخدم const للقيمة التي لن تعيد إسنادها، وlet للقيمة التي قد تتغير. اكتب أسماء واضحة وتجنب var في الأكواد الجديدة.';
      else answer = 'مساعد البرمجة: قسّم المشكلة إلى خطوات صغيرة، اقرأ رسالة الخطأ كاملة، ثم افحص الملف المعني بـ node --check. أحتاج رسالة الخطأ أو مقطع الكود لتشخيص أدق.';
    }
    $('#assistantAnswer').textContent = answer;
    store.set('assistant','last',{engine,question,answer,createdAt:new Date().toISOString()}).catch(() => {});
  }

  async function saveNote() {
    await store.set('notes', 'main', $('#noteInput').value);
    $('#noteState').textContent = `تم الحفظ محليًا · ${new Date().toLocaleString('ar-EG')}`;
    toast('اتحفظت الملاحظة على الجهاز.');
  }

  async function loadNote() {
    $('#noteInput').value = await store.get('notes', 'main').catch(() => '') || '';
    $('#noteState').textContent = $('#noteInput').value ? 'تم تحميل ملاحظتك المحفوظة.' : 'لم يتم الحفظ بعد.';
  }

  function terminalWrite(text) {
    const p = document.createElement('p');
    p.textContent = text;
    $('#terminalOutput').append(p);
    $('#terminalOutput').scrollTop = $('#terminalOutput').scrollHeight;
  }

  function runSafeTerminal(command) {
    const [name] = command.trim().split(/\s+/);
    const commands = {
      help: 'الأوامر الآمنة: help, about, version, time, storage, clear',
      about: 'ESKO OPEN HUB V4.5 — إضافة واجهة تجريبية.',
      version: 'ESKO V4.5 ADD-ON / API local prototype',
      time: new Date().toLocaleString('ar-EG'),
      storage: 'التخزين: IndexedDB على نفس أصل الموقع؛ راجع إعدادات المتصفح للمساحة.',
      clear: '__CLEAR__'
    };
    const output = commands[name];
    if (!output) return terminalWrite(`الأمر غير متاح هنا: ${name || '(فارغ)'}. اكتب help.`);
    if (output === '__CLEAR__') $('#terminalOutput').replaceChildren(); else terminalWrite(output);
  }

  function renderMessages(container, items) {
    container.replaceChildren();
    for (const message of items) {
      const item = document.createElement('article');
      item.className = `message${currentUser && message.username === currentUser.username ? ' mine' : ''}`;
      const name = document.createElement('b');
      name.textContent = message.displayName || message.username || 'مستخدم';
      const body = document.createElement('p');
      body.textContent = message.text;
      const time = document.createElement('time');
      time.textContent = new Date(message.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      item.append(name, body, time);
      if (message.username && currentUser && message.username !== currentUser.username) {
        const actions = document.createElement('button');
        actions.className = 'text-button'; actions.textContent = 'طلب مراسلة';
        actions.addEventListener('click', () => requestDM(message.username));
        const report = document.createElement('button');
        report.className = 'text-button'; report.textContent = 'إبلاغ';
        report.addEventListener('click', async () => {
          const reason = prompt('اكتب سبب الإبلاغ عن الرسالة:');
          if (!reason) return;
          try { await api('/report', { method:'POST', body:{ messageId:message.id, reason } }); toast('تم تسجيل البلاغ للمراجعة.'); }
          catch (error) { toast(error.message); }
        });
        item.append(actions, report);
      }
      container.append(item);
    }
    container.scrollTop = container.scrollHeight;
  }

  async function refreshGeneral() {
    if (!currentUser) { $('#generalMessages').textContent = 'سجّل الدخول لعرض المحادثة العامة.'; return; }
    try { const result = await api('/chat/general'); renderMessages($('#generalMessages'), result.messages || []); }
    catch (error) { $('#generalMessages').textContent = error.message; }
  }

  async function sendGeneral(event) {
    event.preventDefault();
    if (!currentUser) return toast('سجّل الدخول أولًا.');
    const input = event.currentTarget.elements.message;
    try { await api('/chat/general', { method: 'POST', body: { text: input.value } }); input.value = ''; await refreshGeneral(); }
    catch (error) { toast(error.message); }
  }

  async function createGroup(event) {
    event.preventDefault();
    const name = event.currentTarget.elements.name.value;
    try {
      const result = await api('/groups', { method: 'POST', body: { name } });
      event.currentTarget.reset();
      toast(`تم إنشاء المجموعة. رابط الدعوة: ${location.origin}/?join=${result.inviteCode}`);
      await loadGroups();
    } catch (error) { toast(error.message); }
  }

  async function joinGroup(event) {
    event.preventDefault();
    const raw = event.currentTarget.elements.invite.value.trim();
    const invite = raw.includes('join=') ? new URL(raw, location.origin).searchParams.get('join') : raw;
    try { await api('/groups/join', { method: 'POST', body: { inviteCode: invite } }); event.currentTarget.reset(); toast('تم الانضمام للمجموعة بعد تأكيدك.'); await loadGroups(); }
    catch (error) { toast(error.message); }
  }

  async function loadGroups() {
    if (!currentUser) { $('#groupList').textContent = 'سجّل الدخول لإدارة المجموعات.'; return; }
    try {
      const result = await api('/groups');
      $('#groupList').replaceChildren();
      for (const group of result.groups || []) {
        const row = document.createElement('div'); row.className = 'group-item';
        const label = document.createElement('div'); label.innerHTML = `<b>${escapeHTML(group.name)}</b><small>${group.memberCount} أعضاء · ${group.isOwner ? 'أنت المنشئ' : 'عضو'}</small>`;
        const open = document.createElement('button'); open.className = 'small-button'; open.textContent = 'فتح'; open.addEventListener('click', () => openGroup(group.id, group.name));
        const share = document.createElement('button'); share.className = 'text-button'; share.textContent = 'نسخ الدعوة'; share.addEventListener('click', async () => { try { await navigator.clipboard.writeText(`${location.origin}/?join=${group.inviteCode}`); toast('تم نسخ رابط الدعوة.'); } catch (_) { toast(`كود الدعوة: ${group.inviteCode}`); } });
        row.append(label, open, share); $('#groupList').append(row);
      }
    } catch (error) { $('#groupList').textContent = error.message; }
  }

  async function openGroup(id, name) {
    currentGroup = id; $('#groupChat').classList.remove('hidden'); $('#groupChatTitle').textContent = name; await refreshGroup();
  }

  async function refreshGroup() {
    if (!currentGroup) return;
    try { const result = await api(`/groups/${encodeURIComponent(currentGroup)}/messages`); renderMessages($('#groupMessages'), result.messages || []); }
    catch (error) { toast(error.message); }
  }

  async function sendGroup(event) {
    event.preventDefault(); if (!currentGroup) return;
    const input = event.currentTarget.elements.message;
    try { await api(`/groups/${encodeURIComponent(currentGroup)}/messages`, { method: 'POST', body: { text: input.value } }); input.value = ''; await refreshGroup(); }
    catch (error) { toast(error.message); }
  }

  async function requestDM(username) {
    if (!currentUser) return toast('سجّل الدخول أولًا.');
    try { await api('/dm/request', { method: 'POST', body: { username } }); toast('تم إرسال طلب المراسلة؛ الطرف الآخر يحتاج قبوله.'); await loadDMs(); }
    catch (error) { toast(error.message); }
  }

  async function createDMRequest(event) { event.preventDefault(); await requestDM(event.currentTarget.elements.username.value.trim()); event.currentTarget.reset(); }

  async function loadDMs() {
    if (!currentUser) { $('#dmRequests').textContent = 'سجّل الدخول لعرض الطلبات.'; return; }
    try {
      const result = await api('/dm');
      $('#dmRequests').replaceChildren(); $('#dmList').replaceChildren();
      for (const request of result.incoming || []) {
        const row = document.createElement('div'); row.className = 'group-item';
        const label = document.createElement('b'); label.textContent = `طلب مراسلة من @${request.username}`;
        const accept = document.createElement('button'); accept.className = 'small-button'; accept.textContent = 'قبول'; accept.addEventListener('click', async () => { try { await api('/dm/accept', { method: 'POST', body: { requestId: request.id } }); toast('تم قبول الطلب.'); await loadDMs(); } catch (e) { toast(e.message); } });
        const decline = document.createElement('button'); decline.className = 'text-button'; decline.textContent = 'رفض'; decline.addEventListener('click', async () => { try { await api('/dm/decline', { method: 'POST', body: { requestId: request.id } }); await loadDMs(); } catch (e) { toast(e.message); } });
        row.append(label, accept, decline); $('#dmRequests').append(row);
      }
      for (const dm of result.conversations || []) {
        const row = document.createElement('div'); row.className = 'group-item';
        const label = document.createElement('b'); label.textContent = `محادثة مع @${dm.username}`;
        const open = document.createElement('button'); open.className = 'small-button'; open.textContent = 'فتح'; open.addEventListener('click', () => openDM(dm.id, dm.username));
        const block = document.createElement('button'); block.className = 'text-button'; block.textContent = 'حظر'; block.addEventListener('click', async () => { try { await api('/block', { method: 'POST', body: { username: dm.username } }); toast('تم حظر الحساب.'); await loadDMs(); } catch (e) { toast(e.message); } });
        row.append(label, open, block); $('#dmList').append(row);
      }
    } catch (error) { $('#dmRequests').textContent = error.message; }
  }

  async function openDM(id, username) { currentDM = id; $('#dmChat').classList.remove('hidden'); $('#dmTitle').textContent = `محادثة مع @${username}`; await refreshDM(); }
  async function refreshDM() { if (!currentDM) return; try { const result = await api(`/dm/${encodeURIComponent(currentDM)}/messages`); renderMessages($('#dmMessages'), result.messages || []); } catch (error) { toast(error.message); } }
  async function sendDM(event) { event.preventDefault(); if (!currentDM) return; const input = event.currentTarget.elements.message; try { await api(`/dm/${encodeURIComponent(currentDM)}/messages`, { method: 'POST', body: { text: input.value } }); input.value = ''; await refreshDM(); } catch (error) { toast(error.message); } }

  async function refreshChats() {
    await checkSession();
    await Promise.all([refreshGeneral(), loadGroups(), loadDMs()]);
    clearInterval(pollTimer);
    if (currentUser) pollTimer = setInterval(() => { refreshGeneral(); if (currentGroup) refreshGroup(); if (currentDM) refreshDM(); loadDMs(); }, 5000);
  }

  function showChatTab(name) {
    $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.chatTab === name));
    $$('.chat-view').forEach(view => view.classList.toggle('hidden', view.id !== `chat-${name}`));
    if (name === 'general') refreshGeneral(); if (name === 'groups') loadGroups(); if (name === 'private') loadDMs();
  }

  async function runSiteScan(event) {
    event.preventDefault();
    if (!$('#scanAuthorize').checked) return toast('أكد التصريح قبل الفحص.');
    const url = $('#scanUrl').value.trim();
    const resultBox = $('#scanResults');
    resultBox.classList.remove('hidden');
    $('#scanList').textContent = 'جارٍ فحص مؤشرات الاستجابة السلبية...';
    try {
      const result = await api('/security/check', { method: 'POST', body: { url, authorized: true } });
      $('#scanList').replaceChildren();
      for (const item of result.checks) {
        const row = document.createElement('div'); row.className = 'scan-row';
        const label = document.createElement('span'); label.textContent = item.label;
        const value = document.createElement('b'); value.className = item.status === 'good' ? 'scan-ok' : item.status === 'warn' ? 'scan-warn' : 'muted'; value.textContent = item.result;
        row.append(label, value); $('#scanList').append(row);
      }
      toast('اكتمل فحص المؤشرات الـ13. راجع حدود التقرير.');
    } catch (error) { $('#scanList').textContent = error.message; }
  }

  function setupGeometry() {
    const canvas = $('#geometry'); const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 0, height = 0, particles = [], raf = 0;
    const palette = ['#63e8ff', '#9b7bff', '#ff65ce', '#6dffca', '#ffd36e', '#8fa7ff'];
    const count = Math.min(28, Math.max(12, Math.floor((window.innerWidth * window.innerHeight) / 42000)));
    function resize() { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); width = window.innerWidth; height = window.innerHeight; canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); particles = Array.from({ length: count }, () => ({ x: Math.random()*width, y: Math.random()*height, vx:(Math.random()-.5)*.20, vy:(Math.random()-.5)*.20, r:3+Math.random()*5, a:Math.random()*Math.PI, color:palette[Math.floor(Math.random()*palette.length)], type:Math.floor(Math.random()*4) })); }
    function draw() {
      ctx.clearRect(0,0,width,height);
      if (!document.body.classList.contains('no-motion')) {
        for (let i=0;i<particles.length;i++) {
          const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.a+=.003;
          if(p.x < -20) p.x=width+20; if(p.x > width+20) p.x=-20; if(p.y < -20) p.y=height+20; if(p.y > height+20) p.y=-20;
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.strokeStyle=p.color; ctx.globalAlpha=.34; ctx.lineWidth=1;
          ctx.beginPath();
          if(p.type===0){ctx.arc(0,0,p.r*1.5,0,Math.PI*2);} else if(p.type===1){ctx.rect(-p.r,-p.r,p.r*2,p.r*2);} else if(p.type===2){ctx.moveTo(0,-p.r*1.6);ctx.lineTo(p.r*1.5,p.r);ctx.lineTo(-p.r*1.5,p.r);ctx.closePath();} else {for(let j=0;j<6;j++){const a=j*Math.PI/3;const x=Math.cos(a)*p.r*1.4;const y=Math.sin(a)*p.r*1.4;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
          ctx.stroke(); ctx.restore();
          for(let j=i+1;j<particles.length;j++){const q=particles[j];const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);if(d<110){ctx.strokeStyle=p.color;ctx.globalAlpha=(1-d/110)*.09;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
        }
      }
      raf=requestAnimationFrame(draw);
    }
    resize(); draw(); window.addEventListener('resize', resize, { passive:true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!document.body.classList.contains('no-motion')) draw(); });
  }

  function bindEvents() {
    if (!API_ENABLED) {
      ['registerForm','loginForm','recoverForm','logoutButton','scanForm','generalForm',
       'createGroupForm','joinGroupForm','groupMessageForm','dmRequestForm','dmMessageForm']
        .forEach(id => {
          const node = document.getElementById(id);
          if (!node) return;
          node.querySelectorAll('input,button,textarea,select').forEach(control => { control.disabled = true; });
          if (node.matches('button')) node.disabled = true;
        });
    }
    $('#menuToggle').addEventListener('click', () => { const open = !$('#sideMenu').classList.contains('open'); $('#sideMenu').classList.toggle('open', open); $('#menuShade').classList.toggle('show', open); $('#menuToggle').setAttribute('aria-expanded', String(open)); });
    $('#menuShade').addEventListener('click', closeMenu);
    $$('.nav-item').forEach(button => button.addEventListener('click', () => openPage(button.dataset.page)));
    $$('[data-go]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.go)));
    $$('.theme-choice').forEach(button => button.addEventListener('click', () => saveSettings({ theme: button.dataset.themeChoice })));
    $('#themeQuick').addEventListener('click', async () => { const themes=['nebula','grid','aurora','cyber']; const current=document.body.dataset.theme; const next=themes[(themes.indexOf(current)+1)%themes.length]; await saveSettings({theme:next}); toast(`الخلفية: ${next}`); });
    $('#edgeSpeed').addEventListener('change', event => saveSettings({ edgeSpeed: event.target.value }));
    $('#motionToggle').addEventListener('change', event => saveSettings({ motion: event.target.checked }));
    $('#soundToggle').addEventListener('change', event => { saveSettings({ sound: event.target.checked }); if(event.target.checked) playIntroTone(); });
    $('#setLocalLock').addEventListener('click', configureLocalLock);
    $('#unlockForm').addEventListener('submit', async event => { event.preventDefault(); try { if (await unlockLocal($('#unlockPassword').value)) { showApp(); toast('تم فتح الواجهة.'); } else toast('كلمة المرور غير صحيحة.'); } catch (error) { toast(error.message); } });
    $('#resetLocalLock').addEventListener('click', async () => { if (confirm('إزالة القفل المحلي من هذا المتصفح؟')) { await store.remove('settings','localLock'); showApp(); toast('تمت إزالة القفل المحلي.'); } });
    $('#termsAccepted').addEventListener('change', event => { $('#acceptTerms').disabled = !event.target.checked; });
    $('#acceptTerms').addEventListener('click', async () => { if (!$('#termsAccepted').checked) return; await store.set('settings','termsAccepted',true); showAppNow(); toast('تم حفظ الموافقة على الشروط محليًا.'); });
    $('#skipIntro').addEventListener('click', enterAfterIntro);
    $('#registerForm').addEventListener('submit', onRegister);
    $('#loginForm').addEventListener('submit', onLogin);
    $('#recoverForm').addEventListener('submit', onRecover);
    $('#logoutButton').addEventListener('click', async () => { try { await api('/account/logout',{method:'POST',body:{}}); setAccountStatus(null); await refreshChats(); toast('تم تسجيل الخروج.'); } catch(error) { toast(error.message); } });
    $('#avatarInput').addEventListener('change', event => saveAvatar(event.target.files?.[0]).catch(error => toast(error.message)));
    $('#saveNote').addEventListener('click', saveNote);
    $('#exportLocalBackup').addEventListener('click', exportLocalBackup);
    $('#askAssistant').addEventListener('click', runLocalAssistant);
    $('#clearNote').addEventListener('click', () => { $('#noteInput').value=''; toast('تم مسح النص من المحرر؛ اضغط حفظ لتثبيت المسح.'); });
    $('#terminalForm').addEventListener('submit', event => { event.preventDefault(); const input=$('#terminalCommand'); terminalWrite(`$ ${input.value}`); runSafeTerminal(input.value); input.value=''; });
    $('#scanForm').addEventListener('submit', runSiteScan);
    $$('.tab').forEach(tab => tab.addEventListener('click', () => showChatTab(tab.dataset.chatTab)));
    $('#generalForm').addEventListener('submit', sendGeneral);
    $('#createGroupForm').addEventListener('submit', createGroup);
    $('#joinGroupForm').addEventListener('submit', joinGroup);
    $('#groupMessageForm').addEventListener('submit', sendGroup);
    $('#dmRequestForm').addEventListener('submit', createDMRequest);
    $('#dmMessageForm').addEventListener('submit', sendDM);
    window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork);
  }

  async function init() {
    bindEvents(); setupGeometry(); updateNetwork();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
    await store.ready();
    await applySettings(); await loadNote(); await loadAvatar(); updateProcessor();
    await checkSession();
    const params = new URLSearchParams(location.search);
    const invite = params.get('join');
    if (invite) { $('#joinGroupForm').elements.invite.value = invite; }
    startIntro();
  }

  init().catch(error => { console.error(error); toast(`تعذر بدء الإضافة: ${error.message}`); $('#intro').classList.add('hidden'); $('#appShell').classList.remove('hidden'); });
})();
