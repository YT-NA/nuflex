// 저장·불러오기. 「자료 길」은 이 파일 하나로만 다닌다 (나중에 로그인 길과 따로 옮길 수 있게).
G.newState = () => ({
  v: 1, t: 0, day: 1, phase: 'day',
  money: 300, gem: 5, fame: 0, heat: 10,
  routes: { coco: true }, nukes: 10, stage: 0, wp: 0,
  up: { talk: 0, truck: 0, sign: 0, power: 0, range: 0, expand: 0, net: 0 }, decor: {}, look: { dress: '#ff7a3d', hat: '', nuke: '#e9ecf5', sticker: '☢' }, own: {}, shroom: 'button', shrooms: { button: true, fire: true },
  left: G.CUSTOMERS_PER_DAY, cust: null, pick: { dest: null, opts: [] },
  mission: null, opDone: false,
  attendDay: 0, adDay: 0, flags: {},
  stats: { served: 0, ops: 0 },
});

G.deviceId = () => {
  let id = null;
  try { id = localStorage.getItem('nuflex_id'); } catch {}
  if (!id) {
    id = Array.from({ length: 16 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    try { localStorage.setItem('nuflex_id', id); } catch {}
  }
  return id;
};

G.load = async () => {
  let local = null, remote = null;
  try { local = JSON.parse(localStorage.getItem('nuflex_save')); } catch {}
  try {
    const r = await fetch('/api/load?id=' + G.deviceId());
    if (r.ok) remote = (await r.json()).save;
  } catch {}
  const best = [local, remote].filter(s => s && s.v === 1).sort((a, b) => (b.t || 0) - (a.t || 0))[0];
  const fresh = G.newState();
  G.s = Object.assign(G.newState(), best || {});
  G.s.up = Object.assign(fresh.up, G.s.up);
  G.s.decor = G.s.decor || {};
  G.s.stage = G.s.stage || 0; G.s.wp = G.s.wp || 0;
  if (G.s.mission && G.s.mission.stage == null) { G.s.mission = null; if (G.s.phase === 'night' && !G.s.opDone) G.needMission = true; }
  G.s.look = Object.assign(fresh.look, G.s.look); G.s.own = G.s.own || {};
  if (G.s.cust && G.s.cust.g == null) G.s.cust = null;                       // 예전 저장의 손님은 버린다
  if (G.s.mission && !G.CLIENTS[G.s.mission.client]) G.s.mission.client = 0;
  G.s.shroom = G.s.shroom || 'button'; G.s.shrooms = Object.assign({ button: true, fire: true }, G.s.shrooms);
  if (G.s.mission && !G.CLIENTS[G.s.mission.client]) G.s.mission.client = 0;
};

let saveTimer = null;
G.save = () => {
  G.s.t = Date.now();
  try { localStorage.setItem('nuflex_save', JSON.stringify(G.s)); } catch {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: G.deviceId(), save: G.s }) }).catch(() => {});
  }, 800);
};

G.reset = () => { G.s = G.newState(); G.newCustomer(); G.save(); G.screen = 'home'; G.closeSheet(); G.render(); };
