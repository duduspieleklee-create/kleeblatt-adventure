# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.3  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[16-developer-guide.md](./16-developer-guide.md)** – Stack, MVP Build-Order  
→ **[17-mvp-gameplay.md](./17-mvp-gameplay.md)** – Held, Klassen, Skills, Map, Loot  
→ **[18-enemy-ai.md](./18-enemy-ai.md)** – Gegner-KI (Bruiser / Runner / Spitter)  
→ **[12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)** – Pattern-Überblick

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00–09](./00-einfuehrung-vorteile-usecases.md) | Konzept, Architektur, Wallet, Shop |
| [10-player-journeys.md](./10-player-journeys.md) | Player Journeys |
| [11-onboarding-journey.md](./11-onboarding-journey.md) | Onboarding + Metriken |
| [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md) | Pattern vs. Kleeblatt |
| [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) | SDK API v1 |
| [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | Phaser + React |
| [15-game-backend-realtime.md](./15-game-backend-realtime.md) | Backend + Realtime |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | **MVP Gameplay + Klassenfähigkeiten** |
| [18-enemy-ai.md](./18-enemy-ai.md) | **Enemy AI** |

## Kurzfassung

Held (Magier/Fern/Nah) auf Abenteuer-Map; Gegner-KI mit drei Archetypen; optional NFT-Sicherung. Stack: Phaser + React, Postgres, Colyseus, Immutable + MPC.
