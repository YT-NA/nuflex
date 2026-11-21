// 투하 장면: 마을(건물·사람)이 산산조각 나는 그림판(canvas)
G.crush = (() => {
  let cv, ctx, W, H, gy, raf = 0, last = 0, live = false;
  let things = [], frags = [], dust = [], rings = [], bomb = null, fire = null;
  let plane = 0.5, shake = 0, flash = 0, enemy = '😈', big = 1, night = true;
  const COL = ['#ff8a5c', '#ffd23d', '#7fd3a8', '#8fb6ff', '#e59bd0', '#c9b08a'];
  const rnd = (a, b) => a + Math.random() * (b - a);

  function start(canvas, opt) {
    stop();
    cv = canvas;
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d;
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    gy = H * 0.86; enemy = opt.enemy || '😈'; big = opt.big || 1; night = document.body.classList.contains('night');
    things = []; frags = []; dust = []; rings = []; bomb = null; fire = null; shake = flash = 0;
    let x = W * 0.16;
    while (true) {
      const w = rnd(28, 44), h = rnd(46, Math.min(150, H * 0.42));
      if (x + w > W * 0.84) break;
      things.push({ kind: 'b', x, y: gy - h, w, h, c: G.rand(COL), roof: Math.random() < 0.5 });
      x += w + rnd(2, 7);
    }
    for (let i = 0; i < 7; i++) things.push({ kind: 'p', x: rnd(W * 0.18, W * 0.82), y: gy, vx: rnd(8, 22) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 6) });
    live = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { live = false; cancelAnimationFrame(raf); }
  function setPlane(f) { if (!bomb && !fire) plane = f; }
  function release(xf, rf, cb) { bomb = { x: xf * W, y: H * 0.16, vy: 0, r: rf * W, cb }; }

  // 조각 하나 만들기 — 터진 자리에서 바깥·위로 날아간다
  function piece(x, y, w, h, c, ix, R, extra) {
    const dx = x - ix, dy = y - gy - 10, len = Math.hypot(dx, dy) || 1;
    const near = 1 - Math.min(1, Math.abs(dx) / R) * 0.6;
    const p = near * rnd(320, 760) * Math.sqrt(big);
    frags.push(Object.assign({ x, y, w, h, c, vx: dx / len * p + rnd(-70, 70), vy: dy / len * p - rnd(160, 420), rot: 0, vr: rnd(-14, 14) }, extra));
  }
  function shatter(t, ix, R) {
    if (t.kind === 'b') {
      const cell = 11, nx = Math.max(2, Math.round(t.w / cell)), ny = Math.max(3, Math.round(t.h / cell));
      const cw = t.w / nx, ch = t.h / ny;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const win = (i + j) % 3 === 0;
        piece(t.x + (i + 0.5) * cw, t.y + (j + 0.5) * ch, cw, ch, win ? '#fff6c2' : t.c, ix, R);
      }
      if (t.roof) for (let i = 0; i < 3; i++) piece(t.x + t.w * (0.25 + i * 0.25), t.y - 6, 12, 8, '#b5533c', ix, R);
    } else {
      piece(t.x, t.y - 26, 16, 16, null, ix, R, { emoji: enemy });
      piece(t.x, t.y - 14, 9, 11, '#55607d', ix, R);
      piece(t.x - 3, t.y - 4, 3, 8, '#333', ix, R); piece(t.x + 3, t.y - 4, 3, 8, '#333', ix, R);
      piece(t.x - 7, t.y - 15, 3, 8, '#ffe0c2', ix, R); piece(t.x + 7, t.y - 15, 3, 8, '#ffe0c2', ix, R);
    }
  }
  function explode() {
    const ix = bomb.x, R = bomb.r, cb = bomb.cb;
    let hit = 0; const total = things.length, keep = [];
    for (const t of things) {
      const cx = t.kind === 'b' ? t.x + t.w / 2 : t.x;
      if (Math.abs(cx - ix) < R) { hit++; shatter(t, ix, R); }
      else { if (t.kind === 'p') t.vx = (cx < ix ? -1 : 1) * 150; keep.push(t); }
    }
    things = keep; bomb = null;
    flash = 1; shake = 20 * big; rings.push({ x: ix, r: 8, a: 1 }, { x: ix, r: 2, a: 1, slow: true });
    fire = { x: ix, r: 14, a: 1, R };
    for (let i = 0; i < 46; i++) dust.push({ x: ix + rnd(-R, R) * 0.8, y: gy - rnd(0, 30), vx: rnd(-120, 120), vy: rnd(-220, -30), r: rnd(6, 20), a: 0.75 });
    try { navigator.vibrate && navigator.vibrate([70, 40, 240]); } catch {}
    cb({ hit, total });
  }

  function loop(t) {
    if (!live || !cv.isConnected) return stop();
    const dt = Math.min(0.033, (t - last) / 1000); last = t;
    // ── 움직임 ──
    for (const p of things) if (p.kind === 'p') {
      p.x += p.vx * dt; p.ph += dt * 10;
      if (p.x < W * 0.04 || p.x > W * 0.96) { p.vx *= -1; p.x = Math.max(W * 0.04, Math.min(W * 0.96, p.x)); }
    }
    if (bomb) { bomb.vy += 1700 * dt; bomb.y += bomb.vy * dt; if (bomb.y >= gy - 8) explode(); }
    for (const f of frags) {
      if (f.rest) continue;
      f.vy += 1150 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.x < 4 || f.x > W - 4) { f.vx *= -0.5; f.x = Math.max(4, Math.min(W - 4, f.x)); }
      const floor = gy + 6 - f.h / 2;
      if (f.y > floor) {
        f.y = floor; f.vy *= -0.38; f.vx *= 0.62; f.vr *= 0.5;
        if (Math.abs(f.vy) < 40) { f.vy = 0; if (Math.abs(f.vx) < 8) f.rest = true; }
      }
    }
    for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; d.r += 22 * dt; d.a -= 0.5 * dt; }
    dust = dust.filter(d => d.a > 0);
    for (const r of rings) { r.r += (r.slow ? 380 : 900) * dt; r.a -= (r.slow ? 1.1 : 2) * dt; }
    rings = rings.filter(r => r.a > 0);
    if (fire) { fire.r += (fire.R * 0.9 - fire.r) * 9 * dt; fire.a -= 1.3 * dt; if (fire.a <= 0) fire = null; }
    shake *= Math.pow(0.02, dt); flash -= 3.5 * dt;

    // ── 그리기 ──
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0.4) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
    ctx.fillStyle = night ? '#2c3358' : '#e9c98f'; ctx.fillRect(-30, gy, W + 60, H - gy + 30);
    ctx.fillStyle = '#111522'; ctx.fillRect(-30, gy - 1.5, W + 60, 3);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 2; ctx.strokeStyle = '#111522';
    for (const b of things) {
      if (b.kind === 'b') {
        ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#fff6c2';
        for (let wy = b.y + 8; wy < gy - 14; wy += 16) for (let wx = b.x + 6; wx < b.x + b.w - 10; wx += 13) ctx.fillRect(wx, wy, 7, 8);
        if (b.roof) { ctx.fillStyle = '#b5533c'; ctx.beginPath(); ctx.moveTo(b.x - 3, b.y); ctx.lineTo(b.x + b.w / 2, b.y - 14); ctx.lineTo(b.x + b.w + 3, b.y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      } else {
        const hop = Math.abs(Math.sin(b.ph)) * 3;
        ctx.fillStyle = '#333'; ctx.fillRect(b.x - 4, b.y - 8, 3, 8); ctx.fillRect(b.x + 1, b.y - 8, 3, 8);
        ctx.fillStyle = '#55607d'; ctx.fillRect(b.x - 5, b.y - 20 - hop, 10, 13);
        ctx.font = '16px sans-serif'; ctx.fillText(enemy, b.x, b.y - 27 - hop);
      }
    }
    ctx.lineWidth = 1;
    for (const f of frags) {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      if (f.emoji) { ctx.font = '16px sans-serif'; ctx.fillText(f.emoji, 0, 0); }
      else { ctx.fillStyle = f.c; ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h); ctx.strokeRect(-f.w / 2, -f.h / 2, f.w, f.h); }
      ctx.restore();
    }
    if (fire) {
      ctx.globalAlpha = Math.max(0, fire.a);
      ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffd23d'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r * 0.6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r * 0.28, Math.PI, 0); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const d of dust) { ctx.globalAlpha = Math.max(0, d.a); ctx.fillStyle = night ? '#9aa3cf' : '#b8a78a'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.a); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(r.x, gy, r.r, Math.PI, 0); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.font = '38px sans-serif'; ctx.fillText('✈️', plane * W, H * 0.1);
    if (bomb) {
      const s = 9 * big;
      ctx.fillStyle = '#e9ecf5'; ctx.strokeStyle = '#111522'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(bomb.x, bomb.y, s * 0.7, s * 1.2, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b6ff3d'; ctx.fillRect(bomb.x - s * 0.7, bomb.y - s * 1.6, s * 1.4, s * 0.5); ctx.strokeRect(bomb.x - s * 0.7, bomb.y - s * 1.6, s * 1.4, s * 0.5);
    }
    ctx.restore();
    if (flash > 0) { ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    raf = requestAnimationFrame(loop);
  }

  return { start, stop, setPlane, release };
})();
