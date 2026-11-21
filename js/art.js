// 임시 그림 (직접 그린 도형). 진짜 그림이 생기면 이 파일만 바꾼다.
G.art = {};

// 주인공: 양갈래 머리 여자아이. night=true 면 밤 차림
G.art.hero = night => `<svg viewBox="0 0 70 100" class="p hero-svg">
  <g stroke="#2b2b3a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 26 L2 14" stroke-width="7" stroke="#3b2a4a"/><path d="M56 26 L68 14" stroke-width="7" stroke="#3b2a4a"/>
    <circle cx="13" cy="26" r="4" fill="${night ? '#b6ff3d' : '#ffd23d'}"/><circle cx="57" cy="26" r="4" fill="${night ? '#b6ff3d' : '#ffd23d'}"/>
    <rect x="27" y="80" width="6" height="16" fill="#fff"/><rect x="38" y="80" width="6" height="16" fill="#fff"/>
    <path d="M20 84 L24 52 Q35 46 46 52 L50 84 Z" fill="${night ? '#23263a' : '#ff7a3d'}"/>
    <circle cx="35" cy="30" r="19" fill="#ffe0c2"/>
    <path d="M16 30 Q16 10 35 10 Q54 10 54 30 Q46 18 35 20 Q24 18 16 30 Z" fill="#3b2a4a"/>
  </g>
  ${night
    ? '<rect x="22" y="28" width="26" height="8" rx="3" fill="#111"/>'
    : '<circle cx="28" cy="32" r="2.4" fill="#2b2b3a"/><circle cx="42" cy="32" r="2.4" fill="#2b2b3a"/>'}
  <path d="M29 40 Q35 45 41 40" fill="none" stroke="#2b2b3a" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

G.art.person = (color, face) => `<svg viewBox="0 0 60 100" class="p">
  <g stroke="#2b2b3a" stroke-width="2.2" stroke-linejoin="round">
    <rect x="21" y="78" width="6" height="18" fill="#555"/><rect x="33" y="78" width="6" height="18" fill="#555"/>
    <path d="M14 82 L18 48 Q30 42 42 48 L46 82 Z" fill="${color}"/>
    <circle cx="30" cy="28" r="17" fill="#ffe0c2"/>
  </g>
  ${face ? `<text x="30" y="37" text-anchor="middle" font-size="26">${face}</text>`
    : '<circle cx="24" cy="28" r="2.2" fill="#2b2b3a"/><circle cx="36" cy="28" r="2.2" fill="#2b2b3a"/><path d="M25 35 Q30 39 35 35" fill="none" stroke="#2b2b3a" stroke-width="2"/>'}
</svg>`;

// 가게 전경. night=true 면 셔터 내림
G.art.shop = night => {
  let stripes = '';
  for (let i = 0; i < 10; i++) {
    const a = 14 + i * 19.2, b = i * 22;
    stripes += `<polygon points="${a},64 ${a + 19.2},64 ${b + 22},94 ${b},94" fill="${i % 2 ? '#fff' : (night ? '#4a4f70' : '#ff7a3d')}"/>`;
  }
  let shutter = '';
  if (night) {
    shutter = '<rect x="30" y="102" width="160" height="84" fill="#8a8fa8" stroke="#2b2b3a" stroke-width="3"/>';
    for (let y = 112; y < 186; y += 10) shutter += `<line x1="30" y1="${y}" x2="190" y2="${y}" stroke="#5c607a" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 220 190" class="shop-svg">
    <rect x="18" y="60" width="184" height="127" rx="6" fill="${night ? '#3a3f5c' : '#fff3d6'}" stroke="#2b2b3a" stroke-width="3"/>
    <rect x="40" y="26" width="140" height="36" rx="8" fill="${night ? '#22263d' : '#2f9e8f'}" stroke="#2b2b3a" stroke-width="3"/>
    <text x="110" y="50" text-anchor="middle" font-size="18" font-weight="900" fill="${night ? '#55597a' : '#fff'}">✈ 삐삐여행사</text>
    ${night ? shutter : `
    <rect x="32" y="104" width="92" height="56" rx="4" fill="#bfe9ff" stroke="#2b2b3a" stroke-width="3"/>
    <text x="78" y="143" text-anchor="middle" font-size="30">🏝</text>
    <rect x="140" y="104" width="46" height="83" rx="4" fill="#c98b5a" stroke="#2b2b3a" stroke-width="3"/>
    <circle cx="178" cy="148" r="3" fill="#2b2b3a"/>`}
    <g stroke="#2b2b3a" stroke-width="0">${stripes}</g>
    <polygon points="14,64 206,64 220,94 0,94" fill="none" stroke="#2b2b3a" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
};

G.art.truck = () => `<svg viewBox="0 0 130 70" class="truck-svg">
  <g stroke="#111522" stroke-width="3" stroke-linejoin="round">
    <rect x="4" y="8" width="78" height="44" rx="4" fill="#565c7c"/>
    <path d="M82 22 H104 L122 38 V52 H82 Z" fill="#b6ff3d"/>
    <rect x="96" y="27" width="12" height="10" fill="#bfe9ff"/>
    <circle cx="26" cy="56" r="10" fill="#222"/><circle cx="100" cy="56" r="10" fill="#222"/>
  </g>
  <text x="43" y="40" text-anchor="middle" font-size="24">☢️</text>
</svg>`;

// 핵 (스케치: 위에 날개 둘, 받침, 수레)
G.art.bomb = () => `<svg viewBox="0 0 180 240" class="bomb-svg">
  <g stroke="#111522" stroke-width="4" stroke-linejoin="round">
    <rect x="30" y="204" width="120" height="22" rx="6" fill="#565c7c"/>
    <circle cx="58" cy="230" r="9" fill="#222"/><circle cx="122" cy="230" r="9" fill="#222"/>
    <ellipse cx="90" cy="196" rx="62" ry="14" fill="#8a8fa8"/>
    <path d="M52 40 L46 10 L74 30 Z" fill="#b6ff3d"/><path d="M128 40 L134 10 L106 30 Z" fill="#b6ff3d"/>
    <path d="M52 40 Q90 18 128 40 L140 150 Q134 192 90 194 Q46 192 40 150 Z" fill="#e9ecf5"/>
    <path d="M47 82 H133" fill="none"/><path d="M43 120 H137" fill="none"/>
  </g>
  <circle cx="90" cy="152" r="22" fill="#ffd23d" stroke="#111522" stroke-width="4"/>
  <text x="90" y="162" text-anchor="middle" font-size="28">☢</text>
</svg>`;

// 지어낸 세계 지도 바탕
G.art.world = night => `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="world-svg">
  <rect width="100" height="100" fill="${night ? '#141a33' : '#9fdcff'}"/>
  <g fill="${night ? '#2a3358' : '#b9e48a'}" stroke="${night ? '#3d4877' : '#6fae4a'}" stroke-width=".6">
    <path d="M8 10 Q22 2 40 10 Q44 22 32 28 Q18 30 10 24 Z"/>
    <path d="M6 50 Q16 44 28 52 Q32 66 22 74 Q10 74 6 64 Z"/>
    <path d="M34 42 Q50 36 62 46 Q64 60 52 66 Q38 66 34 56 Z"/>
    <path d="M60 16 Q76 10 90 20 Q92 34 80 38 Q64 38 60 28 Z"/>
    <path d="M70 62 Q82 58 92 66 Q92 78 82 82 Q70 80 68 72 Z"/>
    <path d="M34 80 Q46 76 58 82 Q58 92 46 94 Q36 92 34 86 Z"/>
  </g>
</svg>`;

// 작전 성공 그림 (버섯구름을 꽃처럼)
G.art.boom = () => `<svg viewBox="0 0 160 170" class="boom-svg">
  <g stroke="#111522" stroke-width="4" stroke-linejoin="round">
    <path d="M70 160 Q74 110 68 86 H92 Q86 110 90 160 Z" fill="#ffd23d"/>
    <circle cx="48" cy="62" r="26" fill="#ff7a3d"/><circle cx="112" cy="62" r="26" fill="#ff7a3d"/>
    <circle cx="80" cy="42" r="30" fill="#ff9b5a"/><circle cx="80" cy="74" r="22" fill="#ffd23d"/>
  </g>
</svg>`;

// ── 버섯구름: 온갖 버섯 모양 (사람마다 고르는 트레이드마크) ──
G.art.shroomBody = {
  button: `<path d="M62 165 Q58 112 66 92 H94 Q102 112 98 165 Z" fill="#fff6e6"/>
    <path d="M22 98 Q18 28 80 24 Q142 28 138 98 Q80 84 22 98 Z" fill="#f3ead9"/>
    <path d="M40 60 Q60 40 84 38" fill="none" stroke="#fff" stroke-width="5"/>`,
  shiitake: `<path d="M68 165 Q64 122 70 96 H90 Q96 122 92 165 Z" fill="#f1e2c4"/>
    <path d="M8 102 Q28 42 80 40 Q132 42 152 102 Q80 86 8 102 Z" fill="#8a5a3c"/>
    <g fill="none" stroke="#d9b98f" stroke-width="3"><path d="M50 62 L62 76 L54 88"/><path d="M84 52 L80 68 L96 78"/><path d="M112 62 L106 76 L122 86"/></g>`,
  oyster: `<g fill="none" stroke-linecap="round"><path d="M80 165 Q84 120 110 84" stroke="#111522" stroke-width="20"/><path d="M80 165 Q70 130 54 108" stroke="#111522" stroke-width="18"/>
    <path d="M80 165 Q84 120 110 84" stroke="#eceef4" stroke-width="12"/><path d="M80 165 Q70 130 54 108" stroke="#eceef4" stroke-width="10"/></g>
    <ellipse cx="112" cy="66" rx="44" ry="24" transform="rotate(-14 112 66)" fill="#9aa3b5"/>
    <ellipse cx="50" cy="96" rx="38" ry="19" transform="rotate(14 50 96)" fill="#b3bac8"/>
    <ellipse cx="98" cy="122" rx="30" ry="14" transform="rotate(-8 98 122)" fill="#c7ccd8"/>`,
  enoki: `<g fill="none" stroke-linecap="round" stroke="#111522" stroke-width="10"><path d="M80 165 Q70 100 30 44"/><path d="M80 165 Q74 90 54 28"/><path d="M80 165 Q80 90 80 18"/><path d="M80 165 Q86 90 106 28"/><path d="M80 165 Q90 100 130 44"/></g>
    <g fill="none" stroke-linecap="round" stroke="#fff3d6" stroke-width="5"><path d="M80 165 Q70 100 30 44"/><path d="M80 165 Q74 90 54 28"/><path d="M80 165 Q80 90 80 18"/><path d="M80 165 Q86 90 106 28"/><path d="M80 165 Q90 100 130 44"/></g>
    <g fill="#ffe2a0"><circle cx="30" cy="42" r="11"/><circle cx="54" cy="26" r="11"/><circle cx="80" cy="16" r="11"/><circle cx="106" cy="26" r="11"/><circle cx="130" cy="42" r="11"/></g>`,
  agaric: `<path d="M64 165 Q60 120 68 94 H92 Q100 120 96 165 Z" fill="#fff"/>
    <path d="M56 112 Q80 124 104 112 L108 122 Q80 136 52 122 Z" fill="#fff"/>
    <path d="M16 100 Q22 28 80 22 Q138 28 144 100 Q80 84 16 100 Z" fill="#e5342b"/>
    <g fill="#fff" stroke-width="2"><circle cx="52" cy="58" r="9"/><circle cx="84" cy="42" r="10"/><circle cx="114" cy="62" r="8"/><circle cx="70" cy="78" r="6"/><circle cx="100" cy="80" r="6"/><circle cx="34" cy="82" r="5"/><circle cx="128" cy="84" r="5"/></g>`,
  king: `<path d="M52 165 Q42 100 60 62 H100 Q118 100 108 165 Z" fill="#f6efe0"/>
    <path d="M42 68 Q48 28 80 26 Q112 28 118 68 Q80 56 42 68 Z" fill="#b9895a"/>`,
  morel: `<path d="M64 165 Q62 132 68 112 H92 Q98 132 96 165 Z" fill="#f1e2c4"/>
    <path d="M80 12 Q126 40 116 96 Q110 120 80 120 Q50 120 44 96 Q34 40 80 12 Z" fill="#a8794a"/>
    <g fill="#6b4526" stroke-width="2"><ellipse cx="68" cy="46" rx="8" ry="11"/><ellipse cx="92" cy="44" rx="8" ry="11"/><ellipse cx="58" cy="76" rx="8" ry="11"/><ellipse cx="80" cy="74" rx="8" ry="12"/><ellipse cx="102" cy="76" rx="8" ry="11"/><ellipse cx="70" cy="102" rx="7" ry="9"/><ellipse cx="92" cy="102" rx="7" ry="9"/></g>`,
  fire: `<path d="M70 165 Q74 112 68 88 H92 Q86 112 90 165 Z" fill="#ffd23d"/>
    <circle cx="48" cy="64" r="26" fill="#ff7a3d"/><circle cx="112" cy="64" r="26" fill="#ff7a3d"/>
    <circle cx="80" cy="44" r="30" fill="#ff9b5a"/><circle cx="80" cy="76" r="22" fill="#ffd23d"/>`,
};
G.art.shroom = (id, cls) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170" width="160" height="170" class="${cls || 'boom-svg'}"><g stroke="#111522" stroke-width="4" stroke-linejoin="round">${G.art.shroomBody[id] || G.art.shroomBody.button}</g></svg>`;
G.art.boom = () => G.art.shroom(G.s.shroom);
