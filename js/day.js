// 낮: 가게 앞 · 상담실(아무 데나 골라 보내기) · 대포 발사 · 여행 지도

// ── 가게 앞 (낮·밤 공용 첫 화면) ──
G.screens.home = () => {
  const s = G.s, night = s.phase === 'night';
  const side = [['shop', '🛒', '상점'], ['attend', '🎁', '출석'], ['ad', '📺', '광고'], ['mail', '✉️', '우편'], ['sound', G.snd.isOn() ? '🔊' : '🔇', '소리']]
    .map(([id, ic, nm]) => `<button onclick="G.side('${id}')"><span>${ic}</span>${nm}${G.sideBadge(id) ? '<em></em>' : ''}</button>`).join('');
  let cta, bubble;
  if (!night) {
    if (s.left > 0) { cta = `<button class="cta" onclick="G.go('counsel')">🙋 손님 ${s.left}팀 · 상담하기</button>`; bubble = '어서 오세요!'; }
    else { cta = `<button class="cta" onclick="G.closeShop()">🌙 가게 닫기</button>`; bubble = '오늘 장사 끝!'; }
  } else if (!s.opDone) { cta = `<button class="cta" onclick="G.go('ops')">☢️ 오늘 밤 작전</button>`; bubble = '이제 진짜 일…'; }
  else { cta = `<button class="cta" onclick="G.morning()">☀️ 아침 맞기</button>`; bubble = '졸려…'; }
  const walkers = night ? '' : [0, 1, 2].slice(0, Math.max(1, Math.min(3, s.left))).map(i =>
    `<div class="walker w${i}">${G.art.person(G.CUSTOMER_COLORS[(s.day + i) % 6])}</div>`).join('');
  return `<div class="home">
    <div class="sky"><i class="orb"></i>${night ? '<i class="star s1"></i><i class="star s2"></i><i class="star s3"></i>' : '<i class="cloud c1"></i><i class="cloud c2"></i>'}</div>
    <div class="side">${side}</div>
    <div class="shop" style="width:${70 + s.up.expand * 4}%" onclick="G.tapShop()">${G.art.shop(night)}
      ${G.DECOR.filter(x => s.decor[x.id]).map(x => `<span class="decor" style="left:${x.x}%;bottom:${x.y}%">${x.icon}</span>`).join('')}</div>
    ${night ? `<div class="truck" onclick="G.go('ops')">${G.art.truck()}</div>` : ''}
    <div class="hero"><div class="bubble">${bubble}</div>${G.art.hero(night)}</div>
    ${walkers}
    <div class="ground"></div>
    ${cta}
    ${night && !s.opDone ? `<button class="skip" onclick="G.morning()">😴 그냥 자기</button>` : ''}
  </div>`;
};

G.tapShop = () => G.s.phase === 'night' ? G.toast('🌙 셔터 내렸어요') : G.go('counsel');

G.closeShop = () => {
  const s = G.s;
  s.phase = 'night'; s.opDone = false; s.cust = null;
  G.newMission();
  G.save(); G.go('home');
  G.toast('🌙 밤이 됐어요'); G.snd.play('night');
};

// ── 손님: 여행사가 클수록 단체·높은 사람이 온다 ──
G.agencyLv = () => Math.min(G.GUESTS[G.GUESTS.length - 1].lv, 1 + G.s.up.expand + Math.floor(G.s.fame / 40));
G.dayCustomers = () => G.CUSTOMERS_PER_DAY + G.s.up.expand;

G.newCustomer = () => {
  const s = G.s, lv = G.agencyLv();
  const pool = G.GUESTS.map((g, i) => i).filter(i => G.GUESTS[i].lv <= lv);
  const gi = Math.random() < 0.6 ? G.rand(pool.slice(-3)) : G.rand(pool);     // 새로 온 급이 더 자주
  s.cust = { g: gi, name: G.GUESTS[gi].name, color: G.rand(G.CUSTOMER_COLORS), want: G.rand(G.COUNTRIES).id };
  s.pick = { dest: null };
};

// 룰렛 칸 6개: 열린 노선을 돌려 가며 채운다
G.wheelSlots = () => { const open = G.COUNTRIES.filter(c => G.s.routes[c.id]); return Array.from({ length: 6 }, (_, i) => open[i % open.length]); };

G.tripPay = destId => {
  const s = G.s, g = G.GUESTS[s.cust.g];
  return Math.round(G.country(destId).pay * g.mul * (1 + s.up.talk * 0.1 + (s.decor.neon ? 0.1 : 0)));
};

// ── 상담실: 원하는 대로 해 준다고 하고, 아무 데나 골라 보낸다 ──
G.screens.counsel = () => {
  const s = G.s, c = s.cust;
  if (!c) {
    return `<div class="counsel empty">${G.backBtn()}
      <div class="big">🪑</div><p>오늘 손님 끝!</p>
      <button class="cta in" onclick="G.closeShop()">🌙 가게 닫기</button>
      <button class="sub" onclick="G.moreCustomer()">🙋 손님 더 부르기 · 💎2</button></div>`;
  }
  const g = G.GUESTS[c.g], want = G.country(c.want);
  const done = !!s.pick.dest, slots = G.wheelSlots();
  const wheel = slots.map((x, i) => {
    const a = (i * 60 - 90) * Math.PI / 180;
    return `<div class="slot ${done && s.pick.slot === i ? 'on' : ''}" id="slot${i}" style="left:${50 + 37 * Math.cos(a)}%;top:${50 + 37 * Math.sin(a)}%"><span>${x.icon}</span><b>${x.name}</b></div>`;
  }).join('');
  if (!done) G.afterRender = G.startSpin;
  return `<div class="counsel">
    <div class="row head">${G.backBtn()}<button class="auto" onclick="G.autoAsk()">🤖 자동 발사<small>${G.autoLabel()}</small></button><span class="tag">손님 ${s.left}</span></div>
    <div class="room2">
      <div class="guest2"><div class="bubble">${want.icon} ${want.name}<br>가고 싶어요!</div>
        <div class="fig">${G.art.person(c.color, g.icon)}${g.n > 1 ? `<em class="xn">×${g.n}</em>` : ''}</div><small>${g.name}</small></div>
      <div class="desk2">📋</div>
      <div class="me2"><div class="bubble">네~ 원하시는<br>대로요! 😏</div>${G.art.hero(false)}</div>
    </div>
    <div class="wheel"><div class="ring">${wheel}
      <div class="arrow" id="arrow" style="transform:rotate(${s.pick.ang || 0}deg)"></div>
      <div class="hub">${done ? G.country(s.pick.dest).icon : '❓'}</div></div></div>
    ${done ? `<button class="cta in" onclick="G.go('launch')">🚀 ${G.country(s.pick.dest).name}(으)로 발사! +${G.fmt(G.tripPay(s.pick.dest))}</button>`
           : `<button class="cta in" id="stopbtn" onclick="G.stopSpin()">✋ STOP</button>`}
  </div>`;
};

// ── 룰렛: 화살표가 돌다가 STOP 을 누르면 서서히 멈춘 칸으로 보낸다 ──
let spinRaf = null, spinAng = 0, spinStop = null;
G.startSpin = () => {
  cancelAnimationFrame(spinRaf); spinStop = null;
  let last = performance.now(), lastSlot = -1;
  const tick = now => {
    const arrow = $('arrow');
    if (!arrow || !arrow.isConnected || G.s.pick.dest) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (spinStop) {
      const k = Math.min(1, (now - spinStop.t0) / 1300), e = 1 - Math.pow(1 - k, 3);
      spinAng = spinStop.from + (spinStop.to - spinStop.from) * e;
      if (k >= 1) return G.spinDone(spinStop.slot, spinStop.to);
    } else spinAng += 620 * dt;
    arrow.style.transform = `rotate(${spinAng}deg)`;
    const sl = ((Math.round((spinAng + 90) / 60) % 6) + 6) % 6;
    if (sl !== lastSlot) { lastSlot = sl; G.snd.play('tap'); }
    spinRaf = requestAnimationFrame(tick);
  };
  spinRaf = requestAnimationFrame(tick);
};
G.stopSpin = () => {
  if (spinStop || G.s.pick.dest) return;
  const btn = $('stopbtn'); if (btn) btn.classList.add('off');
  const raw = spinAng + 420 + Math.random() * 360, slot = ((Math.round((raw + 90) / 60) % 6) + 6) % 6;
  const to = Math.round((raw + 90) / 60) * 60 - 90;                 // 칸 한가운데에 멈춘다
  spinStop = { t0: performance.now(), from: spinAng, to, slot };
};
G.spinDone = (slot, ang) => {
  const s = G.s, x = G.wheelSlots()[slot];
  s.pick = { dest: x.id, slot, ang: ((ang % 360) + 360) % 360 };
  G.snd.play('good'); G.save(); G.render();
  G.toast(`${x.icon} ${x.name} 당첨!`);
};

G.moreCustomer = () => {
  const s = G.s;
  if (s.gem < 2) return G.side('shop');
  s.gem -= 2; s.left = 1; G.newCustomer(); G.save(); G.render();
};

// ── 자동 발사 (과금): 하루 1번 무료 → 보석 1개, 상담 비서가 있으면 무제한. 알아서 딱 맞게 쏜다 ──
G.autoLabel = () => { const s = G.s; return s.flags.secretary ? '비서' : (s.autoDay || 0) < s.day ? '무료 1번' : '💎1'; };
G.autoAsk = () => {
  const s = G.s;
  if (!s.cust) return;
  if (!s.flags.secretary) {
    if ((s.autoDay || 0) < s.day) s.autoDay = s.day;
    else if (s.gem >= 1) s.gem -= 1;
    else { G.toast('💎 보석이 모자라요'); return G.side('shop'); }
  }
  if (!s.pick.dest) {                                          // 룰렛을 건너뛴다. 원하는 곳이 열려 있으면 거기로
    const slots = G.wheelSlots(), i = Math.max(0, slots.findIndex(x => x.id === s.cust.want)), slot = slots[i].id === s.cust.want ? i : Math.floor(Math.random() * 6);
    s.pick = { dest: slots[slot].id, slot, ang: slot * 60 - 90 };
  }
  G.autoFire = true; G.save(); G.go('launch');
};

// ── 대포 발사: 손님을 여행지로 쏘아 보낸다 ──
let gaugeRaf = null, gaugePos = 0;
G.screens.launch = () => {
  const s = G.s, c = G.country(s.pick.dest), g = G.GUESTS[s.cust.g];
  G.afterRender = () => {
    G.fly.start($('fly'), { n: g.n, color: s.cust.color, face: g.icon, dest: c.icon, fun: c.fun });
    const t0 = performance.now(), mark = $('mark');
    cancelAnimationFrame(gaugeRaf);
    const tick = t => {
      if (!mark.isConnected) return;
      gaugePos = (Math.sin((t - t0) / 380) + 1) / 2;
      mark.style.left = gaugePos * 100 + '%';
      gaugeRaf = requestAnimationFrame(tick);
    };
    gaugeRaf = requestAnimationFrame(tick);
    if (G.autoFire) { G.autoFire = false; $('firebtn').classList.add('off'); setTimeout(() => G.fire(0.5), 450); }
  };
  return `<div class="drop launch">
    <div class="row head"><span class="tag">${c.icon} ${c.name}행 · ${g.name}${g.n > 1 ? ' ×' + g.n : ''}</span></div>
    <div class="air"><canvas id="fly"></canvas><div id="crushmsg" hidden></div></div>
    <div class="bar"><i class="zone" style="left:38%;width:24%"></i><u id="mark"></u></div>
    <button class="cta in" id="firebtn" onclick="G.fire()">🚀 발사!</button>
  </div>`;
};

G.fire = p => {
  const btn = $('firebtn');
  if (!btn || btn.dataset.fired) return;
  btn.dataset.fired = 1; btn.classList.add('off');
  cancelAnimationFrame(gaugeRaf);
  G.snd.play('shoot');
  G.fly.fire(p == null ? gaugePos : p, res => {
    const r = res.n ? res.on / res.n : 0, msg = $('crushmsg');
    if (!msg) return;
    msg.innerHTML = `${r >= 1 ? '착지 성공!' : r > 0 ? '몇 명 풍덩…' : res.far ? '너무 멀리~!' : '풍덩!!'}<small>🏝 ${res.on} / ${res.n}</small>`;
    msg.hidden = false; G.snd.play(r >= 1 ? 'good' : 'splash');
    setTimeout(() => { if (!btn.isConnected) return; btn.textContent = '계속 ▶'; btn.classList.remove('off'); btn.onclick = () => G.landed(r); }, 900);
  });
};

G.landed = r => {
  const s = G.s, c = s.cust, g = G.GUESTS[c.g], match = s.pick.dest === c.want;
  const pay = Math.round(G.tripPay(s.pick.dest) * (0.5 + 0.5 * r)), tip = (r >= 1 ? Math.round(pay * 0.2) : 0) + (s.decor.balloon ? 20 : 0);
  const fame = Math.round((match ? 2 : 1) * (1 + r)) + (s.decor.plant ? 1 : 0), heat = Math.round(2 + 2 * r);
  s.fame += fame; s.heat = Math.max(0, s.heat - heat); s.stats.served++; s.left--;
  s.cust = null;
  if (s.left > 0) G.newCustomer();
  G.screen = 'counsel'; history.pushState({ s: 'counsel' }, '');
  G.earn(pay + tip); G.save(); G.render();
  const face = r < 0.5 ? '🥶' : match ? '😍' : '🤨', say = r < 0.5 ? '어푸어푸… 살려 줘요!' : match ? '딱 원하던 곳이에요!' : '여긴… 어디죠?';
  G.sheet(`<div class="result"><div class="big">${face}</div><h3>${g.name}</h3><p>"${say}"</p>
    <p>💰 +${G.fmt(pay + tip)}${tip ? ' (팁 포함)' : ''} · ⭐ +${fame} · 🚨 −${heat}</p>
    <button class="cta in" onclick="G.closeSheet()">${s.left > 0 ? '다음 손님 ▶' : '확인'}</button></div>`);
};

// ── 여행 중개 지도: 노선 보기·열기 ──
G.screens.map = () => {
  const s = G.s, night = s.phase === 'night', h = G.HOME;
  const target = night && s.mission ? s.mission.target : null;
  const lines = G.COUNTRIES.map(c => `<line x1="${h.x}" y1="${h.y}" x2="${c.x}" y2="${c.y}" class="${s.routes[c.id] ? 'open' : 'shut'}"/>`).join('');
  const nodes = G.COUNTRIES.map(c => `<button class="node ${s.routes[c.id] ? 'open' : 'shut'} ${target === c.id ? 'target' : ''}" style="left:${c.x}%;top:${c.y}%" onclick="G.tapCountry('${c.id}')">
      <span>${s.routes[c.id] ? c.icon : '🔒'}</span><b>${c.name}</b><i>${s.routes[c.id] ? '+' + c.pay : G.fmt(c.cost)}</i></button>`).join('');
  return `<div class="map">
    <div class="row head">${G.backBtn()}<span class="tag">노선 ${Object.keys(s.routes).length}/${G.COUNTRIES.length}</span></div>
    <div class="world">${G.art.world(night)}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="routes">${lines}</svg>
      <div class="node home" style="left:${h.x}%;top:${h.y}%"><span>🏠</span></div>
      ${nodes}
    </div>
  </div>`;
};

G.tapCountry = id => {
  const s = G.s, c = G.country(id);
  if (s.routes[id]) return G.toast(`${c.icon} ${c.name} · 한 번에 +${G.fmt(c.pay)}`);
  const can = s.money >= c.cost;
  G.sheet(`<div class="result"><div class="big">${c.icon}</div><h3>${c.name} 노선</h3>
    <p>손님 한 팀에 +${G.fmt(c.pay)} · 밤 배달도 갈 수 있어요</p>
    <button class="cta in ${can ? '' : 'off'}" onclick="G.openRoute('${id}')">${can ? `🔓 ${G.fmt(c.cost)} → 노선 열기` : `돈 부족 (${G.fmt(c.cost)})`}</button></div>`);
};

G.openRoute = id => {
  const s = G.s, c = G.country(id);
  if (s.money < c.cost) return;
  s.routes[id] = true; G.earn(-c.cost); G.save(); G.closeSheet(); G.render();
  G.toast(`${c.icon} ${c.name} 노선이 열렸어요!`); G.snd.play('good');
};
