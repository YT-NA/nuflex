// 밤: 작전(의뢰) · 협상 · 투하 · 정산 · 성공

G.newMission = () => {
  const s = G.s;
  const c = G.rand(G.COUNTRIES.filter(x => s.routes[x.id]));
  const far = Math.round(Math.hypot(c.x - G.HOME.x, c.y - G.HOME.y));
  let ci;
  do { ci = Math.floor(Math.random() * G.CLIENTS.length); } while (s.mission && ci === s.mission.client);
  const cl = G.CLIENTS[ci];
  let offer = 500 + s.day * 60 + far * 6 + c.cost * 0.3;
  offer *= 1 + s.up.net * 0.1;
  if (cl.weak) offer *= 0.4;                       // 약자는 가진 돈이 적다
  s.mission = { client: ci, target: c.id, offer: Math.round(offer / 10) * 10, price: 0, tried: false, free: false, acc: 0, rerolled: !!(s.mission && s.mission.rerolled) };
};

// ── 작전: 오늘 밤 의뢰 ──
G.screens.ops = () => {
  const s = G.s, night = s.phase === 'night', m = s.mission;
  const head = `<div class="row head">${G.backBtn()}<span class="tag">핵 재고 ×${s.nukes}</span></div>`;
  if (!night) return `<div class="ops">${head}<div class="plea"><div class="big">🌙</div><small>의뢰는 밤에 와요</small></div>
    <button class="cta in" onclick="G.go('armory')">🚀 무기고에서 핵 키우기</button></div>`;
  if (s.opDone) return `<div class="ops">${head}<div class="plea"><div class="big">✅</div><small>오늘 작전 끝</small></div>
    <button class="cta in" onclick="G.morning()">☀️ 아침 맞기</button></div>`;
  const cl = G.CLIENTS[m.client], c = G.country(m.target);
  return `<div class="ops">${head}
    <div class="plea"><div class="bubble">${cl.plea}</div>${G.art.person(cl.color, cl.icon)}
      <small>${cl.name}${cl.weak ? '<span class="weak">약자</span>' : ''}</small></div>
    <div class="mcard"><span class="big">${cl.enemy}</span><div><b>${cl.spot}</b><i>${c.icon} ${c.name}${cl.weak ? ' · ⭐+8 · 🚨 적게' : ''}</i></div><em>${G.fmt(m.offer)}</em></div>
    ${s.nukes > 0 ? `<button class="cta in" onclick="G.go('nego')">🤝 작전 시작</button>` : `<button class="cta in" onclick="G.go('armory')">🚀 핵이 없어요 → 무기고</button>`}
    ${m.rerolled ? '' : `<button class="reroll" onclick="G.reroll()">🔄 다른 의뢰 보기</button>`}
  </div>`;
};

G.reroll = () => { G.newMission(); G.s.mission.rerolled = true; G.save(); G.render(); };

G.makeNuke = () => {
  const s = G.s;
  if (s.money < G.NUKE_COST) return G.toast('돈이 모자라요');
  s.nukes++; G.earn(-G.NUKE_COST); G.save(); G.render();
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

G.deal = (price, free) => { const m = G.s.mission; m.price = price; m.free = !!free; G.s.nukes--; G.save(); G.go('drop'); };

// ── 폭탄 투하: 때 맞춰 누르면 마을이 산산조각 ──
let dropRaf = null, dropPos = 0;
G.screens.drop = () => {
  const s = G.s, m = s.mission, cl = G.CLIENTS[m.client], zone = Math.min(60, 20 + s.up.range * 6);
  G.afterRender = () => {
    G.crush.start($('crush'), { enemy: cl.enemy, big: 1 + s.up.power * 0.12, shroom: G.art.shroom(s.shroom) });
    const t0 = performance.now(), mark = $('mark');
    cancelAnimationFrame(dropRaf);
    const tick = t => {
      if (!mark.isConnected) return;
      dropPos = (Math.sin((t - t0) / 420) + 1) / 2;
      mark.style.left = dropPos * 100 + '%'; G.crush.setPlane(0.08 + 0.84 * dropPos);
      dropRaf = requestAnimationFrame(tick);
    };
    dropRaf = requestAnimationFrame(tick);
  };
  return `<div class="drop">
    <div class="row head"><span class="tag">${cl.enemy} ${cl.spot}</span></div>
    <div class="air"><canvas id="crush"></canvas><div id="crushmsg" hidden></div></div>
    <div class="bar"><i class="zone" style="left:${50 - zone / 2}%;width:${zone}%"></i><u id="mark"></u></div>
    <button class="cta in" id="dropbtn" onclick="G.dropNow()">💣 투하!</button>
  </div>`;
};

G.dropNow = () => {
  cancelAnimationFrame(dropRaf);
  const s = G.s, m = s.mission, btn = $('dropbtn');
  btn.classList.add('off'); G.snd.play('fall');
  G.crush.release(0.08 + 0.84 * dropPos, 0.26 + s.up.range * 0.05, res => {
    m.acc = res.total ? res.hit / res.total : 0; G.snd.play('boom');
    const msg = $('crushmsg');
    const fail = m.acc < G.FAIL_UNDER;
    msg.innerHTML = `${m.acc >= 1 ? '완전 박살!!' : m.acc >= 0.6 ? '와장창!' : fail ? '빗나갔다…' : '아슬아슬!'}<small>💥 ${res.hit} / ${res.total}</small>`;
    msg.hidden = false;
    setTimeout(() => { if (!btn.isConnected) return; btn.textContent = '계속 ▶'; btn.classList.remove('off'); btn.onclick = () => m.acc < G.FAIL_UNDER ? G.failOp() : G.go('pay'); }, 1300);
  });
};

// ── 비용 지불 (정산) ──
G.payout = () => {
  const s = G.s, m = s.mission;
  const power = Math.round(m.price * 0.15 * s.up.power), bonus = Math.round(m.price * 0.3 * m.acc);
  const cost = m.free ? 0 : Math.max(10, G.TRANSPORT - s.up.truck * 15);
  return { price: m.price, power, bonus, cost, total: m.price + power + bonus - cost };
};
G.opFame = () => { const m = G.s.mission, cl = G.CLIENTS[m.client]; return (cl.weak ? 8 : 0) + (m.free ? 20 : 0); };

G.screens.pay = () => {
  const p = G.payout(), m = G.s.mission, cl = G.CLIENTS[m.client], fame = G.opFame();
  return `<div class="pay">
    <div class="row head"><span class="tag">비용 지불</span></div>
    <div class="big">${cl.icon}${m.free ? '💝' : '💵'}</div>
    <div class="bill">
      <p><span>대금</span><b>${m.free ? '공짜' : G.fmt(p.price)}</b></p>
      ${p.power ? `<p><span>💥 위력</span><b>+${G.fmt(p.power)}</b></p>` : ''}
      <p><span>🎯 박살 ${Math.round(m.acc * 100)}%</span><b>+${G.fmt(p.bonus)}</b></p>
      ${m.free ? '' : `<p><span>🚚 운송비</span><b>−${G.fmt(p.cost)}</b></p>`}
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
  s.lastOp = { total: p.total, heat, fame };
  G.earn(p.total); G.save(); G.go('success'); G.snd.play('win');
};

// ── 작전 실패: 표적을 거의 못 맞혔다 ──
G.failOp = () => {
  const s = G.s, m = s.mission, cost = m.free ? 0 : Math.max(10, G.TRANSPORT - s.up.truck * 15);
  const heat = Math.round(G.HEAT_PER_OP * 0.6);
  s.heat = Math.min(100, s.heat + heat); s.fame = Math.max(0, s.fame - 3); s.opDone = true;
  s.stats.fails = (s.stats.fails || 0) + 1; s.lastOp = { total: -cost, heat, fail: true };
  s.money = Math.max(0, s.money - cost);
  G.save(); G.go('fail'); G.snd.play('bad');
};
G.screens.fail = () => {
  const s = G.s, m = s.mission, cl = G.CLIENTS[m.client], o = s.lastOp;
  return `<div class="success fail">
    <div class="seat"><div class="bubble">${cl.weak ? '괜찮아요… 다음엔 꼭…' : '이게 뭐야! 돈은 없어!'}</div>${G.art.person(cl.color, cl.icon)}</div>
    <h2>작전 실패…</h2>
    <p>핵 1개 날림 · 💰 ${o.total ? '−' + G.fmt(-o.total) : '0'} · ⭐ −3 · 🚨 +${o.heat}</p>
    <p class="hint">🎯 초록 칸에서 누르면 더 많이 박살 나요</p>
    <button class="cta in" onclick="G.morning()">☀️ 아침 맞기</button>
  </div>`;
};

// ── 작전 성공 ──
G.screens.success = () => {
  const o = G.s.lastOp || { total: 0, heat: 0, fame: 0 };
  return `<div class="success">
    <div class="boom">${G.art.boom()}</div>
    <h2>작전 성공!</h2>
    <p>💰 +${G.fmt(o.total)}${o.fame ? ` · ⭐ +${o.fame}` : ''} · 🚨 +${o.heat}</p>
    <button class="cta in" onclick="G.morning()">☀️ 아침 맞기</button>
  </div>`;
};

// ── 아침 ── (평판 30마다 손님 +1, 최대 6명)
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
