// 소리 — 파일 없이 그 자리에서 만들어 낸다(효과음 + 낮·밤 배경음). 진짜 음원이 생기면 이 파일만 바꾼다.
G.snd = (() => {
  let ac = null, master = null, bgmGain = null, on = true, mode = null, step = 0, nextT = 0, timer = null;
  try { on = localStorage.getItem('nuflex_snd') !== '0'; } catch {}

  function init() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}   // 아이폰 무음 스위치여도 나게
    if (ac) {
      if (ac.state !== 'running') ac.resume().then(kick).catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = on ? 0.8 : 0; master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.gain.value = 0.5; bgmGain.connect(master);
    timer = setInterval(pump, 100);
    ac.resume().then(kick).catch(() => {});
  }
  // 소리 없는 한 조각을 틀어 아이폰의 잠금을 푼다
  let kicked = false;
  function kick() {
    if (kicked || !ac || ac.state !== 'running') return;
    kicked = true;
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
    s.buffer = b; s.connect(ac.destination); s.start(0);
  }
  // 말소리: 인물마다 높낮이가 다른 옹알이
  function talk(pitch) {
    if (!ac || !on) return;
    if (pitch === 'bark') { tone(420, 0, 0.09, 'square', 0.16, 250); tone(460, 0.16, 0.11, 'square', 0.16, 240); return; }
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) tone(pitch * (0.85 + Math.random() * 0.4), i * 0.075, 0.06, 'triangle', 0.14);
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
  // 잡음: 터지는 소리·부서지는 소리
  function noise(at, dur, vol, f1, f2) {
    if (!ac) return;
    const t = ac.currentTime + at, n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f1, t); lp.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(g); g.connect(master); src.start(t);
  }

  const S = {
    tap:   () => tone(700, 0, 0.05, 'square', 0.06),
    coin:  () => { tone(988, 0, 0.07, 'square', 0.1); tone(1319, 0.07, 0.16, 'square', 0.1); },
    buy:   () => { tone(440, 0, 0.06, 'triangle', 0.16); tone(660, 0.06, 0.06, 'triangle', 0.16); tone(880, 0.12, 0.14, 'triangle', 0.16); },
    good:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.16, 'triangle', 0.16)),
    bad:   () => { tone(220, 0, 0.16, 'sawtooth', 0.12, 150); tone(150, 0.16, 0.3, 'sawtooth', 0.12, 90); },
    night: () => [659, 523, 392, 262].forEach((f, i) => tone(f, i * 0.12, 0.3, 'sine', 0.18)),
    morn:  () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.15)),
    fall:  () => tone(1900, 0, 0.62, 'sine', 0.22, 260),
    boom:  () => {
      noise(0, 0.12, 1.0, 9000, 2000);                       // 쾅
      noise(0, 1.8, 0.9, 1600, 50);                          // 우르르
      tone(110, 0, 1.4, 'sine', 0.9, 28);                    // 바닥 울림
      tone(60, 0.05, 0.9, 'triangle', 0.5, 30);
      for (let i = 0; i < 26; i++) noise(0.15 + Math.random() * 1.5, 0.05 + Math.random() * 0.06, 0.12 + Math.random() * 0.22, 3000 + Math.random() * 5000, 400);  // 와장창 조각
    },
    win:   () => [523, 523, 523, 698, 880, 784, 1047].forEach((f, i) => tone(f, i * 0.11, i === 6 ? 0.5 : 0.12, 'square', 0.12)),
    raid:  () => { for (let i = 0; i < 4; i++) { tone(880, i * 0.3, 0.15, 'square', 0.12); tone(660, i * 0.3 + 0.15, 0.15, 'square', 0.12); } },
  };

  // 배경음: 짧은 가락을 되풀이. 0 은 쉼
  const BGM = {
    day:   { bpm: 132, type: 'triangle', vol: 0.07, mel: [523, 0, 659, 784, 0, 659, 523, 0, 587, 0, 698, 880, 0, 698, 587, 0, 523, 0, 659, 784, 1047, 0, 784, 659, 587, 523, 587, 659, 523, 0, 0, 0], bass: [131, 0, 0, 0, 196, 0, 0, 0, 147, 0, 0, 0, 196, 0, 0, 0] },
    night: { bpm: 96, type: 'sawtooth', vol: 0.045, mel: [0, 0, 330, 0, 0, 311, 0, 0, 294, 0, 0, 0, 262, 0, 247, 0, 0, 0, 330, 0, 392, 0, 0, 370, 0, 0, 330, 0, 0, 0, 0, 0], bass: [82, 0, 82, 0, 0, 82, 0, 98, 73, 0, 73, 0, 0, 73, 0, 62] },
  };
  function pump() {
    if (!ac || !mode || ac.state !== 'running') return;
    const b = BGM[mode], len = 30 / b.bpm;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.3) {
      const m = b.mel[step % b.mel.length], bs = b.bass[step % b.bass.length], at = nextT - ac.currentTime;
      if (m) tone(m, at, len * 0.9, b.type, b.vol, null, bgmGain);
      if (bs) tone(bs, at, len * 1.8, 'triangle', b.vol * 1.6, null, bgmGain);
      step++; nextT += len;
    }
  }

  return {
    init,
    play: name => { if (ac && on && S[name]) S[name](); },
    talk,
    state: () => ac ? ac.state : 'none',
    bgm: m => { if (m !== mode) { mode = m; step = 0; } },
    quiet: q => { if (bgmGain) bgmGain.gain.setTargetAtTime(q ? 0.08 : 0.5, ac.currentTime, 0.1); },
    toggle: () => { on = !on; try { localStorage.setItem('nuflex_snd', on ? '1' : '0'); } catch {} if (master) master.gain.value = on ? 0.8 : 0; return on; },
    isOn: () => on,
  };
})();

// 첫 손가락 터치에서 소리를 깨우고, 버튼마다 톡 소리
['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => G.snd.init(), true));
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('button')) G.snd.play('tap');
}, true);
