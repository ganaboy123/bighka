(() => {
  const canvas = document.querySelector('#field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = canvas.parentElement;
  let w = 0, h = 0, dpr = 1, px = .5, py = .5, pulseAt = 0, frameId = 0;
  const points = Array.from({ length: 82 }, (_, i) => ({
    seed: i * 39.274 + Math.random() * 5,
    x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.4,
    hue: [164, 187, 248, 292][i % 4], speed: .12 + Math.random() * .5
  }));
  function size() {
    const box = stage.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }
  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * (.5 + (px - .5) * .22), cy = h * (.51 + (py - .5) * .18);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * .65);
    glow.addColorStop(0, 'rgba(141,109,255,.28)');
    glow.addColorStop(.52, 'rgba(74,185,230,.09)');
    glow.addColorStop(1, 'rgba(25,23,38,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const t = reduced ? 0 : time * .00016;
    const coords = points.map((p, i) => {
      const sway = t * p.speed + p.seed;
      const x = w * p.x + Math.sin(sway) * w * .035 + (px - .5) * 28 * p.speed;
      const y = h * p.y + Math.cos(sway * .8) * h * .04 + (py - .5) * 22 * p.speed;
      return { x, y, p, i };
    });
    coords.forEach((a, i) => {
      for (let j = i + 1; j < coords.length; j++) {
        const b = coords[j], dx = a.x - b.x, dy = a.y - b.y, distance = Math.hypot(dx, dy);
        if (distance < 86) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(184,190,255,${(1 - distance / 86) * .19})`;
          ctx.lineWidth = .6; ctx.stroke();
        }
      }
      const near = Math.hypot(a.x - px * w, a.y - py * h) < 130;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.p.r * (near ? 1.45 : 1), 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${a.p.hue},92%,${near ? 82 : 74}%,${near ? .95 : .62})`;
      ctx.shadowBlur = near ? 17 : 9; ctx.shadowColor = `hsla(${a.p.hue},90%,75%,.7)`; ctx.fill(); ctx.shadowBlur = 0;
    });
    const age = (time - pulseAt) / 1100;
    if (pulseAt && age >= 0 && age < 1) {
      ctx.beginPath(); ctx.arc(px * w, py * h, age * Math.max(w, h) * .7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(205,244,109,${(1 - age) * .75})`; ctx.lineWidth = 2 - age; ctx.stroke();
    }
    if (!reduced) frameId = requestAnimationFrame(draw);
  }
  stage.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect(); px = (event.clientX - rect.left) / rect.width; py = (event.clientY - rect.top) / rect.height;
    const coords = document.querySelector('.field-coords');
    if (coords) coords.innerHTML = `X <b>${String(Math.round(px * 999)).padStart(3, '0')}</b> &nbsp; Y <b>${String(Math.round(py * 999)).padStart(3, '0')}</b>`;
  }, { passive: true });
  document.querySelector('#play-pulse')?.addEventListener('click', () => { pulseAt = performance.now(); if (reduced) draw(pulseAt + 10); });
  new ResizeObserver(size).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) cancelAnimationFrame(frameId);
    else if (!document.hidden && !reduced) frameId = requestAnimationFrame(draw);
  });
})();
