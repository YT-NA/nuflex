// 대포 발사 장면: 손님이 포물선으로 날아가 섬에 착지하거나 바다에 풍덩
G.fly = (() => {
  let cv, ctx, W, H, gy, raf = 0, last = 0, live = false, opt = {}, guys = [], drops = [], t = 0, cb = null, told = false, kick = 0;
  let x0, y0, ix, hw, funs = [], funT = 0;
  const G0 = 900, TH = 50 * Math.PI / 180;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function start(canvas, o) {
    stop();
    cv = canvas; opt = o;
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d;
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    gy = H * 0.84; x0 = W * 0.15; y0 = gy - 30; ix = W * 0.78; hw = W * 0.09;
    guys = []; drops = []; funs = []; funT = 0; t = 0; cb = null; told = false; kick = 0;
    live = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { live = false; cancelAnimationFrame(raf); }

  // p: 0~1 힘. 0.5 면 섬 한가운데
  function fire(p, f) {
    cb = f; t = 0; kick = 1;
    const v0 = Math.sqrt((ix - x0) * G0 / Math.sin(2 * TH)), n = opt.n || 1;
    for (let i = 0; i < n; i++) {
      const pp = p + (n > 1 ? rnd(-0.07, 0.07) : 0), v = v0 * (0.7 + 0.6 * pp);
      guys.push({ delay: i * 0.1, x: x0, y: y0, vx: v * Math.cos(TH), vy: -v * Math.sin(TH), rot: 0, st: 'wait', slot: (i % 5 - 2) * hw * 0.32 });
    }
    try { navigator.vibrate && navigator.vibrate(60); } catch {}
  }

  function person(g) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot);
    ctx.fillStyle = '#333'; ctx.fillRect(-4, 6, 3, 8); ctx.fillRect(1, 6, 3, 8);
    ctx.fillStyle = opt.color || '#4aa3ff'; ctx.fillRect(-6, -6, 12, 13);
    ctx.strokeStyle = '#111522'; ctx.lineWidth = 1.5; ctx.strokeRect(-6, -6, 12, 13);
    if (opt.face) { ctx.font = '17px sans-serif'; ctx.fillText(opt.face, 0, -14); }
    else { ctx.fillStyle = '#ffe0c2'; ctx.beginPath(); ctx.arc(0, -13, 7, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  function loop(now) {
    if (!live || !cv.isConnected) return stop();
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (cb) t += dt;
    kick *= Math.pow(0.01, dt);
    let fin = 0, on = 0, far = 0;
    for (const g of guys) {
      if (g.st === 'wait' && t >= g.delay) g.st = 'fly';
      if (g.st === 'fly') {
        g.vy += G0 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += 9 * dt;
        if (g.x > W + 30) { g.st = 'gone'; g.far = true; }
        else if (g.vy > 0 && g.y >= gy - 12) {
          if (Math.abs(g.x - ix) < hw) { g.st = 'on'; g.x = ix + g.slot; g.y = gy - 22; g.rot = 0; }
          else { g.st = 'wet'; for (let i = 0; i < 14; i++) drops.push({ x: g.x, y: gy, vx: rnd(-90, 90), vy: rnd(-320, -120), a: 1 }); G.snd.play('splash'); }
        }
      }
      if (g.st !== 'wait' && g.st !== 'fly') fin++;
      if (g.st === 'on') on++;
      if (g.far) far++;
    }
    for (const d of drops) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a -= 1.2 * dt; }
    drops = drops.filter(d => d.a > 0);
    // 도착한 사람들은 신나게 논다: 폴짝폴짝 + 놀거리 그림이 떠오른다
    if (on > 0) {
      funT -= dt;
      if (funT <= 0) { funT = 0.28; funs.push({ ch: (opt.fun || ['🎉'])[Math.floor(Math.random() * (opt.fun || ['🎉']).length)], x: ix + rnd(-hw, hw), y: gy - 50, a: 1 }); }
    }
    for (const f of funs) { f.y -= 46 * dt; f.a -= 0.7 * dt; }
    funs = funs.filter(f => f.a > 0);
    if (cb && !told && guys.length && fin === guys.length) { told = true; cb({ on, n: guys.length, far: far === guys.length }); }

    // ── 그리기 ──
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3aa0e8'; ctx.fillRect(W * 0.3, gy, W * 0.7, H - gy);                       // 바다
    ctx.fillStyle = '#e9c98f'; ctx.fillRect(0, gy, W * 0.3, H - gy);                             // 우리 땅
    ctx.fillStyle = '#111522'; ctx.fillRect(0, gy - 1.5, W, 3);
    ctx.fillStyle = '#f2d9a0'; ctx.strokeStyle = '#111522'; ctx.lineWidth = 2.5;                 // 섬
    ctx.beginPath(); ctx.ellipse(ix, gy, hw + 8, 16, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.font = '34px sans-serif'; ctx.fillText(opt.dest || '🏝', ix, gy - 44);
    ctx.font = '26px sans-serif'; ctx.fillText('🏪', W * 0.06, gy - 16);
    for (const g of guys) {
      if (g.st === 'fly') person(g);
      if (g.st === 'on') { const y = g.y; g.y = y - Math.abs(Math.sin(now / 130 + g.slot)) * 10; person(g); g.y = y; }
    }
    ctx.font = '24px sans-serif';
    for (const f of funs) { ctx.globalAlpha = Math.max(0, f.a); ctx.fillText(f.ch, f.x, f.y); }
    ctx.globalAlpha = 1;
    // 대포
    ctx.save(); ctx.translate(x0 - 12, gy - 14); ctx.rotate(-TH); ctx.translate(-kick * 8, 0);
    ctx.fillStyle = '#565c7c'; ctx.strokeStyle = '#111522'; ctx.lineWidth = 3;
    ctx.fillRect(-6, -13, 50, 26); ctx.strokeRect(-6, -13, 50, 26);
    ctx.fillStyle = '#ff7a3d'; ctx.fillRect(38, -15, 8, 30); ctx.strokeRect(38, -15, 8, 30);
    ctx.restore();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x0 - 12, gy - 8, 10, 0, 7); ctx.fill(); ctx.stroke();
    if (kick > 0.05) { ctx.globalAlpha = kick; ctx.font = '30px sans-serif'; ctx.fillText('💥', x0 + 24, y0 - 22); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#dff3ff';
    for (const d of drops) { ctx.globalAlpha = Math.max(0, d.a); ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  }

  return { start, stop, fire };
})();
