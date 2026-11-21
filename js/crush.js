// 투하 장면: 표적(개집·자동차·건물·명소·행성 무엇이든)이 산산조각 나는 그림판(canvas)
// 모든 물건은 작은 그림(sprite)으로 만들어 두고, 터질 때 그 그림을 바둑판으로 잘라 날린다.
// 물건마다 방어력(hp)이 있고, 적은 막기도 한다: 철판(armor) · 후라이팬(pan) · 요격 미사일(anti)
G.crush = (() => {
  let cv, ctx, W, H, gy, raf = 0, last = 0, live = false;
  let things = [], frags = [], dust = [], rings = [], labels = [], bomb = null, fire = null, stars = [];
  let plane = 0.5, aimR = 0, shake = 0, flash = 0, big = 1, night = true, img = null, cloud = null, space = false, grav = 1150;
  let total = 0, dead = 0, armor = 0, armorMax = 0, armorHit = 0, blocker = null, wicon = '💣', useCloud = false, steel = null, zap = null;
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

  // opt: { main, size, bld, ppl, tall, space, enemy, big, shroom(핵일 때만), hp(물건 하나의 방어력), armor(철판 방어력), blocker('pan'|'anti'), wicon(날아가는 탄 그림) }
  function start(canvas, opt) {
    stop();
    cv = canvas;
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d;
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    space = !!opt.space; gy = space ? H * 0.66 : H * 0.86; grav = space ? 260 : 1150;
    big = opt.big || 1; night = document.body.classList.contains('night');
    things = []; frags = []; dust = []; rings = []; labels = []; bomb = null; fire = null; shake = flash = 0; cloud = null; stars = []; zap = null;
    wicon = opt.wicon || '💣'; useCloud = !!opt.shroom; armor = armorMax = opt.armor || 0; armorHit = 0; aimR = 0;
    img = null;
    if (opt.shroom) { img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(opt.shroom); }
    if (space) for (let i = 0; i < 40; i++) stars.push([rnd(0, W), rnd(0, H), rnd(0.6, 1.8)]);
    steel = sprite(14, 14, x => { x.fillStyle = '#9aa3b5'; x.fillRect(0, 0, 14, 14); x.strokeStyle = '#111522'; x.lineWidth = 2; x.strokeRect(1, 1, 12, 12); x.fillStyle = '#5c607a'; x.fillRect(5, 5, 4, 4); });
    blocker = opt.blocker ? { type: opt.blocker, x: W * 0.3, vx: opt.blocker === 'anti' ? 125 : 70, w: W * (opt.blocker === 'anti' ? 0.2 : 0.17), swing: 0 } : null;

    const hp = opt.hp || 1, size = Math.min(opt.size || 70, W * 0.5, H * 0.5);
    let mainL = W / 2, mainR = W / 2;
    if (opt.main) {
      const m = emoji(opt.main, size);
      things.push(Object.assign(m, { kind: 's', x: W / 2 - m.w / 2, y: gy - m.h + (space ? m.h * 0.35 : size * 0.12), weight: 4, hp: hp * 2 }));
      mainL = W / 2 - size * 0.5; mainR = W / 2 + size * 0.5;
    }
    const maxH = Math.min(150, H * 0.42) * (0.45 + 0.55 * (opt.tall == null ? 0.6 : opt.tall));
    let l = mainL - 4, rr = mainR + 4;
    for (let i = 0; i < (opt.bld || 0); i++) {
      const w = rnd(26, 42), h = rnd(maxH * 0.45, maxH), b = building(w, h, G.rand(COL), Math.random() < 0.5);
      if (i % 2 === 0) { if (l - b.w < W * 0.1) continue; l -= b.w; things.push(Object.assign(b, { kind: 's', x: l, y: gy - b.h, weight: 1, hp })); l -= rnd(1, 5); }
      else { if (rr + b.w > W * 0.9) continue; things.push(Object.assign(b, { kind: 's', x: rr, y: gy - b.h, weight: 1, hp })); rr += b.w + rnd(1, 5); }
    }
    if (!space) for (let i = 0; i < (opt.ppl || 0); i++) {
      const p = baddie(opt.enemy || '😈');
      things.push(Object.assign(p, { kind: 'p', x: rnd(W * 0.16, W * 0.8), y: gy - p.h, vx: rnd(8, 22) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 6), weight: 1, hp: hp * 0.4 }));
    }
    for (const t of things) { t.max = t.hp; t.hitT = 0; }
    total = things.reduce((a, t) => a + t.weight, 0); dead = 0;
    live = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { live = false; cancelAnimationFrame(raf); }
  function setPlane(f, rf) { plane = f; aimR = (rf || 0) * W; }
  // 한 발 쏜다. 이미 날아가는 중이면 false
  function release(xf, rf, dmg, cb) {
    if (bomb) return false;
    bomb = { x: xf * W, y: H * 0.16, vy: 0, r: rf * W, dmg, cb };
    if (blocker && Math.abs(bomb.x - blocker.x) < blocker.w / 2) bomb.block = blocker.type;
    return true;
  }
  const stat = extra => Object.assign({ dead, total, left: things.length }, extra);
  const say = (txt, x, y, c) => labels.push({ txt, x, y, a: 1.4, c: c || '#fff' });

  // 그림을 바둑판으로 잘라 조각으로 만든다 (빈 칸은 버린다)
  function shatter(t, ix, R) {
    const cell = t.w > 90 ? 15 : 11, nx = Math.max(2, Math.round(t.w / cell)), ny = Math.max(2, Math.round(t.h / cell));
    const cw = t.w / nx, ch = t.h / ny, sw = t.sp.width / nx, sh = t.sp.height / ny;
    let data = null;
    try { data = t.sp.getContext('2d').getImageData(0, 0, t.sp.width, t.sp.height).data; } catch {}
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      if (data) { const px = Math.floor((i + 0.5) * sw), py = Math.floor((j + 0.5) * sh); if (data[(py * t.sp.width + px) * 4 + 3] < 24) continue; }
      const x = t.x + (i + 0.5) * cw, y = t.y + (j + 0.5) * ch;
      const dx = x - ix, dy = y - gy - 10, len = Math.hypot(dx, dy) || 1;
      const near = 1 - Math.min(1, Math.abs(dx) / Math.max(R, 40)) * 0.6, p = near * rnd(320, 760) * Math.sqrt(big) * (space ? 0.6 : 1);
      frags.push({ sp: t.sp, sx: i * sw, sy: j * sh, sw, sh, x, y, w: cw, h: ch, vx: dx / len * p + rnd(-70, 70), vy: dy / len * p - rnd(160, 420) * (space ? 0.4 : 1), rot: 0, vr: rnd(-14, 14) });
    }
  }
  function boomFx(ix, y, R, k) {
    flash = Math.max(flash, 0.35 + 0.65 * k); shake = Math.max(shake, (5 + 15 * k) * big);
    rings.push({ x: ix, y, r: 8, a: 1 }); if (k > 0.5) rings.push({ x: ix, y, r: 2, a: 1, slow: true });
    fire = { x: ix, y, r: 8, a: 1, R: Math.max(R, 26) };
    for (let i = 0; i < 10 + 36 * k; i++) dust.push({ x: ix + rnd(-R, R) * 0.8, y: y - rnd(0, 30), vx: rnd(-120, 120), vy: rnd(-220, -30), r: rnd(4, 8 + 12 * k), a: 0.75 });
    try { navigator.vibrate && navigator.vibrate(k > 0.5 ? [70, 40, 240] : 50); } catch {}
  }
  function explode() {
    const ix = bomb.x, R = bomb.r, dmg = bomb.dmg, cb = bomb.cb, k = Math.min(1, R / (W * 0.3));
    bomb = null;
    // 철판이 남아 있으면 철판이 대신 맞는다
    if (armor > 0) {
      armor -= dmg; armorHit = 0.35; boomFx(ix, gy - H * 0.22, R * 0.5, k * 0.4);
      if (armor <= 0) {
        for (let i = 0; i < 60; i++) { const a = Math.PI + Math.random() * Math.PI, rr = W * 0.42; frags.push({ sp: steel, sx: 0, sy: 0, sw: steel.width, sh: steel.height, x: W / 2 + Math.cos(a) * rr, y: gy + Math.sin(a) * rr * 0.7, w: 13, h: 13, vx: rnd(-300, 300), vy: rnd(-500, -100), rot: 0, vr: rnd(-14, 14) }); }
        say('철판 박살!', W / 2, gy - H * 0.36, '#b6ff3d'); return cb(stat({ armor: true, broke: true }));
      }
      say('깡! 철판', ix, gy - H * 0.3, '#cfd4e6'); return cb(stat({ armor: true }));
    }
    let killed = 0; const keep = [];
    for (const t of things) {
      const cx = t.x + t.w / 2;
      if (Math.abs(cx - ix) < R + (t.weight > 1 ? t.w * 0.25 : t.w * 0.3)) {
        t.hp -= dmg;
        if (t.hp <= 0) { dead += t.weight; killed++; shatter(t, ix, R); continue; }
        t.hitT = 0.3;
      } else if (t.kind === 'p') t.vx = (cx < ix ? -1 : 1) * 150;
      keep.push(t);
    }
    things = keep;
    boomFx(ix, gy, R, k);
    if (useCloud) cloud = { x: Math.max(W * 0.3, Math.min(W * 0.7, ix)), t: 0 };
    if (!killed && things.length) say('안 깨진다!', ix, gy - 60, '#ffb3b3');
    cb(stat({ killed }));
  }

  function loop(t) {
    if (!live || !cv.isConnected) return stop();
    const dt = Math.min(0.033, (t - last) / 1000); last = t;
    for (const p of things) {
      if (p.hitT > 0) p.hitT -= dt;
      if (p.kind !== 'p') continue;
      p.x += p.vx * dt; p.ph += dt * 10;
      if (p.x < W * 0.03 || p.x > W * 0.92) { p.vx *= -1; p.x = Math.max(W * 0.03, Math.min(W * 0.92, p.x)); }
    }
    if (blocker) {
      blocker.x += blocker.vx * dt; if (blocker.swing > 0) blocker.swing -= dt;
      if (blocker.x < W * 0.14 || blocker.x > W * 0.86) { blocker.vx *= -1; blocker.x = Math.max(W * 0.14, Math.min(W * 0.86, blocker.x)); }
    }
    if (bomb) {
      bomb.vy += 1700 * dt; bomb.y += bomb.vy * dt;
      if (bomb.block === 'anti' && bomb.y > H * 0.42) {            // 맞미사일이 공중에서 요격
        const b = bomb; bomb = null; zap = { x0: blocker.x, y0: gy - 20, x1: b.x, y1: b.y, a: 1 };
        boomFx(b.x, b.y, 30, 0.2); say('요격당했다!', b.x, b.y - 30, '#ffb3b3'); b.cb(stat({ blocked: 'anti' }));
      } else if (bomb.block === 'pan' && bomb.y > gy - 62) {       // 후라이팬으로 쳐낸다
        const b = bomb; bomb = null; blocker.swing = 0.35;
        const e = emoji(wicon, 22); frags.push({ sp: e.sp, sx: 0, sy: 0, sw: e.sp.width, sh: e.sp.height, x: b.x, y: b.y, w: e.w, h: e.h, vx: rnd(-1, 1) > 0 ? 420 : -420, vy: -720, rot: 0, vr: 20 });
        shake = 5; say('깡! 쳐냈다', b.x, b.y - 40, '#ffe08a'); b.cb(stat({ blocked: 'pan' }));
      } else if (bomb.y >= gy - 8) explode();
    }
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
    if (frags.length > 900) frags.splice(0, frags.length - 900);
    for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; d.r += 22 * dt; d.a -= 0.5 * dt; }
    dust = dust.filter(d => d.a > 0);
    for (const r of rings) { r.r += (r.slow ? 380 : 900) * dt; r.a -= (r.slow ? 1.1 : 2) * dt; }
    rings = rings.filter(r => r.a > 0);
    for (const l of labels) { l.y -= 30 * dt; l.a -= dt; }
    labels = labels.filter(l => l.a > 0);
    if (fire) { fire.r += (fire.R * 0.9 - fire.r) * 9 * dt; fire.a -= 1.3 * dt; if (fire.a <= 0) fire = null; }
    if (zap) { zap.a -= 2.5 * dt; if (zap.a <= 0) zap = null; }
    if (armorHit > 0) armorHit -= dt;
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
      const hop = b.kind === 'p' ? Math.abs(Math.sin(b.ph)) * 3 : 0, j = b.hitT > 0 ? rnd(-3, 3) : 0;
      ctx.drawImage(b.sp, b.x + j, b.y - hop, b.w, b.h);
      if (b.hp < b.max) {                                           // 맞았지만 버틴 물건: 남은 방어력 막대
        const bw = Math.min(b.w, 44), bx = b.x + b.w / 2 - bw / 2, by = b.y - 8;
        ctx.fillStyle = '#111522'; ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
        ctx.fillStyle = '#ff4b4b'; ctx.fillRect(bx, by, bw * Math.max(0, b.hp / b.max), 5);
      }
    }
    if (cloud && img && img.complete && img.naturalWidth) {
      const k = Math.min(1, cloud.t / 0.75), c1 = 1.70158, c3 = c1 + 1, back = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      const h = Math.min(H * 0.74, H * 0.56 * Math.sqrt(big)) * back * (1 + Math.sin(cloud.t * 3) * 0.015), w = h * 160 / 170;
      ctx.globalAlpha = Math.max(0, Math.min(0.96, 2.6 - cloud.t * 0.9)); ctx.drawImage(img, cloud.x - w / 2, gy - h + (space ? h * 0.25 : 0), w, h); ctx.globalAlpha = 1;
    }
    if (armor > 0) {                                                // 철판 지붕
      const rr = W * 0.43;
      ctx.fillStyle = armorHit > 0 ? 'rgba(255,255,255,.7)' : 'rgba(154,163,181,.5)'; ctx.strokeStyle = '#111522'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(W / 2, gy, rr, rr * 0.72, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(17,21,34,.55)';
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(W / 2, gy, rr * i / 6, rr * 0.72, 0, Math.PI, 0); ctx.stroke(); }
      const bw = W * 0.5; ctx.fillStyle = '#111522'; ctx.fillRect(W / 2 - bw / 2 - 2, gy - rr * 0.72 - 20, bw + 4, 11);
      ctx.fillStyle = '#9aa3b5'; ctx.fillRect(W / 2 - bw / 2, gy - rr * 0.72 - 18, bw * Math.max(0, armor / armorMax), 7);
      ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('🔩 철판', W / 2, gy - rr * 0.72 - 30);
    }
    if (blocker) {                                                  // 막는 사람·레이더와 그 범위
      ctx.fillStyle = blocker.type === 'anti' ? 'rgba(255,75,75,.22)' : 'rgba(255,210,61,.28)';
      ctx.fillRect(blocker.x - blocker.w / 2, blocker.type === 'anti' ? H * 0.2 : gy - 70, blocker.w, blocker.type === 'anti' ? gy - H * 0.2 : 70);
      ctx.font = '30px sans-serif';
      if (blocker.type === 'anti') ctx.fillText('📡', blocker.x, gy - 18);
      else { ctx.fillText('👵', blocker.x, gy - 18); ctx.save(); ctx.translate(blocker.x + 16, gy - 44); ctx.rotate(blocker.swing > 0 ? -1.2 : -0.2); ctx.fillText('🍳', 0, 0); ctx.restore(); }
    }
    for (const f of frags) {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.drawImage(f.sp, f.sx, f.sy, f.sw, f.sh, -f.w / 2, -f.h / 2, f.w, f.h);
      ctx.restore();
    }
    if (fire) {
      const full = space || fire.y < gy - 4, a0 = full ? 0 : Math.PI, a1 = full ? 7 : 0;
      ctx.globalAlpha = Math.max(0, fire.a);
      ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r, a0, a1); ctx.fill();
      ctx.fillStyle = '#ffd23d'; ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r * 0.6, a0, a1); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fire.x, fire.y, fire.r * 0.28, a0, a1); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const d of dust) { ctx.globalAlpha = Math.max(0, d.a); ctx.fillStyle = night ? '#9aa3cf' : '#b8a78a'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const r of rings) { const full = space || r.y < gy - 4; ctx.globalAlpha = Math.max(0, r.a); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, full ? 0 : Math.PI, full ? 7 : 0); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (zap) { ctx.globalAlpha = Math.max(0, zap.a); ctx.strokeStyle = '#ff4b4b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(zap.x0, zap.y0); ctx.lineTo(zap.x1, zap.y1); ctx.stroke(); ctx.font = '22px sans-serif'; ctx.fillText('🚀', zap.x1, zap.y1); ctx.globalAlpha = 1; }
    // 조준: 비행기 아래로 떨어질 자리와 터지는 넓이
    if (aimR > 0 && !bomb) {
      const px = plane * W;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.moveTo(px, H * 0.16); ctx.lineTo(px, gy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#b6ff3d'; ctx.fillRect(px - aimR, gy + 6, aimR * 2, 6);
    }
    ctx.font = '38px sans-serif'; ctx.fillText(space ? '🚀' : '✈️', plane * W, H * 0.1);
    if (bomb) { ctx.font = Math.round(24 * big) + 'px sans-serif'; ctx.fillText(wicon, bomb.x, bomb.y); }
    ctx.font = '900 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#111522';
    for (const l of labels) { ctx.globalAlpha = Math.min(1, l.a); ctx.strokeText(l.txt, l.x, l.y); ctx.fillStyle = l.c; ctx.fillText(l.txt, l.x, l.y); }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (flash > 0) { ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    raf = requestAnimationFrame(loop);
  }

  return { start, stop, setPlane, release };
})();
