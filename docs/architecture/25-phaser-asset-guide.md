# Technischer Asset-Leitfaden für Phaser 3 (Kleeblatt Adventure)

Um eine reibungslose Integration in die **Phaser 3.0 Engine** zu gewährleisten, müssen die Assets in spezifischen Formaten und Strukturen vorliegen. Dieser Leitfaden orientiert sich an den Standards Ihres Projekts (32px Grid).

## 1. Asset-Kategorien

| Kategorie | Inhalt | Phaser-Lademethode |
| :--- | :--- | :--- |
| **Spritesheets** | Charaktere, Gegner, Tiere (Animationen) | `this.load.spritesheet()` |
| **Tilesets** | Umgebungsgrafiken (Böden, Wände, Bäume) | `tileset.addTilesetImage()` |
| **Tilemaps** | Level-Layouts und Objekt-Platzierung | `this.load.tilemapTiledJSON()` |
| **UI / Icons** | Buttons, Inventar-Slots, Cursor | `this.load.image()` oder `atlas()` |
| **Audio** | Hintergrundmusik (BGM), Soundeffekte (SFX) | `this.load.audio()` |
| **VFX** | Partikeleffekte (Rauch, Funken) | `this.load.atlas()` |

---

## 2. Formate & Spezifikationen

### A. Grafiken (Bilder & Sprites)
*   **Format:** `.png` (8-Bit oder 24-Bit mit Alpha-Kanal für Transparenz).
*   **Spritesheets:** Alle Einzelbilder einer Animation müssen exakt die gleiche Größe haben (z. B. 64x64 Pixel für einen 32px Charakter inkl. Rand).
*   **Texture Atlas:** Für UI-Elemente empfiehlt sich ein Atlas (eine große PNG + eine `.json` Datei), um die Anzahl der Web-Requests zu minimieren.

### B. Tilemaps & Tilesets
*   **Editor:** Verwenden Sie **Tiled** (Map Editor).
*   **Format:** Export als `.json` (nicht XML oder CSV).
*   **Tile-Größe:** Basierend auf Ihrer `game-config.json` ist der Standard **32x32 Pixel**.
*   **Tileset-Padding:** Lassen Sie 1-2 Pixel Abstand (Extrusion) zwischen den Tiles im PNG, um "Bleeding"-Effekte (kleine Linien zwischen Tiles beim Zoomen) zu vermeiden.

### C. Map-Größen & Performance
Phaser kann theoretisch sehr große Maps laden, aber für einen flüssigen Browser-Prototypen gelten folgende Richtwerte:
*   **Prototyp-Map:** 50x50 Tiles (bei 32px = 1600x1600 Pixel). Das entspricht der Größe in Ihrer Konfiguration.
*   **Maximale Größe:** Vermeiden Sie Maps über 200x200 Tiles in einer einzigen Szene. Nutzen Sie stattdessen "Chunks" oder Szenenwechsel.
*   **Ebenen (Layers):** Begrenzen Sie die Anzahl der Tile-Layer (z. B. Ground, Decoration, Overlap). Jeder Layer erhöht die Render-Last.

---

## 3. Kurzanleitung zur Einbindung

### Schritt 1: Spritesheet vorbereiten
Stellen Sie sicher, dass Animationen wie `walk` oder `attack` in einer horizontalen Reihe (Strip) angeordnet sind.
*Beispiel:* Ein 4-Frame Walk-Zyklus für einen 32px Charakter sollte ein PNG von 128x32 Pixel sein.

### Schritt 2: Tiled Export
1.  Erstellen Sie eine neue Map in Tiled (Orientierung: Orthogonal, Format: JSON).
2.  Wichtig: Stellen Sie sicher, dass "Embed Tilesets" **deaktiviert** ist. Phaser benötigt das Tileset-Bild separat.

### Schritt 3: Laden in Phaser
```javascript
// In der preload() Funktion
this.load.image('tiles', 'assets/tilesets/sunnyside_tiles.png');
this.load.tilemapTiledJSON('map', 'assets/maps/prototype_map.json');
this.load.spritesheet('hero', 'assets/chars/hero_walk.png', { frameWidth: 32, frameHeight: 32 });

// In der create() Funktion
const map = this.make.tilemap({ key: 'map' });
const tileset = map.addTilesetImage('sunnyside_world', 'tiles');
const layer = map.createLayer('Ground', tileset, 0, 0);
```

## 4. Audio-Besonderheiten
*   **BGM:** Nutzen Sie `.ogg` für beste Kompression im Browser, halten Sie `.mp3` als Fallback bereit.
*   **Looping:** Achten Sie darauf, dass Hintergrundmusik nahtlos loopt (Seamless Loop).
