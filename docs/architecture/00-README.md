# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.6  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[20-prototyp-checkliste.md](./20-prototyp-checkliste.md)** – **Erster Vertical Slice (abhaken)**  
→ **[21-game-config.md](./21-game-config.md)** – **Game-Konfiguration (`game-config.json`)**  
→ **[16-developer-guide.md](./16-developer-guide.md)** – Stack, MVP Build-Order  
→ **[17-mvp-gameplay.md](./17-mvp-gameplay.md)** – Gameplay + Skills  
→ **[19-phaser-rule-engine.md](./19-phaser-rule-engine.md)** – Combat RuleEngine  
→ **[12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)** – Pattern

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00–15](./00-einfuehrung-vorteile-usecases.md) | Konzept, Wallet, Shop, Backend, Bridge |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | MVP Gameplay |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy AI |
| [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) | Rule Engine + TS-Interfaces |
| [20-prototyp-checkliste.md](./20-prototyp-checkliste.md) | **Prototyp-Checkliste** |
| [21-game-config.md](./21-game-config.md) | **Game-Konfiguration** |

## Kurzfassung

Zuerst spielbarer Prototyp (Auth, Held, Map, Kampf, XP, Kiste); Web3/MPC/Hub danach. Docs beschreiben das Gesamtbild.  
Alle Gameplay-Werte (Helden, Skills, Gegner, XP, Loot, Auth) in [`game-config.json`](../../game-config.json).
