# Kleeblatt Adventure — Guilds & Economy Design

---

## Händlergilde (Merchant Guild) — The Flying Merchant

The Flying Merchant is an NPC who roams the world map, appearing at **randomised spawn points** (villages, crossroads, forest clearings). He never stays long.

### Spawn Rules

| Property | Value |
|----------|-------|
| Spawn interval | Every 3–4 hours real time (randomised) |
| Duration at location | 45–90 minutes before moving |
| Locations per map zone | 3–5 possible spawn points |
| Notification | Map ping + sound cue when merchant is within your zone |
| Visibility | Visible as a moving icon on the minimap |

The unpredictability is intentional — players who explore regularly get more merchant encounters.

### Inventory — The −2 Level Rule

The merchant always carries items calibrated to **player level − 2**. This means:

- Items are immediately usable and meaningful (not too weak)
- They are never cutting-edge (doesn't replace dungeon drops as the best gear source)
- A Lv 1–2 player sees Lv 1 base items (floor: never below Lv 1)

```
Merchant item level = max(1, PlayerLevel − 2)
```

**Inventory refreshes** each time the merchant moves to a new location. The stock is randomised from a weighted pool of item types appropriate to the current item level.

### Item Stock (per visit, randomised selection of ~8–12 items)

| Category | Examples | Quantity |
|----------|----------|----------|
| Weapons | Sword, Bow, Staff at (Lv−2) | 1–2 |
| Armor pieces | Chest, Boots, Helmet at (Lv−2) | 2–3 |
| Potions | Minor, Brew, Grand Potion | 2–4 |
| Seeds | Seedling / Herb packets | 2–3 |
| Accessories | Rings, Amulets at (Lv−2) | 1–2 |
| Special slot | 1 random rare item (Lv−1, higher price) | 1 |

Seeds from the merchant give players a shortcut to farming materials they haven't unlocked organically yet — but at a gold cost.

### Pricing

| Transaction | Rate |
|-------------|------|
| Buy from merchant | Base item price × 1.0 |
| Sell to merchant | Base item price × 0.45 |
| Karma: Gesegnet (+61 to +100) | Buy price − 15% |
| Karma: Tugendhaft (+11 to +60) | Buy price − 5% |
| Karma: Verdammt (−61 to −100) | Buy price + 10% (he doesn't trust you) |

### Base Item Prices by Level

| Item Level | Common | Uncommon | Rare |
|------------|--------|----------|------|
| Lv 1–4 | 30–80g | 100–200g | — |
| Lv 5–9 | 100–200g | 250–450g | 600–900g |
| Lv 10–14 | 200–400g | 500–900g | 1,000–1,800g |
| Lv 15–19 | 400–700g | 900–1,500g | 2,000–3,500g |
| Lv 20–24 | 700–1,200g | 1,500–2,500g | 4,000–7,000g |
| Lv 25 | 1,200–2,000g | 2,500–4,000g | 8,000–15,000g |

---

## Schmiedgilde (Blacksmith Guild)

The Blacksmith is a **fixed NPC** located in every major settlement (villages, dungeon outposts). Unlike the Flying Merchant, the Blacksmith is always available.

### Services

#### 1. Buy & Sell
Same buy/sell logic as the Merchant, but the Blacksmith only deals in **weapons, armor, and crafting materials** — no potions or seeds.

Sell rate: **0.55× base price** (slightly better than the Merchant — he knows gear value).

#### 2. Upgrade (Verstärken)
Enhance an existing item's stats using gold + crafting materials dropped from dungeons.

```
Item Upgrade Tiers: +1 → +2 → +3 → +4 → +5 (max)

Each upgrade:
  +5% to all item stats
  Cost: item_base_price × upgrade_tier × 0.4 gold
      + crafting_material (type depends on item level)

Upgrade materials by item level:
  Lv 1–9   → Iron Scrap    (drops from Goblin Scout, Stone Golem)
  Lv 10–14 → Steel Shard   (drops from Cursed Skeleton, Spiderling)
  Lv 15–19 → Shadow Alloy  (drops from Thunder Drake, Blood Vampire)
  Lv 20–25 → Void Ore      (drops from Void Wraith, Ancient Colossus)
```

**Upgrade cost example** (Lv 15 sword, base price 700g):  
+1: 280g + 1 Shadow Alloy  
+2: 560g + 2 Shadow Alloy  
+3: 840g + 4 Shadow Alloy  
+4: 1,120g + 6 Shadow Alloy + 1 Void Ore  
+5: 1,400g + 8 Shadow Alloy + 3 Void Ore  

This creates a direct gold + dungeon-material sink, giving endgame players a reason to keep running dungeons even after hitting Lv 25.

#### 3. Weapon Coating (Tränken)
The Blacksmith can permanently coat a weapon for a larger cost (lasts until the weapon breaks or is sold):

```
Permanent coating cost = 3× the potion's base brew cost in gold
                       + the potion itself
```

This is the expensive alternative to doing it manually mid-dungeon — convenience for wealthy players.

#### 4. Craft (Herstellen)
Using materials, the Blacksmith can craft items the player doesn't have yet.

```
Recipe = base materials + crafting schematic (found in dungeons or bought from Guild)
Craft cost = materials + gold (50% of item market price)
```

Schematics are rare dungeon drops — having a schematic is itself a reward worth chasing.

---

## Gold Economy Overview

Bringing all gold sources and sinks together in one view:

### Gold Income Sources

| Source | Gold Range | Notes |
|--------|-----------|-------|
| Dungeon completion (T1) | 50–150g | Per run |
| Dungeon completion (T2) | 200–500g | Per run |
| Dungeon completion (T3) | 800–2,000g | Per run |
| Sell item to Merchant | 14–9,000g | Depends on item |
| Sell item to Blacksmith | 17–11,000g | Slightly better rate |
| Map monster kill | 2–15g | Minimal, mainly early game |
| Daily quest reward | 50–200g | Once per day |

### Gold Sinks

| Sink | Cost Range | Notes |
|------|-----------|-------|
| Buy item from Merchant | 30–15,000g | −2 level items |
| Buy item from Blacksmith | 30–15,000g | Same pricing |
| Weapon upgrade (+1 to +5) | 280g–15,000g | Per upgrade step |
| Permanent weapon coating | Varies | Blacksmith service |
| Skill upgrades (future) | 500–2,000g | See stats doc |
| Dungeon key (crafted) | TBD | Entrance requirement |
| Guild membership | TBD | Optional perks |

The economy is designed so that a consistent dungeon player can always afford useful Merchant items without farming specifically for gold.

---

## Item Rarity Tiers

Since both guilds deal in items, rarity needs to be formally defined:

| Rarity | Color | Stat bonus | Source |
|--------|-------|-----------|--------|
| Common | ⬜ White | Base stats | Merchant, Blacksmith, map drops |
| Uncommon | 🟩 Green | +15% stats | Merchant, T1/T2 dungeon drops |
| Rare | 🟦 Blue | +35% stats | Merchant (rare slot), T2/T3 dungeon drops |
| Epic | 🟪 Purple | +60% stats + 1 bonus effect | T3 dungeon drops, Blacksmith craft |
| Legendary | 🟨 Gold | +100% stats + 2 bonus effects | Legendary Chest only |

**Bonus effects** (Epic/Legendary only) are randomly rolled from a pool:
- +X% damage vs. specific enemy type
- Passive: skill cooldown −10%
- On kill: 5% chance to restore 10% HP
- +X Glück / Stärke / Geschick flat
- Weapon coating slots: +1 (can hold 2 coatings)

