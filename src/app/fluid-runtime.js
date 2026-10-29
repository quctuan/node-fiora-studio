// Reference spring/state machine shared by the React preview and standalone export.
/** @param {()=>import('./fluid-schema').FluidSettings} getSettings @param {(snapshot:import('./fluid-runtime').FluidSnapshot)=>void} emit @param {number[]} widths */
export function createFluidController(getSettings,emit,widths){
 const P={...getSettings()};const H=28;const centers=[21,59,97,135,173,211];let cursorVisible=false,cursorIndex=5;
  class Spring {
    constructor(x) { this.x = x; this.t = x; this.v = 0; }
    snap(x) { this.x = this.t = x; this.v = 0; }
    step(h, k, c) { const a = -k * (this.x - this.t) - c * this.v; this.v += a * h; this.x += this.v * h; }
    done(eps) { return Math.abs(this.x - this.t) < eps && Math.abs(this.v) < eps * 10; }
  }



  let reduce = false;

  const y = new Spring(0), w = new Spring(0), vis = new Spring(0), aY = new Spring(0);
  let labels = [];
  let cur = -1, active = 0, shown = false, hiddenAt = -1e9, openT = 0, hideT = 0, pending = 0;

  let labelSequence=0;
  function replaceLabel(i){labels=[{id:++labelSequence,index:i,p:new Spring(0),out:false}];return widths[i]+20;}
  function rollLabel(i,dir){labels.forEach(l=>{if(!l.out){l.out=true;l.p.t=-dir;}});const p=new Spring(dir);p.t=0;labels.push({id:++labelSequence,index:i,p,out:false});return widths[i]+20;}
  // ---------- state machine ----------
  function moveTo(i) {
    vis.t = 1;
    if (i === cur) return;
    const dir = Math.sign(i - cur) || 1;
    cur = i;
    if (P.shared && !reduce) {
      y.t = centers[i];
      w.t = rollLabel(i, dir);
    } else {
      y.snap(centers[i]);
      w.snap(replaceLabel(i));
      if (!P.shared && !reduce) vis.snap(0);
    }
    kick();
  }
  function open(i) {
    shown = true;
    if (vis.x < 0.05 || cur < 0) {
      cur = i;
      y.snap(centers[i]);
      w.snap(replaceLabel(i));
      vis.t = 1;
    } else {
      moveTo(i);
    }
    kick();
  }
  function hover(i, immediate) {
    Object.assign(P, getSettings());
    clearTimeout(hideT);
    if (shown) { moveTo(i); return; }
    pending = i;
    if (immediate || performance.now() - hiddenAt < P.skip) {
      clearTimeout(openT); openT = 0;
      open(pending);
      return;
    }
    if (!openT) openT = setTimeout(() => { openT = 0; open(pending); }, P.delay * (P.slow ? 5 : 1));
  }
  function hide() {
    if (!shown) return;
    shown = false;
    hiddenAt = performance.now();
    vis.t = 0;
    kick();
  }
  function scheduleHide(ms) {
    clearTimeout(openT); openT = 0;
    clearTimeout(hideT);
    hideT = setTimeout(hide, ms);
  }
  function setActive(i) {
    if (i > 4) return;
    active = i;

    if (reduce) aY.snap(centers[i]); else aY.t = centers[i];
    kick();
  }

  // ---------- animation loop ----------
  let raf = 0, last = 0;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function step(h) {
    const { k, c } = P;
    y.step(h, k, c); w.step(h, k, c); aY.step(h, k, c);
    vis.step(h, 420, 38);
    labels.forEach((l) => l.p.step(h, k, c));
  }
  function frame(now) {
    Object.assign(P, getSettings());
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (P.slow) dt *= 0.2;
    if (reduce) {
      [y, w, aY, vis].forEach((s) => s.snap(s.t));
      labels.forEach((l) => l.p.snap(l.p.t));
    } else {
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      for (let s = 0; s < n; s++) step(dt / n);
    }
    render();
    const settled = y.done(0.05) && w.done(0.05) && aY.done(0.05) && vis.done(0.002)
      && labels.every((l) => !l.out && l.p.done(0.002));
    if (settled) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
  }
  function render(){
    labels=labels.filter(l=>!(l.out&&(Math.abs(l.p.x)>=.97||l.p.done(.002))));
    const vv=Math.min(1,Math.max(0,vis.x));
    emit({opacity:vv,x:-5*(1-vv),y:y.x-H/2,scale:.95+.05*vv,width:Math.max(0,w.x),activeY:aY.x-15,active,cursorVisible,cursorIndex,labels:labels.map(l=>({id:l.id,index:l.index,opacity:Math.max(0,1-Math.abs(l.p.x)),y:l.p.x*P.roll,blur:P.blur>0&&Math.abs(l.p.x)>.002?Math.min(1,Math.abs(l.p.x))*P.blur:0}))});
  }
  // ---------- demo (the clip's path along the rail) ----------
  let demoT = [];
  function stopDemo() {
    if (!demoT.length) return;
    demoT.forEach(clearTimeout);
    demoT = [];
    cursorVisible=false;render();
  }
  function placeCursor(i) {
    cursorIndex=i;render();
  }
  function playDemo() {
    stopDemo();
    const f = P.slow ? 5 : 1;
    const path = [[5, 0], [4, 600], [0, 1250], [1, 1600], [2, 1900], [3, 2200], [4, 2500], [5, 2850], [0, 3600]];
    placeCursor(5);
    cursorVisible=true;render();
    path.forEach(([i, at]) => demoT.push(setTimeout(() => { placeCursor(i); hover(i, true); }, at * f)));
    demoT.push(setTimeout(() => { cursorVisible=false;render(); demoT = []; }, 4400 * f));
  }



  aY.snap(centers[0]);open(0);vis.snap(1);render();
  return {replay:playDemo,enter(i,immediate=false){stopDemo();hover(i,immediate);},leave:scheduleHide,activate:setActive,destroy(){cancelAnimationFrame(raf);clearTimeout(openT);clearTimeout(hideT);demoT.forEach(clearTimeout);}};
}
