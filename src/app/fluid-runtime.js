// Ported from https://ppoinot.github.io/fluid-tooltip-playground/; original spring and state machine.
export function mountFluid(root, getSettings, styles) {
 const $ = selector => root.querySelector(selector);
 const abort = new AbortController();
 const listen=(element,event,handler)=>element.addEventListener(event,handler,{signal:abort.signal});
  const DATA = [
    { name: "Today", key: "1" }, { name: "Tasks", key: "2" }, { name: "Calendar", key: "3" },
    { name: "Focus", key: "4" }, { name: "Settings", key: "5" }, { name: "John Doe", key: null },
  ];
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const MOD = isMac ? "⌘" : "Ctrl ";
  const H = 28, PAD = 10;

  const P = { ...getSettings() };

  const rail = $("#rail"), tip = $("#tip"), hl = $("#hl"), cursor = $("#cursor");
  const items = [...rail.querySelectorAll("." + styles.item)];
  let centers = [];
  const measure = () => { centers = items.map((el) => el.offsetTop + el.offsetHeight / 2); };

  class Spring {
    constructor(x) { this.x = x; this.t = x; this.v = 0; }
    snap(x) { this.x = this.t = x; this.v = 0; }
    step(h, k, c) { const a = -k * (this.x - this.t) - c * this.v; this.v += a * h; this.x += this.v * h; }
    done(eps) { return Math.abs(this.x - this.t) < eps && Math.abs(this.v) < eps * 10; }
  }

  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  // The motion is what this page shows, so it animates even with Reduce Motion on (the panel offers a way out)
  let reduce = false;

  const y = new Spring(0), w = new Spring(0), vis = new Spring(0), aY = new Spring(0);
  let labels = [];
  let cur = -1, active = 0, shown = false, hiddenAt = -1e9, openT = 0, hideT = 0, pending = 0;

  // ---------- labels ----------
  function labelEl(i) {
    const d = DATA[i];
    const el = document.createElement("span");
    el.className = styles["tip-label"];
    const n = document.createElement("span");
    n.textContent = d.name;
    el.append(n);
    if (d.key) { const k = document.createElement("kbd"); k.textContent = MOD + d.key; el.append(k); }
    tip.append(el);
    return el;
  }
  function replaceLabel(i) {
    labels.forEach((l) => l.el.remove());
    const el = labelEl(i);
    labels = [{ el, p: new Spring(0), out: false }];
    return el.offsetWidth + PAD * 2;
  }
  function rollLabel(i, dir) {
    labels.forEach((l) => { if (!l.out) { l.out = true; l.p.t = -dir; } });
    const el = labelEl(i);
    const p = new Spring(dir);
    p.t = 0;
    labels.push({ el, p, out: false });
    return el.offsetWidth + PAD * 2;
  }

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
    items.forEach((el, j) => el.toggleAttribute("aria-current", j === i));
    items[i].setAttribute("aria-current", "page");
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
  function render() {
    const vv = Math.min(1, Math.max(0, vis.x));
    tip.style.opacity = vv.toFixed(3);
    tip.style.transform = `translate3d(${(-5 * (1 - vv)).toFixed(2)}px, ${(y.x - H / 2).toFixed(2)}px, 0) scale(${(0.95 + 0.05 * vv).toFixed(4)})`;
    tip.style.width = Math.max(0, w.x).toFixed(2) + "px";
    hl.style.transform = `translate3d(0, ${(aY.x - 15).toFixed(2)}px, 0)`;
    labels = labels.filter((l) => {
      if (l.out && (Math.abs(l.p.x) >= 0.97 || l.p.done(0.002))) { l.el.remove(); return false; }
      return true;
    });
    labels.forEach((l) => {
      const a = Math.abs(l.p.x);
      l.el.style.opacity = Math.max(0, 1 - a).toFixed(3);
      l.el.style.transform = `translate3d(0, ${(l.p.x * P.roll).toFixed(2)}px, 0)`;
      l.el.style.filter = P.blur > 0 && a > 0.002 ? `blur(${(Math.min(1, a) * P.blur).toFixed(2)}px)` : "none";
    });
  }

  // ---------- input ----------
  const indexAt = (clientY) => {
    const bounds=rail.getBoundingClientRect();
    const yy = (clientY - bounds.top)/(bounds.height/rail.offsetHeight);
    let best = 0, bd = Infinity;
    centers.forEach((c, i) => { const d = Math.abs(c - yy); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  listen(rail,"pointerenter", (e) => { if (e.pointerType === "mouse") { stopDemo(); hover(indexAt(e.clientY), false); } });
  listen(rail,"pointermove", (e) => {
    if (e.pointerType !== "mouse" && e.buttons === 0) return;
    stopDemo();
    hover(indexAt(e.clientY), e.pointerType !== "mouse");
  });
  listen(rail,"pointerdown", (e) => {
    stopDemo();
    if (e.pointerType !== "mouse") hover(indexAt(e.clientY), true);
  });
  listen(rail,"pointerleave", (e) => scheduleHide(e.pointerType === "mouse" ? 80 : 900));
  listen(rail,"pointerup", (e) => { if (e.pointerType !== "mouse") scheduleHide(900); });
  items.forEach((el, i) => listen(el,"click", () => setActive(i)));
  listen(rail,"focusin", (e) => {
    const el = e.target.closest("." + styles.item);
    if (el && el.matches(":focus-visible")) { stopDemo(); hover(+el.dataset.i, true); }
  });
  listen(rail,"focusout", (e) => { if (!rail.contains(e.relatedTarget)) scheduleHide(80); });
  listen(root,"keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) {
      if (e.metaKey || e.ctrlKey) e.preventDefault();
      stopDemo();
      setActive(n - 1);
      hover(n - 1, true);
      scheduleHide(1000);
    }
  });

  // ---------- demo (the clip's path along the rail) ----------
  let demoT = [];
  function stopDemo() {
    if (!demoT.length) return;
    demoT.forEach(clearTimeout);
    demoT = [];
    cursor.classList.remove(styles.on);
  }
  function placeCursor(i) {
    cursor.style.transform = `translate(${21 + 3}px, ${centers[i] + 3}px)`;
  }
  function playDemo() {
    stopDemo();
    const f = P.slow ? 5 : 1;
    const path = [[5, 0], [4, 600], [0, 1250], [1, 1600], [2, 1900], [3, 2200], [4, 2500], [5, 2850], [0, 3600]];
    placeCursor(5);
    cursor.classList.add(styles.on);
    path.forEach(([i, at]) => demoT.push(setTimeout(() => { placeCursor(i); hover(i, true); }, at * f)));
    demoT.push(setTimeout(() => { cursor.classList.remove(styles.on); demoT = []; }, 4400 * f));
  }



  measure(); aY.snap(centers[0]); open(0); vis.snap(1); render();
  const resize = new ResizeObserver(() => {measure(); if(cur>=0)y.snap(centers[cur]);aY.snap(centers[active]);render();}); resize.observe(rail);
  return { replay: playDemo, update() { Object.assign(P,getSettings()); kick(); }, destroy() { abort.abort();labels.forEach(l=>l.el.remove());cancelAnimationFrame(raf);clearTimeout(openT);clearTimeout(hideT);demoT.forEach(clearTimeout);resize.disconnect(); } };
}
