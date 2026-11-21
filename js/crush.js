// 투하 장면: 표적(개집·자동차·건물·명소·행성 무엇이든)이 산산조각 나는 그림판(canvas)
// 모든 물건은 작은 그림(sprite)으로 만들어 두고, 터질 때 그 그림을 바둑판으로 잘라 날린다.
G.crush = (() => {
  let cv, ctx, W, H, gy, raf = 0, last = 0, live = false;
  let things = [], frags = [], dust = [], rings = [], bomb = null, fire = null, stars = [];
  let plane = 0.5, shake = 0, flash = 0, big = 1, night = true, img = null, cloud = null, space = false, grav = 1150;
  const COL = ['#ff8a5c', '#ffd23d', '#7fd3a8', '#8fb6ff', '#e59bd0', '#c9b08a'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const S = 2;                                   // 작은 그림 해상도 배율

  function sprite(w, h, draw) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
    const x = c.getContext('2d'); x.scale(S, S); draw(x); return c;
  }
  function building(w, h, color, roof) {
    const top = roof ? 14 : 0;
    return { w: w + 6, h: h + top, sp: sprite(w + 6, h + top, x => {
      x.lineWidth = 2; x.strokeStyle = '#111522';
      x.fillStyle = color; x.fillRect(3, top, w, h); x.strokeRect(3, top + 1, w, h - 1);
      x.fillStyle = '#fff6c2';
      for (let wy = top + 8; wy < top + h - 14; wy += 16) for (let wx = 9; wx < w - 6; wx += 13) x.fillRect(wx, wy, 7, 8);
      if (roof) { x.fillStyle = '#b5533c'; x.beginPath(); x.moveTo(1, top); x.lineTo(3 + w / 2, 1); x.lineTo(w + 5, top); x.closePath(); x.fill(); x.stroke(); }
    }) };
  }
  function emoji(ch, size) {
    const b = Math.ceil(size * 1.25);
    return { w: b, h: b, sp: sprite(b, b, x => { x.font = size + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, b / 2, b / 2 + size * 0.06); }) };
  }
  function baddie(ch) {
    return { w: 22, h: 40, sp: sprite(22, 40, x => {
      x.fillStyle = '#333'; x.fillRect(7, 32, 3, 8); x.fillRect(12, 32, 3, 8);
      x.fillStyle = '#55607d'; x.fillRect(6, 19, 10, 13);
      x.font = '16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 11, 10);
    }) };
  }

  // opt: { main 큰 표적 그림, size 그 크기, bld 건물 수, ppl 사람 수, tall 건물 키(0~1), space 우주, enemy, big, shroom }
  function start(canvas, opt) {
    stop();
    cv = canvas;
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d;
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    space = !!opt.space; gy = space ? H * 0.66 : H * 0.86; grav = space ? 260 : 1150;
    big = opt.big || 1; night = document.body.classList.contains('night');
    things = []; frags = []; dust = []; rings = []; bomb = null; fire = null; shake = flash = 0; cloud = null; stars = [];
    img = null;
    if (opt.shroom) { img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(opt.shroom); }
    if (space) for (let i = 0; i < 40; i++) stars.push([rnd(0, W), rnd(0, H), rnd(0.6, 1.8)]);

    // 큰 표적은 가운데
    const size = Math.min(opt.size || 70, W * 0.5, H * 0.5);
    let mainL = W / 2, mainR = W / 2;
    if (opt.main) {
      const m = emoji(opt.main, size);
      things.push(Object.assign(m, { kind: 's', x: W / 2 - m.w / 2, y: gy - m.h + (space ? m.h * 0.35 : size * 0.12), weight: 4 }));
      mainL = W / 2 - size * 0.5; mainR = W / 2 + size * 0.5;
    }
    // 둘레 건물: 왼쪽·오른쪽으로 번갈아 놓는다
    const maxH = Math.min(150, H * 0.42) * (0.45 + 0.55 * (opt.tall == null ? 0.6 : opt.tall));
    let l = mainL - 4, rr = mainR + 4;
    for (let i = 0; i < (opt.bld || 0); i++) {
      const w = rnd(26, 42), h = rnd(maxH * 0.45, maxH), b = building(w, h, G.rand(COL), Math.random() < 0.5);
      if (i % 2 === 0) { if (l - b.w < W * 0.1) continue; l -= b.w; things.push(Object.assign(b, { kind: 's', x: l, y: gy - b.h, weight: 1 })); l -= rnd(1, 5); }
      else { if (rr + b.w > W * 0.9) continue; things.push(Object.assign(b, { kind: 's', x: rr, y: gy - b.h, weight: 1 })); rr += b.w + rnd(1, 5); }
    }
    if (!space) for (let i = 0; i < (opt.ppl || 0); i++) {
      const p = baddie(opt.enemy || '😈');
      things.push(Object.assign(p, { kind: 'p', x: rnd(W * 0.16, W * 0.8), y: gy - p.h, vx: rnd(8, 22) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 6), weight: 1 }));
    }
    live = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { live = false; cancelAnimationFrame(raf); }
  function setPlane(f) { if (!bomb && !fire) plane = f; }
  function release(xf, rf, cb) { bomb = { x: xf * W, y: H * 0.16, vy: 0, r: rf * W, cb }; }

  // 그림을 바둑판으로 잘라 조각으로 만든다 (빈 칸은 버린다)
  function shatter(t, ix, R) {
    const cell = t.w > 90 ? 15 : 11, nx = Math.max(2, Math.round(t.w / cell)), ny = Math.max(2, Math.round(t.h / cell));
    const cw = t.w / nx, ch = t.h / ny, sw = t.sp.width / nx, sh = t.sp.height / ny;
    let data = null;
    try { data = t.sp.getContext('2d').getImageData(0, 0, t.sp.width, t.sp.height).data; } catch {}
    const oy = t.kind === 'p' ? 0 : 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      if (data) { const px = Math.floor((i + 0.5) * sw), py = Math.floor((j + 0.5) * sh); if (data[(py * t.sp.width + px) * 4 + 3] < 24) continue; }
      const x = t.x + (i + 0.5) * cw, y = t.y + oy + (j + 0.5) * ch;
      const dx = x - ix, dy = y - gy - 10, len = Math.hypot(dx, dy) || 1;
      const near = 1 - Math.min(1, Math.abs(dx) / R) * 0.6, p = near * rnd(320, 760) * Math.sqrt(big) * (space ? 0.6 : 1);
      frags.push({ sp: t.sp, sx: i * sw, sy: j * sh, sw, sh, x, y, w: cw, h: ch, vx: dx / len * p + rnd(-70, 70), vy: dy / len * p - rnd(160, 420) * (space ? 0.4 : 1), rot: 0, vr: rnd(-14, 14) });
    }
  }
  function explode() {
    const ix = bomb.x, R = bomb.r, cb = bomb.cb;
    let hit = 0, total = 0; const keep = [];
    for (const t of things) {
      const cx = t.x + t.w / 2; total += t.weight;
      if (Math.abs(cx - ix) < R + (t.weight > 1 ? t.w * 0.2 : 0)) { hit += t.weight; shatter(t, ix, R); }
      else { if (t.kind === 'p') t.vx = (cx < ix ? -1 : 1) * 150; keep.push(t); }
    }
    things = keep; bomb = null;
    flash = 1; shake = 20 * big; rings.push({ x: ix, r: 8, a: 1 }, { x: ix, r: 2, a: 1, slow: true });
    fire = { x: ix, r: 14, a: 1, R };
    cloud = { x: Math.max(W * 0.3, Math.min(W * 0.7, ix)), t: 0 };
    for (let i = 0; i < 46; i++) dust.push({ x: ix + rnd(-R, R) * 0.8, y: gy - rnd(0, 30), vx: rnd(-120, 120), vy: rnd(-220, -30), r: rnd(6, 20), a: 0.75 });
    try { navigator.vibrate && navigator.vibrate([70, 40, 240]); } catch {}
    cb({ hit, total });
  }

  function loop(t) {
    if (!live || !cv.isConnected) return stop();
    const dt = Math.min(0.033, (t - last) / 1000); last = t;
    for (const p of things) if (p.kind === 'p') {
      p.x += p.vx * dt; p.ph += dt * 10;
      if (p.x < W * 0.03 || p.x > W * 0.92) { p.vx *= -1; p.x = Math.max(W * 0.03, Math.min(W * 0.92, p.x)); }
    }
    if (bomb) { bomb.vy += 1700 * dt; bomb.y += bomb.vy * dt; if (bomb.y >= gy - 8) explode(); }
    for (const f of frags) {
      if (f.rest) continue;
      f.vy += grav * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (space) continue;
      if (f.x < 4 || f.x > W - 4) { f.vx *= -0.5; f.x = Math.max(4, Math.min(W - 4, f.x)); }
      const floor = gy + 6 - f.h / 2;
      if (f.y > floor) {
        f.y = floor; f.vy *= -0.38; f.vx *= 0.62; f.vr *= 0.5;
        if (Math.abs(f.vy) < 40) { f.vy = 0; if (Math.abs(f.vx) < 8) f.rest = true; }
      }
    }
    if (space) frags = frags.filter(f => f.y < H + 40 && f.x > -40 && f.x < W + 40);
    for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; d.r += 22 * dt; d.a -= 0.5 * dt; }
    dust = dust.filter(d => d.a > 0);
    for (const r of rings) { r.r += (r.slow ? 380 : 900) * dt; r.a -= (r.slow ? 1.1 : 2) * dt; }
    rings = rings.filter(r => r.a > 0);
    if (fire) { fire.r += (fire.R * 0.9 - fire.r) * 9 * dt; fire.a -= 1.3 * dt; if (fire.a <= 0) fire = null; }
    shake *= Math.pow(0.02, dt); flash -= 3.5 * dt;
    if (cloud) cloud.t += dt;

    // ── 그리기 ──
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0.4) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
    if (space) {
      ctx.fillStyle = '#070a1c'; ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.fillStyle = '#fff'; for (const s of stars) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t / 400 + s[0]); ctx.fillRect(s[0], s[1], s[2], s[2]); }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = night ? '#2c3358' : '#e9c98f'; ctx.fillRect(-30, gy, W + 60, H - gy + 30);
      ctx.fillStyle = '#111522'; ctx.fillRect(-30, gy - 1.5, W + 60, 3);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const b of things) {
      const hop = b.kind === 'p' ? Math.abs(Math.sin(b.ph)) * 3 : 0;
      ctx.drawImage(b.sp, b.x, b.y - hop, b.w, b.h);
    }
    if (cloud && img && img.complete && img.naturalWidth) {
      const k = Math.min(1, cloud.t / 0.75), c1 = 1.70158, c3 = c1 + 1, back = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      const h = Math.min(H * 0.74, H * 0.56 * Math.sqrt(big)) * back * (1 + Math.sin(cloud.t * 3) * 0.015), w = h * 160 / 170;
      ctx.globalAlpha = 0.96; ctx.drawImage(img, cloud.x - w / 2, gy - h + (space ? h * 0.25 : 0), w, h); ctx.globalAlpha = 1;
    }
    for (const f of frags) {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.drawImage(f.sp, f.sx, f.sy, f.sw, f.sh, -f.w / 2, -f.h / 2, f.w, f.h);
      ctx.restore();
    }
    if (fire) {
      const a0 = space ? 0 : Math.PI, a1 = space ? 7 : 0;
      ctx.globalAlpha = Math.max(0, fire.a);
      ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r, a0, a1); ctx.fill();
      ctx.fillStyle = '#ffd23d'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r * 0.6, a0, a1); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fire.x, gy, fire.r * 0.28, a0, a1); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const d of dust) { ctx.globalAlpha = Math.max(0, d.a); ctx.fillStyle = night ? '#9aa3cf' : '#b8a78a'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const r of rings) { ctx.globalAlpha = Math.max(0, r.a); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(r.x, gy, r.r, space ? 0 : Math.PI, space ? 7 : 0); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.font = '38px sans-serif'; ctx.fillText(space ? '🚀' : '✈️', plane * W, H * 0.1);
    if (bomb) {
      const s = 9 * big;
      ctx.fillStyle = G.look().nuke; ctx.strokeStyle = '#111522'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(bomb.x, bomb.y, s * 0.7, s * 1.2, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b6ff3d'; ctx.fillRect(bomb.x - s * 0.7, bomb.y - s * 1.6, s * 1.4, s * 0.5); ctx.strokeRect(bomb.x - s * 0.7, bomb.y - s * 1.6, s * 1.4, s * 0.5);
    }
    ctx.restore();
    if (flash > 0) { ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    raf = requestAnimationFrame(loop);
  }

  return { start, stop, setPlane, release };
})();
