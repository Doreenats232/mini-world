# MiniWorld: project brief (read this first, then stop reading and start working)

Owner: Daglas. Casual, wants SHORT replies, one upgrade at a time, and to spend his daily usage limit profitably.
Game: 3D open-world sandbox (Three.js). One codebase -> website (GitHub Pages) + Android APK (Capacitor, loads the website) + Windows EXE (Electron, auto-updates).
Repo: Doreenats232/mini-world. Live: https://doreenats232.github.io/mini-world/ . Every push to `main` redeploys the site (~1 min), and open tabs reload themselves.

## How to work cheaply (rules for Claude)
1. Do NOT open whole files. `grep -n "name" src/parts/*.js` to find code, then `sed -n 'A,Bp'` to read only that range.
2. Edit with one small python patch script per upgrade (`s.replace(anchor, new)` with `assert anchor in s`). Never rewrite a part file wholesale.
3. Verify and ship in ONE command: `GH_TOKEN=... npm run deploy -- "message"` (tests -> build -> commit -> push -> waits until live). Do not hand-poll GitHub, and ignore the APK/EXE jobs (they are free and the APK just opens the site).
4. Batch several small upgrades into one turn when the user asks for them together.
5. Ask the user to test in the browser and report what breaks. Rendering, P2P multiplayer and the AI relay cannot be tested from the sandbox.
6. Token: the user pasted a classic-style PAT into chat before. Remind them to revoke it, and ask for a fine-grained token limited to this one repo (Contents + Workflows + Pages: read/write). Never write a token into a file or commit. Clone with `git -c http.extraheader="Authorization: Basic $(printf 'x-access-token:%s' $GH_TOKEN | base64 -w0)" clone https://github.com/Doreenats232/mini-world.git`.
7. Keep answers short: what changed (bullets), how to try it, what is untested.

## Code layout
`src/main.js` is a stub. The game is `src/parts/*.js`, joined in filename order into ONE scope by `vite.config.js` (so any part can use any top-level name). Edit parts only.
| part | contents |
|---|---|
| 00-header | imports, `net` state object, helpers (`$`, `V3`) |
| 01-textures | procedural canvas textures, facades, interior/floor materials, block textures, `BLOCKS`/`BIDX` |
| 02-scene | scene, camera, renderer, lights |
| 03-world-city | ground, roads, ENTERABLE city (`buildShell` = hollow merged mesh per building, `buildings[]`, `cityFoot[]`), `onRoad` |
| 04-physics | `mkEnt`, `hit`, `move`, `phys` (AABB vs `solids` map) |
| 05-sound | WebAudio synth: `sfx(name)`, `sfxAt(pos,name)`, engine, mute |
| 06-blocks-player | `addBlock/delBlock`, save/load (localStorage `mw_save`), player `P`, HUD, `hurt` |
| 07-cars-enemies | cars (`mkCar`, `driveCar`, `toggleCar`), thugs (`mkEnemy`, `enemyStep`, `damageEnemy`) |
| 08-resources | trees/rocks/sand nodes, `nearestNode` |
| 09-npcs | `mkHuman` (human model), `NPCDEF`, `mkNpc`, `npcs[]`, `ev()`, `say()`, `logLine()` |
| 10-plans-towns | architecture DSL `expandPlan`, `rotCells`, `findSite`, `setTask` (all NPC task types), town founding `genPlan/startTown` |
| 11-npc-behaviour | `walkTo`, `doGather`, `npcStep` (gather/build/assist/protect/follow...), `npcVisuals` |
| 12-ai-director | RelayAPI client: `SYS` prompt, `stateJSON`, `callAI`, `applyAI`, offline `autopilot`, `fallbackChat`, `playerSay` |
| 13-actions-ui-input | place/break/shoot/punch, chat+settings UI, desktop and touch input |
| 14-updates-sky | version polling (auto-reload), day/night `updateSky` |
| 15-furniture-interiors | `FURN`, `mkFurn`, `addFurniture`, doors, E-to-use fixtures (`useIt`), city interiors `spawnInterior/updateCity` |
| 16-police-shop | wanted level + cops, shop `ITEMS` |
| 17-multiplayer | PeerJS host/join, avatars, world sync, NPC puppets |
| 18-citizens | ambient townspeople: pool of ~26 (14 on phone) with 10 jobs (walker, shopper, jogger, worker, vendor, chatter, sitter, kid, dogwalker, busker), road navigation `nextI`, flee from gunfire/thugs/fast cars, E to talk, day/night weights |
| 19-minimap-loop | minimap, main `setAnimationLoop` (order of per-frame updates) |

## Gotchas (learned the hard way)
- Top-level `const/let` used during module start-up must be defined ABOVE the first call (TDZ). `net` lives in 00-header for this reason. Function declarations are hoisted, so they can sit anywhere.
- World units: 1 block cell = 2m. Roads are 14m wide on lines x or z = 25 + 50k. Compass: N = -z.
- `solids` (Map) = dynamic collision (blocks, doors, ACTIVE building walls). City walls only enter `solids` when someone is within ~85m (`updateCity`); `cityFoot[]` has every building's full box for site checks/minimap.
- Furniture/blocks are keyed `"cx,cy,cz"` in `furn` / `blockMeshes`. Saved in `mw_save`.
- Multiplayer is host-authoritative for NPCs/AI; clients are puppets and never save over their own world (`net.noSave`).

## Common changes (where to edit)
- New block type: `BLOCKS` + `BTEX` (01), cost is `BLOCKS[i][1]`. New furniture: `FURN` + `mkFurn` case (15), add to `USEF/USEN` if usable, add the name to the `SYS` prompt (12).
- New NPC task: `setTask` (10) + branch in `npcStep` (11) + document in `SYS` (12).
- New shop item: `ITEMS` (16). New sound: `sfx` switch (05). New key: desktop input (13).
- Town building kinds: `genPlan` (10). Keep `npm test` green: it checks every generated building for overlaps/bounds.

## RelayAPI facts (user's own AI gateway)
`POST https://relayapi-c5ah.onrender.com/v1/chat/completions`, Bearer key. One key = one persistent chat, `model` ignored, 20 req/min, CORS open, slow (headless browser) and Render free tier sleeps ~1 min. Key is pasted by the user in game (gear icon, "Test connection" button) and stored only in his browser (`mw_relay`). Never hardcode it in this public repo.

## Untested / known risks (user must report)
Rendering of the enterable city and interiors at night, mobile performance of many city meshes, P2P multiplayer across strict networks, NPC pathing inside buildings (stuck-teleport after 4s), AI JSON replies from the relay, long town builds (several minutes).

## Backlog (user's priorities)
Polish + balance pass from his testing, NPC memory (remember player and builds), mobile performance, more weapons, quests via AI, upper floors and stairs in city buildings, dedicated multiplayer server on Render. Multiplayer was paused by the user.
