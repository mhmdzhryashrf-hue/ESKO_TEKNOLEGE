/* ESKO V3.2 encrypted local vault using Web Crypto AES-256-GCM + PBKDF2. */
(function () {
  'use strict';
  window.ESKO_V32 = window.ESKO_V32 || {};
  var E=window.ESKO_V32; var STORE='esko_v32_vault_ciphertext_v1'; var ROUNDS=310000;
  function toB64(bytes){var s='';bytes.forEach(function(v){s+=String.fromCharCode(v);});return btoa(s);}
  function fromB64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
  function random(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return a;}
  async function keyFor(password,salt){var m=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:ROUNDS,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
  function status(t){E.status('ev32VaultStatus',t);}
  async function save(){
    var pass=document.getElementById('ev32VaultPassword').value;var value=document.getElementById('ev32VaultText').value;
    if(pass.length<10){status('استخدم كلمة مرور للخزنة لا تقل عن 10 أحرف.');return;}
    if(!crypto.subtle){status('Web Crypto غير متاح؛ لم يتم حفظ بيانات غير مشفرة.');return;}
    try{var salt=random(16),iv=random(12),key=await keyFor(pass,salt);var cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv,tagLength:128},key,new TextEncoder().encode(value));
      localStorage.setItem(STORE,JSON.stringify({version:1,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',rounds:ROUNDS,salt:toB64(salt),iv:toB64(iv),ciphertext:toB64(new Uint8Array(cipher)),updatedAt:Date.now()}));
      status('تم تشفير الخزنة وحفظ النص المشفر محليًا.');
    }catch(err){status('فشل التشفير أو التخزين المحلي؛ لم يتم حفظ النص كبديل غير مشفر.');}
  }
  async function open(){
    var pass=document.getElementById('ev32VaultPassword').value;var raw=localStorage.getItem(STORE);
    if(!pass){status('اكتب كلمة مرور الخزنة أولًا.');return;}if(!raw){status('لا توجد خزنة محفوظة على هذا الجهاز.');return;}
    try{var box=JSON.parse(raw);var key=await keyFor(pass,fromB64(box.salt));var plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(box.iv),tagLength:128},key,fromB64(box.ciphertext));
      document.getElementById('ev32VaultText').value=new TextDecoder().decode(plain);status('تم فك التشفير وفتح الخزنة مؤقتًا في الواجهة.');
    }catch(err){status('كلمة المرور غير صحيحة أو بيانات الخزنة تالفة.');}
  }
  function remove(){if(!window.confirm('حذف النسخة المشفرة من هذا الجهاز نهائيًا؟'))return;localStorage.removeItem(STORE);document.getElementById('ev32VaultText').value='';status('تم حذف بيانات الخزنة المشفرة.');}
  function init(){var a=document.querySelector('[data-vault-save]'),b=document.querySelector('[data-vault-open]'),c=document.querySelector('[data-vault-delete]');if(a)a.addEventListener('click',save);if(b)b.addEventListener('click',open);if(c)c.addEventListener('click',remove);}
  document.addEventListener('esko-v32-ready',init,{once:true});
  document.addEventListener('esko-v32-lock',function(){var p=document.getElementById('ev32VaultPassword'),t=document.getElementById('ev32VaultText');if(p)p.value='';if(t)t.value='';});
})();
