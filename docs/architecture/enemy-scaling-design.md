# Kleeblatt Adventure — Enemy Types, Scaling & Weapon Coating

---

## Overview

10 enemy types across 5 level brackets. Every 5 levels, 2 new enemy types appear — each with a new attack pattern or special ability. Every enemy type (from Bracket 2 onward) has a **Trank-Schwäche** (potion weakness): coating a weapon with the right potion neutralizes their special ability and deals 2× damage.

This connects the farming → brewing loop directly into combat.

---

## Weapon Coating Mechanic (Trank-Schwert)

```
Player opens inventory mid-dungeon
  → selects a potion + selects weapon
  → weapon is "coated" for the duration of 1 dungeon run (or 5 minutes)

Hitting the weakness enemy with the coated weapon:
  → Cancels their special ability permanently for the fight
  → Deals 2× damage on the hit that triggers it
  → Visual: weapon glows in potion color, enemy staggers

Wrong potion on the weapon: no effect (doesn't waste the potion)
Coating wears off at dungeon exit or after 5 minutes
Only 1 coating active at a time
```

The right potion is shown as a subtle **hint in the dungeon lore panel** (a bestiary entry the player unlocks on first encounter). They don't have to guess — but they have to have the right brew ready.

---

## Enemy Stat Scaling Formula

```
Enemy HP     = (50 + Level × 30) × type_hp_mod
Enemy Damage = (8 + Level × 3)  × type_dmg_mod
Enemy XP     = (10 + Level × 4) × type_xp_mod   [map only; dungeons: completion XP only]
```

**Damage taken by player:**  
Actual damage = Enemy Damage × (1 − Damage Reduction %)  
Where Damage Reduction = Armor / (Armor + 250)

**At key levels — base enemy (no modifier):**

| Level | Base HP | Base Dmg/Hit | Player hits to kill* | Enemy hits to kill player* |
|-------|---------|-------------|---------------------|--------------------------|
| 1 | 80 | 11 | 5–8 | 8–12 |
| 5 | 200 | 23 | 6–9 | 7–11 |
| 10 | 350 | 38 | 6–9 | 8–12 |
| 15 | 500 | 53 | 7–10 | 8–12 |
| 20 | 650 | 68 | 7–10 | 9–13 |
| 25 | 800 | 83 | 7–10 | 9–13 |

\* varies by class and equipment. Nahkampf with full armor survives ~2× longer than Magier.

The feel is **consistent across levels** — fights don't become faster or feel more dangerous in isolation. Difficulty comes from enemy specials and dungeon mission pressure, not raw stat bloat.

---

## The 10 Enemy Types

---

### 🟢 Bracket 1 — Level 1–4 (Discovery start)

#### 1. Goblin Scout
> *"Scheinheilig und feige, aber sie kommen in Schwärmen."*

| Stat | Value |
|------|-------|
| HP mod | ×0.6 (fragile) |
| Damage mod | ×0.8 |
| Type | Melee, Aggressive |
| XP mod | ×0.9 |

**Special — Mob Rush:** If the Goblin is alone when attacked, it calls 1–2 reinforcements (one-time). Reinforcements arrive in 6 seconds.

**Trank-Schwäche:** None — tutorial enemy, no weakness system yet.

**Notes:** Teaches players that enemies can summon help. Encourages clearing camps quickly.

---

#### 2. Forest Wolf
> *"Allein harmlos, im Rudel tödlich."*

| Stat | Value |
|------|-------|
| HP mod | ×0.75 |
| Damage mod | ×0.95 |
| Type | Fast melee, Pack hunter |
| XP mod | ×1.0 |

**Special — Pack Bonus:** +20% attack damage per additional wolf in the fight (stacks up to ×3).  
**Special — Lunge:** Leaps at player, deals 150% damage, knocks back 2m.

**Trank-Schwäche:** Minor Potion (Fire variant) on weapon → wolf panics and flees combat for 4 seconds, Pack Bonus removed.  
*Potion available: Lv 1 (Seedling plant).*

---

### 🟡 Bracket 2 — Level 5–9 (Adventurer early)

#### 3. Stone Golem
> *"Langsam, aber sein Schatten fühlt sich schon schwer an."*

| Stat | Value |
|------|-------|
| HP mod | ×2.5 |
| Damage mod | ×1.4 |
| Type | Tank, Slow |
| XP mod | ×1.4 |

**Special — Steinhaut (Stone Skin):** 50% passive damage reduction until the armor is cracked (requires 12+ hits).  
**Special — Tremor:** Slams ground, stuns all players within 3m for 1.5s. Cooldown: 15s.

**Trank-Schwäche:** Brew Potion (Acid variant) on weapon → on first hit, Stone Skin shatters permanently; Golem takes full damage for the rest of the fight + is stunned for 2s.  
*Potion available: Lv 5 (Herb plant).*

---

#### 4. Shadow Rogue
> *"Man hört sie, bevor man sie sieht. Meistens."*

| Stat | Value |
|------|-------|
| HP mod | ×0.9 |
| Damage mod | ×1.7 (backstab) |
| Type | Assassin, Stealth |
| XP mod | ×1.2 |

**Special — Verschwinden (Vanish):** Goes invisible for 5s, repositions behind the player, next attack is a backstab (3× damage). Cooldown: 20s.  
**Special — Smoke Bomb:** On low HP (< 25%), throws a smoke bomb — player is blinded for 2s.

**Trank-Schwäche:** Brew Potion (Light variant) on weapon → reveals invisible enemies; hitting Shadow Rogue while coated prevents Vanish for 20s.  
*Potion available: Lv 5 (Herb plant).*

---

### 🟠 Bracket 3 — Level 10–14 (Adventurer peak)

#### 5. Poison Spiderling
> *"Ihr Gift ist nicht das, was tötet — es ist das Netz."*

| Stat | Value |
|------|-------|
| HP mod | ×0.85 |
| Damage mod | ×0.7 + poison DoT (×0.5/s for 8s) |
| Type | Ranged, DoT |
| XP mod | ×1.1 |

**Special — Web Trap:** Fires a web at the player, slowing movement 70% for 4s.  
**Special — Venom Stack:** Poison stacks up to ×4; at max stack, player is rooted for 2s.

**Trank-Schwäche:** Grand Potion (Antidote variant) on weapon → player becomes poison-immune for the fight; hitting Spider removes all web roots immediately.  
*Potion available: Lv 12 (Bloom plant). Note: enemy appears at Lv 10, so players without Lv 12 Bloom can still fight them — they just need to manage the DoT manually.*

---

#### 6. Cursed Skeleton
> *"Es stirbt nicht beim ersten Mal. Manchmal auch nicht beim zweiten."*

| Stat | Value |
|------|-------|
| HP mod | ×1.3 |
| Damage mod | ×1.1 |
| Type | Undead, Magic resistant |
| XP mod | ×1.3 |

**Special — Dunkle Auferstehung (Dark Resurrection):** On death, revives once at 30% HP (2s invulnerable during revive). Can only happen once per fight.  
**Special — Fluch (Curse):** On hit, reduces player's Glück stat by 8 for 30s (stacks up to −24 Glück). Affects chest rarity rolls and crit chance.

**Trank-Schwäche:** Grand Potion (Holy variant) on weapon → prevents Dark Resurrection entirely; removes existing Curse stacks on hit.  
*Potion available: Lv 12 (Bloom plant).*

---

### 🔴 Bracket 4 — Level 15–19 (Pre-Legend)

#### 7. Thunder Drake
> *"Die Flügel hörst du, den Blitz nicht mehr."*

| Stat | Value |
|------|-------|
| HP mod | ×1.9 |
| Damage mod | ×1.5 |
| Type | Flying, AoE lightning |
| XP mod | ×1.5 |

**Special — Blitzatem (Lightning Breath):** Cone AoE lightning attack, stuns all hit players for 1.5s. Cooldown: 12s.  
**Special — Sturzflug (Dive Bomb):** Flies high (untargetable for 3s), dives for 220% damage on a marked location.

**Trank-Schwäche:** Legendary Potion (Earth/Ground variant) on weapon → grounds the Drake; prevents Sturzflug for the entire fight; Drake loses 20% damage while grounded.  
*Potion available: Lv 18 (Rootvine plant).*

---

#### 8. Blood Vampire
> *"Wer mehr Schaden macht, heilt sich. Das ist das Problem."*

| Stat | Value |
|------|-------|
| HP mod | ×1.5 |
| Damage mod | ×1.35 |
| Type | Life-steal, Fast |
| XP mod | ×1.4 |

**Special — Lebensraub (Life Drain):** Heals 40% of all damage dealt back as HP.  
**Special — Betörung (Mesmerize):** On eye contact (player faces vampire), stuns player for 2s. Cooldown: 18s. Can be avoided by circling.

**Trank-Schwäche:** Grand Potion (Silver variant) on weapon → completely removes Life Drain for the fight; vampire takes +30% damage from all sources.  
*Potion available: Lv 12 (Bloom plant) — available before the enemy appears. Encourages farming ahead.*

---

### 🟣 Bracket 5 — Level 20–25 (Legend — Dungeon only)

#### 9. Void Wraith
> *"Es ist nicht wirklich dort. Bis es dich trifft."*

| Stat | Value |
|------|-------|
| HP mod | ×2.1 |
| Damage mod | ×1.9 |
| Type | Phase-shift, Magic |
| XP mod | ×1.8 |

**Special — Phasenwandel (Phase Walk):** Becomes fully untargetable for 3s every 12s. All attacks pass through it.  
**Special — Void-Puls:** AoE magic burst — deals Intelligenz-type damage and **silences all player skills for 5s**. Cooldown: 20s.  
**Special — Lebenssiphon:** Drains 5% of max HP from player per second when within 2m. Forces ranged fighting.

**Trank-Schwäche:** Legendary Potion (Anchor variant) on weapon → Phase Walk is permanently disabled for the fight; Void-Puls silence reduced to 1s.  
*Potion available: Lv 18 (Rootvine plant).*

---

#### 10. Ancient Colossus
> *"Es gibt Gerüchte. Niemand hat sie bestätigt. Nicht persönlich."*

| Stat | Value |
|------|-------|
| HP mod | ×4.5 (boss) |
| Damage mod | ×2.3 |
| Type | Boss, Multi-phase |
| XP mod | ×3.0 |

**Phase 1 (100% → 50% HP):**  
- **Stampfen (Stomp):** AoE ground slam, 3m radius, 140% dmg + knockback. Cooldown: 8s.  
- **Felswurf (Boulder Throw):** Throws a boulder at random player, 2s warning indicator. 3s cooldown.

**Phase 2 (below 50% HP — Raserei/Enrage):**  
- All damage +60%, attack speed +80%
- Gains **Meteorsturm**: rains 5 meteors randomly over 6s area (2s warning each). Cannot be avoided by standing still.

**Trank-Schwäche:** Legendary Potion (Suppression variant) on weapon → prevents Enrage trigger; Colossus stays in Phase 1 behavior for the full fight. Dramatically easier.  
*Potion available: Lv 18 (Rootvine plant). This is the core endgame anti-grind tool — players who farmed Rootvine can skip the punishing Phase 2.*

---

## Enemy Scaling Summary Table

| # | Enemy | Bracket | Lv Gate | HP mod | Dmg mod | Special | Weakness Potion |
|---|-------|---------|---------|--------|---------|---------|-----------------|
| 1 | Goblin Scout | 1 | Lv 1 | ×0.6 | ×0.8 | Mob Rush | — |
| 2 | Forest Wolf | 1 | Lv 1 | ×0.75 | ×0.95 | Pack Bonus, Lunge | Minor (Fire) |
| 3 | Stone Golem | 2 | Lv 5 | ×2.5 | ×1.4 | Stone Skin, Tremor | Brew (Acid) |
| 4 | Shadow Rogue | 2 | Lv 5 | ×0.9 | ×1.7 | Vanish, Smoke Bomb | Brew (Light) |
| 5 | Poison Spiderling | 3 | Lv 10 | ×0.85 | ×0.7+DoT | Web, Venom Stack | Grand (Antidote) |
| 6 | Cursed Skeleton | 3 | Lv 10 | ×1.3 | ×1.1 | Resurrection, Curse | Grand (Holy) |
| 7 | Thunder Drake | 4 | Lv 15 | ×1.9 | ×1.5 | Lightning Breath, Dive | Legendary (Earth) |
| 8 | Blood Vampire | 4 | Lv 15 | ×1.5 | ×1.35 | Life Drain, Mesmerize | Grand (Silver) |
| 9 | Void Wraith | 5 | Lv 20 | ×2.1 | ×1.9 | Phase Walk, Void Pulse | Legendary (Anchor) |
| 10 | Ancient Colossus | 5 | Lv 20 | ×4.5 | ×2.3 | Multi-phase, Enrage | Legendary (Suppression) |

---

## How This Connects to the Full System

```
FARMING LOOP                    COMBAT LOOP
Rootvine (Lv 18) ──brew──► Legendary Potion ──coat weapon──► Defeats Void Wraith / Ancient Colossus
Bloom    (Lv 12) ──brew──► Grand Potion     ──coat weapon──► Defeats Skeleton / Vampire / Spider
Herb     (Lv  5) ──brew──► Brew Potion      ──coat weapon──► Defeats Stone Golem / Shadow Rogue
Seedling (Lv  1) ──brew──► Minor Potion     ──coat weapon──► Defeats Forest Wolf

AND / OR (endgame only):
Legendary Potion ──────────────────────────────────────────► Opens Legendary Chest (NFT chance)
Grand Potion     ──────────────────────────────────────────► Opens Rare/Epic Chest
```

Players face a real resource decision in the Legend phase:  
**"Do I coat my weapon (easy fight) or save this Legendary Potion for a chest opening?"**  
That tension is the anti-grind engine.
