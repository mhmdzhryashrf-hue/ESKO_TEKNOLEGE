/* Local notes + support link. Ordinary notes are local but NOT encrypted. */
(function () {
  'use strict';window.ESKO_V32=window.ESKO_V32||{};var KEY='esko_v32_local_notes_v1';
  function init(){var area=document.getElementById('ev32Notes'),status=document.getElementById('ev32NotesStatus'),clear=document.querySelector('[data-notes-clear]'),support=document.querySelector('[data-ev32-support]');if(!area)return;
    try{area.value=localStorage.getItem(KEY)||'';}catch(_){status.textContent='تعذر قراءة التخزين المحلي.';}
    var saveTimer=null;area.addEventListener('input',function(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(function(){try{localStorage.setItem(KEY,area.value);status.textContent='تم الحفظ محليًا تلقائيًا.';}catch(_){status.textContent='فشل الحفظ؛ انسخ النص للاحتفاظ به.';}},250);});
    if(clear)clear.addEventListener('click',function(){if(!confirm('هل تريد مسح الملاحظات المحفوظة؟'))return;area.value='';localStorage.removeItem(KEY);status.textContent='تم المسح.';});
    if(support)support.addEventListener('click',function(){var msg='مرحبًا دعم ESKO، أحتاج مساعدة في ESKO OPEN HUB V3.2.';location.href='https://wa.me/201128530613?text='+encodeURIComponent(msg);});
  }
  document.addEventListener('esko-v32-ready',init,{once:true});
})();
