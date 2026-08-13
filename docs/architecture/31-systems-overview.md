# 31 – Systems Overview (Village, Guild, Social, Endgame)

**Status:** Design-Entscheidung  
**Stand:** 13. August 2026  
**Bezug:** [28-pixelguild-village-gdd.md](./28-pixelguild-village-gdd.md), [29](./29-village-dependency-graph.md), [30](./30-side-quests-lost-and-found.md)

---

## 1. Kernprinzipien (unverändert)

- Dorf ist der emotionale Kern. Spieler verändert die Welt sichtbar.
- Erste 30 Minuten: Gefühl „Ich bin Teil der Geschichte“.
- Keine Tutorials, keine langen Dialoge – klare Call-to-Actions + Weltfeedback.
- UI wird progressiv freigeschaltet.
- Combat = Mittel zum Zweck. Adventure = Ergänzung mit Exploration.
- Lost & Found = leichte Würze (finden → zurückbringen, optional ein kleiner Hinweis).

---

## 2. Multiplayer-Architektur (Hybrid)

### Persönlich (pro Spieler)
- Dorf-Zustand und Weltveränderungen
- Eigene Tokens, Ressourcen, Credits
- Fortschritt, Mitgliedschaft, Inventar
- Lost & Found für den eigenen Stand

### Shared
- Eine Sozial-Zone (Marktplatz / Treffpunkt)
- Presence (wer ist online / in der Zone)
- Zonen-Chat
- Gruppenbildung

### Instanziert
- 2–4er Dungeons (kurz, klar, lohnenswert)
- Gruppenchat nur innerhalb der Instanz

### Technik-Richtung
- Nicht Mirror (passt nicht zu Phaser/Web)
- Eher Photon Realtime oder Colyseus
- Persönlicher Fortschritt über bestehendes Backend
- Multiplayer-Layer nur für Presence, Zone, Chat, Instanzen
- **Status:** Design-Wunsch – technische Umsetzung steht noch aus

---

## 3. Chat

- **Zonen-Chat** in der Sozial-Zone (zum Finden und Ansprechen)
- **Gruppenchat** in 2–4er Gruppen / Dungeon-Instanzen
- Kein globaler Chat über die ganze Insel
- Früh nicht nötig; kommt mit Sozial-Zone und Gruppen-Inhalten
- Dient dem Zusammenkommen, nicht als eigener Spielinhalt

---

## 4. Gilde – Timing und Relevanz

### Früh
- Credits tropfen leise nebenbei
- Mitgliedschaft kann durch normales Helfen entstehen
- Keine UI, kein Fokus

### Umschaltpunkt (→ Mid-Game)
Sobald ungefähr:
- Mehrere Kern-Gebäude stehen (z. B. Garten + Schmiede + weiterer Service)
- Spieler hat das Dorf spürbar verändert
- Erste Services werden regelmäßig genutzt

Ab dann:
- Logistics-Aktionen werden sichtbar und klar anbietbar
- Mitgliedschaftsvorteil wird spürbar
- Gilde wird zur bewussten, regelmäßigen Aktivität

### Mid-Game Anreize
- Spürbarer Vorteil bei Käufen/Services (z. B. +5 % Credits)
- Bessere Verfügbarkeit durch gemeinsame Logistics
- Kurze, wiederholbare Aktionen mit klarem Feedback
- Epoch-Rhythmus (z. B. wöchentlich) mit spürbarer Belohnung für Aktive
- Keine sichtbaren Optimierungs-Formeln, kein Zwang

---

## 5. Gruppen-Aktivitäten (Mid → Endgame)

- Optionale 2–4er Inhalte (z. B. kurz generierte / vorbereitete Dungeons)
- Sessions eher 15–30 Min, klarer Nutzen (Ressourcen, Credits, Dorf/Gilde)
- Solo weiter möglich; Gruppe macht es effizienter / lohnender
- Leute finden über: Sozial-Zone, Gilden-Präsenz, einfaches Matchmaking / Einladen

### Erste Gruppen-Aktivität freischalten
- Voraussetzung: Mid-Game-Einstieg, Sozial-Zone erreichbar
- Sichtbarer Eingang / Angebot in der Zone
- Klarer Call-to-Action, kein Tutorial
- Erste Instanz kurz und spürbar nützlich

---

## 6. Wirtschaft (Dorf) – Kurzfassung

- Versorgungs- und Beziehungs-Wirtschaft, keine Optimierungs-Börse
- Kernloop: Helfen → Welt verändert sich → bessere Versorgung → Nutzen für den Spieler
- Token schalten Weltveränderungen frei
- Ressourcen für Alltag und Hand-Ins
- Gilden-Credits = Anerkennung + praktischer Vorteil (vor allem mid-game)
- Verfügbarkeit wird durch Logistics spürbar beeinflusst

---

## 7. Nach dem Dorf (Endgame-Content)

**Priorisierung:**

1. **Neue Map / Region** – stärkster direkter Reward fürs fertige Dorf
2. **Guild-Scale** – größere kooperative Ziele, erweiterte Logistics
3. **Season-Layer** – späterer Frischhalte- und Rhythmus-Content

Das fertige Dorf ist kein Ende, sondern der Unlock für den nächsten Layer.

---

## 8. Umsetzungs-Status (wichtig)

| Bereich              | Status                          |
|----------------------|---------------------------------|
| Village Loop / GDD   | Design festgehalten             |
| Dependency Graph     | Design festgehalten             |
| Lost & Found         | Design schlank festgehalten     |
| Gilde Timing/Anreize | Design festgehalten             |
| Chat-Konzept         | Design festgehalten             |
| Multiplayer Hybrid   | Design-Entscheidung, **Technik offen** |
| Gruppen-Dungeons     | Design-Wunsch, **Technik offen** |
| Sozial-Zone          | Design-Wunsch, **Technik offen** |

Multiplayer (Presence, Zone, Instanzen, Chat) ist ein **eigener technischer Baustein** und noch nicht implementiert.

---

**Ein-Satz-Zusammenfassung**  
Persönliches Dorf als Kern, Gilde wird mid-game regelmäßig relevant, eine Shared Zone + kurze Instanzen fürs Soziale, Chat nur wo nötig, Endgame beginnt mit neuer Region – Multiplayer-Technik steht noch aus.
