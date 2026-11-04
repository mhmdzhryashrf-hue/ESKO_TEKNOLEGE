/* Safe educational Termux command cards. Commands are copied, never auto-executed. */
(function () {
  'use strict';
  window.ESKO_V32=window.ESKO_V32||{};var E=window.ESKO_V32;
  var COMMANDS=[
    ['معلومات النظام','عرض إصدار Android وبيئة Termux.','uname -a'],
    ['تحديث قائمة الحزم','تحديث فهرس الحزم قبل تثبيت البرامج.','pkg update'],
    ['تثبيت أدوات التطوير','أدوات Python وNode.js وGit من مستودعات Termux.','pkg install python nodejs git'],
    ['مجلد العمل','إنشاء مجلد لمشاريعك ثم الدخول إليه.','mkdir -p ~/projects && cd ~/projects'],
    ['فحص إصدار Node.js','عرض إصدار Node وnpm المثبتين.','node --version && npm --version'],
    ['فحص إصدار Python','عرض إصدار Python المثبت.','python --version'],
    ['طلب صلاحية الملفات','طلب إذن الوصول لمساحة الملفات المشتركة من Android.','termux-setup-storage'],
    ['فحص صياغة JavaScript','التحقق من الملف قبل تشغيله.','node --check app.js']
  ];
  function render(){var root=document.getElementById('ev32TermuxList');if(!root)return;root.innerHTML='';COMMANDS.forEach(function(item){var card=document.createElement('article');card.className='ev32-card';var h=document.createElement('h3');h.textContent=item[0];var p=document.createElement('p');p.textContent=item[1];var code=document.createElement('code');code.className='ev32-code';code.textContent=item[2];var btn=document.createElement('button');btn.className='ev32-btn';btn.type='button';btn.textContent='نسخ الأمر';btn.addEventListener('click',function(){E.copy(item[2],btn);});card.append(h,p,code,btn);root.appendChild(card);});}
  document.addEventListener('esko-v32-ready',render,{once:true});
})();
