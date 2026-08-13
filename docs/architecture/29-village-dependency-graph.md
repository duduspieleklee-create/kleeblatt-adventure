# 29 – Village Dependency Graph (MVP Phase 1)

**Status:** Design – Ready for Implementation  
**Bezug:** [28-pixelguild-village-gdd.md](./28-pixelguild-village-gdd.md)  
**Stand:** 13. August 2026

Ziel: Enge, narrative Dependency-Chains, die Single-Loop-Farming unattraktiv machen und gleichzeitig parallelisierbar bleiben (2 Hauptketten + 1 unterstützende). Jeder Hand-In erzeugt **sofort** die drei Tiers: Instant Utility + Visible Change + Systemic Unlock.

---

## 1. Token-Typen (MVP)

| Token-ID | Name | Primäre Quelle | Primärer Empfänger |
|----------|------|----------------|--------------------|
| `saat` | Saat-Siegel | Felder / Wald (leicht) | Gärtner |
| `muehlen` | Mühlenmarken | Getreide-Verarbeitung / Müller-Quests | Müller |
| `werkstatt` | Werkstattplaketten | Schmiede-Material / Minen (Combat) | Schmied |
| `route` | Route-Marken | Wege sichern / Banditen / Fähren | Fährmann / Logistics |

Zusätzliche Ressourcen (kein Token, aber nötig): Holz, Kohle, Nägel, Stein – werden über Combat/Exploration oder als Nebenbelohnung der Hand-Ins freigeschaltet.

---

## 2. Die 6 Kern-NPCs / Strukturen

| # | NPC / Struktur | ID | Rolle |
|---|----------------|----|-------|
| 1 | Gärtnerin Elara | `npc_gaertner` | Nahrung & Schutz des Dorfkerns |
| 2 | Schmied Torben | `npc_schmied` | Werkzeuge & Waffen |
| 3 | Zimmermann Kai | `npc_zimmermann` | Gebäude & Infrastruktur |
| 4 | Müllerin Hilde | `npc_mueller` | Getreide → Mehl → Versorgung |
| 5 | Fährmann Jonas | `npc_faehrmann` | Zugang zu neuen Regionen |
| 6 | Heilerin Mira | `npc_heilerin` | Heilung, Buffs, zweite parallele Kette |

---

## 3. Dependency Graph (visuell)

```text
START (kaputtes Dorf)
│
├── Kette A: Nahrung & Schutz
│   Gärtnerin (braucht Zaun/Schutz)
│        ↓ Saat-Siegel
│   [Zaun steht, Garten wächst]
│        ↓ Getreide verfügbar
│   Müllerin (braucht Getreide + Mühlensteine)
│        ↓ Mühlenmarken
│   [Mühle läuft, Mehl/Brot verfügbar]
│
├── Kette B: Werkzeuge & Bau
│   Schmied (braucht Kohle + Werkzeuge)
│        ↓ Werkstattplaketten (+ Kohle aus Mine)
│   [Schmiede offen, Tools verfügbar]
│        ↓ Tools + Holz
│   Zimmermann (braucht Holz + Nägel)
│        ↓ (Tools vom Schmied)
│   [Gebäude reparierbar, Dock-Teile möglich]
│        ↓
│   Fährmann (braucht Dock-Reparatur)
│        ↓ Route-Marken
│   [Fähre läuft → neue Region / Wald / Steinbruch]
│
└── Kette C (parallel, unterstützend): Versorgung
    Heilerin (braucht Kräuter + sicheren Zugang)
         ↓ (oft nach erstem Garten oder nach Fähre)
    [Heiltrank-Shop / Buffs / zweite Quest-Linie]
```

**Regel:** Keine harte UI-Sperre. Stattdessen Narrative Hints + visuelle Ghost-Gebäude.

---

## 4. Detaillierte Hand-In-Spezifikation

### 4.1 Gärtnerin Elara (`npc_gaertner`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | 3× `saat` (Saat-Siegel) |
| **Voraussetzung** | Keine (erster sinnvoller Hand-In, 5–15 Min) |
| **Narrative** | „Die Wildschweine fressen alles. Wenn ich einen Zaun hätte…“ |
| **Instant Utility** | +XP, 1× kleiner Nahrungs-Buff, 5 Gilden-Credits |
| **Visible Change** | Zaun erscheint um den Garten, Pflanzen wachsen, Elara lächelt/animiert, Vögel/Ambient |
| **Systemic Unlock** | Getreide-Quelle aktiv · neue Dialoge · leichter Zugang zu `muehlen`-Quellen · Quest „Erste Ernte“ |
| **Nächste Ziele** | Müllerin freischalten (Getreide bringen) · leichte Combat-Zone am Waldrand |

### 4.2 Schmied Torben (`npc_schmied`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | 2× `werkstatt` + 1× Kohle (Ressource) |
| **Voraussetzung** | Narrative: „Ohne Kohle und anständige Werkzeuge komme ich nicht weiter.“ Kohle kommt aus der nahen Mine (leichte Combat/Exploration). |
| **Instant Utility** | +XP, einfaches Werkzeug oder Waffe-Upgrade, 8 Gilden-Credits |
| **Visible Change** | Schmiede raucht, Amboss-Animation, Funken, neuer Shop-Stand |
| **Systemic Unlock** | Tools verfügbar für Zimmermann · einfache Waffen/Rüstung kaufbar · Mine bleibt als wiederholbare Quelle |
| **Nächste Ziele** | Zimmermann kann jetzt bauen · bessere Combat-Ausrüstung |

### 4.3 Zimmermann Kai (`npc_zimmermann`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | Tools vom Schmied (Flag) + 2× Holz (Ressource) |
| **Voraussetzung** | Schmied-Hand-In abgeschlossen (Tools freigeschaltet) |
| **Instant Utility** | +XP, Bau-Material-Bonus, 8 Gilden-Credits |
| **Visible Change** | Mehrere Gebäude-Teile werden repariert (Haus, Lager, Teil des Docks), neue Baugerüste verschwinden |
| **Systemic Unlock** | Dock-Reparatur möglich · neue Gebäude-Interaktionen · Zugang zu Fährmann-Quest |
| **Nächste Ziele** | Fährmann · erweiterte Lagerkapazität |

### 4.4 Müllerin Hilde (`npc_mueller`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | 3× `muehlen` + Getreide (von Gärtnerin freigeschaltet) |
| **Voraussetzung** | Gärtnerin-Hand-In (Getreide-Quelle) |
| **Instant Utility** | +XP, Brot/Nahrung (regeneriert), 10 Gilden-Credits |
| **Visible Change** | Mühlenräder drehen sich, Mehlstaub, Hilde backt, neuer Versorgungsstand |
| **Systemic Unlock** | Dauerhafte Nahrungsversorgung · Buff-Shop · leichter Logistics-Beitrag (Guild) |
| **Nächste Ziele** | Heilerin (Kräuter + Nahrung) · Guild-Logistics-Actions |

### 4.5 Fährmann Jonas (`npc_faehrmann`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | 2× `route` + Dock-Teile (vom Zimmermann) |
| **Voraussetzung** | Zimmermann-Hand-In (Dock baubar) |
| **Instant Utility** | +XP, 12 Gilden-Credits, kurzer Reise-Buff |
| **Visible Change** | Fähre erscheint/funktioniert, Wasser-Animation, neue Anlegestelle, Jonas winkt |
| **Systemic Unlock** | **Neue Region** (Wald jenseits des Flusses oder Steinbruch) · neue Token-Quellen · erweiterte Exploration · erste echte Adventure-Erweiterung |
| **Nächste Ziele** | Neue Map-Zone · Heilerin (falls Kräuter dort) · fortgeschrittene Guild-Routen |

### 4.6 Heilerin Mira (`npc_heilerin`)

| Feld | Inhalt |
|------|--------|
| **Benötigt** | 2× Kräuter (Ressource) + sicherer Zugang (nach Gärtner oder Fähre) |
| **Voraussetzung** | Entweder Gärtner-Garten oder neue Region via Fähre |
| **Instant Utility** | +XP, Heiltrank, 8 Gilden-Credits |
| **Visible Change** | Kräutergarten / Hütte wird lebendig, neue Partikel, Mira bietet Services an |
| **Systemic Unlock** | Heilungs- und Buff-Services · zweite parallele Quest-Linie · unterstützende Combat-Resilienz |
| **Nächste Ziele** | Längere Combat-Sessions möglich · Guild-Unterstützung |

---

## 5. Parallelität & Anti-Farming

- **Zwei Hauptketten** (A: Nahrung, B: Bau/Transport) können teilweise parallel laufen.
- **Heilerin** ist bewusst die flexible dritte Kette.
- Kein Token kann endlos isoliert gefarmt werden: Jeder Fortschritt braucht eine andere Quelle oder einen anderen NPC.
- Nach dem Fährmann öffnet sich bewusst neuer Content (neue Region) → fühlt sich wie Reward an, nicht wie Gate.

**Geschätzte Timing-Ziele (Casual)**
- Erster Hand-In (Gärtner): 8–15 Min
- Zwei Ketten aktiv: 25–40 Min
- Fähre + neue Region: 60–90 Min
- Alle 6 Kern-NPCs: 3–6 Stunden (je nach Exploration/Combat)

---

## 6. Implementierungs-Hinweise (für kleeblock / Phaser)

- **VillageState** (Backend + Client): Flags pro NPC (`gaertner_done`, `schmied_done`, …) + freigeschaltete Ressourcen.
- **Hand-In Service**: `POST /guild/hand-in` (oder intern) prüft Token + Voraussetzungen, triggert World-Change-Event.
- **Visuals**: Ghost-Gebäude / kaputte Varianten → reparierte Varianten per Event (Animation + Sound).
- **Narrative**: Tooltip / Dialog-Hinweis statt „Locked“-Icon.
- **Spawn**: Token-Quellen als Tiled Object-Layer oder dynamische Spawns (bestehender SpawnManager erweiterbar).
- **Combat-Anbindung**: Mine (Kohle), Waldrand (Saat/Wild), Banditen auf Routen (Route-Marken) – Combat liefert die fehlenden Ressourcen, bleibt Mittel zum Zweck.

---

## 7. Nächste Schritte nach diesem Graph

1. Tiled-Map: 6 NPC-Positionen + Ghost/Repaired-Varianten der Gebäude + Token-Spawn-Punkte.
2. Quest-/Hand-In-Daten als JSON (id, requiredTokens, rewards, unlocks).
3. Erste Playtest-Schleife: „Erreiche Fähre in unter 90 Min ohne Frustration“.
4. Danach: Logistics-Actions der Merchant Guild an die freigeschalteten Routen koppeln.

---

**Ein-Satz-Zusammenfassung**  
Sechs NPCs in zwei Hauptketten + einer parallelen Versorgungskette: Jeder Hand-In verändert die Welt sichtbar, schaltet neue Quellen und den nächsten sinnvollen Schritt frei – und macht isoliertes Farming unnötig.
