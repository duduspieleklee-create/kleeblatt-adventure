# Detailliertes Asset-Mapping für Kleeblatt Adventure

Dieses Dokument verknüpft die Spiel-Elemente aus der Asset-Liste mit den physischen Dateipfaden im Repository. Alle Pfade beziehen sich auf das Verzeichnis `apps/web/public/assets/`.

## 1. Charaktere & Klassen (Menschlich)
Alle menschlichen Animationen liegen unter `assets/characters/`. Die Dateinamen folgen dem Muster `{frisur}_{animation}_strip{frames}.png`.

| Spielrolle | Animation (Beispiel: Longhair) | Pfad-Muster |
| :--- | :--- | :--- |
| **Krieger** | `longhair_attack_strip10.png` | `assets/characters/longhair_attack_...` |
| **Krieger** | `longhair_axe_strip10.png` | `assets/characters/longhair_axe_...` |
| **Magier** | `longhair_casting_strip15.png` | `assets/characters/longhair_casting_...` |
| **Sammler** | `longhair_mining_strip10.png` | `assets/characters/longhair_mining_...` |
| **Sammler** | `longhair_dig_strip13.png` | `assets/characters/longhair_dig_...` |
| **Basis (Alle)** | `longhair_walk_strip8.png` | `assets/characters/longhair_walk_...` |

## 2. Gegner & NPCs
| Kreatur | Animation | Dateiname |
| :--- | :--- | :--- |
| **Skelett** | Angriff | `skeleton_attack_strip7.png` |
| **Skelett** | Tod | `skeleton_death_strip10.png` |
| **Skelett** | Gehen | `skeleton_walk_strip8.png` |
| **Goblin** | Angriff | `spr_attack_strip10.png` |
| **Goblin** | Laufen | `spr_run_strip8.png` |
| **Goblin** | Axt-Kampf | `spr_axe_strip10.png` |

## 3. Tiere (Pets)
Pfad: `assets/elements/animals/`

| Tier | Dateiname | Rolle |
| :--- | :--- | :--- |
| **Kuh** | `spr_deco_cow_strip4.png` | Freund (Milchquelle) |
| **Schaf** | `spr_deco_sheep_01_strip4.png` | Freund (Wollquelle) |
| **Huhn** | `spr_deco_chicken_01_strip4.png` | Freund (Eierquelle) |
| **Schwein** | `spr_deco_pig_01_strip4.png` | Freund (Trüffelsuche) |
| **Ente** | `spr_deco_duck_01_strip4.png` | Freund / Zierde |
| **Vogel** | `spr_deco_bird_01_strip4.png` | Begleiter |

## 4. Umwelt & Gebäude (Neu!)
Ich habe im Archiv ein Gebäude-Set gefunden, das wir für die funktionalen Orte nutzen können.

| Typ | Pfad / Dateiname | Verwendung im Spiel |
| :--- | :--- | :--- |
| **Basis-Gebäude** | `assets/tilesets/SUNNYSIDE_WORLD_BUILDINGS_V0.01.png` | Grundstrukturen für Häuser |
| **Schmiede / Laden** | `assets/tilesets/spr_tileset_sunnysideworld_16px.png` | Enthält Amboss, Tresen und Schilder |
| **Wald-Tileset** | `assets/tilesets/spr_tileset_sunnysideworld_forest_32px.png` | Bäume und Vegetation |
| **Nutzpflanzen** | `assets/elements/crops/` | Kürbis, Weizen, Karotten, etc. |

## 5. UI, Werkzeuge & Items
Die UI-Icons enthalten bereits fast alles, was wir für die Ausrüstung brauchen.

| Element | Dateiname | Verwendung |
| :--- | :--- | :--- |
| **Schwert** | `sword.png` | Waffe (Krieger) |
| **Axt** | `axe.png` | Werkzeug / Waffe |
| **Hammer** | `hammer.png` | Werkzeug (Schmiede) |
| **Spitzhacke** | `pickaxe.png` | Werkzeug (Bergbau) |
| **Angel** | `rod.png` | Werkzeug (Fischen) |
| **Trank / Wasser** | `water.png` | Kann als Basis für Heiltränke dienen |
| **Loot-Kiste** | `itemdisc_01.png` / `_02.png` | Kann als "Loot-Glow" oder Token dienen |
| **Quest-Marker** | `expression_alerted.png` | Das "!" über NPCs |
| **Statusbalken** | `redbar_00.png` bis `06` | Lebensanzeige |
| **Mana-Balken** | `bluebar_00.png` bis `05` | Magieanzeige |
| **Ausdauer** | `greenbar_00.png` bis `06` | Energieanzeige |
