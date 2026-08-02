# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.4  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[16-developer-guide.md](./16-developer-guide.md)** – Stack, MVP Build-Order  
→ **[17-mvp-gameplay.md](./17-mvp-gameplay.md)** – Held, Klassen, Skills  
→ **[18-enemy-ai.md](./18-enemy-ai.md)** – Gegner-KI  
→ **[19-phaser-rule-engine.md](./19-phaser-rule-engine.md)** – **Combat RuleEngine + TS-Interfaces**  
→ **[12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)** – Pattern

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00–15](./00-einfuehrung-vorteile-usecases.md) | Konzept, Wallet, Shop, Backend, Client-Bridge |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | MVP Gameplay + Klassenfähigkeiten |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy AI |
| [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) | **Phaser Rule Engine + TypeScript-Interfaces** |

## Kurzfassung

2D-Adventure (Phaser + React) mit datengesteuerter Combat-RuleEngine; optional NFT-Ownership auf Immutable via MPC. Backend: Postgres, Redis, Colyseus.
