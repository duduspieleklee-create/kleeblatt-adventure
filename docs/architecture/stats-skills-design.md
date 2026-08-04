# Kleeblatt Adventure — Stats, Armor & Skills Design

---

## The Seven Stats

| Stat | German | What it does |
|------|--------|-------------|
| **HP** | Leben | Total health — reach 0 = defeated |
| **Strength** | Stärke | Scales melee physical damage |
| **Dexterity** | Geschick | Scales ranged damage, dodge chance, crit chance |
| **Attack** | Angriff | Base attack power (applies to all classes before class modifier) |
| **Intelligence** | Intelligenz | Scales spell damage and skill cooldown reduction |
| **Karma** | Karma | NOT changed by level-ups — shifts through events, choices, and actions |
| **Luck** | Glück | Affects drop quality, crit chance, potion brewing bonuses, chest NFT rolls |

---

## Karma — The Moral Compass

Karma sits on a **−100 to +100** scale and never resets automatically.

### What moves Karma

| Action | Change |
|--------|--------|
| Save a captured NPC | +5 |
| Kill a non-hostile NPC | −8 |
| Complete a "light" quest | +3 to +10 |
| Choose the greedy/dark option in an event | −5 to −15 |
| Donate to a village | +2 |
| Loot a graveyard / desecrate a shrine | −10 |
| Help another player in a dungeon | +3 |
| Betray / steal from another player | −12 |

### Karma Effects

| Range | Label | Effects |
|-------|-------|---------|
| +61 to +100 | Gesegnet (Blessed) | Merchants -15% price, NPCs share secrets, +10% light quest XP |
| +11 to +60 | Tugendhaft (Virtuous) | Merchants -5%, some locked quests available |
| −10 to +10 | Neutral | No bonus or penalty |
| −11 to −60 | Dunkel (Dark) | Certain dark-market items available, some NPCs hostile |
| −61 to −100 | Verdammt (Damned) | "Shadow" dungeon variant unlocked, black market, some monsters are friendly |

Karma makes the world react to *who you are*, not just your level. Both extremes have rewards — neither is the "wrong" choice.

---

## Base Stats at Level 1 (All Classes)

| Stat | Base Value |
|------|-----------|
| Leben | 120 |
| Stärke | 10 |
| Geschick | 10 |
| Angriff | 15 |
| Intelligenz | 10 |
| Karma | 0 |
| Glück | 5 |

---

## Per-Level Stat Growth (Base, before class modifier)

Each level-up gives raw stat gains that are then multiplied by a class growth modifier:

| Stat | Base gain / level |
|------|------------------|
| Leben | +22 HP |
| Stärke | +3 |
| Geschick | +3 |
| Angriff | +4 |
| Intelligenz | +3 |
| Karma | 0 |
| Glück | +1 |

---

## Class Growth Multipliers

| Stat | Nahkampf ⚔️ | Fernkampf 🏹 | Magier 🔮 |
|------|:-----------:|:------------:|:---------:|
| Leben | ×1.6 | ×0.9 | ×0.75 |
| Stärke | ×1.9 | ×0.75 | ×0.45 |
| Geschick | ×0.75 | ×1.9 | ×0.9 |
| Angriff | ×1.3 | ×1.25 | ×0.8 |
| Intelligenz | ×0.45 | ×0.8 | ×2.1 |
| Glück | ×0.9 | ×1.2 | ×1.6 |

---

## Stats at Key Levels (No equipment)

### Nahkampf ⚔️

| Level | Leben | Stärke | Geschick | Angriff | Intelligenz | Glück |
|-------|-------|--------|----------|---------|-------------|-------|
| 1 | 120 | 10 | 10 | 15 | 10 | 5 |
| 5 | 401 | 33 | 19 | 35 | 16 | 9 |
| 10 | 753 | 62 | 29 | 62 | 22 | 13 |
| 15 | 1,106 | 91 | 39 | 88 | 29 | 17 |
| 20 | 1,458 | 120 | 49 | 114 | 35 | 21 |
| 25 | 1,810 | 150 | 58 | 141 | 42 | 26 |

### Fernkampf 🏹

| Level | Leben | Stärke | Geschick | Angriff | Intelligenz | Glück |
|-------|-------|--------|----------|---------|-------------|-------|
| 1 | 120 | 10 | 10 | 15 | 10 | 5 |
| 5 | 199 | 19 | 33 | 35 | 20 | 10 |
| 10 | 317 | 33 | 62 | 60 | 30 | 15 |
| 15 | 436 | 47 | 91 | 85 | 41 | 19 |
| 20 | 554 | 60 | 120 | 110 | 51 | 24 |
| 25 | 672 | 74 | 150 | 134 | 61 | 29 |

### Magier 🔮

| Level | Leben | Stärke | Geschick | Angriff | Intelligenz | Glück |
|-------|-------|--------|----------|---------|-------------|-------|
| 1 | 120 | 10 | 10 | 15 | 10 | 5 |
| 5 | 186 | 14 | 20 | 27 | 35 | 11 |
| 10 | 287 | 19 | 33 | 42 | 73 | 18 |
| 15 | 388 | 23 | 46 | 58 | 111 | 26 |
| 20 | 489 | 28 | 58 | 73 | 148 | 33 |
| 25 | 589 | 32 | 71 | 88 | 186 | 41 |

---

## Damage Formulas

```
Melee Damage  = (Angriff × 1.0 + Stärke × 0.8) × weapon_modifier
Ranged Damage = (Angriff × 1.0 + Geschick × 0.8) × weapon_modifier
Spell Damage  = (Angriff × 0.5 + Intelligenz × 1.2) × spell_modifier

Crit Chance   = 5% base + (Geschick / 200) + (Glück / 150)   [cap: 40%]
Crit Multiplier = 1.75×
Dodge Chance  = (Geschick / 250)   [cap: 25%]
```

---

## Luck (Glück) Effects

| Glück Value | Effect |
|------------|--------|
| Every 10 Glück | +1% critical hit chance |
| Every 5 Glück | +1% chance dungeon chest upgrades one rarity tier |
| Every 15 Glück | +0.5% chance of double loot from dungeon completion |
| Every 20 Glück | +0.5% NFT chance on Legendary Chest open |
| Brewing bonus | Every 10 Glück = +1% chance to brew a "Superior" potion (stronger effect) |

Magier's naturally high Glück makes them the best class for farming rare chests and NFT drops.

---

## Armor System

Armor is a separate stat provided **entirely by equipment** (not by level-up). It reduces incoming damage:

```
Damage Reduction % = Armor / (Armor + 250)

Examples:
  Armor  50  → 16.7% reduction
  Armor 100  → 28.6% reduction
  Armor 200  → 44.4% reduction
  Armor 300  → 54.5% reduction
  Armor 500  → 66.7% reduction  ← approximate endgame Nahkampf cap
```

### Armor by Class

| Class | Armor Type | Lv 1 gear | Lv 25 gear (max) | Side effect |
|-------|-----------|-----------|-----------------|-------------|
| Nahkampf | Heavy Plate | 30 | 480 | −10 Geschick (heavy = slower) |
| Fernkampf | Leather / Light | 12 | 200 | +5 Geschick (light = agile) |
| Magier | Robes | 5 | 90 | +8 Intelligenz bonus |

### Equipment Slots

Each character has 6 equipment slots, each adding stats + armor:

```
Head · Chest · Legs · Boots · Weapon · Accessory (ring/amulet)
```

Equipment drops from dungeons (gear pieces), treasure chests, and can be crafted.

---

## Skills — 5 per Class

Skills unlock as the player levels. Each class gets a full kit at Lv 20, just in time for the Legend phase.

**Unlock schedule:** Lv 1 → Lv 6 → Lv 11 → Lv 16 → Lv 20

---

### ⚔️ Nahkampf (Melee) Skills

| # | Name | Unlock | Type | Effect |
|---|------|--------|------|--------|
| 1 | **Stahlhaut** *(Iron Skin)* | Lv 1 | Passive | +15% armor permanently; +extra 20% when HP drops below 30% |
| 2 | **Berserker-Rausch** *(Berserker Frenzy)* | Lv 6 | Active (60s CD) | +60% Stärke for 8s; cannot be CC'd during burst |
| 3 | **Erdbeben-Stoß** *(Earthquake Slam)* | Lv 11 | Active (20s CD) | AoE melee hit in 3m radius, Stärke-scaled ×2.5; stuns enemies 1.5s |
| 4 | **Blutdurst** *(Bloodthirst)* | Lv 16 | Passive | Each kill heals 4% max Leben; doubles to 8% in Berserker-Rausch |
| 5 | **Unzerbrechlich** *(Unbreakable)* | Lv 20 | Active (120s CD) | Full damage immunity for 3s; after it ends, deals stored damage back as AoE |

**Playstyle:** High HP + armor tank that bursts with Berserker-Rausch and sustains through kills. Dominates single-target boss fights.

---

### 🏹 Fernkampf (Ranged) Skills

| # | Name | Unlock | Type | Effect |
|---|------|--------|------|--------|
| 1 | **Präzisionsschuss** *(Precision Shot)* | Lv 1 | Active (8s CD) | 220% Angriff damage; guaranteed crit if Geschick > 80 |
| 2 | **Schattensprung** *(Shadow Dash)* | Lv 6 | Active (18s CD) | Dash 5m backwards; +25% Geschick and dodge for 5s |
| 3 | **Pfeilregen** *(Arrow Rain)* | Lv 11 | Active (30s CD) | Rains arrows on target area for 4s; each hit = 80% Angriff |
| 4 | **Giftpfeil** *(Poison Shot)* | Lv 16 | Active (12s CD) | Applies poison (Geschick × 0.6 per second for 8s); stacks up to ×3 |
| 5 | **Adlerauge** *(Eagle Eye)* | Lv 20 | Passive | Every 6th attack is automatically a critical hit regardless of Glück; crit damage +50% |

**Playstyle:** High mobility, sustained damage, great at mission types that require killing specific targets quickly. Strongest in Pfeilregen + Giftpfeil combo vs. dungeon crowds.

---

### 🔮 Magier (Mage) Skills

| # | Name | Unlock | Type | Effect |
|---|------|--------|------|--------|
| 1 | **Feuersturm** *(Firestorm)* | Lv 1 | Active (15s CD) | AoE fire explosion, Intelligenz × 2.2 damage in 5m radius; leaves burning ground for 3s |
| 2 | **Eissplitter** *(Ice Shards)* | Lv 6 | Active (10s CD) | 3 projectiles, each hits for Intelligenz × 1.0; frozen target takes +30% damage |
| 3 | **Arkanschild** *(Arcane Shield)* | Lv 11 | Active (45s CD) | Absorbs Intelligenz × 3 damage for 10s; when shield breaks, releases a shockwave |
| 4 | **Zeitriss** *(Time Rift)* | Lv 16 | Active (40s CD) | Slows all enemies in 6m by 60% for 8s; affected enemies take +20% spell damage |
| 5 | **Mana-Explosion** *(Mana Burst)* | Lv 20 | Passive | 20% chance on any skill use to chain a free Intelligenz × 1.5 bonus hit; cannot chain again within 3s |

**Playstyle:** Lowest HP and armor, requires positioning and shield timing. Devastating vs. grouped dungeon enemies. Highest Glück makes them the prime class for Legendary Chest NFT drops.

---

## How It All Connects

```
NAHKAMPF
High Leben + Armor → survives long fights → Blutdurst sustains indefinitely
→ Best for: solo boss dungeons, escort missions

FERNKAMPF
High Geschick → high dodge + crit → Adlerauge guarantees crits
→ Best for: speed-clear dungeons, kill-missions, Pfeilregen clears rooms fast

MAGIER
High Intelligenz → massive AoE damage → Zeitriss locks rooms
High Glück → best NFT/chest odds → rewards smart farming investment
→ Best for: puzzle dungeons, group dungeons, Legendary Chest farming
```

---

## Skill Upgrade Path (Optional Future Feature)

Each skill could have 3 upgrade tiers (unlocked by spending dungeon-earned gold):

```
Skill Tier 1 (default) → free
Skill Tier 2 (enhanced) → 500 gold
Skill Tier 3 (mastered) → 2,000 gold + rare crafting material from Legendary Chest
```

This gives gold a long-term sink and connects dungeon rewards to skill power.
