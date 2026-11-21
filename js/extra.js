// 연구(강화) · 왼쪽 팝업 아이콘(상점·출석·광고·우편)

G.upCost = u => Math.round(u.base * Math.pow(1.5, G.s.up[u.id]) / 10) * 10;
G.upRow = (icon, name, lv, cost, effect, fn) => `<div class="uprow"><span class="ic">${icon}</span>
    <div><b>${name}</b><i>${lv}</i></div>
    <button class="${G.s.money >= cost ? '' : 'off'}" onclick="${fn}">${G.fmt(cost)}<small>→ ${effect}</small></button></div>`;

// ── 무기고: 핵만 키운다 ──
G.nukeLv = () => G.s.up.power + G.s.up.range;
G.screens.armory = () => {
  const s = G.s, lv = G.nukeLv(), name = G.NUKE_NAMES[Math.min(G.NUKE_NAMES.length - 1, Math.floor(lv / 2))];
  const scale = Math.min(1, 0.55 + lv * 0.05);
  return `<div class="armory">
    <div class="row head">${G.backBtn()}<span class="tag">${name} · Lv.${lv + 1}</span></div>
    <div class="silo"><div class="grow" style="transform:scale(${scale})">${G.art.bomb()}</div><div class="count">×${s.nukes}</div></div>
    ${G.ARMORY.map(u => G.upRow(u.icon, u.name, 'Lv.' + s.up[u.id], G.upCost(u), u.effect, `G.upgrade('${u.id}')`)).join('')}
    ${G.upRow('🔧', '핵 제작', '재고 ×' + s.nukes, G.NUKE_COST, '핵 +1', 'G.makeNuke()')}
  </div>`;
};

G.screens.research = () => {
  const s = G.s;
  const row = (icon, name, lv, cost, effect, fn) => `<div class="uprow"><span class="ic">${icon}</span>
    <div><b>${name}</b><i>${lv}</i></div>
    <button class="${s.money >= cost ? '' : 'off'}" onclick="${fn}">${G.fmt(cost)}<small>→ ${effect}</small></button></div>`;
  return `<div class="research">
    <div class="row head">${G.backBtn()}<span class="tag">연구</span></div>
    ${G.UPGRADES.map(u => row(u.icon, u.name, 'Lv.' + s.up[u.id], G.upCost(u), u.effect, `G.upgrade('${u.id}')`)).join('')}
  </div>`;
};

G.upgrade = id => {
  const s = G.s, u = G.UPGRADES.concat(G.ARMORY).find(x => x.id === id), cost = G.upCost(u);
  if (s.money < cost) return G.toast('돈이 모자라요');
  s.up[id]++; G.earn(-cost); G.save(); G.render();
};

G.sideBadge = id => (id === 'attend' && G.s.attendDay < G.s.day) || (id === 'ad' && G.s.adDay < G.s.day && !G.s.flags.noad);

G.side = id => {
  const s = G.s;
  if (id === 'shop') {
    const rows = G.SHOP.map(p => `<div class="uprow"><span class="ic">${p.icon}</span><div><b>${p.name}</b><i>${s.flags[p.flag] ? '보유 중' : ''}</i></div>
      <button class="${s.flags[p.flag] ? 'off' : ''}" onclick="G.buy('${p.id}')">${p.won}</button></div>`).join('');
    return G.sheet(`<h3>🛒 상점 <small>시험판 · 실제 결제 없음</small></h3>${rows}
      <div class="uprow"><span class="ic">💰</span><div><b>급전</b><i>보석 → 돈</i></div><button class="${s.gem >= 5 ? '' : 'off'}" onclick="G.gemToMoney()">💎5<small>→ 500만</small></button></div>`);
  }
  if (id === 'attend') {
    if (s.attendDay >= s.day) return G.toast('오늘은 받았어요');
    s.attendDay = s.day; s.gem += 1; G.save(); G.render(); return G.pop('💎 +1');
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
