# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 3.0  
**Stand:** 20. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[16-developer-guide.md](./16-developer-guide.md)** – Stack, MVP Build-Order  
→ **[20-prototyp-checkliste.md](./20-prototyp-checkliste.md)** – Erster Vertical Slice  
→ **[21-game-config.md](./21-game-config.md)** – Game-Konfiguration (`game-config.json`)  
→ **[22-asset-liste.md](./22-asset-liste.md)** – Asset-Liste (Sprites, Audio, UI)  
→ **[23-db-schema.md](./23-db-schema.md)** – DB-Schema & Migrations  
→ **[24-api-contract.md](./24-api-contract.md)** – REST-API-Vertrag  
→ **[25-glossary.md](./25-glossary.md)** – Glossar / Begriffsverzeichnis  
→ **[27-idempotency-keys.md](./27-idempotency-keys.md)** – Idempotency-Keys (Write-Schutz)  
→ **[14-phaser-react-bridge.md](./14-phaser-react-bridge.md)** – gameBridge Event-Vertrag  
→ **[19-phaser-rule-engine.md](./19-phaser-rule-engine.md)** – Combat RuleEngine  

## Game Design

| Datei | Inhalt |
|-------|--------|
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | MVP Gameplay + Skills |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy AI |
| [28-pixelguild-village-gdd.md](./28-pixelguild-village-gdd.md) | Village Rebuild GDD (core gameplay + endgame) |
| [29-village-dependency-graph.md](./29-village-dependency-graph.md) | Village Dependency Graph (first 6 NPCs) |
| [30-side-quests-lost-and-found.md](./30-side-quests-lost-and-found.md) | Side-quest category: Lost & Found |
| [31-systems-overview.md](./31-systems-overview.md) | Systems Overview (Village, Guild, Social, Endgame) |

## Design Docs (Detail-Spezifikationen)

| Datei | Inhalt |
|-------|--------|
| [critical-systems-design.md](./critical-systems-design.md) | Critical systems design |
| [enemy-scaling-design.md](./enemy-scaling-design.md) | Enemy scaling design |
| [guilds-economy-design.md](./guilds-economy-design.md) | Guilds & economy design |
| [inventory-design.md](./inventory-design.md) | Inventory system design |
| [level-system-design.md](./level-system-design.md) | Level system design |
| [stats-skills-design.md](./stats-skills-design.md) | Stats & skills design |

## Asset Guides

| Datei | Inhalt |
|-------|--------|
| [32-phaser-asset-guide.md](./32-phaser-asset-guide.md) | Technical asset guide for Phaser 3 |
| [33-asset-status-overview.md](./33-asset-status-overview.md) | Asset status overview (available vs gaps) |

## Planning & Organisation

| Datei | Inhalt |
|-------|--------|
| [prototype-roadmap.md](../planning/prototype-roadmap.md) | 4-Sprint Roadmap (Sprint 0–3) |
| [definition-of-ready-done.md](../planning/definition-of-ready-done.md) | DoR / DoD Checklisten |
| [risk-register.md](../planning/risk-register.md) | Risiko-Register |
| [missing-prototype-elements.md](../planning/missing-prototype-elements.md) | Ergänzende Prototyp-Anforderungen |
| [free-asset-recommendations.md](../planning/free-asset-recommendations.md) | Free asset recommendations |

GitHub Issues + Milestones (P0–P3) sind im Repo unter [Issues](https://github.com/duduspieleklee-create/kleeblatt-adventure/issues).

## Dokumentenübersicht (00–24)

| Datei | Inhalt |
|-------|--------|
| [00–15](./00-einfuehrung-vorteile-usecases.md) | Konzept, Wallet, Shop, Backend, Bridge |
| [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | gameBridge Event-Vertrag |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | MVP Gameplay |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy AI |
| [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) | Rule Engine + TS-Interfaces |
| [20-prototyp-checkliste.md](./20-prototyp-checkliste.md) | Prototyp-Checkliste |
| [21-game-config.md](./21-game-config.md) | Game-Konfiguration |
| [22-asset-liste.md](./22-asset-liste.md) | Asset-Liste |
| [23-db-schema.md](./23-db-schema.md) | DB-Schema & Migrations |
| [24-api-contract.md](./24-api-contract.md) | REST-API-Vertrag |

## Kurzfassung

Zuerst spielbarer Prototyp (Auth, Held, Map, Kampf, XP, Kiste); Web3/MPC/Hub danach. Docs beschreiben das Gesamtbild.  
Alle Gameplay-Werte in [`game-config.json`](../../game-config.json).  
DB-Schema in [23-db-schema.md](./23-db-schema.md). API-Vertrag in [24-api-contract.md](./24-api-contract.md).  
Write-Schutz: [27-idempotency-keys.md](./27-idempotency-keys.md).
