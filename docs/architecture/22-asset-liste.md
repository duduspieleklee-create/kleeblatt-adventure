# Asset-Liste für Kleeblatt Adventure

Dieses Dokument enthält eine detaillierte Übersicht und Kategorisierung der verfügbaren Assets für das Blockchain-2D-Adventure-Browsergame **Kleeblatt Adventure**. Die Assets basieren auf dem Sunnyside World Pack (V2.1 und Archiv).

## 1. Spielbare Charaktere & Klassen
Basierend auf den verfügbaren Animationen für den menschlichen Basis-Charakter können wir drei Hauptklassen definieren. Jede Klasse kann durch die vier verfügbaren Frisuren (Bowl, Curly, Long, Mop) weiter individualisiert werden.

| Klasse | Primäre Animationen | Rolle im Spiel |
| :--- | :--- | :--- |
| **Krieger** | `spr_attack`, `spr_axe`, `spr_roll` | Nahkampf, hoher Schaden, Ausweichen. |
| **Magier** | `spr_casting`, `spr_waiting` | Fernkampf, Zaubersprüche, Unterstützung. |
| **Sammler / Abenteurer** | `spr_mining`, `spr_dig`, `spr_fishing`, `spr_hammering` | Ressourcenabbau, Crafting, Welt-Interaktion. |

> **Hinweis:** Alle Charaktere verfügen über grundlegende Animationen wie `Idle`, `Walk`, `Run`, `Jump`, `Hurt`, `Death` und `Swimming`.

## 2. NPCs & Gegner
Die Welt wird durch verschiedene freundliche und feindliche Kreaturen bevölkert.

### NPCs (Nicht-Spieler-Charaktere)
*   **Dorfbewohner:** Menschliche Charaktere mit verschiedenen Frisuren, die `spr_doing` oder `spr_waiting` Animationen nutzen.
*   **Händler / Questgeber:** Spezielle Charakter-Variationen (z. B. mit Hammer für Schmiede).

### Gegner
*   **Goblin:** Ein vielseitiger Gegner mit Animationen für Angriff, Axt-Kampf und Laufen.
*   **Skelett:** Ein klassischer Untoter mit Animationen für Angriff, Gehen und einen markanten Tod.

## 3. Pets & Tiere (Freunde vs. Feinde)
Wie gewünscht haben wir die Tiere in zwei Kategorien unterteilt. Da wir aktuell 6 Basistypen haben, erreichen wir die Zielzahl von jeweils 10 durch Farb- und Verhaltensvariationen.

### Freunde (10 Typen)
1.  **Kuh (Weiß/Gefleckt):** Produziert Milch.
2.  **Schaf (Wollig):** Produziert Wolle.
3.  **Huhn:** Produziert Eier.
4.  **Hausschwein:** Hilft beim Trüffelsuchen.
5.  **Ente:** Zierde für Teiche.
6.  **Spatz / Blauvogel:** Begleiter, der Items anzeigt.
7.  **Goldene Kuh:** Seltener Bonus-Begleiter.
8.  **Schwarzes Schaf:** Seltener Bonus-Begleiter.
9.  **Braunes Huhn:** Variation.
10. **Zahmer Goblin:** Ein seltener NPC-Begleiter.

### Feinde (10 Typen)
1.  **Wildschwein:** Greift den Spieler bei Sichtkontakt an.
2.  **Aggressive Ente:** Verteidigt ihr Revier im Wasser.
3.  **Raubvogel:** Greift aus der Luft an.
4.  **Dunkles Schaf:** Von Magie besessenes Tier.
5.  **Tollwütige Kuh:** Unvorhersehbares Verhalten.
6.  **Goblin-Späher:** Schwacher, schneller Gegner.
7.  **Skelett-Krieger:** Standard-Gegner in Dungeons.
8.  **Schleim (VFX-basiert):** Nutzt Staub-FX für Bewegungen.
9.  **Wald-Geist:** Nutzt Blatt-Effekte (`leaves_hit`).
10. **Skelett-Magier:** Nutzt Fernkampf-Animationen.

## 4. Umwelt & Tilesets
Die Welt besteht aus einem modularen 16px/32px Tileset.

*   **Gelände:** Gras, Erde, Wasser, Klippen, Wege.
*   **Vegetation:** Bäume (Wald-Tileset), Blumen, Nutzpflanzen (Kürbisse, Weizen).
*   **Gebäude:** Windmühlen, Fachwerkhäuser, Brücken, Zäune.
*   **VFX:** Kaminrauch, Staubwolken, Blatteffekte bei Treffern.

## 5. UI & Werkzeuge
*   **Werkzeuge:** Schwert, Axt, Spitzhacke, Schaufel, Hammer, Angel, Gießkanne.
*   **Statusanzeigen:** Rote Balken (Leben), Blaue Balken (Mana), Grüne Balken (Ausdauer/Hunger).
*   **Interaktion:** Verschiedene Cursor (Hand, Pfeil, Lupe) und Emoticons (Herz, Fragezeichen, Stress, Liebe).
