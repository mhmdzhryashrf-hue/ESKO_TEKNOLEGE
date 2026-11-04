/* External web search + curated Android source directory. */
(function () {
  'use strict';window.ESKO_V32=window.ESKO_V32||{};var E=window.ESKO_V32;
  var SOURCES=[
    ['F-Droid','مستودع تطبيقات مفتوحة المصدر','https://f-droid.org/'],
    ['IzzyOnDroid','مستودع إضافي لتطبيقات Android','https://apt.izzysoft.de/fdroid/'],
    ['GitHub Releases','إصدارات المشاريع من المطورين','https://github.com/topics/android-app'],
    ['Uptodown','كتالوج تطبيقات Android','https://en.uptodown.com/android'],
    ['APKMirror','أرشيف ملفات APK','https://www.apkmirror.com/'],
    ['APKPure','كتالوج تطبيقات Android','https://apkpure.com/'],
    ['Aptoide','متجر تطبيقات بديل','https://en.aptoide.com/'],
    ['APKCombo','محرك بحث لحزم Android','https://apkcombo.com/'],
    ['Fossdroid','دليل تطبيقات حرة ومفتوحة','https://fossdroid.com/'],
    ['Huawei AppGallery','متجر هواوي الرسمي','https://appgallery.huawei.com/'],
    ['Samsung Galaxy Store','متجر سامسونج الرسمي','https://galaxystore.samsung.com/'],
    ['Amazon Appstore','متجر تطبيقات أمازون','https://www.amazon.com/gp/mas/get/android'],
    ['SourceForge','استضافة المشاريع والبرامج','https://sourceforge.net/directory/mobile/']
  ];
  function search(engine){var input=document.getElementById('ev32SearchInput'),q=input?input.value.trim():'';if(!q){E.status('ev32SearchStatus','اكتب عبارة البحث أولًا.');return;}var bases={duckduckgo:'https://duckduckgo.com/?q=',google:'https://www.google.com/search?q=',bing:'https://www.bing.com/search?q='};var url=bases[engine||'duckduckgo']+encodeURIComponent(q);var win=window.open(url,'_blank','noopener,noreferrer');if(!win){E.status('ev32SearchStatus','المتصفح منع الفتح التلقائي. استخدم الرابط التالي: '+url);return;}E.status('ev32SearchStatus','تم فتح البحث في المتصفح الخارجي.');}
  function renderSources(){var root=document.getElementById('ev32SourcesList');if(!root)return;root.innerHTML='';SOURCES.forEach(function(src){var card=document.createElement('article');card.className='ev32-card';card.setAttribute('data-ev32-source',(src[0]+' '+src[1]).toLowerCase());var h=document.createElement('h3');h.textContent=src[0];var p=document.createElement('p');p.textContent=src[1];var a=document.createElement('a');a.className='ev32-link';a.href=src[2];a.target='_blank';a.rel='noopener noreferrer';a.textContent='فتح المصدر ↗';card.append(h,p,a);root.appendChild(card);});}
  function init(){var form=document.getElementById('ev32SearchForm');if(form)form.addEventListener('submit',function(ev){ev.preventDefault();search('duckduckgo');});document.querySelectorAll('[data-search-engine]').forEach(function(btn){btn.addEventListener('click',function(){search(btn.getAttribute('data-search-engine'));});});var filter=document.getElementById('ev32SourceFilter');if(filter)filter.addEventListener('input',function(){var q=filter.value.trim().toLowerCase();document.querySelectorAll('[data-ev32-source]').forEach(function(c){c.hidden=!c.getAttribute('data-ev32-source').includes(q);});});renderSources();}
  E.search=search;document.addEventListener('esko-v32-ready',init,{once:true});
})();
