# Ergänzende Anforderungen für den "Kleeblatt Adventure" Prototypen

Basierend auf dem aktuellen Stand des Repositories und den verfügbaren Assets wurden folgende Lücken identifiziert, die für ein vollständiges "Basic Adventure"-Gefühl im Prototypen geschlossen werden sollten.

## 1. Funktionale Gebäude & Strukturen
Aktuell gibt es dekorative Gebäude. Für den Prototypen fehlen jedoch interaktive Orte, die den Spielzyklus (Loop) unterstützen:

| Gebäude | Funktion im Prototyp | Wichtigkeit |
| :--- | :--- | :--- |
| **Schmiede (Blacksmith)** | Aufwertung von Ausrüstung; Reparatur. | Hoch |
| **Gasthaus (Inn)** | Wiederherstellung von HP/Mana; Speicherpunkt. | Mittel |
| **Gemischtwarenladen** | Kauf von Verbrauchsgütern (Heiltränke). | Mittel |
| **Schrein / Respawn-Punkt** | Visuelle Markierung des Startpunkts auf der Map. | Hoch |
| **Dungeon-Portal** | Klarer Übergang von der sicheren Zone in Kampfgebiete. | Hoch |

## 2. Erweiterte Ausrüstung (Equipment)
Der Prototyp nutzt aktuell nur `weapon` und `chest`. Für ein motivierendes Loot-System fehlen:

*   **Zusätzliche Slots:**
    *   **Helm:** Kopfschutz, erhöht meist Verteidigung oder Sichtweite.
    *   **Stiefel:** Erhöhen die Bewegungsgeschwindigkeit (`speed`).
    *   **Schild:** Exklusiv für die `melee` Klasse (Block-Chance).
*   **Accessoires (Ideal für Blockchain-Stats):**
    *   **Ringe/Amulette:** Könnten seltene Stats wie "Kritische Trefferchance" oder "Erhöhte Drop-Rate" (Luck) enthalten.
*   **Verbrauchsgüter (Consumables):**
    *   **Heiltrank (HP):** Sofortige Heilung im Kampf.
    *   **Manatrank (Mana):** Wichtig für die `mage` Klasse.

## 3. Klassenspezifische Skills
Um die Klassen `melee`, `ranged` und `mage` spielerisch abzuheben, werden folgende Basis-Skills empfohlen:

### Melee (Krieger)
*   **Passiv:** *Zähigkeit* (+10% max HP).
*   **Aktiv (Q):** *Schildstoß* – Stößt Gegner zurück und betäubt sie kurzzeitig.

### Ranged (Waldläufer)
*   **Passiv:** *Leichtfüßigkeit* (+15% Bewegungsgeschwindigkeit).
*   **Aktiv (Q):** *Mehrfachschuss* – Feuert 3 Pfeile in einem Fächer ab.

### Mage (Magier)
*   **Passiv:** *Meditation* (+5% Mana-Regeneration pro Sekunde).
*   **Aktiv (Q):** *Frostnova* – Verlangsamt alle Gegner im Umkreis des Magiers.

## 4. Kern-Adventure-Mechaniken (MVP)
Was ein Abenteuer erst lebendig macht:

1.  **Quest-Indikatoren:** Ein einfaches "!" über NPCs, um anzuzeigen, dass sie eine Aufgabe haben.
2.  **Zerstörbare Objekte:** Fässer oder Kisten in der Welt, die beim Zerstören kleine Mengen Gold oder Heiltränke fallen lassen.
3.  **Loot-Animation:** Visuelle Effekte (Glow), wenn ein Item auf dem Boden liegt, bevor es aufgesammelt wird.
4.  **Mini-Map:** Eine einfache Orientierungshilfe in der Ecke des Bildschirms.

## 5. Blockchain-Integration (Visuell)
*   **Raritäts-Glow:** Items im Inventar sollten je nach Seltenheit (`common`, `uncommon`, `rare`, `epic`) einen farbigen Rahmen haben.
*   **"Secured"-Badge:** Ein kleines Schloss-Icon an Items, die bereits auf der Blockchain gesichert wurden.
