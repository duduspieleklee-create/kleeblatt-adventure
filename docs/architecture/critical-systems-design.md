# Kleeblatt Adventure — Kritische Systeme (Pre-Implementation)

---

## 1. Tod & Respawn

### Philosophie

> Kein Fortschrittsverlust — aber die Welt erinnert sich.

Spieler verlieren beim Tod **weder XP noch Gold noch Items**. Die einzige Konsequenz ist **Karma-Verlust**. Das hält das Spiel fair und frustrationsarm, gibt dem Tod aber trotzdem Gewicht — weil Karma die Welt verändert.

**Im Dungeon gelten härtere Regeln:** Der gesamte Run ist verloren. Kein Trost.

---

### Tod auf der Weltkarte (Map-Tod)

| Konsequenz | Wert |
|-----------|------|
| XP-Verlust | ❌ Keiner |
| Gold-Verlust | ❌ Keiner |
| Item-Verlust | ❌ Keiner |
| Karma-Verlust | **−5 Karma** |
| Respawn | Nächstes Dorf / Checkpoint |
| Respawn-Zeit | Sofort |

**Karma-Verlust skaliert mit der Situation:**

| Todesursache | Karma-Verlust |
|-------------|--------------|
| Von Monster getötet | −5 |
| Von Spieler getötet (PvP, falls vorhanden) | −3 (Opfer verliert weniger) |
| Eigenverschulden (Fall, Falle, etc.) | −2 |

Der Verlust ist bewusst moderat — ein einziger Tod soll keinen Karma-Absturz auslösen. Aber wiederholtes Sterben treibt den Spieler langsam Richtung Neutral → Dunkel.

---

### Tod im Dungeon (Dungeon-Tod)

| Konsequenz | Wert |
|-----------|------|
| XP-Verlust | ❌ Keiner |
| Gold-Verlust | ❌ Keiner |
| Item-Verlust | ❌ Keiner |
| Karma-Verlust | **−10 Karma** |
| Dungeon-Run | 💀 **Komplett verloren** — kein XP, kein Gold, keine Chest |
| Dungeon-Reset | Vollständig zurückgesetzt |
| Respawn | Dungeon-Eingang / letztes Dorf |

"Pech" trifft es — wer im Dungeon stirbt, verliert den gesamten Fortschritt des Runs. Das macht Dungeons spannungsgeladen ohne das Gesamtspiel zu bestrafen.

**Gruppenregel (falls Co-op):**
- Wenn ein Spieler stirbt, haben Mitspieler **60 Sekunden** um ihn wiederzubeleben (verbraucht eine Minor Potion)
- Stirbt der letzte lebende Spieler: Run komplett verloren für alle

---

### Karma-Verlauf durch Tod

Beispielszenarien:

```
Gesegneter Spieler (Karma +80):
  3 Map-Tode → Karma: +80 → +65 → Tugendhaft — spürbare Veränderung

Neutraler Spieler (Karma 0):
  2 Dungeon-Tode → Karma: 0 → −20 → Dunkel — NPC-Reaktionen ändern sich

Verdammter Spieler (Karma −80):
  Sterben → weiterer Karma-Verlust — nähert sich −100 (Verdammt-Boden)
```

**Karma-Boden:** −100. Kein weiterer Verlust darunter — Spieler im Verdammt-Tier werden nicht endlos weiter bestraft.

---

## 2. Weltkarte & Zonen-Struktur

### 5 Zonen — 1 pro Level-Bracket

Jede Zone entspricht einem Level-Bracket und hat eine eigene Ästhetik, Gegnertypen und Dungeon-Tier.

| Zone | Name | Level | Ästhetik | Dungeon-Tier | Neue Gegner |
|------|------|-------|----------|-------------|-------------|
| 1 | **Grünes Tal** | 1–4 | Wald, Dorf, Wiesen | T1 | Goblin Scout, Forest Wolf |
| 2 | **Wüstenruinen** | 5–9 | Wüste, verfallene Tempel | T1/T2 | Stone Golem, Shadow Rogue |
| 3 | **Finstermoor** | 10–14 | Sumpf, Nebelwald | T2 | Poison Spiderling, Cursed Skeleton |
| 4 | **Glutgipfel** | 15–19 | Vulkane, Gebirgspässe | T2/T3 | Thunder Drake, Blood Vampire |
| 5 | **Schattenwelt** | 20–25 | Void-Landschaft, Dunkelheit | T3 | Void Wraith, Ancient Colossus |

---

### Reisen zwischen Zonen

```
Zone 1 → Zone 2: Freigeschaltet ab Lv 5 (automatisch)
Zone 2 → Zone 3: Freigeschaltet ab Lv 10
Zone 3 → Zone 4: Freigeschaltet ab Lv 15
Zone 4 → Zone 5: Freigeschaltet ab Lv 20
```

**Reisemethoden:**

| Methode | Verfügbarkeit | Kosten | Zeit |
|---------|--------------|--------|------|
| Zu Fuß (Weltkarte) | Immer | Kostenlos | Langsam |
| Schnellreise-Portal | Nach erstem Besuch der Zone | 10–30g | Sofort |
| Händler-Mount (kaufbar) | Ab Lv 5, beim Händler | 500g einmalig | Schnell |

Schnellreise-Portale erscheinen in jedem Zonen-Hauptdorf. Einmal entdeckt, dauerhaft nutzbar.

---

### Was jede Zone enthält

**Pro Zone fix vorhanden:**
- 1 Hauptdorf (Schmied + Händler-Spawn-Punkt + Speicherpunkt / Respawn)
- 2–4 kleinere Außenposten (nur Speicherpunkt, kein Händler)
- 3–6 Dungeon-Eingänge (unterschiedliche Dungeon-Instanzen)
- Farmland / Gartenplots (Anzahl steigt mit Zone)
- Spawn-Gebiete für Zonen-typische Gegner

**Farmland pro Zone:**

| Zone | Farm-Plots | Max. Pflanzentier |
|------|-----------|-----------------|
| 1 – Grünes Tal | 4 Plots | Seedling, Herb |
| 2 – Wüstenruinen | 6 Plots | Herb |
| 3 – Finstermoor | 8 Plots | Herb, Bloom |
| 4 – Glutgipfel | 10 Plots | Bloom, Rootvine |
| 5 – Schattenwelt | 12 Plots | Rootvine |

Höhere Zonen = mehr Plots + bessere Pflanzen. Wer in der Schattenwelt farmt, hat die besten Brauzutaten.

---

### Gegner-Spawn auf der Weltkarte

- Gegner spawnen in bestimmten **Gebieten** innerhalb einer Zone (nicht überall)
- Ab **Lv 20** geben Weltkarten-Monster **0 XP** — Spieler werden natürlich in Dungeons gedrängt
- Monster respawnen alle **5 Minuten** in ihrem Gebiet

---

## 3. Dungeon-Eintrittsregeln

### Dungeon-Schlüssel (Zugang)

Jeder Dungeon benötigt einen **Dungeon-Schlüssel** zum Betreten. Kein Schlüssel = kein Eintritt.

| Schlüsseltyp | Dungeon-Tier | Beschaffung |
|-------------|-------------|-------------|
| Rostiger Schlüssel | T1 (Lv 1+) | Crafting (Eisenschrott × 3) oder Händler (50g) |
| Abenteuer-Schlüssel | T2 (Lv 8+) | Crafting (Stahl-Splitter × 2 + 100g) oder Händler (200g) |
| Legende-Schlüssel | T3 (Lv 20+) | Crafting (Void-Erz × 1 + Rootvine-Trank × 1 + 500g) |

**Schlüssel sind Einweg-Items** — nach dem Dungeon-Betreten verbraucht, egal ob Run erfolgreich oder nicht. Wer stirbt, verliert den Schlüssel mit.

Das macht den Legende-Schlüssel zum doppelten Gold-Sink: schwer zu craften, und bei Tod weg.

---

### Dungeon-Cooldown

Nach einem abgeschlossenen Dungeon-Run:

| Dungeon-Tier | Cooldown |
|-------------|----------|
| T1 | 20 Minuten |
| T2 | 35 Minuten |
| T3 | 60 Minuten |

Der Cooldown gilt **pro Dungeon-Instanz**, nicht pro Spieler. Unterschiedliche Dungeon-Eingänge haben eigene Cooldowns — Spieler können also mehrere T3-Dungeons nacheinander laufen, solange sie verschiedene Eingänge nutzen.

Stirbt der Spieler: **kein Cooldown** — der Run gilt als nicht abgeschlossen. Sofortiger Wiedereintritt möglich (aber neuer Schlüssel nötig).

---

### Gruppengröße & Party-Regeln

| Dungeon-Tier | Min. Spieler | Max. Spieler |
|-------------|-------------|-------------|
| T1 | 1 | 2 |
| T2 | 1 | 3 |
| T3 | 1 | 4 |

**XP-Verteilung in der Gruppe:**

```
Solo:        100% der Completion-XP
2 Spieler:   75% pro Spieler  (150% gesamt — kleiner Gruppen-Bonus)
3 Spieler:   60% pro Spieler  (180% gesamt)
4 Spieler:   55% pro Spieler  (220% gesamt — lohnt sich stark)
```

Gruppenspiel ist bewusst effizienter — fördert Co-op ohne Solo zu bestrafen.

---

### Dungeon-Zugangs-Zusammenfassung

```
Spieler steht vor Dungeon-Eingang
  → Lv-Gate erfüllt? (T2: Lv 8+, T3: Lv 20+)
  → Schlüssel im Inventar?
  → Dungeon nicht im Cooldown?
  → Party-Größe ≤ Maximum?

Alle ✅ → Dungeon startet, Schlüssel wird verbraucht
Ein ❌ → Eintritt verweigert, Fehlermeldung mit Grund
```

---

## Zusammenspiel der drei Systeme

```
TOD IM DUNGEON
  → Run verloren (kein XP, kein Gold, keine Chest)
  → Karma −10
  → Schlüssel verloren
  → Kein Cooldown (sofort neuer Versuch möglich)
  → Neuen Schlüssel craften/kaufen
  → Wieder rein

TOD AUF DER KARTE
  → Karma −5
  → Respawn im Dorf
  → Weiter spielen

WIEDERHOLTE TODE → sinkende Karma → Welt reagiert anders
  → Händler teurer, NPCs misstrauisch (Dunkel)
  → ODER: Shadow-Dungeons freigeschaltet (Verdammt) — ein anderer Spielstil
```
