/* ESKO six-section website interface preview. Local-only interactions are labeled. */
(function () {
  'use strict';
  if (window.__ESKO_SITE_V4_STARTED__) return;
  window.__ESKO_SITE_V4_STARTED__ = true;

  const STORE = {
    posts: 'esko_site_v4_posts_v1',
    bots: 'esko_site_v4_bot_drafts_v1',
    profile: 'esko_site_v4_profile_v1',
    assistant: 'esko_site_v4_assistant_drafts_v1',
    motion: 'esko_site_v4_reduce_motion_v1'
  };
  const tabs = [
    ['home','⌂','البيت'], ['bots','🤖','البوتات'], ['repos','⌘','المستودعات'],
    ['store','▣','المتجر'], ['assistant','✦','المساعد'], ['account','♙','الحساب']
  ];
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };
  const esc = value => String(value == null ? '' : value);
  const $ = (selector, root=document) => root.querySelector(selector);
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const copy = async value => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
    const field = make('textarea'); field.value = value; field.style.position='fixed'; field.style.opacity='0';
    document.body.appendChild(field); field.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    field.remove(); if (!ok) throw new Error('copy failed');
  };

  function mount() {
    if ($('#esko-site-v4')) return;
    const root = make('div'); root.id = 'esko-site-v4';
    root.innerHTML = `
      <header class="esko4-header"><div class="esko4-shell">
        <div class="esko4-topline"><div class="esko4-brand"><span class="esko4-logo">♕</span><span>ESKO OPEN HUB<small>واجهة الموقع الجديدة • معاينة أولية</small></span></div>
          <div class="esko4-head-actions"><button class="esko4-btn primary" type="button" data-go="assistant">✦ المساعد</button><button class="esko4-btn" type="button" data-legacy><span class="legacy-text">الواجهة القديمة</span> ↶</button></div>
        </div>
        <nav class="esko4-nav" role="tablist" aria-label="الأقسام الرئيسية"></nav>
      </div></header>
      <main class="esko4-shell esko4-main">
        <section class="esko4-panel active" data-panel="home" role="tabpanel">
          <div class="esko4-hero"><div><div class="esko4-kicker">ESKO • DIGITAL WORKSPACE</div><h1>كل أدواتك البرمجية في مساحة واحدة.</h1><p>واجهة موحدة للأقسام الرئيسية. التفاعلات المحلية تحفظ على هذا المتصفح فقط؛ الخدمات السحابية ستظهر كغير مفعّلة حتى يتم ربط الخادم واختباره.</p><div class="esko4-row"><button class="esko4-btn primary" type="button" data-go="repos">ابدأ مشروعًا</button><button class="esko4-btn" type="button" data-go="bots">أنشئ مسودة بوت</button></div></div><div class="esko4-eagle" aria-label="رمز النسر المتحرك" role="img">🦅</div></div>
          <div class="esko4-grid">
            <article class="esko4-card"><h3>🤖 البوتات</h3><p>احفظ مواصفات البوت وأوامره في مسودة محلية حتى 100 أمر.</p><button class="esko4-btn" type="button" data-go="bots">فتح القسم</button></article>
            <article class="esko4-card"><h3>⌘ المستودعات</h3><p>روابط GitHub واختيار ملف ZIP محليًا دون تشغيله.</p><button class="esko4-btn" type="button" data-go="repos">فتح القسم</button></article>
            <article class="esko4-card"><h3>▣ المتجر</h3><p>عرض مكتبة أوامر Termux الحالية مع توضيح أنها ليست متجر المنتجات النهائي.</p><button class="esko4-btn" type="button" data-go="store">فتح القسم</button></article>
          </div>
          <h2 class="esko4-section-title">موجز محلي تجريبي</h2>
          <div class="esko4-card"><label class="esko4-label" for="esko4-post-input">اكتب منشورًا تجريبيًا</label><textarea class="esko4-field" id="esko4-post-input" rows="3" maxlength="1200" placeholder="شارك فكرة أو تحديثًا عن مشروعك..."></textarea><div class="esko4-row" style="justify-content:space-between;margin-top:10px"><span class="esko4-pill">محلي فقط • لا يُنشر على الإنترنت</span><button class="esko4-btn primary" type="button" data-action="post">حفظ المنشور محليًا</button></div><p class="esko4-status" id="esko4-feed-status" aria-live="polite"></p></div>
          <div class="esko4-list" id="esko4-feed"></div>
        </section>

        <section class="esko4-panel" data-panel="bots" role="tabpanel">
          <div class="esko4-kicker">BOT WORKSHOP</div><h1>أنشئ بوتك</h1><p class="esko4-muted">هذا النموذج يحفظ مخطط البوت كمسودة محلية. لا ينشئ ملفًا تنفيذيًا ولا يربط Telegram أو Discord حتى يتوفر محرك البناء وخدمة المنصة.</p>
          <div class="esko4-card"><div class="esko4-form-grid">
            <div class="esko4-field-wrap"><label class="esko4-label" for="esko4-bot-name">اسم البوت</label><input class="esko4-field" id="esko4-bot-name" maxlength="80" placeholder="مثال: مساعد مشاريعي"></div>
            <div class="esko4-field-wrap"><label class="esko4-label" for="esko4-bot-platform">منصة التشغيل المستهدفة</label><select class="esko4-field" id="esko4-bot-platform"><option value="غير محددة">حدد لاحقًا</option><option>Telegram</option><option>Discord</option><option>Web / API</option></select></div>
            <div class="esko4-field-wrap" style="grid-column:1/-1"><label class="esko4-label" for="esko4-bot-description">وصف وظيفة البوت</label><textarea class="esko4-field" id="esko4-bot-description" rows="3" maxlength="2000" placeholder="اشرح ما الذي يجب أن يفعله البوت..."></textarea></div>
          </div>
          <h2 class="esko4-section-title">أوامر البوت <span class="esko4-pill">الحد الأقصى 100</span></h2><div class="esko4-command-list" id="esko4-command-list"></div>
          <div class="esko4-row"><button class="esko4-btn" type="button" data-action="add-command">＋ إضافة أمر</button><button class="esko4-btn primary" type="button" data-action="save-bot">حفظ مسودة البوت</button><button class="esko4-btn" type="button" data-action="copy-bot">نسخ مخطط البوت JSON</button></div><p class="esko4-status" id="esko4-bot-status" aria-live="polite"></p></div>
          <h2 class="esko4-section-title">المسودات المحفوظة</h2><div class="esko4-list" id="esko4-bot-drafts"></div><div class="esko4-card" id="esko4-draft-preview" hidden style="margin-top:14px"><div class="esko4-row" style="justify-content:space-between"><h3>مخطط البوت</h3><button class="esko4-btn" type="button" data-action="close-draft">إغلاق</button></div><pre class="esko4-json" id="esko4-draft-json"></pre></div>
        </section>

        <section class="esko4-panel" data-panel="repos" role="tabpanel">
          <div class="esko4-kicker">PROJECT SPACE</div><h1>المستودعات والمشاريع</h1><p class="esko4-muted">روابط وأدوات بداية. لا يتم إرسال الملفات أو تعديل GitHub تلقائيًا من هذه الواجهة.</p>
          <div class="esko4-grid">
            <article class="esko4-card"><h3>مستودع ESKO الرسمي</h3><p>المصدر الحالي للموقع وملفات المشروع.</p><a class="esko4-btn primary" href="https://github.com/mhmdzhryashrf-hue/ESKO_TEKNOLEGE" target="_blank" rel="noopener noreferrer">فتح GitHub ↗</a></article>
            <article class="esko4-card"><h3>معاينة التطبيق</h3><p>نسخة Web Preview منفصلة عن APK Android.</p><a class="esko4-btn" href="./app/v4.5/">فتح معاينة التطبيق ↗</a></article>
            <article class="esko4-card"><h3>العمل عبر Termux</h3><p>تحديث المستودع ومراجعة الفروق ثم Commit وPush من جهازك.</p><code>git pull --ff-only</code></article>
          </div>
          <div class="esko4-card" style="margin-top:16px"><h2 class="esko4-section-title" style="margin-top:0">اختيار ملف مشروع ZIP</h2><input class="esko4-field" id="esko4-zip" type="file" accept=".zip,application/zip"><p class="esko4-status" id="esko4-zip-status" aria-live="polite">يتم عرض اسم الملف وحجمه فقط. لا يجري فك الضغط أو تشغيل أي ملف.</p><div class="esko4-notice">استيراد ZIP وتحليل الملفات وعزل التنفيذ ما زالت تحتاج خدمة معالجة آمنة على الخادم؛ اختيار الملف هنا لا يرفعه لأي مكان.</div></div>
        </section>

        <section class="esko4-panel" data-panel="store" role="tabpanel">
          <div class="esko4-kicker">TOOLS LIBRARY</div><h1>المتجر ومكتبة الأدوات</h1><p class="esko4-muted">المتاح حاليًا هو بيانات أوامر Termux. هذا لا يساوي متجرًا تجاريًا بكتالوج 300 منتج أو حسابات شراء وتنزيل.</p>
          <div class="esko4-notice" id="esko4-store-note">جاري قراءة بيانات الأدوات المحلية...</div>
          <div class="esko4-row"><input class="esko4-field" style="flex:1" id="esko4-tool-search" type="search" placeholder="ابحث في أسماء أوصاف الأدوات..."><span class="esko4-pill" id="esko4-tool-count">0 عنصر</span></div>
          <div class="esko4-grid" id="esko4-tool-grid"></div>
          <div class="esko4-row" style="margin-top:16px"><button class="esko4-btn" type="button" data-action="more-tools">عرض المزيد</button></div>
        </section>

        <section class="esko4-panel" data-panel="assistant" role="tabpanel">
          <div class="esko4-kicker">AI WORKSPACE</div><h1>المساعد الذكي</h1>
          <div class="esko4-card"><span class="esko4-pill">غير متصل حاليًا</span><h3 style="margin-top:12px">واجهة المساعد جاهزة للربط، لكن نموذج AI غير مهيأ في الموقع.</h3><p>المستودع الحالي لا يحتوي على عنوان Backend أو مفتاح خدمة آمن. لن أعرض ردودًا ثابتة على أنها ذكاء اصطناعي، ولن أرسل نصك إلى خدمة خارجية.</p><label class="esko4-label" for="esko4-assistant-draft">احفظ طلبًا تريد إرساله للمساعد بعد ربط الخدمة</label><textarea class="esko4-field" id="esko4-assistant-draft" rows="5" maxlength="5000" placeholder="اكتب وصف المهمة أو المشكلة..."></textarea><div class="esko4-row" style="margin-top:10px"><button class="esko4-btn primary" type="button" data-action="save-assistant">حفظ الطلب محليًا</button><span class="esko4-pill">لا يوجد إرسال خارجي</span></div><p class="esko4-status" id="esko4-assistant-status" aria-live="polite"></p></div>
          <div class="esko4-grid"><article class="esko4-card"><h3>مطلوب للربط</h3><p>خادم API ونموذج AI ومفتاح محفوظ على الخادم وحدود استخدام.</p></article><article class="esko4-card"><h3>قبل تفعيل التعديل</h3><p>عرض الخطة والملفات المتأثرة والفرق والاختبارات قبل اعتماد التغييرات.</p></article><article class="esko4-card"><h3>حماية المشروع</h3><p>عدم إرسال الملفات أو الأسرار إلى أي خدمة خارجية دون إذن واضح.</p></article></div>
        </section>

        <section class="esko4-panel" data-panel="account" role="tabpanel">
          <div class="esko4-kicker">YOUR LOCAL PROFILE</div><h1>الحساب والإعدادات</h1><p class="esko4-muted">لا يوجد تسجيل دخول سحابي في هذه النسخة. البيانات التالية تحفظ محليًا على هذا الجهاز والمتصفح فقط.</p>
          <div class="esko4-card"><div class="esko4-form-grid"><div><label class="esko4-label" for="esko4-profile-name">اسم العرض</label><input class="esko4-field" id="esko4-profile-name" maxlength="80" placeholder="اسم العرض"></div><div><label class="esko4-label" for="esko4-profile-language">لغة الواجهة</label><select class="esko4-field" id="esko4-profile-language"><option value="ar">العربية</option><option value="en">English (واجهة جزئية)</option></select></div></div><div class="esko4-row" style="margin-top:14px"><label><input id="esko4-reduce-motion" type="checkbox"> تقليل الحركة</label><button class="esko4-btn primary" type="button" data-action="save-profile">حفظ الإعدادات المحلية</button><a class="esko4-btn" href="https://wa.me/201128530613" target="_blank" rel="noopener noreferrer">الدعم ↗</a></div><p class="esko4-status" id="esko4-profile-status" aria-live="polite"></p></div>
          <div class="esko4-notice">الكتب: تحت الإنشاء. إعدادات الحساب السحابي والخصوصية وإدارة الجلسات تنتظر Backend موحدًا.</div>
        </section>
      </main>
      <nav class="esko4-bottom-nav" role="tablist" aria-label="التنقل السفلي"></nav>
      <footer class="esko4-footer esko4-shell">ESKO OPEN HUB • واجهة تحديث أولية<br>المنشورات والمسودات والملف الشخصي تحفظ محليًا فقط. لا يوجد اتصال بقاعدة بيانات أو خدمة AI في هذه النسخة.</footer>`;
    document.body.appendChild(root);
    const returnBtn = make('button','esko4-btn primary','↗ فتح واجهة التحديث'); returnBtn.id='esko-v4-return'; returnBtn.hidden=true; document.body.appendChild(returnBtn);
    renderTabs(root.querySelector('.esko4-nav'),root);
    renderTabs(root.querySelector('.esko4-bottom-nav'),root);
    bind(root,returnBtn);
    renderPosts(); renderBotDrafts(); initCommands(); renderTools(); loadProfile();
    document.body.classList.add('esko-v4-active');
    if (read(STORE.motion,false)) document.body.classList.add('esko4-reduce-motion');
  }

  function renderTabs(nav,root) {
    tabs.forEach(([id,icon,label])=>{
      const button=make('button','esko4-tab'); button.type='button'; button.dataset.go=id; button.setAttribute('role','tab'); button.setAttribute('aria-selected',String(id==='home'));
      button.innerHTML='<span aria-hidden="true">'+icon+'</span><span>'+label+'</span>'; nav.appendChild(button);
    });
  }
  function go(name) {
    document.querySelectorAll('#esko-site-v4 .esko4-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===name));
    document.querySelectorAll('#esko-site-v4 [data-go]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.go===name)));
    const panel=$('#esko-site-v4 [data-panel="'+name+'"]'); if(panel) panel.scrollIntoView({block:'start',behavior:document.body.classList.contains('esko4-reduce-motion')?'auto':'smooth'});
  }
  function bind(root,returnBtn) {
    root.addEventListener('click',async event=>{
      const goBtn=event.target.closest('[data-go]'); if(goBtn){go(goBtn.dataset.go);return;}
      if(event.target.closest('[data-legacy]')){root.hidden=true;document.body.classList.remove('esko-v4-active');returnBtn.hidden=false;window.scrollTo(0,0);return;}
      const button=event.target.closest('[data-action]'); if(!button)return;
      const action=button.dataset.action;
      if(action==='post') addPost();
      else if(action==='like') toggleLike(button.dataset.id);
      else if(action==='comment') commentPost(button.dataset.id);
      else if(action==='share') sharePost(button.dataset.id);
      else if(action==='add-command') addCommand();
      else if(action==='save-bot') saveBot();
      else if(action==='copy-bot') copyBot();
      else if(action==='remove-command') button.closest('.esko4-command-row')?.remove();
      else if(action==='open-draft') showBotDraft(button.dataset.id);
      else if(action==='close-draft') { $('#esko4-draft-preview').hidden=true; }
      else if(action==='save-assistant') saveAssistant();
      else if(action==='save-profile') saveProfile();
      else if(action==='more-tools') { toolLimit+=20; renderTools(); }
    });
    returnBtn.addEventListener('click',()=>{root.hidden=false;document.body.classList.add('esko-v4-active');returnBtn.hidden=true;go('home');});
    $('#esko4-zip',root).addEventListener('change',event=>{const file=event.target.files&&event.target.files[0];$('#esko4-zip-status').textContent=file?('تم اختيار '+file.name+' ('+formatBytes(file.size)+'). لم يتم رفعه أو فك ضغطه.'): 'لم يتم اختيار ملف.';});
    $('#esko4-tool-search',root).addEventListener('input',renderTools);
    $('#esko4-reduce-motion',root).addEventListener('change',event=>{document.body.classList.toggle('esko4-reduce-motion',event.target.checked);write(STORE.motion,event.target.checked);});
  }
  function formatBytes(n) { if(!Number.isFinite(n))return ''; const units=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<units.length-1){n/=1024;i++;} return n.toFixed(i?1:0)+' '+units[i]; }

  function getPosts(){const value=read(STORE.posts,[]);return Array.isArray(value)?value:[];}
  function renderPosts(){
    const list=$('#esko4-feed'); if(!list)return; list.replaceChildren(); const posts=getPosts().slice().reverse();
    if(!posts.length){const empty=make('p','esko4-muted','لا توجد منشورات محفوظة بعد. اكتب أول منشور تجريبي.');list.appendChild(empty);return;}
    posts.forEach(post=>{
      const card=make('article','esko4-post'); const meta=make('div','esko4-row'); meta.append(make('span','esko4-pill',post.author||'زائر محلي'),make('span','esko4-pill',new Date(post.createdAt).toLocaleString('ar')));
      const text=make('p','esko4-post-text',post.text); const actions=make('div','esko4-post-actions');
      [['like',(post.liked?'♥':'♡')+' '+(post.likes||0)],['comment','تعليق'],['share','مشاركة']].forEach(([action,label])=>{const b=make('button','esko4-btn',label);b.type='button';b.dataset.action=action;b.dataset.id=post.id;actions.appendChild(b);});
      card.append(meta,text,actions); if(post.comment){const c=make('p','esko4-muted','آخر تعليق محلي: '+post.comment);card.appendChild(c);} list.appendChild(card);
    });
  }
  function addPost(){const input=$('#esko4-post-input'),status=$('#esko4-feed-status');const text=input.value.trim();if(!text){status.textContent='اكتب محتوى المنشور أولًا.';return;}const posts=getPosts();posts.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),text,author:'مستخدم الجهاز',createdAt:new Date().toISOString(),likes:0,comment:''});if(write(STORE.posts,posts)){input.value='';status.textContent='تم حفظ المنشور على هذا الجهاز فقط.';renderPosts();}else status.textContent='تعذر الحفظ المحلي؛ مساحة التخزين قد تكون ممتلئة.';}
  function updatePost(id,fn){const posts=getPosts();const item=posts.find(x=>x.id===id);if(!item)return;fn(item);write(STORE.posts,posts);renderPosts();}
  function toggleLike(id){updatePost(id,post=>{post.liked=!post.liked;post.likes=Math.max(0,(post.likes||0)+(post.liked?1:-1));});}
  function commentPost(id){const value=window.prompt('اكتب تعليقًا محليًا:');if(value&&value.trim())updatePost(id,post=>{post.comment=value.trim().slice(0,500);});}
  async function sharePost(id){const post=getPosts().find(x=>x.id===id);if(!post)return;const text=post.text;try{if(navigator.share)await navigator.share({title:'ESKO',text});else{await copy(text);window.alert('تم نسخ نص المنشور.');}}catch(_){}}

  function initCommands(){if($('#esko4-command-list')?.children.length)return;addCommand();}
  function addCommand(){const list=$('#esko4-command-list');if(!list)return;if(list.children.length>=100){$('#esko4-bot-status').textContent='وصلت إلى الحد الأقصى: 100 أمر.';return;}
    const row=make('div','esko4-command-row');row.innerHTML='<input class="esko4-field" maxlength="80" aria-label="اسم الأمر" placeholder="اسم الأمر أو /start"><input class="esko4-field" maxlength="500" aria-label="وصف تنفيذ الأمر" placeholder="ما الذي يجب أن ينفذه الأمر؟"><button class="esko4-btn danger" type="button" data-action="remove-command" aria-label="حذف الأمر">حذف</button>';list.appendChild(row);$('#esko4-bot-status').textContent='عدد الأوامر: '+list.children.length+' / 100';}
  function readBotForm(){const commands=[...$('#esko4-command-list').children].map(row=>{const fields=row.querySelectorAll('input');return {name:fields[0].value.trim(),description:fields[1].value.trim()};}).filter(x=>x.name||x.description);return {id:String(Date.now()),name:$('#esko4-bot-name').value.trim(),description:$('#esko4-bot-description').value.trim(),platform:$('#esko4-bot-platform').value,commands,createdAt:new Date().toISOString(),type:'local-draft'};}
  function saveBot(){const draft=readBotForm();const status=$('#esko4-bot-status');if(!draft.name){status.textContent='اكتب اسم البوت أولًا.';return;}if(!draft.description){status.textContent='اكتب وصف وظيفة البوت.';return;}if(!draft.commands.length){status.textContent='أضف أمرًا واحدًا على الأقل.';return;}if(draft.commands.length>100){status.textContent='تجاوز عدد الأوامر الحد الأقصى.';return;}const items=read(STORE.bots,[]);items.push(draft);if(write(STORE.bots,items)){status.textContent='تم حفظ مسودة البوت محليًا. لم يتم إنشاء بوت قابل للتشغيل.';renderBotDrafts();}else status.textContent='تعذر حفظ المسودة على الجهاز.';}
  async function copyBot(){const draft=readBotForm();if(!draft.name||!draft.description){$('#esko4-bot-status').textContent='أدخل الاسم والوصف قبل نسخ المخطط.';return;}try{await copy(JSON.stringify(draft,null,2));$('#esko4-bot-status').textContent='تم نسخ مخطط JSON فقط؛ ليس برنامج بوت قابلًا للتشغيل.';}catch(_){$('#esko4-bot-status').textContent='تعذر النسخ من المتصفح.';}}
  function renderBotDrafts(){const root=$('#esko4-bot-drafts');if(!root)return;root.replaceChildren();const items=read(STORE.bots,[]);if(!items.length){root.appendChild(make('p','esko4-muted','لا توجد مسودات محفوظة.'));return;}items.slice().reverse().forEach(item=>{const card=make('article','esko4-card');card.append(make('h3','',item.name),make('p','',item.description),make('span','esko4-pill',(item.platform||'غير محددة')+' • '+item.commands.length+' أمر'));const btn=make('button','esko4-btn','عرض المخطط');btn.type='button';btn.dataset.action='open-draft';btn.dataset.id=item.id;card.appendChild(btn);root.appendChild(card);});}
  function showBotDraft(id){const item=read(STORE.bots,[]).find(x=>x.id===id);if(!item)return;const box=$('#esko4-draft-preview'),pre=$('#esko4-draft-json');pre.textContent=JSON.stringify(item,null,2);box.hidden=false;box.scrollIntoView({block:'nearest',behavior:document.body.classList.contains('esko4-reduce-motion')?'auto':'smooth'});}

  function renderTools(){const grid=$('#esko4-tool-grid');if(!grid)return;const all=Array.isArray(window.ESKO_V31_TOOLS)?window.ESKO_V31_TOOLS:[];const query=($('#esko4-tool-search')?.value||'').trim().toLowerCase();const filtered=all.filter(item=>(String(item.name)+' '+String(item.description)+' '+String(item.category)).toLowerCase().includes(query));const count=$('#esko4-tool-count');if(count)count.textContent=filtered.length+' عنصر';const note=$('#esko4-store-note');if(note)note.textContent=all.length?'المتاح الآن: '+all.length+' بطاقة أوامر من بيانات Termux. ليست منتجات متجر، ولا يوجد شراء أو تثبيت تلقائي.':'لم تُحمّل بيانات أدوات Termux في هذه الصفحة.';grid.replaceChildren();filtered.slice(0,toolLimit).forEach(item=>{const card=make('article','esko4-card');card.append(make('h3','',item.name),make('p','',item.description),make('span','esko4-pill',item.category||'أداة'));grid.appendChild(card);});}
  let toolLimit=12;
  function saveAssistant(){const value=$('#esko4-assistant-draft').value.trim();const status=$('#esko4-assistant-status');if(!value){status.textContent='اكتب الطلب قبل الحفظ.';return;}const items=read(STORE.assistant,[]);items.push({text:value,createdAt:new Date().toISOString()});if(write(STORE.assistant,items)){status.textContent='تم حفظ الطلب كمسودة محلية. لم يتم إرساله إلى أي نموذج.';$('#esko4-assistant-draft').value='';}else status.textContent='تعذر الحفظ المحلي.';}
  function loadProfile(){const data=read(STORE.profile,{});if($('#esko4-profile-name'))$('#esko4-profile-name').value=data.name||'';if($('#esko4-profile-language'))$('#esko4-profile-language').value=data.language||'ar';if($('#esko4-reduce-motion'))$('#esko4-reduce-motion').checked=!!read(STORE.motion,false);}
  function saveProfile(){const data={name:$('#esko4-profile-name').value.trim(),language:$('#esko4-profile-language').value};if(write(STORE.profile,data))$('#esko4-profile-status').textContent='تم حفظ الإعدادات محليًا على هذا الجهاز.';else $('#esko4-profile-status').textContent='تعذر الحفظ المحلي.';}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
