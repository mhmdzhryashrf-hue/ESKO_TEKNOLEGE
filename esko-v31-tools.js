/* ESKO JOKER V3.1 • 200 command workflows + 300 geometric objects */
(function(){
  'use strict';
  if (window.__ESKO_V31_STARTED__) return;
  window.__ESKO_V31_STARTED__ = true;
  const DATA = Array.isArray(window.ESKO_V31_TOOLS) ? window.ESKO_V31_TOOLS : [];
  const PAGE_SIZE = 12;
  const perfRules = [
    'lazy initialization','IntersectionObserver visibility','pause when document hidden','prefers-reduced-motion','devicePixelRatio cap','24fps frame budget','canvas dimension cap','deterministic geometry','single event delegation','debounced search','normalized search cache','category filtering','pagination slicing','DocumentFragment rendering','HTML escaping','safe repository allowlist','noopener noreferrer links','clipboard API with fallback','no automatic downloads','no automatic installs','no eval or dynamic code','static command strings','CSS containment','avoid layout thrashing','reuse canvas context','low-memory rendering','stop requestAnimationFrame offscreen','resize observer throttling','bounded visible DOM','isolated ESKO namespace'
  ];
  window.ESKO_V31_PERFORMANCE = perfRules;
  const $ = (sel, root=document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s||'').normalize('NFKC').toLowerCase().trim();
  const allowedRepo = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
  let page=0, category='all', query='', filtered=DATA.slice(), visible=false, raf=0, lastFrame=0, geometry=[];
  let searchTimer=0;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const perf = {dpr:Math.min(window.devicePixelRatio||1,1),fps:24,pageSize:PAGE_SIZE};
  function fillExistingSlots(){
    const slots=window.ESKO_TOOL_SLOTS;
    if(!Array.isArray(slots)) return 0;
    let filled=0;
    DATA.forEach(card=>{
      const id=Number(card.id);
      if(id<301||id>500) return;
      let index=slots.findIndex(x=>x && Number(x.id)===id);
      if(index<0 && slots.length>=id) index=id-1;
      if(index<0 || index>=slots.length) return;
      const current=slots[index];
      if(!current || typeof current!=='object') return;
      const name=String(current.name||'').trim();
      const content=String(current.content||'').trim();
      const empty=!name || /^(خانة|slot|tool slot|أداة رقم)\s*#?\s*\d*$/i.test(name) || (!content && /^(خانة|slot|tool slot)/i.test(name));
      if(!empty) return;
      current.id=id;
      current.name='🃏 ESKO | '+card.name;
      current.content=[card.description,'المستودع: '+card.repository,'التثبيت: '+card.install,'التشغيل: '+card.run].join('\n');
      filled++;
    });
    return filled;
  }
  function mount(){
    if(!document.body || $('#eskoV31Panel')) return;
    const toolsPage=$('#page-tools') || $('[data-page="tools"]') || $('#esko900Tools')?.parentElement || $('main') || document.body;
    const panel=document.createElement('section');
    panel.id='eskoV31Panel'; panel.setAttribute('aria-label','ESKO JOKER V3.1 command toolbox');
    panel.innerHTML=`<canvas class="v31-canvas" aria-hidden="true"></canvas>
      <div class="v31-head"><div class="v31-brand">🃏 ESKO JOKER | V3.1 TOOL DECK</div><strong>الخانات 301–500</strong></div>
      <p class="v31-sub">200 بطاقة تشغيل من 25 مشروعًا مفتوح المصدر. كل بطاقة تعرض مستودع المصدر وأمر تثبيت وأمر تشغيل مستقلين مع نسخ بنقرة واحدة. التثبيت لا يبدأ تلقائيًا.</p>
      <div class="v31-controls"><input id="eskoV31Search" type="search" placeholder="ابحث باسم الأداة أو المهمة أو الوصف…" autocomplete="off"><select id="eskoV31Category" aria-label="تصنيف الأدوات"><option value="all">كل التصنيفات</option></select></div>
      <div id="eskoV31Count" class="v31-meta"></div><div id="eskoV31Grid" class="v31-grid"></div>
      <div class="v31-pager"><button type="button" data-v31-page="prev">السابق</button><span id="eskoV31Page"></span><button type="button" data-v31-page="next">التالي</button></div>
      <p class="v31-footer">🃏 ESKO JOKER • التوافق مع ARMv7 يختلف حسب الحزمة. راجع الأمر قبل تشغيله. أوامر فحص الشبكة مقيدة بعنوان 127.0.0.1 على هاتفك. الأدوات الدفاعية تعمل على ملفاتك ومشاريعك فقط. بعض الأدوات ثقيلة أو قد لا تتوفر على معمارية هاتفك.</p>`;
    if(toolsPage===document.body) document.body.appendChild(panel);
    else if($('#esko900Tools',toolsPage)) toolsPage.insertBefore(panel,$('#esko900Tools',toolsPage));
    else toolsPage.insertBefore(panel,toolsPage.firstChild);
    const categories=[...new Set(DATA.map(x=>x.category))].sort();
    const select=$('#eskoV31Category',panel);
    categories.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;select.appendChild(o);});
    panel.addEventListener('input',e=>{if(e.target.id==='eskoV31Search'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=normalize(e.target.value);page=0;applyFilter();},110);}});
    panel.addEventListener('change',e=>{if(e.target.id==='eskoV31Category'){category=e.target.value;page=0;applyFilter();}});
    panel.addEventListener('click',e=>{
      const copy=e.target.closest('[data-v31-copy]');
      if(copy){const card=DATA.find(x=>String(x.id)===copy.dataset.id);if(!card)return;copyText(copy.dataset.v31Copy==='install'?card.install:card.run);return;}
      const pg=e.target.closest('[data-v31-page]');if(pg){const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));page=pg.dataset.v31Page==='next'?Math.min(pages-1,page+1):Math.max(0,page-1);render();}
    });
    const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{visible=entries.some(x=>x.isIntersecting);if(visible&&!reduced&&!document.hidden) startGeometry();else stopGeometry();},{rootMargin:'120px'}):null;
    if(observer) observer.observe(panel); else visible=true;
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopGeometry();else if(visible&&!reduced)startGeometry();});
    window.addEventListener('resize',()=>{if(visible&&!reduced){resizeCanvas();}}, {passive:true});
    applyFilter(); setupGeometry(panel);
  }
  function applyFilter(){
    filtered=DATA.filter(c=>(category==='all'||c.category===category) && (!query || normalize([c.name,c.tool,c.category,c.description,c.repository].join(' ')).includes(query)));
    page=0;render();
  }
  function render(){
    const panel=$('#eskoV31Panel');if(!panel)return;
    const grid=$('#eskoV31Grid',panel);const frag=document.createDocumentFragment();
    const start=page*PAGE_SIZE;
    filtered.slice(start,start+PAGE_SIZE).forEach(c=>{
      const el=document.createElement('article');el.className='v31-card';
      const repo=allowedRepo.test(c.repository)?c.repository:'#';
      el.innerHTML=`<div class="v31-meta">🃏 SLOT ${esc(c.id)} • ${esc(c.category)} • ${esc(c.fit)}</div>
        <h4>${esc(c.name)}</h4><div class="v31-desc">${esc(c.description)}</div>
        <div class="v31-meta">أمر التثبيت / تجهيز الأداة</div><pre>${esc(c.install)}</pre>
        <div class="v31-actions"><button type="button" data-v31-copy="install" data-id="${esc(c.id)}">نسخ التثبيت</button></div>
        <div class="v31-meta">أمر التشغيل</div><pre>${esc(c.run)}</pre>
        <div class="v31-actions"><button type="button" data-v31-copy="run" data-id="${esc(c.id)}">نسخ التشغيل</button></div>
        <a class="v31-repo" href="${esc(repo)}" target="_blank" rel="noopener noreferrer">المستودع الرسمي ↗</a>
        <div class="v31-footer">${esc(c.notice)}</div>`;
      frag.appendChild(el);
    });
    grid.replaceChildren(frag);
    const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
    $('#eskoV31Count',panel).textContent=`🃏 ${filtered.length} بطاقة مطابقة من ${DATA.length} | 25 مستودعًا/مشروعًا`;
    $('#eskoV31Page',panel).textContent=`صفحة ${page+1} من ${pages}`;
    const prev=$('[data-v31-page="prev"]',panel),next=$('[data-v31-page="next"]',panel);
    prev.disabled=page<=0;next.disabled=page>=pages-1;
  }
  async function copyText(value){
    try{
      if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(value);toast('تم نسخ الأمر 🃏');return;}
    }catch(_e){}
    const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
    let ok=false;try{ok=document.execCommand('copy');}catch(_e){}area.remove();toast(ok?'تم نسخ الأمر 🃏':'تعذر النسخ تلقائيًا؛ اضغط مطولًا على الأمر لنسخه.');
  }
  function toast(msg){let t=$('#eskoV31Toast');if(!t){t=document.createElement('div');t.id='eskoV31Toast';document.body.appendChild(t);}t.textContent=msg;t.style.display='block';clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.display='none',1900);}
  function setupGeometry(panel){
    const canvas=$('.v31-canvas',panel);if(!canvas)return;
    const kinds=['circle','rect','triangle','hex','diamond','line','ring','pentagon','cross','arc'];
    geometry=Array.from({length:300},(_,i)=>({kind:kinds[i%kinds.length],x:((i*73)%997)/997,y:((i*137)%991)/991,r:2+(i%7),phase:(i%19)*.33,speed:.12+(i%5)*.025,alpha:.12+(i%4)*.035}));
    resizeCanvas();
  }
  function resizeCanvas(){const panel=$('#eskoV31Panel'),canvas=panel&&$('.v31-canvas',panel);if(!canvas)return;const rect=canvas.getBoundingClientRect();const dpr=perf.dpr;canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));}
  function drawGeometry(now){
    raf=0;if(!visible||document.hidden||reduced)return;
    if(now-lastFrame < 1000/perf.fps){raf=requestAnimationFrame(drawGeometry);return;}
    lastFrame=now;const canvas=$('#eskoV31Panel .v31-canvas');if(!canvas)return;
    const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
    const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
    geometry.forEach((s,i)=>{
      const drift=(now*.00005*s.speed+s.phase);const x=(s.x+Math.sin(drift+i)*.012)*w;const y=(s.y+Math.cos(drift*.8+i)*.01)*h;const r=s.r;
      ctx.save();ctx.translate(x,y);ctx.rotate(drift*.14);ctx.strokeStyle=`rgba(92,220,255,${s.alpha})`;ctx.lineWidth=.8;
      ctx.beginPath();
      if(s.kind==='circle'||s.kind==='ring')ctx.arc(0,0,r*(s.kind==='ring'?1.6:1),0,Math.PI*2);
      else if(s.kind==='rect')ctx.rect(-r,-r,r*2,r*2);
      else if(s.kind==='line'){ctx.moveTo(-r*2,0);ctx.lineTo(r*2,0);}
      else if(s.kind==='cross'){ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);}
      else {const sides=s.kind==='triangle'?3:s.kind==='hex'?6:s.kind==='diamond'?4:s.kind==='pentagon'?5:7;for(let n=0;n<sides;n++){const a=(Math.PI*2*n/sides)-Math.PI/2;const px=Math.cos(a)*r*1.5,py=Math.sin(a)*r*1.5;if(n===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();}
      ctx.stroke();ctx.restore();
    });
    raf=requestAnimationFrame(drawGeometry);
  }
  function startGeometry(){if(!raf&&!reduced&&visible&&!document.hidden)raf=requestAnimationFrame(drawGeometry);}
  function stopGeometry(){if(raf){cancelAnimationFrame(raf);raf=0;}}
  function startWhenReady(){fillExistingSlots();mount();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startWhenReady,{once:true});else startWhenReady();
})();
