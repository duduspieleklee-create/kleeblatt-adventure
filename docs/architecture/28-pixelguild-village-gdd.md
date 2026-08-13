# 28 – PixelGuild: Village Rebuild & Merchant Economy GDD

**Status:** Ready for Development  
**Priority:** P0  
**Estimated Effort:** 10 Wochen (MVP)  
**Stand:** 13. August 2026  
**Quelle:** Project Brief + Strategic Ideas Brief (Meeting Notes) + Design-Entscheidungen

---

## 1. Vision & Kernphilosophie

**Ein-Satz-Vision**  
Spieler bauen ein lebendiges Dorf auf, indem sie Tokens sammeln und an NPCs übergeben. Jede Übergabe erzeugt sofort sichtbare Weltveränderung + Belohnung + nächsten Unlock. Die Merchant Guild macht Kooperation spürbar. Blockchain erscheint erst, wenn emotionale Bindung da ist – und bleibt optional.

**Leitprinzipien**
- Blockchain = unsichtbare Infrastruktur, nie Selling Point.
- Endowment Effect vor Ownership (Bind → Proof → optional Export).
- Ein einziger Onboarding-Flow mit progressive Disclosure.
- Default immer Casual; Player-Type-Inference nur bei hoher Confidence (>70 %).
- Fairness durch Framing („du bekommst mehr“) statt Formel-Transparenz.
- Structure beats Detection: enge Dependency-Chains machen Single-Loop-Farming unrentabel.

**Ziel-Metriken**
- ≥85 % erreichen ersten Token-Hand-In innerhalb 15 Min
- ≥35 % 7-Tage-Retention
- Membership (Gilden-Mitgliedschaft) ≥60 % der aktiven Spieler über Gameplay-Pfad
- Zero App-Store-Steering-Violations

---

## 2. Core Gameplay Loop – Village Token Hand-In

**Drei-Tier-Reward bei jeder Übergabe** (muss simultan oder <10 s passieren)

1. **Instant Utility**: XP, Gilden-Credits, Buff, Rezept
2. **Visible World Change**: Gebäude wird repariert, neuer NPC erscheint, Animationen/Sounds, Dialoge ändern sich
3. **Systemic Unlock**: neuer Service, neue Region/Ressource, nächste Quest-Chain

**Token-Typen (MVP)**  
Saat-Siegel · Mühlenmarken · Werkstattplaketten · Route-Marken

**Hand-In-Ziele**: 6 NPCs mit Dependency-Graph (Beispiel)  
Gärtner (braucht Zaun) → Schmied (braucht Werkzeuge + Kohle) → Zimmermann → Fährmann → …

**Design-Regel**: Kein isoliertes Farming. Jede Kette erzwingt neue Orte/Quests. Narrative Hints statt harter Locks („Der Gärtner sagt, er fängt morgen an, sobald der Zaun steht“).

**Chained Progression**: Jeder Hand-In öffnet ≥2 neue Möglichkeiten.

---

## 3. Onboarding – Single Flow + Progressive Disclosure

- Großer „Spielen“-Button → sofort ins Spiel
- Wallet-Button sichtbar aber nicht prominent
- Null Crypto-Begriffe in den ersten 10 Minuten
- Probabilistische Player-Type-Scorecard (lokal, dann Sync)

**Signal-Klassen**
1. Passive: Acquisition-Source, Device, Login-Type
2. Behavioral (erste 3–5 Min): Time-to-first-action, Dialog-Skip, Spatial (Exploration vs. Quest-Beeline), Shop-Open, Inventory
3. Soft Choice: Difficulty-Preset (Entspannt / Herausforderung)

**Safety**: Nur bei >70 % Confidence personalisieren. Default = Casual.

**Ownership-Reveal-Timing** (konservativ starten)  
Nach emotionalem Milestone (15–30 Min, nach erstem sichtbaren Dorf-Change oder NPC-Story). Bind (Name/Gravure) → Provenance → optional Export.

---

## 4. Merchant Guild – Cooperative Logistics Loop

Spieler führen Guild-Actions aus (Escort, Banditen räumen, Depot reparieren, Bulk-Order). Das hebt den globalen Logistics-Score → bessere Verfügbarkeit von Waren/Services.

**Persönliche Belohnung**
- Gilden-Credits (non-tradable, daily Cap + Decay)
- Epoch-Dividends (vorgeschlagen 7 Tage)

**Payout-Formel (Start)**
```ts
function calculateDividend(playerShares, totalShares, epochSurplus, daysSinceLastActivity) {
  const decayFactor = Math.max(0.3, 1 - (daysSinceLastActivity / 14));
  // 70 % Participation (gleichmäßig an alle mit ≥2 verschiedenen Action-Types)
  // 30 % proportional mit Diminishing Returns + Caps
  return (playerShares * decayFactor / totalShares) * epochSurplus * 0.7;
}
```

**Anti-Freerider / Anti-Cartel**
- 70/30 Split + Variety-Requirement
- Activity-Type-Caps pro Epoch
- Individual Caps (keine Gruppen-Detection zuerst)

**Gilden-Mitgliedschaft**
- Wird durch Gameplay verdient (erste Guild-Quest / Milestone)
- +5 % non-tradable Credits auf **jeden** Kauf, unabhängig vom Payment-Rail
- Wallet nur optionale Enrollment für externes Siegel/Badge

---

## 5. Economy, Payments & Ownership

**Payment-Framing (App-Store-sicher)**
- Nie „Crypto-Rabatt“
- Immer „Gilden-Mitglied: +X % Bonus-Credits“
- Parity auf Mobile (IAP) und Web (Stripe + CoinGate)
- Bonus nach confirmed Webhook, daily Cap, Revert bei Refund

**Ownership-Flow**  
Bind → Proof of Scarcity → optional Export (nach Attachment). Keine Immediate-NFT-Drops.

---

## 6. Combat / Adventure & Village – Relation (Design-Entscheidung)

**Combat** = Mittel zum Zweck.  
Combat dient der Ressourcen- und Token-Beschaffung, dem Schutz von Routen und dem Freischalten von Gebieten. Es ist kein Selbstzweck und steht nicht im Zentrum der emotionalen Bindung.

**Adventure / Exploration** = Ergänzung und Erweiterung.  
Adventure ergänzt den Village-Loop mit Exploration, Story, neuen Regionen und optionalen Side-Content. Es füttert den Village-Loop (neue Token-Quellen, neue Dependencies) und wird vom Village-Loop freigeschaltet (neue Gebiete nach bestimmten Hand-Ins).

**Parallel-Lauf**
- Village ist der emotionale und progressive Kern (sichtbare Weltveränderung, Endowment).
- Combat und Adventure laufen parallel und unterstützen den Village-Loop, ersetzen ihn aber nicht.
- Frühe Stunden: stark Village-fokussiert (Onboarding + erste Hand-Ins).
- Später: Combat/Adventure als natürlicher Teil der Token- und Resource-Beschaffung + Exploration-Reward.

---

## 7. Endgame / Nach „Dorf fertig“ (20–40 h) – Design-Entscheidung

Wenn das Dorf vollständig aufgebaut ist, wird **neuer Content als Reward** freigeschaltet:

- **Neue Season / Season-Reset-ähnliche Struktur** oder
- **Weitere Map / neue Region** oder
- **Neuer Content-Block als direkter Reward** (z. B. erweiterte Guild-Scale-Mechaniken, regionale Governance, neue Token-Ketten, Story-Arc)

**Prinzip**: Das fertige Dorf ist kein Cliff, sondern der Unlock für den nächsten Content-Layer. Der Spieler fühlt den Fortschritt als Belohnung („weil du das Dorf aufgebaut hast, öffnet sich …“).

Mögliche konkrete Formen (noch zu priorisieren):
- Neue Map / Biome mit eigener Dependency-Chain
- Season-System mit frischem Content und leichten Resets / neuen Zielen
- Guild-Scale: regionale Logistics, größere kooperative Ziele, erweiterte Dividends
- Pure Adventure-Layer, der organisch aus dem Village heraus wächst

---

## 8. Phased Implementation (MVP 10 Wochen)

**Phase 1 (W1–3): Core Village Loop**  
4 Token-Typen, 6 NPCs, Dependency-Graph, Visual Transformations, probabilistische Onboarding-Scorecard.  
Deliverable: Playable von First Login bis erstem Shop-Opening.  
Validation: 10 Playtester erreichen chained Unlock <25 Min, zero Crypto-Terms.

**Phase 2 (W4–6): Merchant Guild & Loyalty**  
Logistics-Engine, Membership-Flag, Credits-Ledger, Epoch-Payout.  
Validation: keine sichtbaren Preis-Formeln, identische Base-Preise.

**Phase 3 (W7–10): Optional Ownership & Payments**  
Wallet-Enrollment, Receipt-Export, Payment-Parity, Anti-Cartel-Caps.  
Validation: Wallet nie vor Membership, Bonus rail-unabhängig.

---

## 9. Abgleich mit bestehenden Docs

**Starke Übereinstimmungen**
- Progressive Disclosure / Gameplay-first (11-onboarding-journey.md)
- Gilden als Wirtschafts-Organisation (guilds-economy-design.md)
- Ownership optional und spät (10-player-journeys.md)
- Event-driven Architecture, UIScene vs. World-Scene (AI_CONTEXT + Development Plan in kleeblock)
- Static Tiled World + dynamische Spawns (passt zu Token-Spawns und World-Changes)

**Anpassungen**
| Bestehendes | PixelGuild | Aktion |
|-------------|------------|--------|
| Combat-Klassen + Enemy-AI + Loot-Kisten als Kern (17-mvp-gameplay.md) | Village Token Hand-In als primärer emotionaler Loop | Combat als Mittel zum Zweck positionieren; Village wird Anker |
| Flying Merchant + Blacksmith | Cooperative Logistics + Epoch-Dividends + Gilden-Credits | Bestehende NPCs behalten, Logistics-Layer + Credits hinzufügen |
| Helden-Erstellung mit harter Klasse | Soft Choice / Inference, sofortiges Spielen | Klassen optional nach erstem Dorf-Change |
| Explizite Pfad-Wahl Neuling/Experte | Ein Flow + Confidence-Threshold | Pfad-Wahl abschwächen oder entfernen |
| kleeblock Development Plan (Input/UI/Map) | Village-State, Dependency-Graph, Hand-In-Service, Logistics-Engine | Neue Manager ergänzen; QuestManager/SpawnManager erweitern |

---

## 10. Offene Punkte (noch zu klären)

- Exakte Epoch-Länge (7 Tage Vorschlag)
- Max. gleichzeitige Guild-Actions pro Spieler
- Wie viele parallele Rebuild-Chains (2–3 empfohlen)
- Konkrete Form des Post-Dorf-Contents (Season vs. neue Map vs. Guild-Scale) – Priorisierung in nächster Iteration
- Exakte Margin → nachhaltige Dividend-Höhe

---

## 11. Success Metrics & Validation Checklist

| Metric | Target | Messung |
|--------|--------|--------|
| Onboarding Completion | ≥85 % erster Hand-In <15 Min | Telemetry |
| 7-Day Retention | ≥35 % | Cohort |
| Token Hand-Ins / Spieler (Day 7) | ≥8 | Telemetry |
| Membership via Gameplay | ≥60 % aktiver Spieler | Telemetry |
| App-Store Compliance | 0 Steering-Violations | Review + Test Builds |

**Validation Checklist (MVP)**
- [ ] Zero Crypto-Terms in ersten 10 Min
- [ ] Membership ohne Wallet erreichbar
- [ ] Bonus identisch über alle Rails
- [ ] Keine sichtbaren Preis-Formeln
- [ ] Dependency-Graph fühlt sich wie Puzzle, nicht wie Gate an
- [ ] Combat dient der Village-Progression (Ressourcen/Token/Schutz)
- [ ] Nach Dorf-fertig: klarer Content-Reward (Season / Map / neuer Layer)

---

## 12. Ein-Satz-Zusammenfassung

**Das Dorf ist der emotionale Kern: Spieler verändern die Welt sichtbar, verdienen Gilden-Mitgliedschaft durch Mitmachen und bekommen optional Ownership erst nach Attachment. Combat ist Mittel zum Zweck, Adventure ergänzt mit Exploration. Nach dem fertigen Dorf kommt neuer Content als Reward (Season / weitere Map / Guild-Scale).**

---

**Verwandte Docs**
- 11-onboarding-journey.md
- 10-player-journeys.md
- guilds-economy-design.md
- 17-mvp-gameplay.md
- kleeblock-adventure: AI_CONTEXT.md + docs/development_game/development_plan.md
