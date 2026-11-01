/* K9 Rescue community coin: the scroll story and the live ledger. No build step.
   - opening: live Solana block counter vs. stray dogs killed since you arrived
   - prologue: words light up as they pass the reading line
   - I the road east: pinned section that travels sideways
   - II the front: 516 squares fill as the field log is read
   - III the math of mercy: one unspayed dog's descendants drawn on a canvas, year by year
   - IV the ledger: reads the tracker worker every minute
   The donate widget lives in donate.js; it listens for the "k9:stats" event fired after each ledger refresh. */
(() => {
  const C = window.K9 || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nf = (n) => Math.round(n).toLocaleString("en-GB");
  const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");

  /* ------------------------------------------------ config-driven bits */
  $$("[data-ticker]").forEach((e) => (e.textContent = C.TICKER || "K9"));
  $$("[data-wallet-short]").forEach((e) => (e.textContent = short(C.WALLET)));
  $$("[data-solscan]").forEach((e) => (e.href = `https://solscan.io/account/${C.WALLET}`));
  $$("[data-buy]").forEach((a) => {
    if (C.MINT && C.BUY_URL) { a.textContent = `Buy $${C.TICKER}`; a.href = C.BUY_URL; a.target = "_blank"; a.rel = "noopener"; }
    else { a.textContent = "Coin launching soon"; a.setAttribute("aria-disabled", "true"); }
  });

  const toastEl = $("[data-toast]");
  let toastT;
  window.k9Toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (toastEl.hidden = true), 2600);
  };

  $$("[data-copy-wallet]").forEach((btn) => btn.addEventListener("click", async () => {
    const label = $("[data-copy-label]", btn) || btn;
    const was = label.textContent;
    try { await navigator.clipboard.writeText(C.WALLET); label.textContent = "Copied ✓"; window.k9Toast("K9 Rescue's wallet address copied"); }
    catch { label.textContent = "Select & copy"; }
    setTimeout(() => (label.textContent = was), 1800);
  }));

  /* ------------------------------------------------ opening counters: blocks vs. dogs */
  const t0 = performance.now();
  const blocksEl = $("[data-blocks]"), killedEl = $("[data-killed]");
  let slot0 = null, slotAt = 0, slotBase = 0;           // last known slot and when we learned it
  async function syncSlot() {
    try {
      const r = await fetch(C.RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [{ commitment: "processed" }] }) });
      const s = (await r.json()).result;
      if (typeof s === "number") { if (slot0 === null) slot0 = s; slotBase = s; slotAt = performance.now(); }
    } catch { /* keep extrapolating */ }
  }
  syncSlot(); setInterval(syncSlot, 10000);
  function counters() {
    const now = performance.now(), secs = (now - t0) / 1000;
    const blocks = slot0 === null ? secs * 2.5 : (slotBase - slot0) + ((now - slotAt) / 1000) * 2.5;
    blocksEl.textContent = nf(Math.max(0, blocks));
    killedEl.textContent = nf(Math.floor(secs * 38 / 60));
  }
  setInterval(counters, 100);

  /* ------------------------------------------------ prologue: split into words */
  const pro = $("[data-litwords]");
  const HOT = new Set(["killed", "worst."]);
  pro.innerHTML = pro.textContent.trim().split(/\s+/).map((w) => `<span class="wd${HOT.has(w) ? " hot" : ""}">${w}</span>`).join(" ");
  const words = $$(".wd", pro);

  /* ------------------------------------------------ front: 516 squares */
  const dotsEl = $("[data-dots]");
  dotsEl.innerHTML = "<i></i>".repeat(516);
  const dots = $$("i", dotsEl);
  const fsteps = $$("[data-fstep]");
  const fCount = $("[data-front-count]"), fLabel = $("[data-front-label]");
  let fShown = 0, fTarget = 0, fTimer = 0;
  function fillTo(target) {
    clearInterval(fTimer);
    const step = Math.max(1, Math.round(Math.abs(target - fShown) / 40));
    fTimer = setInterval(() => {
      fShown += Math.sign(target - fShown) * Math.min(step, Math.abs(target - fShown));
      for (let i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i < fShown);
      fCount.textContent = fShown;
      if (fShown === target) clearInterval(fTimer);
    }, reduced ? 0 : 22);
  }

  /* ------------------------------------------------ road east: sideways travel */
  const road = $("[data-hscroll]"), track = $("[data-track]"), routeFill = $("[data-route]");
  let roadOver = 0;
  const wide = () => innerWidth > 820;
  function sizeRoad() {
    if (!wide()) { road.style.height = ""; track.style.transform = ""; return; }
    roadOver = Math.max(0, track.scrollWidth - innerWidth);
    road.style.height = `${roadOver + innerHeight}px`;
  }

  /* ------------------------------------------------ math of mercy */
  const math = $("[data-math]"), mc = $("[data-math-canvas]"), mx = mc.getContext("2d");
  const OFF = [0, 12, 67, 376, 2107, 11801, 66088, 370092, 2072514, 11606077];
  const MAXD = 7000;
  const pts = [];                                          // sunflower spiral, jittered, mother at the centre
  for (let i = 0; i < MAXD; i++) {
    const a = i * 2.39996323, j = 0.35;
    pts.push([Math.cos(a), Math.sin(a), (Math.random() - 0.5) * j, (Math.random() - 0.5) * j]);
  }
  let mathT = 0, spayed = false, spayK = 0, mathVisible = false;
  const mYear = $("[data-math-year]"), mN = $("[data-math-n]"), mK = $("[data-math-k]"), mScale = $("[data-math-scale]");
  function offspring(t) {
    const y = Math.min(8, Math.floor(t)), f = clamp(t - y, 0, 1);
    const a = OFF[y], b = OFF[y + 1];
    if (t >= 9) return OFF[9];
    return a === 0 ? b * f : a * Math.pow(b / a, f);
  }
  function sizeMath() {
    const d = Math.min(2, devicePixelRatio || 1);
    mc.width = mc.clientWidth * d; mc.height = mc.clientHeight * d; mc._d = d;
  }
  function drawMath() {
    const W = mc.width, H = mc.height, d = mc._d || 1;
    const N = offspring(mathT);
    const desk = innerWidth > 820;
    const cx = desk ? W * 0.68 : W / 2, cy = desk ? H * 0.52 : H * 0.5;
    const R = desk ? Math.min(W * 0.27, H * 0.4) : Math.min(W * 0.46, H * 0.27);
    const D = Math.min(MAXD, Math.max(1, Math.round(N)) + 1);   // dots incl. her, capped at the spiral size
    const dotR = clamp(R * 0.82 / Math.sqrt(D), 0.7 * d, 16 * d);
    mx.clearRect(0, 0, W, H);
    const fade = 1 - spayK;
    // the others
    if (fade > 0.01) {
      mx.fillStyle = "#ECEFF3";
      for (let i = 1; i < D; i++) {
        const p = pts[i], rr = R * Math.sqrt(i / D) * (1 + spayK * 0.5);
        const x = cx + p[0] * rr + p[2] * dotR, y = cy + p[1] * rr + p[3] * dotR;
        mx.globalAlpha = (0.35 + 0.5 * (1 - i / D)) * fade;
        mx.fillRect(x - dotR / 2, y - dotR / 2, dotR, dotR);
      }
    }
    // her
    mx.globalAlpha = 1;
    const mr = Math.max(dotR * 1.6, 6 * d) * (1 + spayK * 1.4);
    mx.fillStyle = "#E98335";
    mx.fillRect(cx - mr / 2, cy - mr / 2, mr, mr);
    mx.strokeStyle = "rgba(233,131,53,.45)"; mx.lineWidth = d;
    mx.strokeRect(cx - mr * 1.6, cy - mr * 1.6, mr * 3.2, mr * 3.2);

    const y = Math.min(9, Math.floor(mathT));
    if (spayK > 0.5) {
      mYear.textContent = "Spayed";
      mN.textContent = "0";
      mK.textContent = "puppies born into hardship. One surgery.";
      mScale.textContent = "1 dot = 1 dog";
    } else {
      mYear.textContent = mathT < 0.05 ? "Year 0" : `Year ${Math.min(9, Math.max(1, Math.ceil(mathT - 0.001)))}`;
      mN.textContent = mathT < 0.05 ? "1" : nf(N);
      mK.textContent = mathT < 0.05 ? "unspayed female. Her." : "descendants of one unspayed dog";
      mScale.textContent = N > MAXD ? `1 dot ≈ ${nf(N / MAXD)} dogs` : "1 dot = 1 dog";
    }
    math.classList.toggle("done", y >= 9 || spayed);
  }
  $("[data-spay]").addEventListener("click", (e) => {
    spayed = !spayed;
    math.classList.toggle("spayed", spayed);
    e.currentTarget.textContent = spayed ? "Undo" : "Spay her";
    const from = spayK, to = spayed ? 1 : 0, s = performance.now();
    const anim = (t) => { const k = clamp((t - s) / 900, 0, 1); spayK = from + (to - from) * (1 - Math.pow(1 - k, 3)); drawMath(); if (k < 1) requestAnimationFrame(anim); };
    requestAnimationFrame(anim);
  });

  /* ------------------------------------------------ chapters, rail, progress */
  const bar = $("[data-bar]"), prog = $("[data-progress]"), rail = $(".rail");
  const chNum = $("[data-ch-num]"), chName = $("[data-ch-name]");
  const chapters = $$("[data-ch]");
  const railLinks = $$("[data-rail]");
  let lastCh = "";

  /* ------------------------------------------------ the one scroll handler */
  const layers = $$("[data-speed],[data-x]");
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight, sy = scrollY;
    bar.classList.toggle("solid", sy > 40);
    prog.style.transform = `scaleX(${(sy / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4)})`;

    // chapter label + rail
    let cur = chapters[0];
    for (const s of chapters) if (s.getBoundingClientRect().top < vh * 0.35) cur = s;
    const key = cur.dataset.ch + cur.dataset.chname;
    if (key !== lastCh) {
      lastCh = key;
      chNum.textContent = cur.dataset.ch; chName.textContent = cur.dataset.chname;
      railLinks.forEach((a) => a.classList.toggle("on", a.dataset.rail === cur.dataset.ch));
    }
    rail.classList.toggle("on", sy > vh * 0.8);
    const give = $("#give").getBoundingClientRect();
    rail.classList.toggle("light", give.top < vh / 2 && give.bottom > vh / 2);

    // parallax
    if (!reduced) for (const el of layers) {
      const host = el.closest("section, footer") || document.body;
      const r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const p = el.closest(".open") ? -r.top : (vh / 2) - (r.top + r.height / 2);
      el.style.transform = `translate3d(${(p * (Number(el.dataset.x) || 0)).toFixed(1)}px, ${(p * (Number(el.dataset.speed) || 0)).toFixed(1)}px, 0)`;
    }

    // prologue words
    const line = vh * 0.62;
    for (const w of words) w.classList.toggle("lit", w.getBoundingClientRect().top < line);

    // road
    if (wide()) {
      const r = road.getBoundingClientRect();
      const k = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      track.style.transform = `translate3d(${(-k * roadOver).toFixed(1)}px,0,0)`;
      routeFill.style.width = `${(k * 100).toFixed(1)}%`;
    }

    // front log
    let active = null;
    for (const s of fsteps) if (s.getBoundingClientRect().top < vh * 0.6) active = s;
    fsteps.forEach((s) => s.classList.toggle("on", s === active));
    const target = active ? Number(active.dataset.fstep) : 0;
    if (target !== fTarget) { fTarget = target; fLabel.textContent = active ? active.dataset.flabel : "Each square is one dog"; fillTo(target); }

    // math
    const mr = math.getBoundingClientRect();
    mathVisible = mr.bottom > 0 && mr.top < vh;
    if (mathVisible) { mathT = clamp(-mr.top / Math.max(1, mr.height - vh), 0, 1) * 9.6; drawMath(); }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { sizeRoad(); sizeMath(); frame(); });
  addEventListener("load", () => { sizeRoad(); frame(); });
  sizeRoad(); sizeMath(); frame();

  /* ------------------------------------------------ reveals */
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }, { threshold: 0.15 });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ------------------------------------------------ the ledger */
  const fmt = (n, d = 2) => Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const usd = (n) => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const ago = (t) => {
    if (!t) return "";
    const s = Math.max(1, Math.floor(Date.now() / 1000 - t));
    if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 86400 * 60) return `${Math.floor(s / 86400)}d ago`;
    return new Date(t * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const set = (sel, text) => $$(sel).forEach((e) => (e.textContent = text));
  let seen = new Set(), last = null;
  const mine = [];                 // gifts sent through the label, shown until the tracker picks them up
  window.k9AddMine = (item) => { mine.unshift(item); if (last) render(last); setTimeout(load, 20000); setTimeout(load, 65000); };

  function animateNumber(sel, value, d) {
    $$(sel).forEach((el) => {
      const from = Number(el.dataset.v || 0);
      el.dataset.v = value;
      if (reduced || from === value) { el.textContent = fmt(value, d); return; }
      const s = performance.now();
      const step = (t) => { const k = Math.min(1, (t - s) / 900); el.textContent = fmt(from + (value - from) * (1 - Math.pow(1 - k, 3)), d); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  function render(s) {
    last = s;
    const price = s.solUsd || 0;
    animateNumber("[data-balance]", s.balanceSol, 2);
    set("[data-balance-usd]", price ? `≈ ${usd(s.balanceSol * price)} at ${usd(price)}/SOL` : "");
    const r = s.rewards || {};
    animateNumber("[data-rewards-sol]", r.totalSol || 0, 3);
    set("[data-rewards-usd]", s.launched ? (price ? `≈ ${usd((r.totalSol || 0) * price)} so far` : "") : "Starts the moment the coin launches");
    set("[data-rewards-count]", String(r.count || 0));
    set("[data-rewards-last]", r.last ? `Last one ${ago(r.last)}` : (s.launched ? "Waiting for the first one" : "None yet"));
    const d = s.donations || {};
    animateNumber("[data-donations-sol]", d.totalSol || 0, 2);
    set("[data-donations-extra]", `${d.count || 0} gift${d.count === 1 ? "" : "s"}${d.totalUsdc ? ` + ${fmt(d.totalUsdc, 0)} USDC` : ""} since ${new Date((s.trackingSince || 0) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`);
    if (C.GOAL_SOL > 0) {
      $("[data-goal]").hidden = false;
      $("[data-goal-fill]").style.width = Math.min(100, ((r.totalSol || 0) / C.GOAL_SOL) * 100).toFixed(1) + "%";
      set("[data-goal-text]", `${fmt(r.totalSol || 0, 2)} of ${fmt(C.GOAL_SOL, 0)} SOL ${C.GOAL_LABEL}`);
    }
    const known = new Set((s.recent || []).map((x) => x.sig));
    for (let i = mine.length - 1; i >= 0; i--) if (known.has(mine[i].sig)) mine.splice(i, 1);
    const list = [...mine, ...(s.recent || [])];
    const rows = list.map((x) => {
      const amt = [x.sol ? `${fmt(x.sol, x.sol < 1 ? 3 : 2)} SOL` : "", x.usdc ? `${fmt(x.usdc, x.usdc < 10 ? 2 : 0)} USDC` : ""].filter(Boolean).join(" + ");
      const k = x.mine ? `<span class="k you">You</span>` : `<span class="k ${x.kind}">${x.kind === "reward" ? "Coin reward" : "Gift"}</span>`;
      return `<div class="fr${seen.size && !seen.has(x.sig) ? " new" : ""}" role="row">
        <span role="cell"><a href="https://solscan.io/tx/${x.sig}" target="_blank" rel="noopener">${short(x.sig)} ↗</a></span>
        <span role="cell">${ago(x.time)}</span>
        <span role="cell" class="amt">${amt}</span>
        <span role="cell" class="from">${short(x.from)}</span>
        <span role="cell">${k}</span></div>`;
    });
    $("[data-feed]").innerHTML = rows.length ? rows.join("") : `<div class="fr-empty">No gifts yet. Be the first.</div>`;
    seen = new Set(list.map((x) => x.sig));
    set("[data-updated]", `Updated ${ago(s.updatedAt)}${s.stale ? " (reconnecting)" : ""}`);
  }

  async function load() {
    if (!C.TRACKER_URL) return;
    try {
      const s = await (await fetch(C.TRACKER_URL, { cache: "no-store" })).json();
      if (s.error) throw new Error(s.error);
      render(s);
      window.K9_STATS = s;
      document.dispatchEvent(new CustomEvent("k9:stats", { detail: s }));
    } catch { set("[data-updated]", "Can't reach the chain right now. Retrying…"); }
  }
  load();
  setInterval(load, (C.REFRESH_SECONDS || 60) * 1000);
})();
