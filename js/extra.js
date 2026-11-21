// 연구(강화) · 왼쪽 팝업 아이콘(상점·출석·광고·우편)

G.upCost = u => Math.round(u.base * Math.pow(1.5, G.s.up[u.id]) / 10) * 10;
G.upRow = (icon, name, lv, cost, effect, fn) => `<div class="uprow"><span class="ic">${icon}</span>
    <div><b>${name}</b><i>${lv}</i></div>
    <button class="${G.s.money >= cost ? '' : 'off'}" onclick="${fn}">${G.fmt(cost)}<small>→ ${effect}</small></button></div>`;

// ── 무기고: 핵만 키운다 ──
G.screens.armory = () => {
  const s = G.s, w = G.weapon(), next = G.WEAPONS[(s.wp || 0) + 1], pack = w.ammo * G.AMMO_PACK;
  const pic = w.nuke ? G.art.bomb() : `<div class="wpic">${w.icon}</div>`;
  return `<div class="armory">
    <div class="row head">${G.backBtn()}<span class="tag">${w.name} · 위력 ${G.dmg()}</span></div>
    <div class="silo"><div class="grow" style="transform:scale(${Math.min(1, 0.6 + (s.wp || 0) * 0.07)})">${pic}</div><div class="count">탄 ×${s.nukes}</div>
      ${w.nuke ? `<button class="mark" onclick="G.shroomSheet()">${G.art.shroom(s.shroom, 'mini')}<b>내 버섯구름</b></button>` : ''}
      <div class="ladder">${G.WEAPONS.map((x, i) => `<span class="${i === s.wp ? 'on' : i < s.wp ? 'past' : ''}">${i <= s.wp + 1 ? x.icon : '❔'}</span>`).join('')}</div></div>
    ${next ? G.upRow(next.icon, next.name + '(으)로 발전', '위력 ' + w.dmg + ' → ' + next.dmg, next.cost, '더 센 무기', 'G.evolve()')
           : `<div class="uprow"><span class="ic">👑</span><div><b>최강 무기</b><i>더 발전할 무기가 없어요</i></div><button class="off">끝</button></div>`}
    ${G.ARMORY.map(u => G.upRow(u.icon, u.name, 'Lv.' + s.up[u.id], G.upCost(u), u.effect, `G.upgrade('${u.id}')`)).join('')}
    ${G.upRow('🔧', '탄 만들기', '재고 ×' + s.nukes, pack, '탄 +' + G.AMMO_PACK, 'G.makeNuke()')}
  </div>`;
};
G.evolve = () => {
  const s = G.s, next = G.WEAPONS[(s.wp || 0) + 1];
  if (!next) return;
  if (s.money < next.cost) return G.toast('돈이 모자라요');
  s.wp = (s.wp || 0) + 1; G.earn(-next.cost); G.snd.play('win'); G.save(); G.render();
  G.sheet(`<div class="result"><div class="big">${next.icon}</div><h3>${next.name}!</h3><p>위력 ${next.dmg} · 더 넓게 터져요${next.nuke ? ' · 버섯구름이 솟아요 🍄' : ''}</p><button class="cta in" onclick="G.closeSheet()">좋아!</button></div>`);
};
G.makeNuke = () => {
  const s = G.s, cost = G.weapon().ammo * G.AMMO_PACK;
  if (s.money < cost) return G.toast('돈이 모자라요');
  s.nukes += G.AMMO_PACK; G.earn(-cost); G.save(); G.render();
};

// ── 연구소: 낮 사업(여행사) / 밤 사업(무기) ──
G.resSide = null;
G.setSide = side => { G.resSide = side; G.render(); };
G.screens.research = () => {
  const s = G.s, side = G.resSide || (s.phase === 'night' ? 'night' : 'day');
  if (side === 'look') return G.lookScreen();
  const rows = G.UPGRADES.filter(u => u.side === side).map(u => {
    const lv = s.up[u.id], full = u.max && lv >= u.max;
    return full ? `<div class="uprow"><span class="ic">${u.icon}</span><div><b>${u.name}</b><i>Lv.${lv} · 끝</i></div><button class="off">최고</button></div>`
      : G.upRow(u.icon, u.name, 'Lv.' + lv, G.upCost(u), u.effect, `G.upgrade('${u.id}')`);
  }).join('');
  const decor = side !== 'day' ? '' : `<h4 class="sec">🎀 가게 꾸미기</h4><div class="decos">${G.DECOR.map(x => s.decor[x.id]
    ? `<button class="deco have"><span>${x.icon}</span><b>${x.name}</b><i>놓았어요</i></button>`
    : `<button class="deco ${s.money >= x.cost ? '' : 'off'}" onclick="G.buyDecor('${x.id}')"><span>${x.icon}</span><b>${G.fmt(x.cost)}</b><i>${x.effect}</i></button>`).join('')}</div>`;
  return `<div class="research">
    <div class="row head">${G.backBtn()}<span class="tag">연구소</span></div>
    ${G.segHtml(side)}
    ${rows}${decor}
    ${side === 'night' ? `<button class="reroll" onclick="G.go('armory')">🚀 핵은 무기고에서 키워요</button>` : ''}
  </div>`;
};

G.upgrade = id => {
  const s = G.s, u = G.UPGRADES.concat(G.ARMORY).find(x => x.id === id), cost = G.upCost(u);
  if (u.max && s.up[id] >= u.max) return;
  if (s.money < cost) return G.toast('돈이 모자라요');
  s.up[id]++; G.earn(-cost);
  G.save(); G.render();
};

G.buyDecor = id => {
  const s = G.s, x = G.DECOR.find(k => k.id === id);
  if (s.decor[id]) return;
  if (s.money < x.cost) return G.toast('돈이 모자라요');
  s.decor[id] = true; G.earn(-x.cost); G.save(); G.render();
  G.toast(`${x.icon} 가게 앞에 놓았어요`);
};

G.sideBadge = id => (id === 'attend' && G.s.attendDay < G.s.day) || (id === 'ad' && G.s.adDay < G.s.day && !G.s.flags.noad);

G.side = id => {
  const s = G.s;
  if (id === 'sound') { const on = G.snd.toggle(); G.render(); if (on) G.snd.play('good'); return G.toast(on ? (G.snd.state() === 'running' ? '🔊 소리 켬' : '🔊 켰는데 기기가 막고 있어요 (' + G.snd.state() + ')') : '🔇 소리 끔'); }
  if (id === 'shop') {
    const rows = G.SHOP.map(p => `<div class="uprow"><span class="ic">${p.icon}</span><div><b>${p.name}</b><i>${s.flags[p.flag] ? '보유 중' : (p.note || '')}</i></div>
      <button class="${s.flags[p.flag] ? 'off' : ''}" onclick="G.buy('${p.id}')">${p.won}</button></div>`).join('');
    return G.sheet(`<h3>🛒 상점 <small>시험판 · 실제 결제 없음</small></h3>${rows}
      <div class="uprow"><span class="ic">💰</span><div><b>급전</b><i>보석 → 돈</i></div><button class="${s.gem >= 5 ? '' : 'off'}" onclick="G.gemToMoney()">💎5<small>→ 500만</small></button></div>`);
  }
  if (id === 'attend') {
    if (s.attendDay >= s.day) return G.toast('오늘은 받았어요');
    s.attendDay = s.day; s.gem += 1; G.snd.play('good'); G.save(); G.render(); return G.pop('💎 +1');
  }
  if (id === 'ad') {
    if (s.flags.noad) { if (s.adDay >= s.day) return G.toast('오늘은 받았어요'); }
    else if (s.adDay >= s.day) return G.toast('오늘 광고 끝');
    s.adDay = s.day; G.earn(100); G.save(); G.render(); return;
  }
  if (id === 'mail') return G.sheet(`<div class="result"><div class="big">📭</div><h3>우편이 없어요</h3><button class="cta in" onclick="G.closeSheet()">닫기</button>
    <button class="sub" onclick="if(confirm('처음부터 다시 할까요?'))G.reset()">🗑 처음부터 (시험용)</button></div>`);
};

G.buy = id => {
  const s = G.s, p = G.SHOP.find(x => x.id === id);
  if (p.flag && s.flags[p.flag]) return;
  if (p.flag) s.flags[p.flag] = true;
  if (p.gem) s.gem += p.gem;

  G.save(); G.render(); G.side('shop');
  G.toast('시험판: 결제 없이 지급했어요');
};

G.gemToMoney = () => {
  const s = G.s;
  if (s.gem < 5) return G.toast('보석이 모자라요');
  s.gem -= 5; G.earn(500); G.save(); G.render(); G.side('shop');
};

// ── 버섯구름 고르기 (트레이드마크) ──
G.shroomSheet = () => {
  const s = G.s;
  const cells = G.SHROOMS.map(m => {
    const have = s.shrooms[m.id], on = s.shroom === m.id;
    const label = on ? '✔ 사용 중' : have ? '고르기' : m.gem ? '💎' + m.gem : G.fmt(m.cost);
    return `<button class="shr ${on ? 'on' : ''} ${have ? '' : 'lock'}" onclick="G.pickShroom('${m.id}')">${G.art.shroom(m.id, 'mini')}<b>${m.name}</b><i>${label}</i></button>`;
  }).join('');
  G.sheet(`<h3>🍄 내 버섯구름</h3><div class="shrs">${cells}</div>`);
};
G.pickShroom = id => {
  const s = G.s, m = G.SHROOMS.find(x => x.id === id);
  if (!s.shrooms[id]) {
    if (m.gem) { if (s.gem < m.gem) return G.toast('💎 보석이 모자라요'); s.gem -= m.gem; G.snd.play('buy'); }
    else { if (s.money < m.cost) return G.toast('돈이 모자라요'); G.earn(-m.cost); }
    s.shrooms[id] = true;
  }
  s.shroom = id; G.save(); G.render(); G.shroomSheet();
};

// ── 연구소 칸 나누기 ──
G.segHtml = side => `<div class="seg">${[['day', '☀️ 여행사'], ['night', '🌙 무기'], ['look', '🎀 꾸미기']].map(([id, nm]) =>
  `<button class="${side === id ? 'on' : ''}" onclick="G.setSide('${id}')">${nm}</button>`).join('')}</div>`;

// ── 꾸미기: 삐삐와 핵 ──
G.lookId = x => x.kind + ':' + x.val;
G.lookScreen = () => {
  const s = G.s;
  const rows = G.LOOK_KINDS.map(([kind, title]) => `<h4 class="sec">${title}</h4><div class="looks">${G.LOOKS.filter(x => x.kind === kind).map(x => {
    const free = !x.cost && !x.gem, have = free || s.own[G.lookId(x)], on = s.look[kind] === x.val;
    const sw = x.val.startsWith('#') ? `<span class="sw" style="background:${x.val}"></span>` : `<span class="em">${x.val || '🚫'}</span>`;
    return `<button class="look ${on ? 'on' : ''}" onclick="G.pickLook('${kind}','${x.val}')">${sw}<i>${on ? '✔' : have ? x.name : x.gem ? '💎' + x.gem : G.fmt(x.cost)}</i></button>`;
  }).join('')}</div>`).join('');
  return `<div class="research">
    <div class="row head">${G.backBtn()}<span class="tag">연구소</span></div>
    ${G.segHtml('look')}
    <div class="preview"><div class="pv-hero">${G.art.hero(false)}</div><div class="pv-bomb">${G.art.bomb()}</div></div>
    ${rows}
  </div>`;
};
G.pickLook = (kind, val) => {
  const s = G.s, x = G.LOOKS.find(k => k.kind === kind && k.val === val), id = G.lookId(x);
  if ((x.cost || x.gem) && !s.own[id]) {
    if (x.gem) { if (s.gem < x.gem) return G.toast('💎 보석이 모자라요'); s.gem -= x.gem; G.snd.play('buy'); }
    else { if (s.money < x.cost) return G.toast('돈이 모자라요'); G.earn(-x.cost); }
    s.own[id] = true;
  }
  s.look[kind] = val; G.save(); G.render();
};
