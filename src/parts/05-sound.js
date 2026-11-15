// ---------- sound (synthesized, no files) ----------
let AC = null, master = null, nb = null, eng = null, stepT = 0, muted = false;
try { muted = localStorage.getItem('mw_mute') === '1'; } catch (e) {}
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
['keydown', 'mousedown', 'touchstart'].forEach(k => addEventListener(k, () => audio(), { passive: true }));
function tone(f1, f2, dur, type = 'square', vol = 0.3) {
  const a = AC; if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, type = 'lowpass') {
  const a = AC; if (!a || muted) return;
  if (!nb) { nb = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = a.createBufferSource(); s.buffer = nb;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(), t = a.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5, dur + 0.02);
}
function sfx(n, v = 1) {
  if (!audio() || muted) return;
  switch (n) {
    case 'shoot': noise(0.14, 0.5 * v, 900, 'highpass'); tone(500, 70, 0.14, 'sawtooth', 0.3 * v); break;
    case 'punch': noise(0.08, 0.5 * v, 500); tone(140, 60, 0.1, 'square', 0.25 * v); break;
    case 'hit': tone(900, 400, 0.05, 'square', 0.12 * v); break;
    case 'place': tone(330, 220, 0.07, 'square', 0.18 * v); break;
    case 'brk': noise(0.15, 0.4 * v, 1400); break;
    case 'hurt': tone(220, 80, 0.22, 'sawtooth', 0.35 * v); break;
    case 'die': tone(400, 60, 0.7, 'sawtooth', 0.35 * v); break;
    case 'edie': tone(260, 50, 0.3, 'sawtooth', 0.25 * v); break;
    case 'npcplace': tone(520, 380, 0.05, 'triangle', 0.18 * v); break;
    case 'chop': noise(0.07, 0.35 * v, 700); tone(180, 120, 0.05, 'square', 0.12 * v); break;
    case 'mine': tone(1200, 700, 0.04, 'square', 0.12 * v); noise(0.05, 0.3 * v, 2500, 'highpass'); break;
    case 'crash': noise(0.25, 0.6 * v, 600); tone(100, 40, 0.25, 'sawtooth', 0.3 * v); break;
    case 'siren': tone(600, 900, 0.35, 'sine', 0.2 * v); setTimeout(() => tone(900, 600, 0.35, 'sine', 0.2 * v), 350); break;
    case 'water': noise(0.22, 0.1 * v, 3500, 'highpass'); break;
    case 'flush': noise(1.1, 0.3 * v, 900); tone(150, 60, 1, 'sine', 0.1 * v); break;
    case 'click': tone(1300, 900, 0.04, 'square', 0.1 * v); break;
    case 'sizzle': noise(0.7, 0.15 * v, 5000, 'highpass'); break;
    case 'note': { const f = [261, 293, 329, 392, 440, 523][Math.floor(Math.random() * 6)]; tone(f, f * 0.99, 0.4, 'triangle', 0.14 * v); break; }
    case 'horn': tone(430, 430, 0.22, 'square', 0.12 * v); tone(540, 540, 0.22, 'square', 0.09 * v); break;
    case 'step': noise(0.04, 0.1 * v, 450); break;
  }
}
function sfxAt(pos, n) { const v = 1 - dist2(pos, P.pos) / 45; if (v > 0.05) sfx(n, v); }
function startEngine() { const a = audio(); if (!a || eng) return; const o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = 45; g.gain.value = 0.05; o.connect(g); g.connect(master); o.start(); eng = { o, g }; }
function engine(sp) { if (eng) { eng.o.frequency.value = 45 + sp * 5; eng.g.gain.value = muted ? 0 : 0.05 + Math.min(0.06, sp * 0.003); } }
function stopEngine() { if (eng) { try { eng.o.stop(); } catch (e) {} eng = null; } }
function toggleMute() { muted = !muted; try { localStorage.setItem('mw_mute', muted ? '1' : '0'); } catch (e) {} $('mute').textContent = muted ? '🔇' : '🔊'; if (muted && eng) eng.g.gain.value = 0; }
$('mute').textContent = muted ? '🔇' : '🔊';
$('mute').addEventListener('click', toggleMute);

