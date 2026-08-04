# Kleeblatt Adventure — Inventar-System

---

## Übersicht

Das Inventar besteht aus drei Bereichen:

```
┌─────────────────────────────────────────────────────┐
│  AUSRÜSTUNG          │  RUCKSACK        │  TRUHE    │
│  (6 Slots, immer)   │  (getragen)      │  (Dorf)   │
└─────────────────────────────────────────────────────┘
```

---

## 1. Ausrüstungs-Slots (Equipment)

Immer sichtbar — das was der Charakter gerade trägt. Bereits in `stats-skills-design.md` definiert:

| Slot | Inhalt |
|------|--------|
| Kopf | Helm / Hut / Kapuze |
| Brust | Rüstung / Robe |
| Beine | Hose / Gamaschen |
| Stiefel | Schuhe / Stiefel |
| Waffe | Schwert / Bogen / Stab |
| Accessoire | Ring oder Amulett (1 Slot, 1 Item) |

Ausrüstungs-Slots zählen **nicht** zum Rucksack-Limit.

---

## 2. Rucksack (Backpack) — Getragenes Inventar

### Slot-Kapazität

| Zustand | Slots |
|---------|-------|
| Start (Lv 1) | 20 Slots |
| Nach Erweiterung I | 28 Slots |
| Nach Erweiterung II | 36 Slots |
| Nach Erweiterung III | 44 Slots (Maximum) |

**Erweiterungen** kauft man beim **Fliegenden Händler** (spezieller Slot, taucht nicht bei jedem Besuch auf):

| Erweiterung | Kosten | Freigeschaltet ab |
|------------|--------|-------------------|
| Rucksack I (+8 Slots) | 300g | Lv 5 |
| Rucksack II (+8 Slots) | 800g | Lv 10 |
| Rucksack III (+8 Slots) | 2,000g | Lv 18 |

---

### Item-Kategorien & Stapelregeln

| Kategorie | Stapelbar | Max. pro Stapel | Typische Slot-Nutzung |
|-----------|-----------|----------------|----------------------|
| Waffen | ❌ | 1 | 1 Slot pro Waffe |
| Rüstungsteile | ❌ | 1 | 1 Slot pro Teil |
| Accessoires | ❌ | 1 | 1 Slot pro Item |
| Tränke (alle Tiers) | ✅ | 10 | 1 Slot für bis zu 10× |
| Samen (alle Tiers) | ✅ | 20 | 1 Slot für bis zu 20× |
| Crafting-Materialien | ✅ | 50 | 1 Slot pro Materialtyp |
| Dungeon-Schlüssel | ✅ | 5 | 1 Slot für bis zu 5× |
| Versiegelte Truhen | ❌ | 1 | 1 Slot pro Truhe |
| Schmiede-Schemata | ✅ | 5 | 1 Slot pro Rezept |
| Quest-Items | ❌ | 1 | Eigener Slot, **nicht** ins Limit |

**Versiegelte Truhen** sind die wertvollsten Items im Spiel und stapeln nicht — wer viele Dungeons macht, muss seinen Rucksack aktiv managen.

---

### Schnellzugriff-Leiste (Hotbar)

**4 dedizierte Slots** für den Kampf — unabhängig vom Rucksack:

```
[Slot 1] [Slot 2] [Slot 3] [Slot 4]
```

- Nur Tränke und Weapon-Coatings können in die Hotbar
- Tastatur-/Controller-Shortcut für jeden Slot
- Wird aus dem Rucksack befüllt (kein eigenes Limit — Items bleiben auch im Rucksack)
- Im Dungeon überlebenswichtig — vor jedem Run vorbereiten

---

### Rucksack voll — Was passiert?

- Neue Items können **nicht** aufgenommen werden
- Dungeon-Drops die keinen Platz haben → **bleiben am Boden** (30 Sekunden aufhebbar, dann weg)
- Completion-Belohnungen (XP, Gold) werden immer gutgeschrieben — kein XP-Verlust durch volles Inventar
- Versiegelte Truhen aus Dungeon-Abschluss: Bei vollem Rucksack → **automatisch in die Truhe** (falls Dorf in der gleichen Zone zugänglich), sonst verloren

**Empfehlung an den Spieler:** Vor jedem T3-Dungeon den Rucksack aufräumen — Truhen brauchen Platz.

---

## 3. Truhe (Stash) — Lager im Dorf

Die Truhe ist bei **jedem Dorf-Schmied** zugänglich und zonenübergreifend synchronisiert. Was in Zone 1 eingelagert wird, ist in Zone 5 abrufbar.

### Kapazität

| Zustand | Slots |
|---------|-------|
| Start | 50 Slots |
| Erweiterung I | 75 Slots |
| Erweiterung II | 100 Slots |
| Erweiterung III | 150 Slots (Maximum) |

**Truhen-Erweiterungen** kauft man beim **Schmied**:

| Erweiterung | Kosten | Freigeschaltet ab |
|------------|--------|-------------------|
| Truhe I (+25 Slots) | 500g | Lv 8 |
| Truhe II (+25 Slots) | 1,500g | Lv 15 |
| Truhe III (+50 Slots) | 4,000g | Lv 20 |

Gleiche Stapelregeln wie Rucksack. Versiegelte Truhen können hier gelagert werden bis der passende Trank gebraut ist.

---

## 4. Inventar-Interaktionen mit anderen Systemen

### Farming & Brauen
```
Samen im Rucksack → auf Farm-Plot pflanzen → geerntete Pflanzen im Rucksack (stapeln bis 50)
→ zum Brauen: Pflanzen + Braustations-Interface → Trank landet im Rucksack
```

### Dungeon-Loop
```
Vor dem Dungeon:
  - Schlüssel im Rucksack ✅
  - Tränke in Hotbar vorbereitet ✅
  - Mind. 1 freier Slot für Truhen ✅

Nach Dungeon-Abschluss:
  - XP + Gold: automatisch gutgeschrieben (kein Slot nötig)
  - Versiegelte Truhe: braucht 1 freien Slot
  - Gear-Drop: braucht 1 freien Slot
```

### Truhe öffnen
```
Versiegelte Truhe im Rucksack + passender Trank im Rucksack
→ Öffnen-Interface → Inhalt landet direkt im Rucksack
→ Falls Rucksack voll: Inhalt geht in die Dorf-Truhe (Lager)
→ Falls auch die voll: Inhalt geht verloren (Warnung vorher!)
```

### Händler & Schmied
```
Verkaufen: Items direkt aus Rucksack oder Truhe verkaufbar
Kaufen: Neues Item braucht freien Rucksack-Slot
Upgrade: Item bleibt im Rucksack/Truhe, wird direkt upgradet (kein Transfer nötig)
```

---

## 5. Inventar-Verwaltungs-Tools

Um Inventar-Management weniger mühsam zu machen:

| Feature | Funktion |
|---------|---------|
| **Auto-Sort** | Sortiert Rucksack nach Kategorie per Knopfdruck |
| **Truhe schnell einlagern** | Alle Materialien & Samen mit einem Klick in die Truhe |
| **Junk markieren** | Items als Junk markieren → werden beim nächsten Händler-Besuch auto-verkauft |
| **Filter-Ansicht** | Rucksack nach Kategorie filtern (Tränke, Waffen, etc.) |
| **Truhen-Suche** | Truhe nach Itemname durchsuchen |

---

## Kurzübersicht

```
RUCKSACK
  20 → 44 Slots (erweiterbar beim Händler)
  + 4 Hotbar-Slots (nur Tränke/Coatings)
  Tränke/Samen/Materialien stapeln — Waffen/Rüstung/Truhen nicht

TRUHE (Dorf-Lager)
  50 → 150 Slots (erweiterbar beim Schmied)
  Zonenübergreifend synchronisiert

AUSRÜSTUNG
  6 feste Slots — zählen nicht zum Limit
```
