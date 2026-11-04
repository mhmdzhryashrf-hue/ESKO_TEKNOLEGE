/* ESKO V3.2 local UI gate. This is not a replacement for native Android authentication. */
(function () {
  'use strict';
  window.ESKO_V32 = window.ESKO_V32 || {};
  var E = window.ESKO_V32;
  var AUTH_KEY = 'esko_v32_auth_record_v1';
  var FAIL_KEY = 'esko_v32_auth_failures_v1';
  var TRUST_KEY = 'esko_v32_trust_until_v1';
  var SESSION_KEY = 'esko_v32_session_until_v1';
  var PBKDF2_ROUNDS = 310000;
  var SESSION_MS = 15 * 60 * 1000;
  var TRUST_MS = 7 * 24 * 60 * 60 * 1000;
  var LOCK_MS = 15 * 60 * 1000;
  function bytesToB64(bytes) { var bin=''; bytes.forEach(function (b) { bin += String.fromCharCode(b); }); return btoa(bin); }
  function b64ToBytes(value) { var bin=atob(value); var out=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i); return out; }
  function randomBytes(length) { var out=new Uint8Array(length); crypto.getRandomValues(out); return out; }
  async function derive(password, salt) {
    var material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:PBKDF2_ROUNDS,hash:'SHA-256'}, material, 256));
  }
  function equal(a,b) { if(a.length!==b.length) return false; var diff=0; for(var i=0;i<a.length;i++) diff |= a[i]^b[i]; return diff===0; }
  function readRecord() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); } catch (_) { return null; } }
  function showGate(mode, message) {
    var gate=document.getElementById('eskoV32Gate'); if(!gate) return;
    gate.hidden=false;
    var setup=mode==='setup';
    gate.innerHTML='<div class="ev32-gate-card"><div class="ev32-kicker">ESKO OPEN HUB • V3.2</div><h2>'+(setup?'إنشاء قفل التطبيق':'تسجيل الدخول')+'</h2><p class="ev32-desc">'+(setup?'أنشئ كلمة مرور خاصة بك. لا توجد كلمة مرور افتراضية ولا يتم إرسالها إلى أي خادم.':'أدخل كلمة المرور لفتح جلسة التطبيق.')+'</p>'+
      (message?'<p class="ev32-status" role="alert">'+E.escapeHTML(message)+'</p>':'')+
      (setup?'<input id="ev32Pass1" class="ev32-field" type="password" minlength="10" maxlength="128" autocomplete="new-password" placeholder="كلمة المرور — 10 أحرف على الأقل"><input id="ev32Pass2" class="ev32-field" type="password" minlength="10" maxlength="128" autocomplete="new-password" placeholder="تأكيد كلمة المرور">':'<input id="ev32Pass1" class="ev32-field" type="password" maxlength="128" autocomplete="current-password" placeholder="كلمة المرور">')+
      (setup?'<label class="ev32-check"><input id="ev32Terms" type="checkbox"><span>أوافق على شروط الاستخدام: أستخدم الأدوات بمسؤولية، وأتحقق من المصادر، ولا أضع أسرارًا في الملاحظات العادية.</span></label>':'<label class="ev32-check"><input id="ev32Trust" type="checkbox"><span>تذكر هذا الجهاز لمدة 7 أيام (ثقة محلية على هذا الجهاز فقط).</span></label>')+
      '<button id="ev32AuthSubmit" class="ev32-btn" type="button">'+(setup?'إنشاء القفل':'دخول')+'</button><p id="ev32AuthStatus" class="ev32-small">'+(setup?'احفظ كلمة المرور في مكان آمن؛ لا توجد استعادة تلقائية.':'بعد 5 محاولات فاشلة يتم تفعيل مهلة قفل.')+'</p></div>';
    gate.querySelector('#ev32AuthSubmit').addEventListener('click',function(){ if(setup) createPassword(); else login(); });
  }
  function unlock() {
    var gate=document.getElementById('eskoV32Gate'); if(gate) gate.hidden=true;
    var expiry=Date.now()+SESSION_MS; try { sessionStorage.setItem(SESSION_KEY,String(expiry)); } catch (_) {}
    E.open(); resetTimer();
  }
  async function createPassword() {
    var p1=document.getElementById('ev32Pass1').value;
    var p2=document.getElementById('ev32Pass2').value;
    var accepted=document.getElementById('ev32Terms').checked;
    if(p1.length<10){showGate('setup','كلمة المرور لازم تكون 10 أحرف على الأقل.');return;}
    if(p1!==p2){showGate('setup','كلمتا المرور غير متطابقتين.');return;}
    if(!accepted){showGate('setup','لازم توافق على شروط الاستخدام قبل الدخول.');return;}
    try {
      var salt=randomBytes(16); var verifier=await derive(p1,salt);
      localStorage.setItem(AUTH_KEY,JSON.stringify({version:1,algorithm:'PBKDF2-SHA256',rounds:PBKDF2_ROUNDS,salt:bytesToB64(salt),verifier:bytesToB64(verifier),termsAcceptedAt:Date.now()}));
      unlock();
    } catch (error) { showGate('setup','تعذر تشغيل التشفير الآمن في بيئة التطبيق. يلزم تفعيل Web Crypto أو دمج Android Keystore Native.'); }
  }
  async function login() {
    var input=document.getElementById('ev32Pass1'); var password=input?input.value:'';
    var fail={count:0,until:0}; try{fail=JSON.parse(localStorage.getItem(FAIL_KEY)||'{}');}catch(_){}
    if(Date.now()<Number(fail.until||0)){showGate('login','محاولات كثيرة. جرّب بعد انتهاء مهلة القفل.');return;}
    try {
      var record=readRecord(); if(!record) {showGate('setup','لم يتم إنشاء قفل بعد.');return;}
      var actual=await derive(password,b64ToBytes(record.salt));
      if(equal(actual,b64ToBytes(record.verifier))){localStorage.removeItem(FAIL_KEY);if(document.getElementById('ev32Trust').checked)localStorage.setItem(TRUST_KEY,String(Date.now()+TRUST_MS));unlock();return;}
      fail.count=Number(fail.count||0)+1;
      if(fail.count>=5){fail.until=Date.now()+LOCK_MS;fail.count=0;}
      localStorage.setItem(FAIL_KEY,JSON.stringify(fail));
      showGate('login',fail.until?'تم تفعيل مهلة القفل لمدة 15 دقيقة.':'كلمة المرور غير صحيحة.');
    } catch (error) { showGate('login','تعذرت عملية التحقق الآمن.'); }
  }
  function lock(showMessage) {
    if (!E.isAndroidApp) return;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
    E.close(); document.dispatchEvent(new CustomEvent('esko-v32-lock')); showGate('login',showMessage?'تم قفل الجلسة.':'');
  }
  var timer=null;
  function resetTimer() {
    if(timer) clearTimeout(timer);
    timer=setTimeout(function(){lock(true);},SESSION_MS);
  }
  function init() {
    if(!E.isAndroidApp) { var lockButton=document.querySelector('[data-ev32-lock]'); if(lockButton) lockButton.hidden=true; return; }
    if(!window.crypto||!crypto.subtle||!crypto.getRandomValues){showGate('setup','بيئة Web Crypto غير متاحة. لم يتم تجاوز القفل تلقائيًا. يلزم دمج طبقة Android Native/Keystore.');return;}
    var record=readRecord(); var trusted=0; var session=0;
    try{trusted=Number(localStorage.getItem(TRUST_KEY)||0);session=Number(sessionStorage.getItem(SESSION_KEY)||0);}catch(_){}
    if(record && (session>Date.now()||trusted>Date.now())) { var gate=document.getElementById('eskoV32Gate'); if(gate)gate.hidden=true; E.open(); resetTimer(); }
    else showGate(record?'login':'setup','');
    ['click','keydown','touchstart'].forEach(function(evt){document.addEventListener(evt,function(){if(!document.getElementById('eskoV32Gate').hidden) return; resetTimer();},{passive:true});});
  }
  E.Auth={lock:lock,init:init};
  document.addEventListener('esko-v32-ready',init,{once:true});
})();
