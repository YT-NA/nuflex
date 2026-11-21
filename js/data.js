// 게임 숫자·목록. 나중에 서버 장부(DB)로 옮겨 배포 없이 바꾼다.
window.G = {};

G.HOME = { x: 48, y: 54 };

// 여행지 (모두 지어낸 나라). x·y 는 지도 위 자리(%)
G.COUNTRIES = [
  { pay: 80, fun: ['🏊','🤿','🍹','🏖'], id: 'coco',   name: '코코넛섬',   icon: '🏝', tag: '바다', x: 80, y: 72, cost: 0 },
  { pay: 120, fun: ['⛷','☃️','🏂','🧣'], id: 'snow',   name: '스노알프',   icon: '🏔', tag: '눈',   x: 24, y: 17, cost: 300 },
  { pay: 160, fun: ['🍜','🥟','🍢','🎆'], id: 'noodle', name: '누들리아',   icon: '🏙', tag: '미식', x: 17, y: 62, cost: 600 },
  { pay: 220, fun: ['🐫','🏜','📸','🕶'], id: 'sand',   name: '모래모래국', icon: '🏜', tag: '모험', x: 74, y: 28, cost: 1000 },
  { pay: 300, fun: ['🐒','🦜','🍌','🌺'], id: 'jungle', name: '정글라',     icon: '🌴', tag: '탐험', x: 46, y: 86, cost: 1500 },
];

// 손님 급 — 여행사 등급(lv)이 오를수록 단체·높은 사람이 온다. n=사람 수, mul=돈 배수
G.GUESTS = [
  { lv: 1, name: '손님',        icon: '',   n: 1,  mul: 1 },
  { lv: 1, name: '대학생',      icon: '🧑‍🎓', n: 1,  mul: 1.2 },
  { lv: 2, name: '가족 여행',   icon: '👨‍👩‍👧', n: 3,  mul: 2.5 },
  { lv: 3, name: '단체 관광',   icon: '🧓', n: 8,  mul: 6 },
  { lv: 4, name: '사장님',      icon: '🤵', n: 1,  mul: 9 },
  { lv: 5, name: '국회의원',    icon: '🧑‍💼', n: 1,  mul: 15 },
  { lv: 6, name: '효도 관광단', icon: '👵', n: 12, mul: 22 },
  { lv: 7, name: '임금님',      icon: '🤴', n: 1,  mul: 45 },
  { lv: 8, name: '외계 대사',   icon: '👽', n: 1,  mul: 90 },
];
G.CUSTOMERS_PER_DAY = 3;
G.CUSTOMER_COLORS = ['#4aa3ff', '#ff6b8b', '#38c172', '#b57bff', '#ffb02e', '#20c4c4'];

// 밤 의뢰 — 작전을 성공할수록 급(t)이 올라 표적이 커진다: 동네 → 마을 → 도시 → 명소 → 나라 → 행성
// weak=사회적 약자(돈은 적지만 평판↑ 의심↓). main=가운데 큰 표적 그림, size=크기, bld=둘레 건물 수, ppl=사람 수, tall=건물 키
// 명소·나라는 실제 이름 대신 빗댄 이름을 쓴다.
G.RANKS = ['동네 해결사', '마을 해결사', '도시의 그림자', '세계의 손', '나라 지우개', '행성 파괴자'];
G.TIER_AT = [0, 2, 5, 8, 12, 16];                       // 작전 성공 횟수
G.TIER_PAY = [600, 1000, 2000, 5000, 12000, 35000];
G.CLIENTS = [
  { t: 0, voice: 820,    name: '동네 꼬마',   icon: '🧒', color: '#ffb02e', weak: true, plea: '형들이 맨날 때려요…',       spot: '일진 아지트',        enemy: '😈', main: '🏚', size: 84,  bld: 2, ppl: 3, tall: 0.2 },
  { t: 0, voice: 'bark', name: '멍멍이',      icon: '🐶', color: '#c9a070', weak: true, plea: '끼잉… 끼잉…',               spot: '못된 주인네 개집',   enemy: '👿', main: '🛖', size: 80,  bld: 1, ppl: 2, tall: 0.2 },
  { t: 0, voice: 900,    name: '사탕가게 손녀', icon: '👧', color: '#ff8fc0', weak: true, plea: '옆 가게가 사탕을 훔쳐 가요!', spot: '도둑 캔디샵',        enemy: '🤥', main: '🍭', size: 84,  bld: 2, ppl: 2, tall: 0.25 },
  { t: 0, voice: 560,    name: '옆집 아내',   icon: '👩', color: '#e06b8b', weak: true, plea: '저 차 안에서 바람을…!',     spot: '바람피우는 자동차',  enemy: '💋', main: '🚗', size: 92,  bld: 1, ppl: 2, tall: 0.2 },
  { t: 1, voice: 520,    name: '시장 아지매', icon: '👵', color: '#e06b8b', weak: true, plea: '더는 못 참겠어예…',         spot: '주정뱅이 골목',      enemy: '🤬', main: '🍻', size: 76,  bld: 5, ppl: 5, tall: 0.45 },
  { t: 1, voice: 620,    name: '알바생',      icon: '🧑‍🍳', color: '#4aa3ff', weak: true, plea: '월급을 또 떼였어요…',       spot: '악덕 사장 빌딩',     enemy: '🤑', main: '🏢', size: 110, bld: 4, ppl: 4, tall: 0.5 },
  { t: 2, voice: 190,    name: '수염 장군',   icon: '🥸', color: '#6b7f4f', plea: '저 녀석들을 날려 주게.',     spot: '라이벌 비밀기지',    enemy: '💀', main: '🏭', size: 120, bld: 6, ppl: 6, tall: 0.75 },
  { t: 2, voice: 300,    name: '선글라스 박사', icon: '😎', color: '#5a5f8a', plea: '실험이 필요하오.',         spot: '악당 연구소',        enemy: '🤖', main: '🏰', size: 120, bld: 6, ppl: 6, tall: 0.8 },
  { t: 2, voice: 150,    name: '망토 남작',   icon: '🧛', color: '#7a3d5c', plea: '후후… 부탁하지.',            spot: '괴수 둥지',          enemy: '👾', main: '🌋', size: 130, bld: 4, ppl: 6, tall: 0.6 },
  { t: 3, voice: 240,    name: '검은 양복',   icon: '🕴', color: '#23263a', plea: '각하께서 원하십니다.',       spot: '하얀 관저',          enemy: '🕶', main: '🏛', size: 160, bld: 4, ppl: 6, tall: 0.5 },
  { t: 3, voice: 440,    name: '관광청장',    icon: '🎩', color: '#7a5cff', plea: '저 탑이 우리 탑보다 높소!',  spot: '세계에서 제일 큰 철탑', enemy: '🥖', main: '🗼', size: 170, bld: 4, ppl: 6, tall: 0.5 },
  { t: 3, voice: 380,    name: '수집가',      icon: '🧐', color: '#2f9e8f', plea: '세상에 하나만 있어야 하오.', spot: '횃불 든 동상',       enemy: '🗿', main: '🗽', size: 170, bld: 4, ppl: 6, tall: 0.5 },
  { t: 4, voice: 170,    name: '독재자',      icon: '🫅', color: '#8a2d2d', plea: '저 나라가 눈에 거슬린다.',   spot: '이웃 나라 수도',     enemy: '💂', main: '🏙', size: 130, bld: 12, ppl: 9, tall: 1 },
  { t: 4, voice: 210,    name: '총통',        icon: '👨‍✈️', color: '#4f6b3a', plea: '지도에서 지워 주게.',        spot: '모래모래국 통째로',  enemy: '🐫', main: '🕌', size: 140, bld: 12, ppl: 9, tall: 0.9 },
  { t: 5, voice: 1100,   name: '외계 황제',   icon: '👽', color: '#38c172', plea: '삐리릭. 저 달이 눈부시다.',  spot: '달',                 enemy: '👾', main: '🌕', size: 190, bld: 0, ppl: 0, space: true },
  { t: 5, voice: 700,    name: '은하 상인',   icon: '🛸', color: '#8fb6ff', plea: '저 고리, 장사에 방해된다.',  spot: '고리 달린 행성',     enemy: '👾', main: '🪐', size: 200, bld: 0, ppl: 0, space: true },
  { t: 5, voice: 120,    name: '로봇 대왕',   icon: '🤖', color: '#8a8fa8', plea: '삑. 저 별똥별을 부숴라.',    spot: '거대 혜성',          enemy: '👾', main: '☄️', size: 190, bld: 0, ppl: 0, space: true },
];

// 연구(강화) — 값은 단계마다 ×1.5
G.TITLE = '핵플렉스';
G.SUBTITLE = '당신의 안마당에<br>핵무기를 배달해 드립니다.';

// 연구소 — 낮 사업(여행사)과 밤 사업(무기)을 따로 키운다. 값은 단계마다 ×1.5
G.UPGRADES = [
  { id: 'talk',   side: 'day',   name: '말솜씨',      icon: '🗣', base: 200, effect: '여행 수익 +10%' },
  { id: 'expand', side: 'day',   name: '가게 확장',   icon: '🏬', base: 400, effect: '하루 손님 +1', max: 3 },
  { id: 'truck',  side: 'night', name: '트럭 개조',   icon: '🚚', base: 250, effect: '운송비 −15만', max: 6 },
  { id: 'net',    side: 'night', name: '암시장 인맥', icon: '🕶', base: 350, effect: '의뢰 대금 +10%' },
  { id: 'sign',   side: 'night', name: '변장술',      icon: '🥸', base: 300, effect: '의심 −10%', max: 8 },
];
// 여행사 꾸미기 — 한 번 사면 가게 앞에 놓인다
G.DECOR = [
  { id: 'plant',   name: '화분',      icon: '🪴', cost: 200, effect: '계약마다 ⭐+1', x: 10, y: 0 },
  { id: 'balloon', name: '풍선',      icon: '🎈', cost: 400, effect: '계약마다 팁 +20만', x: 84, y: 44 },
  { id: 'neon',    name: '반짝 전구', icon: '💡', cost: 800, effect: '여행 수익 +10%', x: 50, y: 86 },
];
// 무기고 — 핵만 키운다
G.ARMORY = [
  { id: 'power', name: '위력', icon: '💥', base: 300, effect: '대금 +15%' },
  { id: 'range', name: '범위', icon: '🎯', base: 250, effect: '더 넓게 박살' },
];
G.NUKE_NAMES = ['꼬마탄', '통통탄', '우람탄', '왕폭탄', '대마왕탄'];
G.NUKE_COST = 300;
G.TRANSPORT = 100;          // 기본 운송비(만)
G.HEAT_PER_OP = 25;
G.FAIL_UNDER = 0.3;        // 박살 낸 비율이 이보다 낮으면 작전 실패

// 상점(과금) — 지금은 시험용. 실제 결제는 구글 플레이 연결 뒤
G.SHOP = [
  { id: 'gem30',  icon: '💎', name: '보석 30',   won: '₩1,200', gem: 30 },
  { id: 'gem100', icon: '💎', name: '보석 100',  won: '₩3,900', gem: 100 },
  { id: 'sec',    icon: '🤖', name: '상담 비서', won: '₩3,300', flag: 'secretary', note: '자동 발사 무제한' },
  { id: 'noad',   icon: '🚫', name: '광고 제거', won: '₩5,500', flag: 'noad' },
  { id: 'month',  icon: '📅', name: '월정액',    won: '₩4,900', flag: 'month', gem: 10 },
];

// 목표 한 줄
G.GOALS = [
  { text: '첫 손님 상담하기',  done: s => s.stats.served >= 1, go: 'counsel' },
  { text: '가게 닫고 밤 맞기', done: s => s.day > 1 || s.phase === 'night', go: 'home' },
  { text: '첫 작전 성공',      done: s => s.stats.ops >= 1, go: 'ops' },
  { text: '새 노선 열기',      done: s => Object.keys(s.routes).length >= 2, go: 'map' },
  { text: '핵 2개 쌓아 두기',  done: s => s.nukes >= 2, go: 'armory' },
  { text: '핵 위력 올리기',    done: s => s.up.power >= 1, go: 'armory' },
  { text: '노선 4곳 열기',     done: s => Object.keys(s.routes).length >= 4, go: 'map' },
  { text: '작전 10번 성공',    done: s => s.stats.ops >= 10, go: 'ops', n: s => s.stats.ops, of: 10 },
];

// 버섯구름 모양 — 내 트레이드마크. cost=돈(만), gem=보석
G.SHROOMS = [
  { id: 'button',   name: '양송이' },
  { id: 'fire',     name: '불버섯' },
  { id: 'shiitake', name: '표고',     cost: 300 },
  { id: 'oyster',   name: '느타리',   cost: 500 },
  { id: 'king',     name: '새송이',   cost: 800 },
  { id: 'enoki',    name: '팽이',     gem: 5 },
  { id: 'agaric',   name: '광대버섯', gem: 10 },
  { id: 'morel',    name: '곰보버섯', gem: 15 },
];

// 꾸미기 — 삐삐(옷·모자)와 핵(색·스티커). cost=돈(만), gem=보석
G.LOOKS = [
  { kind: 'dress',   val: '#ff7a3d', name: '주황' },
  { kind: 'dress',   val: '#4aa3ff', name: '하늘', cost: 200 },
  { kind: 'dress',   val: '#ff6b9d', name: '분홍', cost: 200 },
  { kind: 'dress',   val: '#ffd23d', name: '황금', gem: 5 },
  { kind: 'hat',     val: '',   name: '없음' },
  { kind: 'hat',     val: '👒', name: '밀짚모자', cost: 300 },
  { kind: 'hat',     val: '🎩', name: '신사모', cost: 600 },
  { kind: 'hat',     val: '👑', name: '왕관', gem: 10 },
  { kind: 'nuke',    val: '#e9ecf5', name: '흰색' },
  { kind: 'nuke',    val: '#ffb3d1', name: '분홍', cost: 300 },
  { kind: 'nuke',    val: '#565c7c', name: '강철', cost: 600 },
  { kind: 'nuke',    val: '#ffd23d', name: '황금', gem: 10 },
  { kind: 'sticker', val: '☢',  name: '방사능' },
  { kind: 'sticker', val: '💖', name: '하트', cost: 200 },
  { kind: 'sticker', val: '💀', name: '해골', cost: 400 },
  { kind: 'sticker', val: '🌈', name: '무지개', gem: 5 },
];
G.LOOK_KINDS = [['dress', '👗 삐삐 옷'], ['hat', '🎩 삐삐 모자'], ['nuke', '🎨 핵 색'], ['sticker', '⭐ 핵 스티커']];
