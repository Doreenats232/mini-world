// ---------- Family: build affection with contacts, propose, marry, set a family home, have kids who grow up, you age ----------
const FAM = { age: 18, days: 0, aff: {}, spouse: null, home: null, kids: [], gift: {}, preg: null, pp: [], lastDT: dayT, mem: [], hudT: 0 };
try { const s = JSON.parse(localStorage.getItem('mw_fam') || 'null'); if (s) Object.assign(FAM, s); } catch (e) {}
FAM.mem = []; FAM.lastDT = dayT;
const famSave = () => { try { localStorage.setItem('mw_fam', JSON.stringify({ age: FAM.age, days: FAM.days, aff: FAM.aff, spouse: FAM.spouse, home: FAM.home, kids: FAM.kids, gift: FAM.gift, preg: FAM.preg, pp: FAM.pp })); } catch (e) {} };
const famCash = n => { money += n; hud(); };
const famEl = document.createElement('div'); famEl.style.cssText = 'position:fixed;left:6px;bottom:6px;padding:3px 9px;border-radius:10px;background:#000a;color:#fff;font:12px sans-serif;z-index:20;pointer-events:none'; document.body.appendChild(famEl);
const famFade = document.createElement('div'); famFade.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;display:none;align-items:center;justify-content:center;font:bold 28px sans-serif;z-index:60;pointer-events:none;text-align:center;opacity:0;transition:opacity .8s'; document.body.appendChild(famFade);
function famBanner(t, ms) { famFade.textContent = t; famFade.style.display = 'flex'; setTimeout(() => { famFade.style.opacity = 1; }, 20); setTimeout(() => { famFade.style.opacity = 0; }, ms || 2600); setTimeout(() => { famFade.style.display = 'none'; }, (ms || 2600) + 900); }
// restore the spouse: residents get random names each load, so the saved name wins
if (FAM.spouse) { const r = residents.find(x => x.id === FAM.spouse.id); if (r) { r.name = FAM.spouse.name; r.fam = 1; if (!contactOf(r)) contacts.push({ r, log: [] }); } }
const famR = () => FAM.spouse && residents.find(x => x.id === FAM.spouse.id);
const hearts = a => '❤'.repeat(Math.round(a / 20)) + '🖤'.repeat(5 - Math.round(a / 20));
function famAct(r, k) {
  const say = (t, ms = 900) => setTimeout(() => phoneNotify(r, t), ms), a = FAM.aff[r.id] || 0, c = contactOf(r), log = t => { if (c) c.log.push(t); };
  if (FAM.spouse && FAM.spouse.id !== r.id) { log('You: ...'); return say('I know you are married. Please do not text me like that.'); }
  const add = n => { FAM.aff[r.id] = Math.min(100, a + n); famSave(); };
  if (k === 'chat') { const now = performance.now(); if (r.chatT && now - r.chatT < 15000) { log('You: Let us talk'); return say('Let me catch my breath :)'); } r.chatT = now; log('You: Let us chat'); add(a < 60 ? 3 : 2); return say(pick(['I love talking to you!', 'You always make me smile.', 'Tell me more about your day!', 'Haha, you are funny.'])); }
  if (k === 'gift') { if (money < 50) return msg('🎁 A gift costs $50', 1500); if (FAM.gift[r.id] === FAM.days) { log('You: A gift!'); return say('You already spoiled me today!'); } money -= 50; hud(); FAM.gift[r.id] = FAM.days; log('You: 🎁 Sent a gift'); add(8); return say(pick(['Aww, thank you!! 😍', 'This is so thoughtful!', 'You did not have to... but I love it!'])); }
  if (k === 'date') { if (money < 100) return msg('🌹 A date costs $100', 1500); if (r.vis) return say('I am already coming!'); phoneMsg(r, 'come'); if (r.vis) { money -= 100; hud(); r.dateOn = 1; r.dT = 0; log('You: 🌹 Want to go on a date?'); } return; }
  if (k === 'propose') { log('You: 💍 Will you marry me?'); if (a < 75) return say('I really like you, but I am not ready yet. Let us get closer first.'); if (money < 500) return msg('💍 The ring costs $500', 1800); money -= 500; marry(r); return; }
  if (k === 'together') { if (FAM.spouse) return; const pg = FAM.pp.find(x => x.id === r.id); if (pg) return say('I am already expecting your baby! Month ' + Math.min(9, Math.floor(pg.t / 1.5 * 9) + 1) + ' of 9. 🤰');
    if (r.role === 'student') return say('Let us just stay friends.'); if (a < 80) return say('I like you, but I am not ready for that yet. Let us grow closer first.'); if (FAM.kids.length + FAM.pp.length >= 4) return say('You already have a big family to look after!');
    if (!(r.vis && r.vis.st === 'wait' && Math.hypot(P.pos.x - r.vis.pos.x, P.pos.z - r.vis.pos.z) < 10)) return msg('📱 She has to be with you: send "Come to my place" and wait for her', 3000);
    closePhone(); famBanner('💕 A private evening together…', 3000); if (Math.random() < 0.45) FAM.pp.push({ id: r.id, name: r.name, t: 0, told: 0 }); dayT = (dayT + 0.12) % 1; famSave(); return; }
  if (k === 'night') { if (FAM.preg) return say('I am already expecting! Month ' + famMonth() + ' of 9. 🤰'); if (FAM.kids.length >= 4) return say('Four kids is plenty for us! 😅'); if (FAM.age >= 55) return say('Maybe we are done with babies, darling.'); const b = famHome(); if (!b || Math.hypot(b.x - P.pos.x, b.z - P.pos.z) > 45) return msg('🏠 Go to your family home first', 2500); const h = dayT * 24; if (h < 19 && h >= 5) return msg('🌙 Wait until evening (after 19:00)', 2500);
    closePhone(); const skip = 0.3 - dayT + (dayT > 0.3 ? 1 : 0); famBanner('🌙 A night together…\n💕', 3200); if (FAM.preg === null && Math.random() < 0.5) FAM.preg = { t: skip, told: 0 }; dayT = 0.3; famSave(); setTimeout(() => msg('☀️ Good morning, love', 2500), 1800); return; }
  if (k === 'home') { const b = nearestBld(P.pos); if (!b) return; FAM.home = { x: b.x, z: b.z }; famSave(); say('Our new home! I will be waiting there. 🏠'); msg('🏠 Family home set to the nearest house', 3000); }
}
function marry(r) {
  FAM.spouse = { id: r.id, name: r.name, role: r.role, label: r.label }; FAM.aff[r.id] = 100; r.fam = 1; unmatRes(r); r.vis = null; r.dateOn = 0; money += 300; hud();
  if (!FAM.home) { const b = nearestBld(P.pos); if (b) FAM.home = { x: b.x, z: b.z }; } famSave();
  famBanner('💒 ' + r.name + ' said YES!\nYou are married. +$300 in wedding gifts', 3600); msg('💍 Married to ' + r.name + '! Stand near a house and press 🏠 in the phone to change your family home', 6000);
}
function famPhone(r, e) {
  const a = FAM.aff[r.id] || 0, add = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.background = '#c2185b'; b.onclick = () => { famAct(r, f); renderPhone(); }; e.appendChild(b); };
  const d = document.createElement('div'); d.style.cssText = 'margin-top:6px;font-size:13px'; d.textContent = FAM.spouse && FAM.spouse.id === r.id ? '💍 Your spouse ' + hearts(100) : 'Affection ' + hearts(a) + ' ' + a + '%'; e.appendChild(d);
  if (FAM.spouse && FAM.spouse.id === r.id) { add('🏠 Our home = nearest house', 'home'); add('💬 Sweet talk', 'chat'); add('🎁 Gift $50', 'gift'); add(FAM.preg ? '🤰 Pregnant: month ' + famMonth() + '/9' : '🌙 Spend the night together', 'night'); }
  else if (!FAM.spouse) { const pg = FAM.pp.find(x => x.id === r.id); add('☕ Chat', 'chat'); add('🎁 Gift $50', 'gift'); add('🌹 Date $100', 'date'); add('💍 Propose $500', 'propose'); if (a >= 80 || pg) add(pg ? '🤰 Expecting: month ' + Math.min(9, Math.floor(pg.t / 1.5 * 9) + 1) + '/9' : '💕 Spend time together', 'together'); }
}
function famSection(e) {
  if (!FAM.spouse && !FAM.kids.length) return; const d = document.createElement('div'); d.style.cssText = 'margin-top:10px;padding-top:6px;border-top:1px solid #fff4;font-size:13px';
  d.innerHTML = '<b>👨‍👩‍👧 Family</b><br>You: age ' + FAM.age + (FAM.spouse ? ' · 💍 ' + FAM.spouse.name : '') + (FAM.home ? ' · 🏠 home set' : ' · 🏠 no home yet') + '<br>' + (FAM.kids.length ? FAM.kids.map(k => (k.g === 'b' ? '👦 ' : '👧 ') + k.n + ' (' + k.age + ')' + (k.mom ? ' · mum ' + k.mom : '')).join(', ') : 'No kids yet'); e.appendChild(d);
}
function newDay() {
  FAM.days++; let t = '';
  if (FAM.spouse) { const inc = Math.floor(Math.max(20, 80 - 15 * FAM.kids.length) * (FAM.preg && FAM.preg.t > 0.9 ? 0.5 : 1)); money += inc; hud(); t = '💼 Household income +$' + inc; }
  if (FAM.days % 2 === 0) { // a year passes every 2 game days
    FAM.age++; for (const k of FAM.kids) k.age++; t += (t ? ' · ' : '') + '🎂 You turned ' + FAM.age + '!';
    if (FAM.spouse) { money += 50; hud(); t += ' Spouse gift +$50'; }
    for (let i = FAM.kids.length - 1; i >= 0; i--) if (FAM.kids[i].age >= 18) { const k = FAM.kids.splice(i, 1)[0]; money += 200; hud(); t += ' · 🎓 ' + k.n + ' grew up and moved out (+$200 thanks)'; }
  }
  AGE.pen = FAM.age > 60 ? Math.min(40, (FAM.age - 60) * 2) : 0; famSave(); if (t) msg(t, 6500);
}
function famMember(key, mk) { // spawn / remove a family citizen standing outside the home
  const c0 = FAM.mem[key]; if (c0 && !c0.dead) return c0; return null;
}
function famHome() { if (!FAM.home) return null; return buildings.find(b => Math.abs(b.x - FAM.home.x) < 1 && Math.abs(b.z - FAM.home.z) < 1) || null; }
const famMonth = () => FAM.preg ? Math.min(9, Math.floor(FAM.preg.t / 1.5 * 9) + 1) : 0;
function giveBirth() { const g = Math.random() < 0.5 ? 'b' : 'g', n = pick(NAMES); FAM.kids.push({ n, age: 0, g, pm: -1 }); FAM.preg = null; famSave(); famBanner('👶 ' + (FAM.spouse ? FAM.spouse.name : 'She') + ' gave birth to ' + (g === 'b' ? 'a baby boy' : 'a baby girl') + '!\nWelcome, ' + n, 3800); msg('👶 ' + n + ' is born! Mother and baby are healthy', 6000); }
function famBelly(c, tt) { const p = (tt !== undefined ? tt : FAM.preg && FAM.preg.t) > 0.17 ? Math.min(1, (tt !== undefined ? tt : FAM.preg.t) / 1.5) : 0; if (!p) { if (c.belly) { c.g.remove(c.belly); c.belly = null; } return; } if (!c.belly) { c.belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshLambertMaterial({ color: 0xd9d9d9 })); c.belly.position.set(0, 1.02, 0.2); c.g.add(c.belly); } c.belly.scale.setScalar(0.45 + 1.15 * p); c.belly.position.z = 0.17 + 0.1 * p; }
function giveBirthPP(pg) { const g = Math.random() < 0.5 ? 'b' : 'g', n = pick(NAMES); FAM.kids.push({ n, age: 0, g, pm: -1, mom: pg.name }); FAM.pp.splice(FAM.pp.indexOf(pg), 1); famSave(); famBanner('👶 ' + pg.name + ' gave birth to your ' + (g === 'b' ? 'baby boy' : 'baby girl') + '!\n' + n, 3800); msg('👶 ' + pg.name + ' had your baby: ' + n + '! The child joins your family', 6500); }
function famTick(dt) {
  for (const pg of FAM.pp.slice()) { pg.t += dt / 300; const r = residents.find(x => x.id === pg.id); if (!pg.told && pg.t > 0.17) { pg.told = 1; famSave(); if (r && contactOf(r)) phoneNotify(r, 'I need to tell you something... I am pregnant with your baby. 🤰'); msg('🤰 ' + pg.name + ' is pregnant with your baby!', 6000); } if (pg.t >= 1.5) giveBirthPP(pg); else if (r && r.c && !r.c.dead && pg.t > 0.17) famBelly(r.c, pg.t); }
  if (FAM.preg && FAM.spouse) { FAM.preg.t += dt / 300; if (!FAM.preg.told && FAM.preg.t > 0.17) { FAM.preg.told = 1; famSave(); const r = famR(); if (r) phoneNotify(r, 'I have wonderful news... I am pregnant! 🤰💕'); msg('🤰 ' + FAM.spouse.name + ' is pregnant! Nine months to go', 6000); } if (FAM.preg.t >= 1.5) giveBirth(); }
  if (dayT < FAM.lastDT - 0.3) newDay(); FAM.lastDT = dayT;
  // date progress
  for (const c of contacts) { const r = c.r; if (r.dateOn && r.vis && r.vis.st === 'wait') { if (Math.hypot(P.pos.x - r.vis.pos.x, P.pos.z - r.vis.pos.z) < 9) { r.dT += dt; if (r.dT >= 15) { r.dateOn = 0; FAM.aff[r.id] = Math.min(100, (FAM.aff[r.id] || 0) + 15); famSave(); phoneNotify(r, 'That was a lovely date! 💕'); msg('🌹 Great date! Affection up', 2500); } } } else if (r.dateOn && !r.vis) r.dateOn = 0; }
  // family members outside the home
  const b = FAM.spouse && FAM.home ? famHome() : null, hour = dayT * 24;
  if (b && Math.hypot(b.x - P.pos.x, b.z - P.pos.z) < 90) {
    const door = doorPt(b), nx = Math.sin(b.ry), nz = Math.cos(b.ry), px = Math.cos(b.ry), pz = -Math.sin(b.ry), list = [{ key: 's', here: !(hour >= 9 && hour < 17) || !!(FAM.preg && FAM.preg.t > 1.3), sc: 1, label: 'Spouse', name: FAM.spouse.name }];
    FAM.kids.forEach((k, i) => list.push({ key: 'k' + i + k.n, here: k.age < 6 || !(hour >= 8 && hour < 15), sc: 0.4 + 0.6 * Math.min(k.age, 17) / 17, label: 'Child', name: k.n, kid: k }));
    const live = new Set(); list.forEach((m, i) => { live.add(m.key); let c = FAM.mem[m.key]; if (c && c.dead) c = FAM.mem[m.key] = null;
      if (!m.here) { if (c) { removeCitizen(c); FAM.mem[m.key] = null; } return; }
      if (c) { const dx = P.pos.x - c.pos.x, dz = P.pos.z - c.pos.z; if (Math.hypot(dx, dz) < 14) c.yaw = Math.atan2(dx, dz); if (m.key === 's') famBelly(c); return; }
      if (citizens.length > (isTouch ? 28 : 46)) return; const x = door.x + px * (i - 1) * 1.5 + nx * 1.2, z = door.z + pz * (i - 1) * 1.5 + nz * 1.2;
      try { c = mkCitizen('suit', x, z, b.ry, { role: m.kid ? 'student' : 'worker', label: m.label, name: m.name, isStatic: true, home: new V3(x, 0, z), tgt: new V3(x, 0, z) }); c.stand = true; c.fam = { key: m.key, kid: m.kid || null }; c.g.scale.setScalar(m.sc); FAM.mem[m.key] = c; if (m.key === 's') famBelly(c); } catch (e) {} });
    for (const k in FAM.mem) if (!live.has(k) && FAM.mem[k]) { removeCitizen(FAM.mem[k]); FAM.mem[k] = null; }
  } else for (const k in FAM.mem) if (FAM.mem[k]) { removeCitizen(FAM.mem[k]); FAM.mem[k] = null; }
  FAM.hudT -= dt; if (FAM.hudT <= 0) { FAM.hudT = 1; const t = '🎂 ' + FAM.age + (FAM.spouse ? '  💍 ' + FAM.spouse.name : '') + (FAM.preg ? '  🤰 month ' + famMonth() + '/9' : '') + (FAM.kids.length ? '  👶×' + FAM.kids.length : ''); if (famEl._t !== t) { famEl._t = t; famEl.textContent = t; } }
}
function famTalk(c) {
  const f = c.fam; if (!f) return false;
  if (f.kid) { const k = f.kid; if (k.pm !== FAM.days && money >= 20) { k.pm = FAM.days; money -= 20; hud(); citizenSay(c, 'Thanks for the pocket money!'); msg('💵 ' + k.n + ' got $20 pocket money', 2000); } else citizenSay(c, pick([k.age < 5 ? 'Goo goo!' : 'Hi!', 'Play with me!', 'I love you!', 'Look what I drew!'])); return true; }
  if (FAM.spouse && FAM.days !== (FAM.hug || -1)) { FAM.hug = FAM.days; P.hp = Math.min(maxHp(), P.hp + 30); citizenSay(c, pick(['Welcome back, love. 💕', 'Come here, a hug will help.', 'Dinner is ready!'])); msg('🤗 Hug: +30 HP', 2000); } else citizenSay(c, FAM.preg ? pick(['The baby kicked today!', 'Month ' + famMonth() + ' already. I am so excited!', 'Can you get me something sweet?']) : pick(['I love you.', 'Be careful out there.', 'Our kids are doing great.']));
  return true;
}

function famDebugTime(v) { dayT = v; }
