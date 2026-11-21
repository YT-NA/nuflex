// 낮: 가게 앞 · 상담실 · 여행 지도

// ── 가게 앞 (낮·밤 공용 첫 화면) ──
G.screens.home = () => {
  const s = G.s, night = s.phase === 'night';
  const side = [['shop', '🛒', '상점'], ['attend', '🎁', '출석'], ['ad', '📺', '광고'], ['mail', '✉️', '우편']]
    .map(([id, ic, nm]) => `<button onclick="G.side('${id}')"><span>${ic}</span>${nm}${G.sideBadge(id) ? '<em></em>' : ''}</button>`).join('');
  let cta, bubble;
  if (!night) {
    if (s.left > 0) { cta = `<button class="cta" onclick="G.go('counsel')">🙋 손님 ${s.left}명 · 상담하기</button>`; bubble = '어서 오세요!'; }
    else { cta = `<button class="cta" onclick="G.closeShop()">🌙 가게 닫기</button>`; bubble = '오늘 장사 끝!'; }
  } else if (!s.opDone) { cta = `<button class="cta" onclick="G.go('ops')">☢️ 오늘 밤 작전</button>`; bubble = '이제 진짜 일…'; }
  else { cta = `<button class="cta" onclick="G.morning()">☀️ 아침 맞기</button>`; bubble = '졸려…'; }
  const walkers = night ? '' : [0, 1, 2].slice(0, Math.max(1, s.left)).map(i =>
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
  G.toast('🌙 밤이 됐어요');
};

// ── 손님 ──
G.newCustomer = () => {
  const s = G.s;
  const open = G.COUNTRIES.filter(c => s.routes[c.id]);
  const dest = Math.random() < 0.75 ? G.rand(open) : G.rand(G.COUNTRIES);
  const likes = [];
  while (likes.length < 2) { const o = G.rand(G.OPTIONS).id; if (!likes.includes(o)) likes.push(o); }
  const i = Math.floor(Math.random() * 6);
  s.cust = { name: G.CUSTOMER_NAMES[i], color: G.CUSTOMER_COLORS[i], want: dest.id, likes, budget: 200 + Math.floor(Math.random() * 4) * 30 };
  s.pick = { dest: null, opts: [] };
};

G.tripTotal = () => G.BASE_TRIP + G.s.pick.opts.reduce((a, id) => a + G.OPTIONS.find(o => o.id === id).price, 0);
G.tripStars = () => {
  const { cust, pick } = G.s;
  return Math.min(5, 1 + (pick.dest === cust.want ? 2 : 0) + pick.opts.filter(o => cust.likes.includes(o)).length);
};
G.tripProfit = () => Math.round(G.tripTotal() * 0.5 * (1 + G.s.up.talk * 0.1 + (G.s.decor.neon ? 0.1 : 0)));
G.dayCustomers = () => G.CUSTOMERS_PER_DAY + G.s.up.expand + Math.min(3, Math.floor(G.s.fame / 30));

// ── 상담실 ──
G.screens.counsel = () => {
  const s = G.s, c = s.cust;
  if (!c) {
    return `<div class="counsel empty">${G.backBtn()}
      <div class="big">🪑</div><p>오늘 손님 끝!</p>
      <button class="cta in" onclick="G.closeShop()">🌙 가게 닫기</button>
      <button class="sub" onclick="G.moreCustomer()">🙋 손님 더 부르기 · 💎2</button></div>`;
  }
  const want = G.country(c.want), dest = s.pick.dest && G.country(s.pick.dest);
  const total = G.tripTotal(), over = total > c.budget;
  const opts = G.OPTIONS.map(o => `<button class="opt ${s.pick.opts.includes(o.id) ? 'on' : ''}" onclick="G.toggleOpt('${o.id}')">
      <span>${o.icon}</span><b>${o.name}</b><i>${o.price}</i></button>`).join('');
  const likeIcons = c.likes.map(id => G.OPTIONS.find(o => o.id === id).icon).join('');
  let btn;
  if (!dest) btn = `<button class="cta in" onclick="G.openMap(true)">🗺 여행지 고르기</button>`;
  else if (over) btn = `<button class="cta in off">예산 넘음</button>`;
  else btn = `<button class="cta in" onclick="G.contract()">✍️ 계약 → +${G.fmt(G.tripProfit())}</button>`;
  return `<div class="counsel">
    <div class="row head">${G.backBtn()}<span class="tag">남은 손님 ${s.left}</span></div>
    <div class="room">
      <div class="desk-area">
        <button class="mapbtn" onclick="G.openMap(true)">🗺 ${dest ? dest.icon + ' ' + dest.name : '지도'}</button>
        <div class="guest"><div class="bubble">${want.icon} ${want.tag} 여행!<br>${likeIcons} 좋아요</div>${G.art.person(c.color)}<small>${c.name}</small></div>
        <div class="desk">📋</div>
        <div class="me">${G.art.hero(false)}</div>
      </div>
      <div class="pkg"><h4>패키지</h4>${opts}</div>
    </div>
    <div class="sum">
      <span>합계 <b class="${over ? 'bad' : ''}">${G.fmt(total)}</b> / 예산 ${G.fmt(c.budget)}</span>
      <span class="stars">${'★'.repeat(dest ? G.tripStars() : 0)}${'☆'.repeat(5 - (dest ? G.tripStars() : 0))}</span>
    </div>
    ${btn}
  </div>`;
};

G.toggleOpt = id => {
  const o = G.s.pick.opts, i = o.indexOf(id);
  i < 0 ? o.push(id) : o.splice(i, 1);
  G.render();
};

G.contract = () => {
  const s = G.s, stars = G.tripStars(), tip = (stars === 5 ? 50 : 0) + (s.decor.balloon ? 20 : 0), profit = G.tripProfit() + tip;
  if (s.decor.plant) s.fame += 1;
  const name = s.cust.name;
  s.fame += stars; s.heat = Math.max(0, s.heat - stars * 2);
  s.stats.served++; s.left--;
  s.cust = null;
  if (s.left > 0) G.newCustomer();
  G.earn(profit); G.save(); G.render();
  G.sheet(`<div class="result"><div class="big">${stars >= 4 ? '😍' : stars >= 3 ? '🙂' : '😐'}</div>
    <h3>${name}</h3><div class="stars lg">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
    <p>💰 +${G.fmt(profit)}${tip ? ' (팁 포함)' : ''} · ⭐ +${stars} · 🚨 −${stars * 2}</p>
    <button class="cta in" onclick="G.closeSheet()">${s.left > 0 ? '다음 손님 ▶' : '확인'}</button></div>`);
};

G.moreCustomer = () => {
  const s = G.s;
  if (s.gem < 2) return G.side('shop');
  s.gem -= 2; s.left = 1; G.newCustomer(); G.save(); G.render();
};

// ── 여행 중개 지도 ──
G.openMap = pick => { G.mapPick = !!pick; G.go('map'); };

G.screens.map = () => {
  const s = G.s, night = s.phase === 'night', h = G.HOME;
  const target = night && s.mission ? s.mission.target : null;
  const lines = G.COUNTRIES.map(c => `<line x1="${h.x}" y1="${h.y}" x2="${c.x}" y2="${c.y}" class="${s.routes[c.id] ? 'open' : 'shut'}"/>`).join('');
  const nodes = G.COUNTRIES.map(c => `<button class="node ${s.routes[c.id] ? 'open' : 'shut'} ${target === c.id ? 'target' : ''}" style="left:${c.x}%;top:${c.y}%" onclick="G.tapCountry('${c.id}')">
      <span>${s.routes[c.id] ? c.icon : '🔒'}</span><b>${c.name}</b><i>${s.routes[c.id] ? c.tag : G.fmt(c.cost)}</i></button>`).join('');
  return `<div class="map">
    <div class="row head">${G.mapPick ? `<button class="back" onclick="G.go('counsel')">◀ 상담실</button>` : G.backBtn()}
      <span class="tag">${G.mapPick ? '여행지를 고르세요' : `노선 ${Object.keys(s.routes).length}/${G.COUNTRIES.length}`}</span></div>
    <div class="world">${G.art.world(night)}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="routes">${lines}</svg>
      <div class="node home" style="left:${h.x}%;top:${h.y}%"><span>🏠</span></div>
      ${nodes}
    </div>
  </div>`;
};

G.tapCountry = id => {
  const s = G.s, c = G.country(id);
  if (s.routes[id]) {
    if (G.mapPick) { s.pick.dest = id; G.go('counsel'); }
    else G.toast(`${c.icon} ${c.name} · ${c.tag}`);
    return;
  }
  const can = s.money >= c.cost;
  G.sheet(`<div class="result"><div class="big">${c.icon}</div><h3>${c.name} 노선</h3>
    <p>${c.tag} 손님을 받고, 밤 배달도 갈 수 있어요</p>
    <button class="cta in ${can ? '' : 'off'}" onclick="G.openRoute('${id}')">${can ? `🔓 ${G.fmt(c.cost)} → 노선 열기` : `돈 부족 (${G.fmt(c.cost)})`}</button></div>`);
};

G.openRoute = id => {
  const s = G.s, c = G.country(id);
  if (s.money < c.cost) return;
  s.routes[id] = true; G.earn(-c.cost); G.save(); G.closeSheet(); G.render();
  G.toast(`${c.icon} ${c.name} 노선이 열렸어요!`);
};
