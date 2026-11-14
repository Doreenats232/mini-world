// ---------- AI director (RelayAPI) ----------
let REL = { url: 'https://relayapi-c5ah.onrender.com', key: '' };
try { const s = JSON.parse(localStorage.getItem('mw_relay') || 'null'); if (s) REL = { ...REL, ...s }; } catch (e) {}
const SYS = `You control 3 NPC characters (archie=architect, mason=builder, ranger=guard) in a 3D voxel sandbox city game. Reply with ONE JSON object only. No markdown, no text outside the JSON.
WORLD: 1 block = 2m. N=-z, S=+z, E=+x, W=-x. Resources: wood (trees), stone (rocks), sand (sand piles). Blocks and cost (1 material per block): planks=wood, roof=wood, stone=stone, brick=stone, concrete=stone, glass=sand. NPCs must gather materials before building; the game automatically walks them to resource nodes, gathers, and goes back to building. Hostile thugs roam the roads; guards fight them. A human PLAYER chats with you. Listen to player_message, act on reasonable requests, and REFUSE (explain briefly, give no task) if it is unsafe, impossible, pointless, or against your personality. You may ask questions, negotiate, joke, report what you see. Keep "say" under 140 characters, in character. If player_message is not null, the addressed NPC (to="everyone" means the nearest or most fitting NPC) MUST answer it conversationally in "say" (answer questions, chat naturally, explain what you are doing and why); other NPCs may chip in. "thought" = your short reasoning (1-2 sentences): what you see, what materials you need vs have, why this design.
REPLY FORMAT: {"npcs":[{"id":"archie","thought":"...","say":"...","task":{...}}]}  Include only NPCs that speak or change task. Omit task to keep the current one.
TASKS: {"type":"idle"} {"type":"wander"} {"type":"follow"} {"type":"guard"} {"type":"gather","resource":"wood|stone|sand","amount":20} {"type":"build","name":"Cottage","where":"near_player|near_me","dx":0,"dz":0,"plan":[ops]} (dx,dz optional offset in meters from the reference point). {"type":"assist","with":"archie"} joins another NPC's build and splits the blocks with them. {"type":"protect","who":"archie"} guards a teammate and fights thugs near them. Any NPC entry may include "then":[task,...] (max 4) to queue follow-up tasks. {"type":"town","name":"Oakvale","buildings":["house","house","cottage","shop","inn","tower"],"size":"small|medium|large"} founds a WHOLE TOWN: the game finds open land, builds a plaza with a well and lamps, designs each listed building (kinds: house, cottage, shop, inn, tower) in a ring facing the plaza, and shares them out among the builders automatically. Use it when the player asks for a town, village or settlement; afterwards do not change the builders' tasks, just comment on progress, keep the guard protecting, and react to the towns progress in the state.
TEAMWORK: act as a crew, not as individuals. The architect designs and starts a build; builders ASSIST (blocks and material gathering are shared, so it goes faster); the guard PROTECTS the builders. React to teammates' events. If the player asks for something big (a village, a base), split it into several buildings across NPCs and queue follow-ups.
PLAN OPS (integer cells; x,z horizontal; y up; y=0 is the ground layer; stay within 24x16x24): {"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true} (hollow = walls only); {"op":"fill","x","y","z","w","h","d","block"}; {"op":"roof","x","y","z","w","d","block","style":"gable|flat"} (gable ridge runs along x); {"op":"hole","x","y","z","w","h","d"} deletes cells (doors, windows); {"op":"block","x","y","z","block"}; {"op":"floor","x","y","z","w","d","block"}; {"op":"furniture","type":"bed|table|chair|lamp|shelf|rug|plant|door|sink|toilet|tub|fridge|stove","x","y","z","rot":0} places ONE furniture piece in one cell (cost: bed 3 wood, table 2 wood, chair 1 wood, shelf 2 wood, rug 1 wood, plant 1 wood, lamp 1 sand, door 2 wood, sink 2 stone, toilet 2 stone, tub 3 stone, fridge 3 stone, stove 3 stone; bathrooms = toilet + sink + tub, kitchens = stove + fridge + sink; the player can press E on lamps, taps, toilets, fridges, stoves and beds). A real door is {"op":"furniture","type":"door","x":2,"y":0,"z":0,"rot":0}: rot 0 for doors in walls running along x (front/back walls), rot 1 for side walls; it opens by itself when someone walks up. rot 0-3 turns other furniture. Later ops override earlier ones. The wall at z=0 is the FRONT; the game rotates the building so the front faces the player.
ARCHITECTURE RULES: design real buildings with walls, a door (a door furniture piece at ground level in the front wall), windows (glass fill at y=1), a roof covering all walls (roof y = wall height), and a furnished interior (bed, table with chairs, lamp, shelf, rug, plant) inside the walls, never on wall cells, keeping a clear path from the door. Sensible sizes (house about 6x3x6 cells). Nothing floating. Pick materials that match what you have and what resource nodes are near, and say why.
EXAMPLE house: [{"op":"box","x":0,"y":0,"z":0,"w":6,"h":3,"d":6,"block":"brick","hollow":true},{"op":"furniture","type":"door","x":2,"y":0,"z":0,"rot":0},{"op":"fill","x":1,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"fill","x":4,"y":1,"z":0,"w":1,"h":1,"d":1,"block":"glass"},{"op":"roof","x":0,"y":3,"z":0,"w":6,"d":6,"block":"roof","style":"gable"},{"op":"furniture","type":"bed","x":4,"y":0,"z":4,"rot":0},{"op":"furniture","type":"table","x":1,"y":0,"z":3,"rot":0},{"op":"furniture","type":"chair","x":1,"y":0,"z":2,"rot":1},{"op":"furniture","type":"lamp","x":1,"y":0,"z":4,"rot":0},{"op":"furniture","type":"shelf","x":3,"y":0,"z":4,"rot":0}]`;
let aiCtrl = null, aiAborted = false, aiIsChat = false, chatSeq = 0, chatWaiting = 0;
let aiBusy = false, aiFail = 0, lastAI = performance.now() - 20000, pendingMsg = null;
const setStat = (t, c) => { const e = $('aistat'); e.textContent = t; e.style.color = c || '#fff'; };
setStat(REL.key ? 'AI: ready' : 'AI: no key (⚙) · scripted mode', REL.key ? '#fff' : '#ffb347');
function stateJSON(m) {
  const nn = n => { const o = {}; for (const r of ['wood', 'stone', 'sand']) { const nd = nearestNode(n.pos, r); if (nd) o[r] = { m: Math.round(dist2(nd.pos, n.pos)), dir: dirName(n.pos, nd.pos), left: nd.left }; } return o; };
  return JSON.stringify({
    time: Math.round(clock), player: { at: [Math.round(P.pos.x), Math.round(P.pos.z)], hp: Math.round(P.hp), mode, inCar: !!inCar },
    npcs: npcs.map(n => ({ id: n.id, role: n.role, personality: n.pers, at: [Math.round(n.pos.x), Math.round(n.pos.z)], hp: Math.round(n.hp), inv: n.inv, doing: n.status, task: n.task ? n.task.type : 'idle', last: n.last, playerIs: { m: Math.round(dist2(n.pos, P.pos)), dir: dirName(n.pos, P.pos) }, nearestNodes: nn(n), thugsWithin25m: enemies.filter(e => !e.dead && dist2(e.pos, n.pos) < 25).length })),
    structures: structures.map(s => ({ name: s.name, by: s.by, status: s.status, progress: s.done + '/' + s.total, workers: npcs.filter(o => o.task && o.task.st === s).map(o => o.name) })),
    towns: towns.map(x => ({ name: x.name, built: x.done + '/' + x.total })), events: events.splice(0, 14), player_message: m || null,
  });
}
async function relay(user) {
  const ctrl = new AbortController(); aiCtrl = ctrl; const to = setTimeout(() => ctrl.abort(), 150000);
  try {
    const r = await fetch(REL.url.replace(/\/$/, '') + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + REL.key }, body: JSON.stringify({ model: 'relay', messages: [{ role: 'system', content: SYS }, { role: 'user', content: 'STATE: ' + user + '\nReply with JSON only.' }] }), signal: ctrl.signal });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
    return j.choices[0].message.content || '';
  } finally { clearTimeout(to); }
}
function parseAI(t) { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null; try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; } }
function applyAI(j) {
  chatWaiting = 0; for (const x of npcs) if (x.bub.textContent === '💭 …') x.bubT = 0;
  const arr = Array.isArray(j.npcs) ? j.npcs : j.npc ? [j.npc] : [];
  for (const o of arr) {
    const n = npcs.find(x => x.id === String(o.id || o.name || '').toLowerCase());
    if (!n) continue;
    if (o.thought) logLine('💭 ' + n.name + ': ' + String(o.thought).slice(0, 260), 'th');
    if (o.say) say(n, o.say);
    if (o.task) { n.queue = []; setTask(n, o.task); }
    if (Array.isArray(o.then)) n.queue = o.then.filter(x => x && x.type).slice(0, 4);
  }
}
async function callAI(m) {
  aiBusy = true; aiIsChat = !!m; lastAI = performance.now(); setStat('AI: thinking…', '#ffe066');
  try {
    const raw = await relay(stateJSON(m)), j = parseAI(raw);
    if (!j) {
      if (m && raw && raw.trim()) { const n = npcs.find(x => x.id === m.to) || nearestNpc(P.pos); chatWaiting = 0; say(n, raw.trim().slice(0, 200)); aiFail = 0; setStat('AI: online (plain-text reply)', '#7CFC7C'); aiBusy = false; return; }
      throw new Error('reply was not valid JSON');
    }
    aiFail = 0; applyAI(j); setStat('AI: online', '#7CFC7C');
  } catch (e) {
    if (e.name === 'AbortError' && aiAborted) { aiAborted = false; aiBusy = false; return; }
    aiFail++; const why = e.name === 'AbortError' ? 'timeout' : e.message;
    setStat('AI: error (' + why + ')', '#ff7b7b'); logLine('⚠ AI error: ' + why + (/fetch|network|timeout/i.test(why) ? ' (the relay may be asleep on Render, wait a minute, or check ⚙ → Test connection)' : ''), 'ev');
    if (m) fallbackChat(m);
  }
  aiBusy = false;
}
setInterval(() => {
  if (!REL.key || net.client) return;
  if (aiBusy) { if (pendingMsg && !aiIsChat && aiCtrl) { aiAborted = true; aiCtrl.abort(); } return; }
  const since = performance.now() - lastAI;
  if (pendingMsg && since > 1200) { const m = pendingMsg; pendingMsg = null; callAI(m); return; }
  if (aiFail >= 3 && since < 60000) return;
  if ((npcs.some(n => !n.task) && since > 25000) || since > 90000 || (events.length > 2 && since > 20000)) callAI(null);
}, 1000);
function autopilot() {
  if (net.client || (REL.key && aiFail < 3)) return;
  for (const n of npcs) {
    if (n.task || n.idleT < 5) continue;
    n.idleT = 0;
    if (n.queue.length) continue;
    const bs = structures.find(x => x.status === 'building');
    if (n.role === 'guard') { const w = bs && npcs.find(o => o.task && o.task.st === bs); setTask(n, w ? { type: 'protect', who: w.id } : { type: 'guard' }); continue; }
    if (bs && npcs.some(o => o !== n && o.task && o.task.st === bs)) { setTask(n, { type: 'assist' }); continue; }
    const mine = structures.filter(s => s.by === n.name).length;
    if (mine < 2 && Math.random() < 0.7) setTask(n, { type: 'build', name: n.name + "'s hut", where: 'near_player', plan: HUT }); else setTask(n, { type: 'gather', resource: ['wood', 'stone'][Math.floor(Math.random() * 2)], amount: 15 });
  }
}
setInterval(autopilot, 2000);
function fallbackChat(m) {
  const n = npcs.find(x => x.id === m.to) || nearestNpc(P.pos), t = m.text.toLowerCase();
  const targets = m.to === 'everyone' ? npcs : [n]; let reply = '';
  const go = (task, r) => { targets.forEach(x => setTask(x, task)); reply = r; };
  if (/follow|come/.test(t)) go({ type: 'follow' }, 'Right behind you.');
  else if (/stop|stay|wait|idle/.test(t)) go({ type: 'idle' }, 'Okay, standing by.');
  else if (/guard|protect|fight/.test(t)) go({ type: 'guard' }, 'On guard!');
  else if (/town|village/.test(t)) { startTown('Newtown', null, /large|big/.test(t) ? 'large' : /medium/.test(t) ? 'medium' : 'small'); reply = "Founding a town! We'll start with a plaza."; }
  else if (/build|house|hut/.test(t)) go({ type: 'build', name: 'Hut', where: 'near_player', plan: HUT }, "Building a hut. I'll gather the wood first.");
  else if (/wood|tree/.test(t)) go({ type: 'gather', resource: 'wood', amount: 20 }, 'Chopping wood.');
  else if (/stone|rock/.test(t)) go({ type: 'gather', resource: 'stone', amount: 20 }, 'Gathering stone.');
  else if (/sand|glass/.test(t)) go({ type: 'gather', resource: 'sand', amount: 20 }, 'Fetching sand.');
  else if (/\b(hi|hello|hey|yo|sup)\b/.test(t)) reply = ['Hey there!', 'Hello! Need anything built?', 'Hi! Ready when you are.'][Math.floor(Math.random() * 3)];
  else if (/what.*(doing|up to)|status|how.*going/.test(t)) reply = "I'm " + n.status + '.';
  else if (/who are you|your name/.test(t)) reply = `I'm ${n.name}, the ${n.role}.`;
  else if (/thank/.test(t)) reply = 'Anytime!';
  else if (/help|what can you/.test(t)) reply = 'Try: follow me, guard me, build a house, build a town, get wood/stone/sand, stop.';
  else reply = REL.key ? 'My head is fuzzy, try again in a moment.' : 'Add your relay key in settings (⚙) so I can think properly. Until then I can follow, guard, gather or build a hut.';
  say(n, reply);
}
function playerSay(text, who = 'You') {
  text = text.trim(); if (!text) return;
  if (text[0] === '!') { const t = text.slice(1).trim(); if (!net.on) logLine('Host or join a room (🌐) to chat with players', 'ev'); else if (t) { logLine(net.name + ': ' + t, 'me'); netSend({ t: 'chat', name: net.name, text: t }); } return; }
  if (net.client) { logLine('You: ' + text, 'me'); netSend({ t: 'npcchat', text }); return; }
  const mt = text.match(/^@?(archie|mason|ranger)\b[\s,:]*/i), to = mt ? mt[1].toLowerCase() : 'everyone';
  logLine(who + ': ' + text, 'me');
  const m = { to, text: mt ? text.slice(mt[0].length) || text : text };
  if (!REL.key || aiFail >= 3) fallbackChat(m); else { pendingMsg = m; const tn = npcs.find(x => x.id === m.to) || nearestNpc(P.pos); tn.bub.textContent = '💭 …'; tn.bubT = 40; const id = ++chatSeq; chatWaiting = id; setTimeout(() => { if (chatWaiting === id) { chatWaiting = 0; if (pendingMsg === m) pendingMsg = null; logLine('⏳ The AI is slow right now, answering with my simple brain.', 'ev'); fallbackChat(m); } }, 40000); }
}

