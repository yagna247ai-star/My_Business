# Sprout Kingdom — one-shot build prompt

Paste everything below into Claude Code (or any capable coding agent) in an empty folder.

---

Build me a complete, polished, frame-accurate Super Mario Bros.-style platformer that runs in the browser. Work autonomously through the whole thing and verify as you go — don't stop halfway to ask permission for each step.

## 1. Legal constraint (read first — this shapes everything)

There are **no legally free official Mario assets**. Nintendo's sprites, tiles, characters and music are copyrighted; ripped SMB sprite sheets (Spriters Resource etc.) are infringement — this is exactly what got Full Screen Mario DMCA'd twice, site and GitHub repo. So:

- **DO NOT** download or use any ripped Nintendo assets.
- **DO** clone the *physics and mechanics* exactly — game mechanics are not copyrightable, and the real SMB constants are published in disassembly documentation (given below).
- **DO** author 100% original art, music, characters and level layouts, styled to *look* authentically 8-bit NES (visual style is not protected IP).
- Give the game its own name, mascot and theme. Do not make a Mario look-alike character.

Theme to use: **Sprout Kingdom**, hero is **Sprout, a seedling knight** (green, acorn-cap helmet). Sun Seed = grow, Ember Bloom = fire, Comet = star, Green Sprout = 1-up. Enemies: acorn-walker (goomba), shellhopper (koopa), snapvine (piranha), spikeling (spiny), emberling (lava leaper), thornbar (firebar). Boss: **King Bramble**. Worlds: Grasslands, Undergrove, Cloudreach, Thorn Keep.

## 2. Tech stack (no negotiation)

Vanilla JavaScript + Canvas 2D + ES modules. **Zero dependencies, zero build step.** Run with `python3 -m http.server 8080` (ES modules need HTTP; `file://` fails on CORS). Tests with `node --test`. Add `package.json` with `"type": "module"`.

Do **not** use Phaser/Kaboom — their arcade physics cannot reproduce SMB's speed-bucketed variable gravity or tile corner-clip resolution.

## 3. The physics — this is the whole game, get it exact

These are the real SMB1 constants from the disassembly data tables. Store them in raw NES units in `src/game/physics.js` and convert exactly once.

Units: **16 subpixels = 1 pixel**. Acceleration bytes are 1/256 subpixel/frame² (= 1/4096 px/frame²). Gravity bytes are 1/256 px/frame². Vertical speed is signed integer px/frame + unsigned 1/256 fraction.

```
Speed caps:   max walk 24 subpx/f (1.5 px/f)   max run 40 subpx/f (2.5 px/f)
              swim 24                           swim-ground 16

FrictionData (Mario): run accel 0xE4 (228) | walk accel 0x98 (152) | release decel 0xD0 (208)
                      skid deceleration = 2x release decel

Speed buckets (|vx| in subpx/f): [9, 16, 25, 28] -> table row 0..4 (5,6 = swimming)

                idx:    0     1     2     3     4     5     6
PlayerYSpdData:        -4    -4    -4    -5    -5    -2    -1     (int px/f)
InitMForceData:      0x00  0x00  0x00  0x00  0x00  0x80  0x00     (frac /256)
JumpMForceData:      0x20  0x20  0x1E  0x28  0x28  0x0D  0x04     (gravity, button HELD)
FallMForceData:      0x70  0x70  0x60  0x90  0x90  0x0A  0x09     (gravity, RELEASED)

Terminal fall speed: 4.5 px/frame
In-game timer: decrement 1 unit every 24 frames (400 units ~ 160s)
```

Behaviour that must **emerge** from these, not be special-cased:

- **Variable jump height**: while ascending AND holding jump, use `JumpMForceData`; the moment it's released (or you start falling), switch to the ~3.5x stronger `FallMForceData`.
- **Running jumps go higher**: at |vx| >= 25 subpx/f the impulse changes from -4.0 to -5.0.
- The bucket is **latched at takeoff** and never recomputed mid-air.
- **No air friction** — releasing the d-pad mid-jump preserves momentum.
- Skid: pressing opposite your velocity on the ground applies 2x deceleration.
- **Deliberately OMIT** coyote time, jump buffering, and air-dash. SMB has none; adding them is what makes clones feel wrong.

**Grid:** render on an **18px** tile grid. Define `K = 18/16 = 1.125` and multiply every distance-dimensioned constant by it exactly once, in one place. Trajectories stay identical in tile units.

**Acceptance criteria (must pass before building anything else):**

- Standing full-hold jump apex = **4.0 tiles** (v0²/2g = 16/0.25 = 64px)
- Running full-hold jump apex = **5.0 tiles** (25/0.3125 = 80px)
- Tapped jump ~2 tiles, well under half a full jump
- Walk cap converges to 24 subpx/f, run to 40 (walk = 3/5 of run)
- Skid stops faster than coasting

Write these as real tests in `tests/physics.test.mjs` (`node --test`) and run them before proceeding.

## 4. Art — generate it, don't download it

Write **Python + Pillow scripts** in `tools/` that generate every sprite sheet as PNG + JSON manifest. This keeps art versionable, editable and provably original. Render each sheet and visually inspect it, then iterate if it looks wrong.

- `tools/make_tiles.py` → an original **NES-style tileset** (18px, 10 cols, no spacing). This is what makes it look like Mario: orange brick ground (beveled, high contrast, black outlines), orange brick blocks, **gold ?-blocks with corner rivets, a "?" glyph and shimmer frames**, used blocks, gray stone/castle brick, blue underground blocks, **GREEN warp pipes** (wide top rim + shaded body halves), gold coins (round + thin spin frame), white stepped clouds, green bushes, green hills, bridge planks.
- `tools/make_hero.py` → Sprout small (18x18) and big (18x32): idle, 2–3 walk frames, jump, skid, crouch, dead.
- `tools/make_enemies.py` → acorn-walker (walk x2 + flattened), shellhopper (walk x2, shell, spinning shell), spikeling, snapvine (open/closed), emberling.
- `tools/make_items.py` → sun seed, ember bloom, comet, green sprout, fireball (2 frames).
- `tools/make_props.py` → goal castle (brick, battlements, arched door) and the King Bramble boss sprite.
- `tools/make_font.py` → a 5x7 bitmap font (A–Z, 0–9, punctuation) for HUD/title.

Palette guidance: sky `#5c94fc`, ground orange `#c84c0c` w/ `#fc9838` highlights, ?-block gold `#e8a008`, pipe green `#00a800` / `#78e060` / `#006000`, black outlines everywhere. Underground and castle backgrounds are pure black.

Generate Ember (fire) and Comet (star) hero variants at runtime by **palette-swapping** the base sprite on a canvas — don't hand-draw them.

## 5. Features (build all of it)

**Player:** small/big/ember states, grow/shrink with i-frame flicker, crouch, skid, death arc, star invincibility with flashing palette cycle.

**Blocks & world:** ?-blocks (bump → coin or item, becomes used), bricks (shatter when big, bump when small), multi-coin blocks, coin collection, block-bump nudge animation, one-way platforms.

**Enemies:** acorn-walker (stomp → flatten); shellhopper (stomp → shell → kick → slides, kills other enemies, ledge-aware red variant); spikeling (**cannot** be stomped — stomping hurts you); snapvine (rises from pipe mouths on a cycle, and **will not emerge while the player is standing beside the pipe**); emberling (leaps from lava on a timer, invincible); thornbar (rotating bar of thorn balls around a pivot — needs a custom per-segment hit test, not one AABB).

**Power-ups:** Sun Seed (grow), Ember Bloom (fire; max 2 bouncing fireballs on screen), Comet (invincibility), Green Sprout (1-up). Items emerge from blocks, mushrooms drift and bounce off walls, flowers sit still, comets hop.

**Boss — King Bramble:** patrols and hops on the final bridge, contact hurts, not stompable, defeated by ~5 fireballs (then tumbles off screen). A nimble player can also dash past him.

**Scoring/flow:** score, coins, lives, 400-unit timer, stomp-chain score ladder (100/200/400/500/800/1000/2000/4000/5000/8000 → 1-up), 1-up at 100 coins, flagpole finish (grab height bonus → slide → walk to castle → time-to-score tally), death → lose a life → respawn → game over → restart, **mid-level checkpoints**.

**Camera:** SMB one-way scroll — follows right, **never scrolls back left**; the left edge is a hard wall. Enemies spawn when they cross the right screen edge and despawn behind.

**Audio — synthesize it, no files:** emulate the NES APU in WebAudio — 2 pulse channels via `PeriodicWave` at 12.5%/25%/50% duty, a triangle for bass, buffered noise for percussion. Write ~12 SFX (jump, stomp, bump, coin, powerup, powerdown, kick, fireball, 1-up, pipe, flagpole, death) and **4 original looping chiptunes** (overworld, underground, sky, castle) plus a course-clear fanfare, as note-list data driven by a lookahead sequencer. Speed the music up when time drops below 100. Start the AudioContext only on a user gesture (autoplay policy). Add a mute toggle.

**Shell:** title screen (big game name, subtitle, hero + enemy on the ground, blinking "PRESS ENTER", control legend), "WORLD 1-1" cards between levels, HUD (score/coins/world/time), pause overlay.

**Levels:** four complete levels — 1-1 grasslands (teaching level: ?-block cluster, escalating pipes with snapvines, two pits, staircase, flagpole), 1-2 undergrove (enclosed, coin rooms, brick pillars), 1-3 cloudreach (athletic — floating brick islands over the void), 1-4 thorn keep (lava gaps, thornbars, emberlings, King Bramble, flag). Author them with a fluent `LevelBuilder` (helpers: `ground`, `pipe`, `stairs`, `block`, `coins`, `enemy`, `flag`, `castle`, `fillRect`, `decor`).

**Level format + editor:** levels are ASCII rows + a legend + side-lists (enemies, block contents, spawn, goal, castle). Build `tools/editor.html` — a standalone visual editor to paint tiles/enemies/contents, place spawn/flag/castle, load the built-in levels as samples, Export/Import JSON, and **Test Play** (save to `localStorage`, open the game with `?play=custom`).

**Controls:** keyboard (arrows/WASD move, Z/Space jump, X/Shift run+fire, P pause, M mute, Enter start), **gamepad** (poll `navigator.getGamepads`), and **on-screen touch buttons** for mobile.

## 6. Architecture

```
index.html                    canvas + module boot
package.json                  {"type":"module"}
src/main.js                   boot, integer-scaled canvas, title→card→play modes, level progression
src/engine/  constants, loop (fixed 60Hz accumulator, decoupled render), input,
             atlas (SpriteSheet + NamedAtlas), font, palette (remap/flatTint), camera, audio
src/game/    physics, player, tiles, tilemap, world (the play scene: state, collisions,
             scoring, goal/death flow), hud, effects, level (compile + LevelBuilder), levels, title
src/game/entities/  entity (base: gravity + tile collision), acornWalker, shellhopper,
                    spikeling, snapvine, emberling, thornbar, kingBramble, powerup, fireball
src/audio/tracks.js  original note data
tools/       make_*.py generators + editor.html
tests/physics.test.mjs
assets/custom/  generated PNG + JSON
```

**Collision:** axis-separated AABB against the tile grid, X resolved before Y. Ceiling bumps need SMB's **corner-clip forgiveness** — if a rising player clips a single block by a small margin at its edge, nudge them sideways past it instead of stopping dead. Stomp = falling AND previous bottom above the enemy's upper band; bounce higher if jump is still held.

## 7. Build order (gate each phase)

0. Scaffold + generate art. 1. **Physics core + tests — do not proceed until the jump-height tests pass.** 2. Tiles/blocks/coins/HUD. 3. Enemies. 4. Power-ups + fireballs. 5. Level format + builder. 6. The four levels. 7. Audio. 8. Title/cards/flagpole/lives/game-over. 9. Boss, checkpoints, gamepad, touch, editor.

Every phase must end with the game still running.

## 8. Verification (do this continuously, not at the end)

Run it in a real browser and check the console is clean after every phase. Expose a debug handle for deterministic testing:

```js
window.__game = { world, player, map, cam, input, render,
                  step(n){for(let i=0;i<n;i++) update();},
                  hold:b=>input.down.add(b), release:b=>input.down.delete(b), releaseAll(){...} };
```

**Three pitfalls that will waste your time — avoid them:**

1. **`requestAnimationFrame` pauses in a backgrounded tab.** Never verify physics with wall-clock timers; drive the sim with `step(n)` instead.
2. **Chrome caches ES modules per-origin.** After editing `src/`, a plain reload can silently run stale code. Serve on a **new port** (8081, 8082…) or hard-reload when verifying changes.
3. **Test on genuinely open ground.** Placing a test player near a staircase/wall/pit makes correct collisions look like physics bugs. Reset the camera too — the one-way scroll lock fights repositioning.

Verify concretely: running jump ≈5 tiles at max run speed (~2.81 px/f on the 18px grid) in bucket 4; ?-block → coin + becomes used; brick shatters only when big; stomp flattens; small dies on side-hit, big shrinks; shell rests then kicks in the correct direction; each power-up applies; boss HP drops 5→defeated under fireballs; flagpole runs slide→walk→clear; death → respawn → game over → restart.

## 9. Definition of done

Boots to a title screen, plays four complete themed levels with music and SFX, beat the boss, clear the flag, win — or lose all lives and restart. Console clean, physics tests green, level editor works, all assets original. Finish it and tell me how to run it.