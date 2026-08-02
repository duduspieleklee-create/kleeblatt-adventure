# Asset-Liste – Kleeblattadventure Prototyp

**Stand:** 3. August 2026  
**Bezug:** [`game-config.json`](../../game-config.json), [17-mvp-gameplay.md](./17-mvp-gameplay.md), [18-enemy-ai.md](./18-enemy-ai.md), [19-phaser-rule-engine.md](./19-phaser-rule-engine.md)

---

## Format-Konventionen

| Typ | Format | Hinweis |
|------|--------|---------|
| Sprites / Charaktere | PNG Sprite-Sheet + JSON Atlas | Phaser 3 `spritesheet` oder TextureAtlas |
| Tilemap | Tiled `.tmj`/`.tmx` + Tileset PNG | Phaser 3 Tilemap Plugin |
| UI-Icons | PNG (einzeln oder Atlas) | React-Seite, nicht Phaser |
| Audio | OGG (Web-kompatibel) | Phaser WebAudio |
| Größe | 32×32 px pro Tile | Map: 50×37 Tiles → 1600×1200 px |

Sprite-Sheets: pro Animation eine Zeile, Frames von links nach rechts.  
Alternativ: einzelne PNGs pro Frame (einfacher zum Start, später zu Atlas zusammenfassen).

---

## Prio 1 – Braucht man zwingend für P5 (Combat) + P7 (Loot)

### 1.1 Spieler-Sprites (3 Klassen)

Jede Klasse braucht mindestens: idle, walk, basic-attack, death.  
Richtung: Entweder 4-Directional (unten/oben/links/rechts) oder Top-Down mit Maus-Rotation (weniger Sprites).

Empfehlung Prototyp: **Side-Scroll-Stil / Top-Down 4-Directional**.

| Asset-ID | Beschreibung | Frames | Größe |
|----------|-------------|--------|-------|
| `player_melee_idle` | Nahkämpfer steht | 4 | 32×32 |
| `player_melee_walk` | Nahkämpfer läuft | 6 | 32×32 |
| `player_melee_attack` | Nahkämpfer Basisangriff (Schwert) | 4 | 32×32 |
| `player_melee_dash` | Nahkämpfer Sturmangriff (Q) | 3 | 32×32 |
| `player_melee_shield` | Nahkämpfer Schildwall (E) | 2 | 32×32 |
| `player_melee_death` | Nahkämpfer stirbt | 4 | 32×32 |
| `player_ranged_idle` | Fernkämpfer steht | 4 | 32×32 |
| `player_ranged_walk` | Fernkämpfer läuft | 6 | 32×32 |
| `player_ranged_attack` | Fernkämpfer Schuss (Basis) | 4 | 32×32 |
| `player_ranged_rapid` | Fernkämpfer Schnellfeuer (Q) | 4 | 32×32 |
| `player_ranged_death` | Fernkämpfer stirbt | 4 | 32×32 |
| `player_mage_idle` | Magier steht | 4 | 32×32 |
| `player_mage_walk` | Magier läuft | 6 | 32×32 |
| `player_mage_cast` | Magier Basiszauber (LMB) | 4 | 32×32 |
| `player_mage_fireball` | Magier Feuerball-Cast (Q) | 3 | 32×32 |
| `player_mage_blink` | Magier Blink (E) – Optional: Post-Blink-Wisch | 2 | 32×32 |
| `player_mage_death` | Magier stirbt | 4 | 32×32 |

**Richtungsvarianten:** Wenn 4-Directional, multipliziere walk/idle mit 4.  
**Minimalstart für Prototyp:** Nur `idle` (1 Frame), `walk` (4 Frames), `attack` (3 Frames), `death` (3 Frames) → reicht für P5.

### 1.2 Gegner-Sprites

| Asset-ID | Beschreibung | Frames | Größe | Prio |
|----------|-------------|--------|-------|------|
| `enemy_bruiser_idle` | Bruiser steht | 4 | 48×48 | P5 |
| `enemy_bruiser_walk` | Bruiser läuft | 4 | 48×48 | P5 |
| `enemy_bruiser_attack` | Bruiser schlägt zu | 3 | 48×48 | P5 |
| `enemy_bruiser_death` | Bruiser stirbt | 4 | 48×48 | P5 |
| `enemy_runner_idle` | Runner steht | 4 | 32×32 | Später |
| `enemy_runner_walk` | Runner läuft | 6 | 32×32 | Später |
| `enemy_runner_attack` | Runner greift an | 3 | 32×32 | Später |
| `enemy_runner_death` | Runner stirbt | 4 | 32×32 | Später |
| `enemy_spitter_idle` | Spitter steht | 4 | 40×40 | Später |
| `enemy_spitter_walk` | Spitter läuft | 4 | 40×40 | Später |
| `enemy_spitter_attack` | Spitter spuckt | 3 | 40×40 | Später |
| `enemy_spitter_death` | Spitter stirbt | 4 | 40×40 | Später |

Bruiser ist 48×48 (größer, bedrohlicher). Runner/Spitter 32–40 px.

### 1.3 Projektile

| Asset-ID | Beschreibung | Größe | Prio |
|----------|-------------|-------|------|
| `proj_arrow` | Pfeil (Fernkämpfer Basis + Schnellfeuer) | 16×4 | P5 |
| `proj_fireball` | Feuerball (Magier Q) | 16×16 | P5 (wenn Mage im Prototyp) |
| `proj_net` | Netzfallengeschoss (Fernkämpfer E) | 16×16 | Später |
| `proj_spit` | Spitter-Geschoss | 12×12 | Später |
| `proj_aoe_blast` | Feuerball-Einschlag (AoE-Ring) | 48×48 | P5 |

### 1.4 Map / Tileset

| Asset-ID | Beschreibung | Größe | Prio |
|----------|-------------|-------|------|
| `tileset_grass` | Gras-Tile (Boden) | 32×32 | P4 |
| `tileset_path` | Weg / Pflaster | 32×32 | P4 |
| `tileset_wall` | Wand / Fels (Kollision) | 32×32 | P4 |
| `tileset_bush` | Busch / Deko | 32×32 | P4 |
| `tileset_tree` | Baum (Kollision + Deko) | 32×48 | P4 |
| `tileset_water` | Wasser (opt., Kollision) | 32×32 | Optional |

Minimal: 1 Boden-Tile + 1 Wand-Tile reicht für eine spielbare Map.  
Besser: 3–4 Boden-Varianten + 1 Wand + 2 Deko.

### 1.5 Lootkiste

| Asset-ID | Beschreibung | Frames | Größe | Prio |
|----------|-------------|--------|-------|------|
| `chest_closed` | Kiste geschlossen | 1 | 32×32 | P7 |
| `chest_open` | Kiste geöffnet | 1 | 32×32 | P7 |
| `chest_opening` | Öffnungs-Animation | 3 | 32×32 | Optional |

### 1.6 UI / HUD (React-Seite, nicht Phaser)

| Asset-ID | Beschreibung | Format | Prio |
|----------|-------------|--------|------|
| `ui_hp_bar_bg` | HP-Leiste Hintergrund | PNG 200×20 | P5 |
| `ui_hp_bar_fill` | HP-Leiste Füllung (grün) | PNG 200×20 | P5 |
| `ui_resource_bar_bg` | Mana/Stamina Hintergrund | PNG 200×12 | P5 |
| `ui_resource_bar_mana` | Mana-Füllung (blau) | PNG 200×12 | P5 |
| `ui_resource_bar_stamina` | Stamina-Füllung (gelb) | PNG 200×12 | P5 |
| `ui_xp_bar_bg` | XP-Leiste Hintergrund | PNG 300×8 | P6 |
| `ui_xp_bar_fill` | XP-Leiste Füllung (lila) | PNG 300×8 | P6 |
| `ui_skill_slot` | Skill-Slot Hintergrund (Q/E) | PNG 48×48 | P5 |
| `ui_skill_cooldown` | Cooldown-Overlay (radial oder dunkel) | PNG 48×48 | P5 |
| `ui_inventory_slot` | Inventar-Slot Hintergrund | PNG 48×48 | P7 |
| `ui_rarity_border_common` | Rahmen gewöhnlich (grau) | PNG 48×48 | P7 |
| `ui_rarity_border_uncommon` | Rahmen ungewöhnlich (grün) | PNG 48×48 | P7 |
| `ui_rarity_border_rare` | Rahmen selten (blau) | PNG 48×48 | P7 |
| `ui_rarity_border_epic` | Rahmen episch (lila) | PNG 48×48 | P7 |

HUD kann auch komplett mit CSS/React gebaut werden ohne PNGs. Skill-Icons und Rarity-Borders sind die einzigen, die wirklich Bilder brauchen.

---

## Prio 2 – Wichtig für ein vollständiges Gefühl, aber nicht blockierend

### 2.1 Item-Icons (für Inventar)

| Asset-ID | Beschreibung | Größe | Prio |
|----------|-------------|-------|------|
| `icon_starter_melee_chest` | Starter-Rüstung (Nahkämpfer) | 32×32 | P7 |
| `icon_starter_melee_weapon` | Starter-Schwert | 32×32 | P7 |
| `icon_starter_ranged_chest` | Leichte Rüstung (Fernkämpfer) | 32×32 | P7 |
| `icon_starter_ranged_weapon` | Starter-Bogen | 32×32 | P7 |
| `icon_starter_mage_chest` | Leichte Robe (Magier) | 32×32 | P7 |
| `icon_starter_mage_weapon` | Zauberfokus | 32×32 | P7 |
| `icon_loot_common_chest` | Verstärkte Lederrüstung | 32×32 | P7 |
| `icon_loot_uncommon_chest` | Gepanzerter Wams | 32×32 | P7 |
| `icon_loot_common_weapon` | Rostige Axt | 32×32 | P7 |
| `icon_loot_rare_chest` | Dornenpanzer | 32×32 | P7 |
| `icon_loot_epic_weapon` | Klinge der alten Kriege | 32×32 | P7 |

### 2.2 Skill-Icons

| Asset-ID | Beschreibung | Größe | Prio |
|----------|-------------|-------|------|
| `icon_skill_dash` | Sturmangriff-Icon | 32×32 | P5 |
| `icon_skill_shield_wall` | Schildwall-Icon | 32×32 | P5 |
| `icon_skill_rapid_fire` | Schnellfeuer-Icon | 32×32 | P5 |
| `icon_skill_slow_shot` | Netzfalle-Icon | 32×32 | P5 |
| `icon_skill_fireball` | Feuerball-Icon | 32×32 | P5 |
| `icon_skill_blink` | Blink-Icon | 32×32 | P5 |
| `icon_basic_attack` | Basisangriff-Icon (alle Klassen) | 32×32 | P5 |

### 2.3 Effekte (VFX)

| Asset-ID | Beschreibung | Frames | Größe | Prio |
|----------|-------------|--------|-------|------|
| `vfx_hit_slash` | Treffer-Slash (Nahkampf) | 3 | 32×32 | Optional |
| `vfx_hit_impact` | Treffer-Aufprall (generisch) | 3 | 24×24 | Optional |
| `vfx_levelup` | Level-Up-Burst | 6 | 64×64 | P6 |
| `vfx_chest_glow` | Kisten-Glühen beim Öffnen | 4 | 48×48 | P7 |
| `vfx_death_poof` | Tod-Staubwolke (Gegner) | 4 | 48×48 | P5 |
| `vfx_dash_trail` | Dash-Spur (Nahkämpfer) | 3 | 32×32 | Optional |
| `vfx_blink_flash` | Blink-Blitz (Magier) | 2 | 32×32 | Optional |
| `vfx_shield_glow` | Schildwall-Glühen | 2 | 48×48 | Optional |

---

## Prio 3 – Audio (kann nachträglich rein)

### 3.1 SFX

| Asset-ID | Beschreibung | Dauer | Prio |
|----------|-------------|-------|------|
| `sfx_melee_swing` | Schwert-Schwung | 0.3 s | P5 |
| `sfx_arrow_shoot` | Pfeil-Schuss | 0.2 s | P5 |
| `sfx_magic_cast` | Zauber-Sound | 0.3 s | P5 |
| `sfx_enemy_hit` | Gegner wird getroffen | 0.2 s | P5 |
| `sfx_enemy_death` | Gegner stirbt | 0.5 s | P5 |
| `sfx_player_hit` | Spieler wird getroffen | 0.2 s | P5 |
| `sfx_player_death` | Spieler stirbt | 0.5 s | P5 |
| `sfx_chest_open` | Kiste öffnet sich | 0.4 s | P7 |
| `sfx_levelup` | Level-Up-Jingle | 0.8 s | P6 |
| `sfx_footstep` | Schritt (loopbar) | 0.3 s | Optional |

### 3.2 Musik

| Asset-ID | Beschreibung | Dauer | Prio |
|----------|-------------|-------|------|
| `bgm_adventure` | Hintergrundmusik Abenteuer-Map | 2–3 min Loop | Optional |

---

## Prio 4 – Später (nicht Prototyp)

- Runner + Spitter komplette Sprite-Sets
- Hub-Map Tileset (Social Hub, M9)
- NPC-Sprites (Händler, Gilden)
- Kosmetik-Skins
- Boss-Sprites
- Mehr Biome / Tilesets
- Staking/Mint/Claim UI-Assets
- Charakter-Portraits (für Helden-Auswahl)

---

## Minimal-Set für ersten spielbaren Prototyp (P4–P7)

Wenn du so schnell wie möglich etwas Lauffähiges haben willst:

| Was | Wie viele | Bemerkung |
|-----|----------|-----------|
| Spieler-Sprites | 3 Klassen × 4 Anims (idle, walk, attack, death) | Minimum: 1 Frame für idle, 4 für walk, 3 für attack, 3 für death |
| Gegner-Sprites | 1 Bruiser × 4 Anims | 48×48, grßer und bedrohlich |
| Projektile | 2 (arrow, fireball) | Plus 1 AoE-Blast |
| Tileset | 2 Tiles (Boden + Wand) | Minimum für eine spielbare Map |
| Kiste | 2 States (closed, open) | 32×32 |
| HUD | CSS-basiert, 7 Skill-Icons | Keine PNGs nötig für HP/XP-Bars |
| Item-Icons | 11 (6 Starter + 5 Loot) | 32×32, kannst du mit Platzhalter-Rechtecken starten |
| VFX | 1 (death_poof) | Rest optional |
| Audio | 0 | Kann komplett wegbleiben für Prototyp |

**Total Minimum:** ~25 Sprite-Sheets/Icons + 2 Tiles + 1 VFX = **~28 Assets** für einen spielbaren Prototyp.

---

## Empfohlene Ordnerstruktur

```
apps/web/public/assets/
├── sprites/
│   ├── player/
│   │   ├── melee.png          # Sprite-Sheet
│   │   ├── melee.json         # Atlas (optional am Anfang)
│   │   ├── ranged.png
│   │   ├── ranged.json
│   │   ├── mage.png
│   │   └── mage.json
│   ├── enemies/
│   │   ├── bruiser.png
│   │   ├── bruiser.json
│   │   ├── runner.png         # später
│   │   └── spitter.png        # später
│   └── projectiles/
│       ├── arrow.png
│       ├── fireball.png
│       └── aoe_blast.png
├── tilemaps/
│   ├── prototype_map_01.json  # Tiled-Export
│   └── tileset_grass.png
├── objects/
│   ├── chest_closed.png
│   └── chest_open.png
├── icons/
│   ├── items/
│   │   ├── starter_melee_chest.png
│   │   ├── starter_melee_weapon.png
│   │   └── ...
│   └── skills/
│       ├── dash.png
│       ├── shield_wall.png
│       └── ...
├── vfx/
│   ├── death_poof.png
│   └── levelup.png
└── audio/
    ├── sfx/
    │   ├── melee_swing.ogg
    │   └── ...
    └── music/
        └── adventure_loop.ogg
```

---

## Quellen-Tipps für kostenlose Assets

- [itch.io](https://itch.io/game-assets/free) – Filter: 2D, Sprites, Top-Down
- [OpenGameArt.org](https://opengameart.org) – CC0/CC-BY Sprites
- [Kenney.nl](https://kenney.nl) – CC0 Asset Packs (sehr Phaser-freundlich)
- [LPC (Liberated Pixel Cup)](https://lpc.opengameart.org) – 32×32 Top-Down Charaktere
- [0x72 Dungeon Tileset](https://0x72.itch.io/dungeontileset-ii) – 16×16, CC0
