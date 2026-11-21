// 밤: 작전(단계) · 협상 · 투하(여러 발) · 정산 · 성공/실패

// ── 무기와 단계 계산 ──
G.weapon = () => G.WEAPONS[Math.min(G.WEAPONS.length - 1, G.s.wp || 0)];
G.dmg = () => Math.round(G.weapon().dmg * (1 + G.s.up.power * 0.15));
G.blast = () => G.weapon().r + G.s.up.range * 0.025;
G.isNuke = () => !!G.weapon().nuke;
G.stageInfo = st => {
  const n = G.CLIENTS.length, i = st % n, cl = G.CLIENTS[i];
  const hp = Math.round(G.STAGE_HP * Math.pow(G.STAGE_GROW, st));
  const pay = Math.round(G.STAGE_PAY * Math.pow(G.PAY_GROW, st) / 10) * 10;
  return { i, cl, hp, pay, armor: cl.armor ? Math.round(cl.armor * hp * 2) : 0, round: Math.floor(st / n) + 1 };
};

G.newMission = () => {
  const s = G.s, info = G.stageInfo(s.stage || 0);
  const c = G.rand(G.COUNTRIES.filter(x => s.routes[x.id]));
  let offer = info.pay * (1 + s.up.net * 0.1);
  if (info.cl.weak) offer *= 0.6;                  // 약자는 가진 돈이 적다
  s.mission = { stage: s.stage || 0, client: info.i, target: c.id, offer: Math.round(offer / 10) * 10, price: 0, tried: false, free: false, acc: 0, used: 0 };
};

// ── 작전: 이번 단계 의뢰 ──
G.screens.ops = () => {
  const s = G.s, night = s.phase === 'night', m = s.mission, w = G.weapon();
  const mine = `<span class="tag">${w.icon} 위력 ${G.dmg()} · 탄 ${s.nukes}발</span>`;
  if (!night) {
    const info = G.stageInfo(s.stage || 0);
    return `<div class="ops"><div class="row head">${G.backBtn()}${mine}</div>
      <div class="plea"><div class="big">🌙</div><small>${(s.stage || 0) + 1}단계 의뢰는 밤에 와요</small><small>다음 표적: ${info.cl.main} ${info.cl.spot} · 🛡 ${info.hp}</small></div>
      <button class="cta in" onclick="G.go('armory')">🚀 무기고에서 무기 키우기</button></div>`;
  }
  if (s.opDone) return `<div class="ops"><div class="row head">${G.backBtn()}${mine}</div><div class="plea"><div class="big">✅</div><small>오늘 작전 끝</small></div>
    <button class="cta in" onclick="G.morning()">☀️ 아침 맞기</button></div>`;
  const info = G.stageInfo(m.stage), cl = info.cl;
  const defs = [info.armor ? '🔩 철판' : '', cl.def === 'pan' ? '🍳 후라이팬' : '', cl.def === 'anti' ? '📡 요격' : ''].filter(Boolean).join(' · ');
  const weak = G.dmg() < info.hp;
  return `<div class="ops"><div class="row head">${G.backBtn()}${mine}</div>
    <div class="plea"><div class="bubble">${cl.plea}</div>${G.art.person(cl.color, cl.icon)}
      <small>${cl.name}${cl.weak ? '<span class="weak">약자</span>' : ''}</small></div>
    <div class="mcard"><span class="big">${cl.main}</span><div><b>${m.stage + 1}단계 · ${cl.spot}</b><i>🛡 방어 ${info.hp}${defs ? ' · ' + defs : ''}</i></div><em>${G.fmt(m.offer)}</em></div>
    ${weak ? `<p class="warn">⚠ 내 위력 ${G.dmg()} &lt; 방어 ${info.hp} — 여러 번 맞혀야 깨져요</p>` : ''}
    ${s.nukes > 0 ? `<button class="cta in" onclick="G.go('nego')">🤝 작전 시작</button>` : `<button class="cta in" onclick="G.go('armory')">🚀 탄이 없어요 → 무기고</button>`}
    ${weak ? `<button class="reroll" onclick="G.go('armory')">🚀 무기고에서 더 세게</button>` : ''}
  </div>`;
};

// ── 작전 협상 ──
G.screens.nego = () => {
  const m = G.s.mission, cl = G.CLIENTS[m.client];
  let say, btns;
  if (cl.weak) {
    say = `${G.fmt(m.offer)}… 이게 전부예요`;
    btns = `<button class="cta in" onclick="G.deal(${m.offer})">🤝 ${G.fmt(m.offer)} 받기</button>
      <button class="cta in alt" onclick="G.deal(0,true)">💝 공짜로 해 주기 <small>⭐ +20</small></button>`;
  } else if (m.tried) {
    say = `그럼 ${G.fmt(m.price)}. 더는 안 돼!`;
    btns = `<button class="cta in" onclick="G.deal(${m.price})">🤝 ${G.fmt(m.price)} 받기</button>`;
  } else {
    say = `${G.fmt(m.offer)}에 합시다.`;
    btns = `<button class="cta in" onclick="G.deal(${m.offer})">🤝 ${G.fmt(m.offer)} 받기</button>
      <button class="cta in alt" onclick="G.haggle(1.3,0.6)">😏 더 부르기 → ${G.fmt(m.offer * 1.3)} <small>성공 60%</small></button>
      <button class="cta in alt" onclick="G.haggle(1.7,0.3)">😤 배짱 → ${G.fmt(m.offer * 1.7)} <small>성공 30%</small></button>`;
  }
  return `<div class="nego">
    <div class="row head"><span class="tag">작전 협상</span></div>
    <div class="table">
      <div class="seat">${G.art.hero(true)}</div>
      <div class="desk">💼</div>
      <div class="seat"><div class="bubble">${say}</div>${G.art.person(cl.color, cl.icon)}<small>${cl.name}</small></div>
    </div>
    <div class="stack">${btns}</div>
  </div>`;
};

G.haggle = (mult, chance) => {
  const m = G.s.mission;
  if (Math.random() < chance) { G.toast('😎 통했다!'); G.snd.play('good'); return G.deal(Math.round(m.offer * mult)); }
  m.tried = true; m.price = Math.round(m.offer * 0.85 / 10) * 10;
  G.toast('😡 안 통했어요'); G.snd.play('bad'); G.render();
};

G.deal = (price, free) => { const m = G.s.mission; m.price = price; m.free = !!free; m.used = 0; G.save(); G.go('drop'); };

// ── 투하: 한 작전에 탄을 여러 발 쏜다. 적은 방어력이 있고, 막기도 한다 ──
let dropRaf = null, dropPos = 0, dropBusy = false, dropEnd = false;
G.shotsLeft = () => Math.min(G.s.nukes, G.MAX_SHOTS - G.s.mission.used);
G.dropLabel = () => `${G.weapon().icon} 투하! <small>남은 ${G.shotsLeft()}발</small>`;
G.screens.drop = () => {
  const s = G.s, m = s.mission, info = G.stageInfo(m.stage), cl = info.cl, w = G.weapon();
  dropBusy = false; dropEnd = false;
  G.afterRender = () => {
    G.crush.start($('crush'), { enemy: cl.enemy, big: 0.7 + (s.wp || 0) * 0.1 + s.up.power * 0.04, shroom: G.isNuke() ? G.art.shroom(s.shroom) : null,
      main: cl.main, size: cl.size, bld: cl.bld, ppl: cl.ppl, tall: cl.tall, space: cl.space, hp: info.hp, armor: info.armor, blocker: cl.def, wicon: w.icon });
    const t0 = performance.now(), mark = $('mark'), speed = Math.max(250, 430 - m.stage * 6);     // 단계가 오를수록 빨라진다
    cancelAnimationFrame(dropRaf);
    const tick = t => {
      if (!mark.isConnected) return;
      dropPos = (Math.sin((t - t0) / speed) + 1) / 2;
      mark.style.left = dropPos * 100 + '%'; G.crush.setPlane(0.08 + 0.84 * dropPos, G.blast());
      dropRaf = requestAnimationFrame(tick);
    };
    dropRaf = requestAnimationFrame(tick);
  };
  return `<div class="drop">
    <div class="row head"><span class="tag">${m.stage + 1}단계 · ${cl.main} ${cl.spot}</span><span class="tag">🛡 ${info.hp} vs ${w.icon} ${G.dmg()}</span></div>
    <div class="air"><canvas id="crush"></canvas><div id="crushmsg" hidden></div></div>
    <div class="bar noz"><u id="mark"></u></div>
    <button class="cta in" id="dropbtn" onclick="G.dropNow()">${G.dropLabel()}</button>
  </div>`;
};

G.dropNow = () => {
  const s = G.s, m = s.mission, btn = $('dropbtn');
  if (dropEnd) return m.acc < G.FAIL_UNDER ? G.failOp() : G.go('pay');
  if (dropBusy || G.shotsLeft() <= 0) return;
  const ok = G.crush.release(0.08 + 0.84 * dropPos, G.blast(), G.dmg(), res => {
    dropBusy = false;
    m.acc = res.total ? res.dead / res.total : 0;
    if (res.blocked) G.snd.play('bad');
    else if (res.armor) { G.snd.play('clang'); if (res.broke) G.snd.play('boom'); }
    else G.snd.play(G.isNuke() ? 'boom' : res.killed ? 'smash' : 'thud');
    const over = res.left === 0 || G.shotsLeft() <= 0;
    if (!btn.isConnected) return;
    if (!over) { btn.innerHTML = G.dropLabel(); btn.classList.remove('off'); return; }
    dropEnd = true; cancelAnimationFrame(dropRaf);
    const fail = m.acc < G.FAIL_UNDER, msg = $('crushmsg');
    msg.innerHTML = `${m.acc >= 1 ? '완전 박살!!' : fail ? '못 깼다…' : '와장창!'}<small>💥 ${Math.round(m.acc * 100)}%</small>`;
    msg.hidden = false; G.save();
    setTimeout(() => { if (btn.isConnected) { btn.textContent = '계속 ▶'; btn.classList.remove('off'); } }, 1100);
  });
  if (!ok) return;
  dropBusy = true; s.nukes--; m.used++;
  btn.classList.add('off'); G.snd.play('fall');
};

// ── 비용 지불 (정산) ──
G.payout = () => {
  const s = G.s, m = s.mission;
  const base = Math.round(m.price * m.acc), bonus = m.acc >= 1 ? Math.round(m.price * 0.3) : 0;
  const cost = m.free ? 0 : Math.max(10, G.TRANSPORT - s.up.truck * 15);
  return { price: base, bonus, cost, total: base + bonus - cost };
};
G.opFame = () => { const m = G.s.mission, cl = G.CLIENTS[m.client]; return (cl.weak ? 8 : 0) + (m.free ? 20 : 0); };

G.screens.pay = () => {
  const p = G.payout(), m = G.s.mission, cl = G.CLIENTS[m.client], fame = G.opFame();
  return `<div class="pay">
    <div class="row head"><span class="tag">비용 지불</span></div>
    <div class="big">${cl.icon}${m.free ? '💝' : '💵'}</div>
    <div class="bill">
      <p><span>대금 × 박살 ${Math.round(m.acc * 100)}%</span><b>${m.free ? '공짜' : G.fmt(p.price)}</b></p>
      ${p.bonus ? `<p><span>💥 완전 박살 보너스</span><b>+${G.fmt(p.bonus)}</b></p>` : ''}
      ${m.free ? '' : `<p><span>🚚 운송비</span><b>−${G.fmt(p.cost)}</b></p>`}
      <p><span>${G.weapon().icon} 쓴 탄</span><b>${m.used}발</b></p>
      ${fame ? `<p><span>⭐ 평판</span><b>+${fame}</b></p>` : ''}
      <p class="sumline"><span>받을 돈</span><b>${G.fmt(p.total)}</b></p>
    </div>
    <button class="cta in" onclick="G.collect()">💰 받기</button>
  </div>`;
};

G.collect = () => {
  const s = G.s, p = G.payout(), cl = G.CLIENTS[s.mission.client], fame = G.opFame();
  const heat = Math.round(G.HEAT_PER_OP * (1 - s.up.sign * 0.1) * (cl.weak ? 0.4 : 1));
  s.heat = Math.min(100, s.heat + heat); s.fame += fame; s.stats.ops++; s.opDone = true;
  s.stage = (s.stage || 0) + 1;
  const next = G.stageInfo(s.stage).cl;
  s.lastOp = { total: p.total, heat, fame, up: next.t !== cl.t ? G.RANKS[next.t] : '' };
  G.earn(p.total); G.save(); G.go('success'); G.snd.play('win');
};

// ── 작전 실패: 표적을 거의 못 깼다 ──
G.failOp = () => {
  const s = G.s, m = s.mission, cost = m.free ? 0 : Math.max(10, G.TRANSPORT - s.up.truck * 15);
  const heat = Math.round(G.HEAT_PER_OP * 0.6);
  s.heat = Math.min(100, s.heat + heat); s.fame = Math.max(0, s.fame - 3); s.opDone = true;
  s.stats.fails = (s.stats.fails || 0) + 1; s.lastOp = { total: -cost, heat, fail: true };
  s.money = Math.max(0, s.money - cost);
  G.save(); G.go('fail'); G.snd.play('bad');
};
G.screens.fail = () => {
  const s = G.s, m = s.mission, info = G.stageInfo(m.stage), cl = info.cl, o = s.lastOp;
  return `<div class="success fail">
    <div class="seat"><div class="bubble">${cl.weak ? '괜찮아요… 다음엔 꼭…' : '이게 뭐야! 돈은 없어!'}</div>${G.art.person(cl.color, cl.icon)}</div>
    <h2>${m.stage + 1}단계 실패…</h2>
    <p>탄 ${m.used}발 날림 · 💰 ${o.total ? '−' + G.fmt(-o.total) : '0'} · ⭐ −3 · 🚨 +${o.heat}</p>
    <p class="hint">🛡 방어 ${info.hp} vs 내 위력 ${G.dmg()} — 무기를 키우면 쉬워져요</p>
    <button class="cta in" onclick="G.go2('armory')">🚀 무기고로</button>
    <button class="sub" onclick="G.morning()">☀️ 아침 맞기</button>
  </div>`;
};
G.go2 = name => { G.screen = 'home'; G.go(name); };          // 작전 화면에서 빠져나와 다른 화면으로

// ── 작전 성공 ──
G.screens.success = () => {
  const s = G.s, o = s.lastOp || { total: 0, heat: 0, fame: 0 };
  return `<div class="success">
    <div class="boom">${G.isNuke() ? G.art.boom() : '<div class="big" style="font-size:120px">💥</div>'}</div>
    <h2>${s.stage}단계 성공!</h2>
    <p>💰 +${G.fmt(o.total)}${o.fame ? ` · ⭐ +${o.fame}` : ''} · 🚨 +${o.heat}</p>
    ${o.up ? `<p class="rankup">🎖 「${o.up}」(으)로 승급!</p>` : ''}
    <button class="cta in" onclick="G.morning()">☀️ 아침 맞기</button>
  </div>`;
};

// ── 아침 ──
G.morning = () => {
  const s = G.s;
  s.day++; s.phase = 'day'; s.opDone = false; s.mission = null;
  s.left = G.dayCustomers(); G.newCustomer();
  let raid = 0;
  if (s.heat >= 100) { raid = Math.round(s.money * 0.3); s.money -= raid; s.heat = 50; }
  G.save(); G.screen = 'home'; history.pushState({ s: 'home' }, ''); G.render();
  G.snd.play(raid ? 'raid' : 'morn');
  if (raid) G.sheet(`<div class="result"><div class="big">🚓</div><h3>단속!</h3><p>의심이 가득 찼어요 · 벌금 −${G.fmt(raid)}</p><p>낮 손님을 잘 모시면 의심이 내려가요</p><button class="cta in" onclick="G.closeSheet()">확인</button></div>`);
  else G.toast(`☀️ ${s.day}일째 아침`);
};
