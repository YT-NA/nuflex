// 게임 숫자·목록. 나중에 서버 장부(DB)로 옮겨 배포 없이 바꾼다.
window.G = {};

G.HOME = { x: 48, y: 54 };

// 여행지 (모두 지어낸 나라). x·y 는 지도 위 자리(%)
G.COUNTRIES = [
  { id: 'coco',   name: '코코넛섬',   icon: '🏝', tag: '바다', x: 80, y: 72, cost: 0 },
  { id: 'snow',   name: '스노알프',   icon: '🏔', tag: '눈',   x: 24, y: 17, cost: 300 },
  { id: 'noodle', name: '누들리아',   icon: '🏙', tag: '미식', x: 17, y: 62, cost: 600 },
  { id: 'sand',   name: '모래모래국', icon: '🏜', tag: '모험', x: 74, y: 28, cost: 1000 },
  { id: 'jungle', name: '정글라',     icon: '🌴', tag: '탐험', x: 46, y: 86, cost: 1500 },
];

// 패키지에 넣는 것
G.OPTIONS = [
  { id: 'hotel',   name: '호텔',     icon: '🏨', price: 80, tag: '휴식' },
  { id: 'snorkel', name: '스노클링', icon: '🤿', price: 50, tag: '물놀이' },
  { id: 'guide',   name: '가이드',   icon: '🧭', price: 40, tag: '안내' },
  { id: 'food',    name: '맛집',     icon: '🍜', price: 60, tag: '먹기' },
  { id: 'ski',     name: '스키',     icon: '🎿', price: 70, tag: '운동' },
  { id: 'spa',     name: '온천',     icon: '♨️', price: 50, tag: '휴식2' },
];

G.BASE_TRIP = 100;          // 여행 기본값(만)
G.CUSTOMERS_PER_DAY = 3;
G.CUSTOMER_COLORS = ['#4aa3ff', '#ff6b8b', '#38c172', '#b57bff', '#ffb02e', '#20c4c4'];
G.CUSTOMER_NAMES = ['김 과장', '박 할머니', '신혼부부', '대학생', '이 사장', '최 선생'];

// 밤 의뢰인 (모두 지어낸 것). weak=사회적 약자: 돈은 적지만 평판이 오르고 의심이 덜 오른다
G.CLIENTS = [
  { name: '동네 꼬마',   icon: '🧒', color: '#ffb02e', weak: true, plea: '형들이 맨날 때려요…',   spot: '일진 아지트',     enemy: '😈' },
  { name: '멍멍이',      icon: '🐶', color: '#c9a070', weak: true, plea: '끼잉… 끼잉…',           spot: '학대범네 동네',   enemy: '👿' },
  { name: '시장 아지매', icon: '👵', color: '#e06b8b', weak: true, plea: '더는 못 참겠어예…',     spot: '주정뱅이 골목',   enemy: '🤬' },
  { name: '알바생',      icon: '🧑‍🍳', color: '#4aa3ff', weak: true, plea: '월급을 또 떼였어요…',   spot: '악덕 사장 빌딩',  enemy: '🤑' },
  { name: '수염 장군',   icon: '🥸', color: '#6b7f4f', plea: '저 녀석들을 날려 주게.',   spot: '라이벌 비밀기지', enemy: '💀' },
  { name: '선글라스 박사', icon: '😎', color: '#5a5f8a', plea: '실험이 필요하오.',       spot: '악당 연구소',     enemy: '🤖' },
  { name: '망토 남작',   icon: '🧛', color: '#7a3d5c', plea: '후후… 부탁하지.',          spot: '괴수 둥지',       enemy: '👾' },
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

// 상점(과금) — 지금은 시험용. 실제 결제는 구글 플레이 연결 뒤
G.SHOP = [
  { id: 'gem30',  icon: '💎', name: '보석 30',   won: '₩1,200', gem: 30 },
  { id: 'gem100', icon: '💎', name: '보석 100',  won: '₩3,900', gem: 100 },
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
