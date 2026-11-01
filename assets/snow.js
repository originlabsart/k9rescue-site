/* Falling snow over the sections that ask for it (data-snow="0..1" sets the density there).
   The wind follows how fast you scroll, so the flakes lean when the page moves. */
(() => {
  const cv = document.querySelector("[data-snow-canvas]");
  if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) { if (cv) cv.remove(); return; }
  const ctx = cv.getContext("2d");
  const zones = [...document.querySelectorAll("[data-snow]")];
  let W, H, dpr, flakes = [];
  const MAX = innerWidth < 720 ? 110 : 240;

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
  }
  function flake(top) {
    const z = Math.random();               // depth: far flakes are small, slow and faint
    return { x: Math.random() * W, y: top ? -10 : Math.random() * H, r: (0.6 + z * 2.2) * dpr, v: (0.35 + z * 1.1) * dpr,
             a: 0.25 + z * 0.6, ph: Math.random() * 6.28, z };
  }
  size(); addEventListener("resize", size);
  for (let i = 0; i < MAX; i++) flakes.push(flake(false));

  let lastY = scrollY, wind = 0, density = 1;
  function targetDensity() {
    const mid = innerHeight / 2;
    let d = 0;
    for (const z of zones) {
      const r = z.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        const overlap = (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / innerHeight;
        d = Math.max(d, Number(z.dataset.snow) * Math.min(1, overlap * 1.6) * (r.top < mid + innerHeight ? 1 : 0));
      }
    }
    return d;
  }
  function tick(t) {
    const dy = scrollY - lastY; lastY = scrollY;
    wind += ((-dy * 0.06) - wind) * 0.08;
    density += (targetDensity() - density) * 0.06;
    cv.style.opacity = density.toFixed(3);
    if (density > 0.01) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      for (const f of flakes) {
        f.y += f.v - wind * (0.4 + f.z) * dpr * 0.6;
        f.x += Math.sin(t / 1400 + f.ph) * 0.35 * dpr + wind * 0.15 * dpr;
        if (f.y > H + 10) Object.assign(f, flake(true));
        if (f.y < -20) f.y = H + 5;
        if (f.x > W + 10) f.x = -10; if (f.x < -10) f.x = W + 10;
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
