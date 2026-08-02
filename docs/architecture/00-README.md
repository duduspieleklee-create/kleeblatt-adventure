# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.7  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[20-prototyp-checkliste.md](./20-prototyp-checkliste.md)** – **Erster Vertical Slice (abhaken)**  
→ **[21-game-config.md](./21-game-config.md)** – **Game-Konfiguration (`game-config.json`)**  
→ **[22-asset-liste.md](./22-asset-liste.md)** – **Asset-Liste (Sprites, Audio, UI)**  
→ **[23-db-schema.md](./23-db-schema.md)** – **DB-Schema & Migrations**  
→ **[24-api-contract.md](./24-api-contract.md)** – **REST-API-Vertrag**  
→ **[25-glossary.md](./25-glossary.md)** – **Glossar / Begriffsverzeichnis**  
→ **[16-developer-guide.md](./16-developer-guide.md)** – Stack, MVP Build-Order  
→ **[17-mvp-gameplay.md](./17-mvp-gameplay.md)** – Gameplay + Skills  
→ **[19-phaser-rule-engine.md](./19-phaser-rule-engine.md)** – Combat RuleEngine  
→ **[12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)** – Pattern

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00–15](./00-einfuehrung-vorteile-usecases.md) | Konzept, Wallet, Shop, Backend, Bridge |
| [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | gameBridge Event-Vertrag |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | MVP Gameplay |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy AI |
| [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) | Rule Engine + TS-Interfaces |
| [20-prototyp-checkliste.md](./20-prototyp-checkliste.md) | **Prototyp-Checkliste** |
| [21-game-config.md](./21-game-config.md) | **Game-Konfiguration** |
| [22-asset-liste.md](./22-asset-liste.md) | **Asset-Liste** |
| [23-db-schema.md](./23-db-schema.md) | **DB-Schema & Migrations** |
| [24-api-contract.md](./24-api-contract.md) | **REST-API-Vertrag** |
| [25-glossary.md](./25-glossary.md) | **Glossar** |

## Kurzfassung

Zuerst spielbarer Prototyp (Auth, Held, Map, Kampf, XP, Kiste); Web3/MPC/Hub danach. Docs beschreiben das Gesamtbild.  
Alle Gameplay-Werte in [`game-config.json`](../../game-config.json).  
DB-Schema in [23-db-schema.md](./23-db-schema.md). API-Vertrag in [24-api-contract.md](./24-api-contract.md).
