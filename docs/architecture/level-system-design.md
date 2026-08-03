# Kleeblatt Adventure — Progressive Level-Up System Design

## Overview

- **Max level:** 25
- **Target:** Reachable in ~30 days at 6 h/day = ~180 hours total playtime
- **Core philosophy:** No grind marathon. Every session should feel meaningful. The game rewards adventurers who explore, farm *and* descend into dungeons — not those who just mindlessly repeat one loop.

---

## Phase Structure

The 25 levels split into three distinct phases with different dominant activities:

| Phase | Levels | Hours | Primary XP Sources |
|-------|--------|-------|--------------------|
| **Discovery** | 1–10 | ~40 h | Map monsters, Farming, Early dungeons |
| **Adventurer** | 11–20 | ~80 h | Dungeons (primary), Farming (secondary), Map (minimal) |
| **Legend** | 21–25 | ~60 h | Dungeons ONLY — map monsters are too weak |

---

## EXP Curve

The curve is intentionally front-loaded with easy gains (hook the player) and slows meaningfully in the Legend phase without ever feeling like a wall.

```
XP required per level (XP to go from Lv N → Lv N+1):

Lv  1→2   :    300 XP   |  Lv 13→14:   4,500 XP
Lv  2→3   :    500 XP   |  Lv 14→15:   5,200 XP
Lv  3→4   :    750 XP   |  Lv 15→16:   6,000 XP
Lv  4→5   : 1,100 XP    |  Lv 16→17:   7,000 XP
Lv  5→6   : 1,500 XP    |  Lv 17→18:   8,200 XP
Lv  6→7   : 2,000 XP    |  Lv 18→19:   9,500 XP
Lv  7→8   : 2,500 XP    |  Lv 19→20:  11,000 XP
Lv  8→9   : 2,900 XP    |  ─── Legend Phase ───
Lv  9→10  : 3,200 XP    |  Lv 20→21:  15,000 XP
Lv 10→11  : 3,500 XP    |  Lv 21→22:  20,000 XP
Lv 11→12  : 3,800 XP    |  Lv 22→23:  26,000 XP
Lv 12→13  : 4,100 XP    |  Lv 23→24:  33,000 XP
                         |  Lv 24→25:  41,000 XP

Total XP to reach Lv 25: ~185,000 XP
```

The **Legend phase** (Lv 20–25) requires ~135,000 XP total — 73% of all EXP in only 60 hours. Dungeons must deliver this.

---

## XP Sources by Phase

### Phase 1 — Discovery (Lv 1–10)

| Source | XP Range | Notes |
|--------|----------|-------|
| Map monster kill | 5–25 XP | Weak, good for early hours |
| Crop harvest (low-tier plant) | 15–40 XP | 30-min grow cycle |
| Dungeon completion (Tier 1) | 200–450 XP | ~15–20 min, tutorial-level |
| Daily login bonus | 50 XP flat | Once per day |

**Target pace:** ~1,000–1,500 XP/hour (mix of activities)

---

### Phase 2 — Adventurer (Lv 11–20)

| Source | XP Range | Notes |
|--------|----------|-------|
| Map monster kill | 10–35 XP | Rapidly diminishing returns past Lv 15 |
| Crop harvest (mid-tier plant) | 50–100 XP | 60-min grow cycle |
| Dungeon completion (Tier 2) | 700–1,500 XP | ~20–25 min, mission-based |
| Daily login bonus | 75 XP flat | Once per day |

**Target pace:** ~2,000–2,500 XP/hour (dungeons as primary, farming alongside)

---

### Phase 3 — Legend (Lv 21–25)

| Source | XP Range | Notes |
|--------|----------|-------|
| Map monster kill | 0 XP | Deliberately zero — too weak |
| Crop harvest (high-tier plant) | 120–200 XP | 90-min grow cycle, still worth it |
| Dungeon completion (Tier 3) | 2,000–5,000 XP | Up to 30 min, mission chains |
| Daily login bonus | 100 XP flat | Once per day |

**Target pace:** ~2,200–2,500 XP/hour (almost entirely dungeons + passive farming)

Dungeon math check for Lv 20–25:
- 60 hours available
- Average dungeon: 25 min → ~144 dungeons over the phase
- Average XP per dungeon: ~3,500 XP
- Total dungeon XP: ~504,000 XP (more than enough, giving the player buffer for failed/incomplete runs)

---

## Dungeon System

### Core Rules
- EXP is awarded **only on full dungeon completion** (no partial credit)
- Max completion time: **30 minutes**
- Dungeons are unlocked by level gate + key item (crafted or purchased)
- Completion = all missions inside the dungeon are fulfilled

### Mission Types (inside a dungeon)
Each dungeon contains 2–4 of these randomly combined:

| Mission Type | Example |
|-------------|---------|
| **Hunt** | "Kill 12 Goblin Scouts" |
| **Collect** | "Gather 5 Moonshards from ore nodes" |
| **Escort** | "Bring the lost merchant to the exit" |
| **Survive** | "Hold the gate for 3 minutes" |
| **Puzzle** | "Activate the 3 rune pillars in order" |
| **Boss** | "Defeat the Dungeon Keeper" |

Mixing Hunt + Puzzle + Boss creates 30-minute dungeons that don't feel like a grind.

### Dungeon Tier Structure

| Tier | Available | Difficulty | Completion XP | Time |
|------|-----------|------------|---------------|------|
| T1 (Beginner) | Lv 1+ | Easy | 200–450 XP | 15–20 min |
| T2 (Adventurer) | Lv 8+ | Medium | 700–1,500 XP | 20–25 min |
| T3 (Legend) | Lv 20+ | Hard | 2,000–5,000 XP | 25–30 min |

### Dungeon Rewards (on completion)

Every completed dungeon drops:
1. **Gold** — scales with tier (T1: 50–150g, T2: 200–500g, T3: 800–2,000g)
2. **Treasure Box** — Sealed Magic Chest (always 1 guaranteed, rarely 2)
3. **Crafting scraps** — materials for equipment upgrades
4. **EXP** — the main reward, as above

---

## Farming & Plant System

Farming provides **passive EXP income** while the player is active elsewhere (dungeons, exploring). It is the heart of the crafting ecosystem.

### Plant Tiers

| Tier | Unlock Level | Grow Time | Harvest XP | Brew Into |
|------|-------------|-----------|------------|-----------|
| **Seedling** (Common) | Lv 1 | 30 min | 15–40 XP | Minor Potion |
| **Herb** (Uncommon) | Lv 5 | 60 min | 50–100 XP | Brew Potion |
| **Bloom** (Rare) | Lv 12 | 90 min | 120–200 XP | Grand Potion |
| **Rootvine** (Epic) | Lv 18 | 120 min | 200–350 XP | Legendary Potion |

### Brewing

Higher-tier plants can be combined into potions using a **Brewing Station** (unlocked at Lv 5):

```
3× Herb  →  Brew Potion (standard)
5× Herb + 1× Bloom  →  Grand Potion
3× Bloom + 2× Rootvine  →  Legendary Potion
```

Potions have two uses:
1. **Combat use** — temporary stat boosts during dungeons
2. **Key use** — required to open Sealed Magic Chests (see below)

---

## Sealed Magic Chest System

This is the key endgame loop connecting farming, dungeons, and NFTs.

### How It Works

```
[Dungeon Drop]         [Farming Loop]
Sealed Magic Chest  +  Brewed Potion  →  Open Chest
```

Chests are **endgame content** — they only drop from Tier 2+ dungeons (Lv 8+), and the potions required to open them use **endgame plant ingredients only**. Early-game herbs (Seedlings, basic Herbs) cannot brew chest-opening potions. This means the chest loop doesn't unlock until the player has invested in high-level farming alongside dungeon progression.

**Which plants can brew chest-opening potions:**

| Plant Tier | Unlock Level | Brews Into | Can Open Chest? |
|------------|-------------|------------|-----------------|
| Seedling (Common) | Lv 1 | Minor Potion | ❌ No — combat use only |
| Herb (Uncommon) | Lv 5 | Brew Potion | ❌ No — combat use only |
| Bloom (Rare) | Lv 12 | Grand Potion | ✅ Yes |
| Rootvine (Epic) | Lv 18 | Legendary Potion | ✅ Yes |

**Chest opening requirements:**

| Chest Rarity | Drops From | Required Potion | Ingredient Unlock |
|-------------|------------|----------------|-------------------|
| **Rare Chest** | T2 Dungeon (Lv 8+) | Grand Potion | Bloom plant, Lv 12 |
| **Epic Chest** | T2/T3 Dungeon (Lv 15+) | Grand Potion ×2 | Bloom plant, Lv 12 |
| **Legendary Chest** | T3 Dungeon (Lv 20+) | Legendary Potion | Rootvine plant, Lv 18 |

This creates a natural gate: a Lv 20 Legend player who neglected farming won't be able to open their Legendary Chests right away — they need to grow and brew first. It rewards players who ran both loops in parallel.

The chest rarity is determined at dungeon completion (random roll weighted by dungeon tier).

### NFT Integration (TBD)

Legendary Chests have a chance (suggested: 5–15%) to yield a **unique in-game NFT**:
- Could be a cosmetic item (skin, pet, title)
- Could be a unique gameplay item (plot of rare land, special seed, named weapon)
- Minted on-chain on open — the chain and standard are TBD
- Common → Epic chests deliberately yield nothing NFT, keeping NFTs rare and meaningful

---

## Difficulty Scaling (Levels 1–20)

The design goal is a *soft* difficulty ramp — players should feel gradually more capable, not suddenly punched by a wall.

| Level Range | Monster HP Multiplier | Player base DPS | Dungeon mission complexity |
|-------------|----------------------|-----------------|---------------------------|
| 1–5 | ×1.0 | Low | 1 mission type, simple layout |
| 6–10 | ×1.4 | Medium-low | 2 mission types |
| 11–15 | ×1.9 | Medium | 2–3 mission types, light timer pressure |
| 16–20 | ×2.5 | Medium-high | 3 mission types, boss always present |
| 21–25 | ×4.0+ | High | 3–4 mission types, hard boss, environmental hazards |

The jump from Lv 20 → 21 is deliberately sharp (no map monsters, dungeons required) but the player has 20 levels of skill building behind them.

---

## Anti-Grind Design Principles

1. **Daily cap** — Optional: soft-cap daily XP from map monsters (e.g. cap at 500 XP/day from kills) to nudge players toward dungeons and farming naturally, not by punishment.
2. **Dungeon variety** — Randomized mission combos mean no two dungeon runs feel identical.
3. **Parallel loops** — Plant a crop → go run a dungeon → come back and harvest. The loops nest.
4. **Social pressure valve** — Dungeons with escort/survival missions benefit from grouping, making it social, not solo-grindy.
5. **No XP decay** — Offline time is never punished. Farming ticks while offline.

---

## Summary: The Core Loop

```
🗺️  Explore map (early game)
   ↓ get basic XP + gold
🌱  Plant crops
   ↓ passive XP + brewing materials
⚔️  Enter dungeon (T1 → T2 → T3)
   ↓ complete missions
🏆  Dungeon complete → EXP + Gold + Sealed Chest
   ↓ (combine with brewed potions)
📦  Open chest → gear / cosmetics / NFT
   ↓ (get stronger)
🔁  Repeat with harder dungeons
```

This loop keeps every session feeling purposeful: plant before you dungeon, collect when you return, open chests as celebration moments — not routine.
