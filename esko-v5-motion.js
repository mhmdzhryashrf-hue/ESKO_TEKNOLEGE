(() => {
  if (window.__ESKO_V5_MOTION__) return;
  window.__ESKO_V5_MOTION__ = true;

  const boot = () => {
    if (!document.body) return requestAnimationFrame(boot);

    const canvas = document.createElement("canvas");
    canvas.id = "esko-v5-motion-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const geometries = [
      {x:.12,y:.24,s:.105,k:"cube",c:"#00eaff",v:.00045},
      {x:.87,y:.22,s:.090,k:"oct",c:"#ff35ca",v:-.00038},
      {x:.13,y:.79,s:.080,k:"pyramid",c:"#00d9ff",v:-.00032},
      {x:.88,y:.78,s:.105,k:"cube",c:"#b34cff",v:.00029},
      {x:.51,y:.13,s:.045,k:"oct",c:"#00ffe0",v:.00040}
    ];

    function resize() {
      w = innerWidth;
      h = innerHeight;
      dpr = Math.min(1.1, devicePixelRatio || 1);
      canvas.width = Math.round(w*dpr);
      canvas.height = Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw(0);
    }

    function vertices(kind) {
      if (kind === "oct")
        return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
      if (kind === "pyramid")
        return [[-1,-.7,-1],[1,-.7,-1],[1,-.7,1],[-1,-.7,1],[0,1,0]];
      return [
        [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
        [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
      ];
    }

    const edges = {
      cube:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
      oct:[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]],
      pyramid:[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]]
    };

    function project(p, angle, scale, cx, cy) {
      let [x,y,z] = p;
      const ax = angle*.73, ay = angle, az = angle*.43;
      let yy = y*Math.cos(ax)-z*Math.sin(ax);
      let zz = y*Math.sin(ax)+z*Math.cos(ax);
      let xx = x*Math.cos(ay)+zz*Math.sin(ay);
      zz = -x*Math.sin(ay)+zz*Math.cos(ay);
      const X = xx*Math.cos(az)-yy*Math.sin(az);
      const Y = xx*Math.sin(az)+yy*Math.cos(az);
      const perspective = 3.7/(3.7+zz);
      return [cx+X*scale*perspective,cy+Y*scale*perspective];
    }

    function drawShape(g,t) {
      const cx = w*g.x, cy = h*g.y;
      const size = Math.min(w,h)*g.s;
      const points = vertices(g.k).map(p =>
        project(p, reduced ? 0 : t*g.v, size, cx, cy)
      );

      ctx.beginPath();
      for (const [a,b] of edges[g.k]) {
        ctx.moveTo(points[a][0],points[a][1]);
        ctx.lineTo(points[b][0],points[b][1]);
      }
      ctx.strokeStyle = g.c;
      ctx.lineWidth = 1.15;
      ctx.globalAlpha = .68;
      ctx.shadowColor = g.c;
      ctx.shadowBlur = 7;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(cx,cy,2.2,0,Math.PI*2);
      ctx.fillStyle = g.c;
      ctx.fill();
    }

    function draw(t) {
      ctx.clearRect(0,0,w,h);

      // شبكة ضوئية هندسية عند أطراف الشاشة
      ctx.globalAlpha = .12;
      ctx.lineWidth = .6;
      ctx.strokeStyle = "#00dfff";
      for (let i=0;i<5;i++) {
        const x = i%2 ? 12 : w-92;
        const y = 90+i*25;
        ctx.strokeRect(x,y,76,35);
      }
      ctx.globalAlpha = 1;

      // نقاط مترابطة متحركة
      const pts = [];
      for (let i=0;i<22;i++) {
        const a = i*2.399 + (reduced ? 0 : t*.00018);
        const x = w*(.5 + Math.cos(a)*(.37 + (i%4)*.035));
        const y = h*(.5 + Math.sin(a)*(.34 + (i%3)*.035));
        pts.push([x,y]);
      }

      ctx.lineWidth = .65;
      for (let i=0;i<pts.length;i++) {
        for (let j=i+1;j<pts.length;j++) {
          const dx=pts[i][0]-pts[j][0], dy=pts[i][1]-pts[j][1];
          if (dx*dx+dy*dy < 11500) {
            ctx.globalAlpha=.12;
            ctx.strokeStyle="#00dfff";
            ctx.beginPath();
            ctx.moveTo(...pts[i]);
            ctx.lineTo(...pts[j]);
            ctx.stroke();
          }
        }
      }

      for (let i=0;i<pts.length;i++) {
        ctx.globalAlpha=.5;
        ctx.fillStyle=i%3===0 ? "#ff39cf" : "#00eaff";
        ctx.beginPath();
        ctx.arc(pts[i][0],pts[i][1],1.5,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;

      geometries.forEach(g => drawShape(g,t));

      // خط مسح ضوئي متحرك
      const scanY = h*(.25 + .5*(.5+.5*Math.sin(reduced?0:t*.00035)));
      const grad=ctx.createLinearGradient(0,scanY, w,scanY);
      grad.addColorStop(0,"rgba(0,220,255,0)");
      grad.addColorStop(.5,"rgba(0,220,255,.18)");
      grad.addColorStop(1,"rgba(255,40,210,0)");
      ctx.fillStyle=grad;
      ctx.fillRect(0,scanY,w,1.2);
    }

    let animationId = 0;
    let running = false;

    function frame(t) {
      animationId = 0;

      if (document.hidden || !running) {
        running = false;
        return;
      }

      if (t-last >= 55) {
        last=t;
        draw(t);
      }

      animationId = requestAnimationFrame(frame);
    }

    function startMotion() {
      if (reduced || document.hidden || running) return;
      running = true;
      last = 0;
      animationId = requestAnimationFrame(frame);
    }

    function stopMotion() {
      running = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    }

    addEventListener("resize",resize,{passive:true});

    document.addEventListener("visibilitychange",() => {
      if (document.hidden) stopMotion();
      else startMotion();
    });

    resize();
    startMotion();
  };

  // تحديث أسماء النسخة التي تظهر في الواجهة
  function patchText(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      root.nodeValue = root.nodeValue
        .replace(/OPEN HUB\s+V3\.0/gi,"OPEN HUB V5.0")
        .replace(/\bV3\.2\b/g,"V5.0");
      return;
    }
    for (const child of root.childNodes || []) patchText(child);
  }

  function start() {
    patchText(document.body);
    document.title = document.title
      .replace(/V3\.2/gi,"V5.0")
      .replace(/V3\.0/gi,"V5.0");

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") patchText(record.target);
        for (const node of record.addedNodes || []) patchText(node);
      }
    });
    observer.observe(document.documentElement,{
      subtree:true,childList:true,characterData:true
    });
    boot();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
