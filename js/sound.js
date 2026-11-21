// 소리 — 파일 없이 그 자리에서 만들어 낸다(효과음 + 낮·밤·작전 배경음 3곡). 진짜 음원이 생기면 이 파일만 바꾼다.
G.snd = (() => {
  let ac = null, master = null, bgmGain = null, noiseBuf = null, on = true, mode = null, step = 0, nextT = 0, kicked = false;
  try { on = localStorage.getItem('nuflex_snd') !== '0'; } catch {}

  function init() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}   // 아이폰 무음 스위치여도 나게
    if (ac) { if (ac.state !== 'running') ac.resume().then(kick).catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = on ? 1 : 0; master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.gain.value = 1; bgmGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(pump, 80);
    ac.resume().then(kick).catch(() => {});
  }
  // 소리 없는 한 조각을 틀어 아이폰의 잠금을 푼다
  function kick() {
    if (kicked || !ac || ac.state !== 'running') return;
    kicked = true;
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
    s.buffer = b; s.connect(ac.destination); s.start(0);
  }

  // 음 하나: f → f2 로 미끄러질 수 있다
  function tone(f, at, dur, type, vol, f2, out) {
    if (!ac) return;
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || master); o.start(t); o.stop(t + dur + 0.02);
  }
  // 잡음: 터지는 소리·부서지는 소리·북
  function noise(at, dur, vol, f1, f2, out) {
    if (!ac) return;
    const t = ac.currentTime + at, src = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f1, t); lp.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(g); g.connect(out || master); src.start(t, Math.random()); src.stop(t + dur + 0.02);
  }

  const S = {
    tap:   () => tone(700, 0, 0.05, 'square', 0.07),
    coin:  () => { tone(988, 0, 0.07, 'square', 0.12); tone(1319, 0.07, 0.16, 'square', 0.12); },
    buy:   () => { tone(440, 0, 0.06, 'triangle', 0.2); tone(660, 0.06, 0.06, 'triangle', 0.2); tone(880, 0.12, 0.14, 'triangle', 0.2); },
    good:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.16, 'triangle', 0.2)),
    bad:   () => { tone(220, 0, 0.16, 'sawtooth', 0.15, 150); tone(150, 0.16, 0.3, 'sawtooth', 0.15, 90); },
    night: () => [659, 523, 392, 262].forEach((f, i) => tone(f, i * 0.12, 0.3, 'sine', 0.22)),
    morn:  () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.2)),
    shoot: () => { noise(0, 0.3, 0.7, 500, 6000); tone(180, 0, 0.4, 'sawtooth', 0.25, 1100); tone(90, 0, 0.2, 'sine', 0.6, 40); },
    splash:() => { noise(0, 0.45, 0.5, 3000, 300); tone(500, 0, 0.2, 'sine', 0.12, 150); },
    fall:  () => tone(1900, 0, 0.62, 'sine', 0.28, 260),
    boom:  () => {
      noise(0, 0.12, 1.0, 9000, 2000);                       // 쾅
      noise(0, 1.8, 1.0, 1600, 50);                          // 우르르
      tone(110, 0, 1.4, 'sine', 1.0, 28);                    // 바닥 울림
      tone(60, 0.05, 0.9, 'triangle', 0.6, 30);
      for (let i = 0; i < 26; i++) noise(0.15 + Math.random() * 1.5, 0.05 + Math.random() * 0.06, 0.15 + Math.random() * 0.25, 3000 + Math.random() * 5000, 400);  // 와장창 조각
    },
    win:   () => [523, 523, 523, 698, 880, 784, 1047].forEach((f, i) => tone(f, i * 0.11, i === 6 ? 0.5 : 0.12, 'square', 0.15)),
    raid:  () => { for (let i = 0; i < 4; i++) { tone(880, i * 0.3, 0.15, 'square', 0.15); tone(660, i * 0.3 + 0.15, 0.15, 'square', 0.15); } },
  };

  // 말소리: 인물마다 높낮이가 다른 옹알이
  function talk(pitch) {
    if (!ac || !on) return;
    if (pitch === 'bark') { tone(420, 0, 0.09, 'square', 0.2, 250); tone(460, 0.16, 0.11, 'square', 0.2, 240); return; }
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) tone(pitch * (0.85 + Math.random() * 0.4), i * 0.075, 0.06, 'triangle', 0.18);
  }

  // 배경음 3곡. 한 칸 = 8분음표. 0 은 쉼. 북: k 쿵, s 탁, h 칫, . 쉼
  const BGM = {
    // 낮: 밝고 통통 튀는 장조
    day: { bpm: 138, lead: 'triangle', vol: 0.2, bvol: 0.24,
      mel:  [523, 0, 659, 784, 0, 659, 523, 0, 587, 0, 698, 880, 0, 698, 587, 0, 523, 0, 659, 784, 1047, 0, 784, 659, 587, 523, 587, 659, 523, 0, 0, 0],
      bass: [131, 0, 196, 0, 131, 0, 196, 0, 147, 0, 220, 0, 147, 0, 196, 0],
      drum: 'k.h.s.h.k.hhs.h.' },
    // 밤: 느리고 살금살금한 단조
    night: { bpm: 80, lead: 'sine', vol: 0.2, bvol: 0.3,
      mel:  [0, 0, 330, 0, 311, 0, 0, 0, 294, 0, 0, 262, 0, 0, 247, 0, 0, 0, 330, 0, 392, 0, 370, 0, 330, 0, 0, 294, 0, 0, 0, 0],
      bass: [82, 0, 0, 0, 0, 0, 82, 0, 73, 0, 0, 0, 0, 0, 62, 0],
      drum: 'k.......h...k...' },
    // 작전: 빠르고 조여 오는 긴박한 가락 + 경보
    ops: { bpm: 172, lead: 'square', vol: 0.13, bvol: 0.24, btype: 'sawtooth',
      mel:  [659, 0, 0, 622, 0, 0, 659, 0, 784, 0, 0, 740, 0, 0, 659, 0, 659, 0, 0, 622, 0, 0, 659, 0, 988, 932, 988, 932, 880, 0, 784, 0],
      bass: [82, 82, 82, 98, 82, 82, 110, 98, 82, 82, 82, 98, 82, 82, 123, 110],
      drum: 'khshkhshkhshkssh' },
  };
  function pump() {
    if (!ac || !mode || ac.state !== 'running') return;
    const b = BGM[mode], len = 30 / b.bpm;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.25) {
      const at = nextT - ac.currentTime, m = b.mel[step % b.mel.length], bs = b.bass[step % b.bass.length], dr = b.drum[step % b.drum.length];
      if (m) tone(m, at, len * 0.9, b.lead, b.vol, null, bgmGain);
      if (bs) tone(bs, at, len * (mode === 'ops' ? 0.8 : 1.8), b.btype || 'triangle', b.bvol, null, bgmGain);
      if (dr === 'k') tone(150, at, 0.13, 'sine', 0.5, 45, bgmGain);
      if (dr === 's') noise(at, 0.1, 0.3, 4000, 1200, bgmGain);
      if (dr === 'h') noise(at, 0.03, 0.1, 9000, 7000, bgmGain);
      step++; nextT += len;
    }
  }

  return {
    init, talk,
    play: name => { if (ac && on && S[name]) S[name](); },
    bgm: m => { if (m !== mode) { mode = m; step = 0; nextT = 0; } },
    toggle: () => { on = !on; try { localStorage.setItem('nuflex_snd', on ? '1' : '0'); } catch {} if (master) master.gain.value = on ? 1 : 0; return on; },
    isOn: () => on,
    state: () => ac ? ac.state : 'none',
  };
})();

// 휴대폰은 손가락을 "뗄 때"만 소리를 허락한다 → 여러 신호에서 깨운다. 버튼마다 톡 소리
['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => G.snd.init(), true));
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('button')) G.snd.play('tap');
}, true);
