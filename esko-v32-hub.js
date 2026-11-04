/* ESKO OPEN HUB V3.2 core interface. Does not rewrite existing application pages. */
(function () {
  'use strict';
  window.ESKO_V32 = window.ESKO_V32 || {};
  var E = window.ESKO_V32;
  E.version = '3.2';
  E.isAndroidApp = location.protocol === 'file:' && /Android/i.test(navigator.userAgent || '');
  E.escapeHTML = function (value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);
    });
  };
  E.status = function (id, message) {
    var node = document.getElementById(id);
    if (node) node.textContent = String(message || '');
  };
  E.copy = async function (text, button) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(text));
        if (button) button.textContent = 'تم النسخ';
        return true;
      }
    } catch (_) {}
    var field = document.createElement('textarea');
    field.value = String(text); field.style.position = 'fixed'; field.style.opacity = '0';
    document.body.appendChild(field); field.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    field.remove();
    if (button) button.textContent = ok ? 'تم النسخ' : 'انسخ يدويًا';
    return ok;
  };
  E.open = function () {
    var panel = document.getElementById('eskoV32Overlay');
    if (panel) { panel.hidden = false; panel.setAttribute('aria-hidden', 'false'); }
  };
  E.close = function () {
    var panel = document.getElementById('eskoV32Overlay');
    if (panel) { panel.hidden = true; panel.setAttribute('aria-hidden', 'true'); }
  };
  E.go = function (name) {
    document.querySelectorAll('#eskoV32Window .ev32-page').forEach(function (page) {
      page.classList.toggle('active', page.getAttribute('data-ev32-page') === name);
    });
    document.querySelectorAll('#eskoV32Window .ev32-nav button').forEach(function (button) {
      button.setAttribute('aria-selected', button.getAttribute('data-ev32-go') === name ? 'true' : 'false');
    });
    var main = document.querySelector('#eskoV32Window .ev32-main');
    if (main) main.scrollTop = 0;
  };
  function build() {
    if (document.getElementById('eskoV32Launcher')) return;
    var launcher = document.createElement('button');
    launcher.id = 'eskoV32Launcher'; launcher.type = 'button'; launcher.textContent = '🃏 ESKO V3.2';
    launcher.setAttribute('aria-label', 'فتح منظومة ESKO V3.2'); launcher.addEventListener('click', E.open);
    var overlay = document.createElement('div'); overlay.id = 'eskoV32Overlay'; overlay.hidden = true; overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <section id="eskoV32Window" role="dialog" aria-modal="true" aria-label="ESKO OPEN HUB V3.2">
        <header class="ev32-head"><div class="ev32-brand">🃏 ESKO OPEN HUB<small>OFFICIAL ECOSYSTEM • V3.2</small></div>
          <div class="ev32-head-actions"><button class="ev32-icon-btn" type="button" data-ev32-lock title="قفل الجلسة">🔒</button><button class="ev32-icon-btn" type="button" data-ev32-close aria-label="إغلاق">×</button></div>
        </header>
        <nav class="ev32-nav" aria-label="أقسام ESKO">
          <button type="button" data-ev32-go="home" aria-selected="true">الرئيسية</button>
          <button type="button" data-ev32-go="termux" aria-selected="false">♕ تريمكس ♕</button>
          <button type="button" data-ev32-go="search" aria-selected="false">بحث الويب</button>
          <button type="button" data-ev32-go="downloads" aria-selected="false">التنزيلات</button>
          <button type="button" data-ev32-go="notes" aria-selected="false">ملاحظاتي</button>
          <button type="button" data-ev32-go="vault" aria-selected="false">الخزنة</button>
        </nav>
        <main class="ev32-main">
          <section class="ev32-page active" data-ev32-page="home">
            <div class="ev32-hero"><div class="ev32-kicker">TECHNOLOGY • ENGINEERING • DEVELOPMENT</div><h2 class="ev32-title">منظومة ESKO الرسمية</h2><p class="ev32-desc">مساحة إضافية مستقلة لأدوات Termux والبحث ومصادر التطبيقات والملاحظات والخزنة المشفرة. تم الحفاظ على واجهة المشروع الأصلية وبيانات الأدوات الحالية.</p></div>
            <div class="ev32-grid">
              <article class="ev32-card"><h3>♕ تريمكس ♕</h3><p>أوامر تعليمية قابلة للنسخ بدون تنفيذ تلقائي.</p><button class="ev32-btn" data-ev32-jump="termux">فتح القسم</button></article>
              <article class="ev32-card"><h3>⌕ بحث الويب</h3><p>فتح نتائج البحث في المتصفح بدل إطار قد تمنعه المواقع.</p><button class="ev32-btn" data-ev32-jump="search">ابدأ البحث</button></article>
              <article class="ev32-card"><h3>⇩ مصادر التطبيقات</h3><p>13 مصدرًا للعثور على صفحات التطبيقات الرسمية.</p><button class="ev32-btn" data-ev32-jump="downloads">عرض المصادر</button></article>
              <article class="ev32-card"><h3>▤ ملاحظاتي</h3><p>حفظ محلي تلقائي على الجهاز أو المتصفح الحالي.</p><button class="ev32-btn" data-ev32-jump="notes">فتح المذكرة</button></article>
              <article class="ev32-card"><h3>🔐 خزنة ESKO</h3><p>تشفير محلي باستخدام Web Crypto عند دعمه.</p><button class="ev32-btn" data-ev32-jump="vault">فتح الخزنة</button></article>
              <article class="ev32-card"><h3>🧰 أدوات المشروع</h3><p>الأدوات الأصلية الـ900 محفوظة في واجهتها الحالية دون استبدال.</p><p class="ev32-small">استخدم قسم الأدوات الأصلي في الصفحة الرئيسية.</p></article>
            </div>
            <div class="ev32-note">تنبيه: بوابة الواجهة تمنع الاستخدام العادي دون كلمة المرور، لكنها ليست حماية ضد تعديل ملفات التطبيق. الحماية الحساسة تحتاج طبقة Android Native وAndroid Keystore.</div>
          </section>
          <section class="ev32-page" data-ev32-page="termux"><div class="ev32-kicker">TERMUX WORKSPACE</div><h2 class="ev32-title">♕ تريمكس ♕</h2><p class="ev32-desc">أوامر أساسية للتعلّم وإعداد بيئة التطوير. لا يتم تشغيل أي أمر تلقائيًا.</p><div id="ev32TermuxList" class="ev32-list"></div></section>
          <section class="ev32-page" data-ev32-page="search"><div class="ev32-kicker">WEB SEARCH</div><h2 class="ev32-title">بحث الويب</h2><p class="ev32-desc">البحث يفتح في المتصفح لتجنب مشاكل تحميل صفحات البحث داخل WebView.</p><form id="ev32SearchForm"><input id="ev32SearchInput" class="ev32-field" type="search" maxlength="300" placeholder="اكتب عبارة البحث..." required><div><button class="ev32-btn" type="submit">بحث DuckDuckGo</button><button class="ev32-btn secondary" type="button" data-search-engine="google">بحث Google</button><button class="ev32-btn secondary" type="button" data-search-engine="bing">بحث Bing</button></div></form><div class="ev32-note">لو فتح المتصفح الخارجي لم يعمل من داخل نسخة التطبيق، انسخ عبارة البحث وافتح المتصفح يدويًا.</div><p id="ev32SearchStatus" class="ev32-status" aria-live="polite"></p></section>
          <section class="ev32-page" data-ev32-page="downloads"><div class="ev32-kicker">ANDROID APP SOURCES</div><h2 class="ev32-title">مصادر تنزيل التطبيقات</h2><input id="ev32SourceFilter" class="ev32-field" type="search" placeholder="فلترة المصادر..." maxlength="80"><div id="ev32SourcesList" class="ev32-grid"></div><div class="ev32-note">استخدم صفحة المطوّر الرسمية متى كانت متاحة. تحقّق من اسم الحزمة والتوقيع والإصدار، ولا تثبّت APK مجهول المصدر. المصادر قد تختلف في الإتاحة حسب البلد والتطبيق.</div></section>
          <section class="ev32-page" data-ev32-page="notes"><div class="ev32-kicker">LOCAL NOTES</div><h2 class="ev32-title">ملاحظاتي الخاصة</h2><p class="ev32-desc">يُحفظ النص محليًا تلقائيًا في هذا التطبيق/المتصفح فقط.</p><textarea id="ev32Notes" class="ev32-area" maxlength="30000" placeholder="اكتب ملاحظاتك هنا..."></textarea><div class="ev32-row"><span id="ev32NotesStatus" class="ev32-status">جاهز</span><button class="ev32-btn secondary" type="button" data-notes-clear>مسح الملاحظات</button></div><div class="ev32-note">الملاحظات العادية ليست مشفّرة. لا تكتب فيها كلمات المرور أو أسرار الحسابات؛ استخدم الخزنة المشفرة للبيانات الحساسة.</div><button class="ev32-btn" type="button" data-ev32-support>التواصل مع دعم ESKO</button></section>
          <section class="ev32-page" data-ev32-page="vault"><div class="ev32-kicker">ENCRYPTED LOCAL VAULT</div><h2 class="ev32-title">خزنة ESKO</h2><p class="ev32-desc">استخدم كلمة مرور مستقلة وقوية. لا تُحفظ كلمة المرور. تُشفّر البيانات قبل تخزينها.</p><input id="ev32VaultPassword" class="ev32-field" type="password" minlength="10" maxlength="128" autocomplete="off" placeholder="كلمة مرور الخزنة (10 أحرف على الأقل)"><textarea id="ev32VaultText" class="ev32-area" maxlength="20000" placeholder="بيانات تريد حفظها مشفرة..."></textarea><div><button class="ev32-btn" type="button" data-vault-save>تشفير وحفظ</button><button class="ev32-btn secondary" type="button" data-vault-open>فك التشفير وفتح</button><button class="ev32-btn secondary" type="button" data-vault-delete>حذف الخزنة</button></div><p id="ev32VaultStatus" class="ev32-status" aria-live="polite"></p><div class="ev32-note">التشفير هنا يعتمد على Web Crypto في بيئة WebView/المتصفح. لا يعني ذلك أن مفاتيح Android Keystore قد تم دمجها؛ لا تضع أسرارًا شديدة الحساسية قبل إضافة طبقة Android Native ومراجعتها.</div></section>
        </main>
      </section>`;
    var gate = document.createElement('div'); gate.id = 'eskoV32Gate'; gate.hidden = true; gate.setAttribute('aria-live', 'polite');
    document.body.appendChild(launcher); document.body.appendChild(overlay); document.body.appendChild(gate);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) E.close(); });
    overlay.querySelectorAll('[data-ev32-close]').forEach(function (b) { b.addEventListener('click', E.close); });
    overlay.querySelectorAll('[data-ev32-go]').forEach(function (b) { b.addEventListener('click', function () { E.go(b.getAttribute('data-ev32-go')); }); });
    overlay.querySelectorAll('[data-ev32-jump]').forEach(function (b) { b.addEventListener('click', function () { E.go(b.getAttribute('data-ev32-jump')); }); });
    overlay.querySelector('[data-ev32-lock]').addEventListener('click', function () { if (E.Auth) E.Auth.lock(true); });
    overlay.querySelector('[data-ev32-support]').addEventListener('click', function () {
      var message = 'مرحبًا دعم ESKO، أحتاج مساعدة في ESKO OPEN HUB V3.2.';
      location.href = 'https://wa.me/201128530613?text=' + encodeURIComponent(message);
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') E.close(); });
    document.dispatchEvent(new CustomEvent('esko-v32-ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, {once:true}); else build();
})();
