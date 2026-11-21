// 화면 틀: 위 상태창 · 가운데 장면 · 목표 한 줄 · 아래 탭
G.screen = 'home';
G.screens = {};
const $ = id => document.getElementById(id);
G.fmt = n => Math.round(n).toLocaleString('ko-KR') + '만';
G.rand = arr => arr[Math.floor(Math.random() * arr.length)];
G.country = id => G.COUNTRIES.find(c => c.id === id);

const FLOW = ['nego', 'drop', 'pay', 'success', 'fail', 'launch'];   // 작전 중 화면 (뒤로·탭 막음)

G.go = name => {
  if (name !== G.screen) history.pushState({ s: name }, '');
  G.screen = name;
  G.closeSheet();
  G.render();
};
window.addEventListener('popstate', () => {
  if (!$('sheet').hidden) { G.closeSheet(); history.pushState({ s: G.screen }, ''); return; }
  if (FLOW.includes(G.screen)) { history.pushState({ s: G.screen }, ''); return; }
  G.screen = 'home';
  G.render();
});

G.render = () => {
  const s = G.s, night = s.phase === 'night';
  document.body.classList.toggle('night', night);
  G.snd.bgm(['nego', 'drop'].includes(G.screen) ? 'ops' : night ? 'night' : 'day');   // 배경음 3곡: 낮·밤·작전
  $('top').innerHTML = `
    <span class="chip day">${s.day}일 ${night ? '🌙' : '☀️'}</span>
    <span class="chip">💰<b id="money">${G.fmt(s.money)}</b></span>
    <span class="chip">💎<b>${s.gem}</b></span>
    <span class="chip">⭐<b>${s.fame}</b></span>
    <span class="chip heat" title="의심">🚨<i><u style="width:${Math.min(100, s.heat)}%"></u></i></span>`;
  $('scene').innerHTML = G.screens[G.screen]();
  // 목표 한 줄
  const g = G.GOALS.find(x => !x.done(s));
  const goal = $('goal');
  if (g && !FLOW.includes(G.screen)) {
    goal.hidden = false;
    goal.innerHTML = `🎯 ${g.text} <b>${g.of ? g.n(s) + '/' + g.of : '0/1'}</b> ▶`;
    goal.onclick = () => G.tab(g.go);
  } else goal.hidden = true;
  // 아래 탭
  const tabs = [['research', '🔬', '연구소'], ['counsel', '🏪', '매장'], ['armory', '🚀', '무기고'], ['ops', '🎯', '작전'], ['map', '🗺', '지도']];
  $('tabs').innerHTML = tabs.map(([id, ic, nm]) =>
    `<button class="${G.screen === id ? 'on' : ''}" onclick="G.tab('${id}')"><span>${ic}</span>${nm}${G.badge(id) ? '<em></em>' : ''}</button>`).join('');
  $('tabs').classList.toggle('lock', FLOW.includes(G.screen));
  // 말풍선이 새로 뜨면 말소리
  let who = null;
  if (G.screen === 'counsel' && s.cust) who = 'c' + s.stats.served + s.cust.name;
  if ((G.screen === 'ops' || G.screen === 'nego') && s.mission && night && !s.opDone) who = G.screen + s.mission.client + s.mission.tried;
  if (who && who !== G.lastTalk) G.snd.talk(G.screen === 'counsel' ? 420 + (s.stats.served % 4) * 90 : (G.CLIENTS[s.mission.client].voice || 300));
  G.lastTalk = who;
  if (G.afterRender) { const f = G.afterRender; G.afterRender = null; f(); }
};

// 할 일이 있는 탭에만 점
G.badge = id => {
  const s = G.s;
  if (id === 'counsel') return s.phase === 'day' && s.left > 0;
  if (id === 'ops') return s.phase === 'night' && !s.opDone;
  return false;
};

G.tab = id => {
  if (FLOW.includes(G.screen)) return;
  if (id === 'counsel' && G.s.phase === 'night') return G.toast('🌙 셔터 내렸어요');
  if (id === 'map') G.mapPick = false;
  if (id === 'research') G.resSide = null;
  G.go(id);
};

// 아래에서 올라오는 창
G.sheet = html => {
  const el = $('sheet');
  el.innerHTML = `<div class="dim" onclick="G.closeSheet()"></div><div class="box"><button class="x" onclick="G.closeSheet()">✕</button>${html}</div>`;
  el.hidden = false;
};
G.closeSheet = () => { $('sheet').hidden = true; $('sheet').innerHTML = ''; };

let toastTimer = null;
G.toast = text => {
  const el = $('toast');
  el.textContent = text; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1600);
};

// 튀는 숫자
G.pop = text => {
  const el = document.createElement('div');
  el.className = 'pop'; el.textContent = text;
  $('app').appendChild(el);
  setTimeout(() => el.remove(), 1200);
};

G.earn = n => { G.snd.play(n >= 0 ? 'coin' : 'buy'); G.s.money += n; G.pop((n >= 0 ? '+' : '−') + G.fmt(Math.abs(n))); };

G.backBtn = (label = '가게') => `<button class="back" onclick="G.go('home')">◀ ${label}</button>`;

G.boot = async () => {
  await G.load();
  if (G.s.phase === 'day' && !G.s.cust && G.s.left > 0) G.newCustomer();
  if (G.s.phase === 'night' && !G.s.opDone && !G.s.mission) G.newMission();
  history.replaceState({ s: 'home' }, '');
  G.render();
  G.title();
};

// 시작 화면 (제목 + 부제). 누르면 사라진다
G.title = () => {
  const el = document.createElement('div');
  el.id = 'title';
  el.innerHTML = `<div class="t-art"><div class="t-bomb">${G.art.bomb()}</div><div class="t-hero">${G.art.hero(true)}</div></div>
    <h1>${G.TITLE}</h1><h2>Nuflex</h2><p>${G.SUBTITLE}</p><button class="cta">▶ 시작</button>`;
  el.onclick = () => { el.classList.add('bye'); setTimeout(() => el.remove(), 300); };
  $('app').appendChild(el);
};
