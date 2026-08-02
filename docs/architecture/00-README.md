# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.2  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Für Entwickler zuerst

→ **[16-developer-guide.md](./16-developer-guide.md)** – Lesereihenfolge, Stack, MVP Build-Order  
→ **[17-mvp-gameplay.md](./17-mvp-gameplay.md)** – **Gameplay: Held, Klassen, Map, Kampf, Loot**  
→ **[12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)** – 1-Seiten-Pattern

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00-einfuehrung-vorteile-usecases.md](./00-einfuehrung-vorteile-usecases.md) | Warum dieses Konzept? |
| [01-konzept-uebersicht.md](./01-konzept-uebersicht.md) | Vision, Kernprinzipien |
| [02-architektur.md](./02-architektur.md) | Systemarchitektur |
| [03-item-lifecycle.md](./03-item-lifecycle.md) | Item-/NFT-Lebenszyklus |
| [04-waehrungs-und-haendler-system.md](./04-waehrungs-und-haendler-system.md) | Währungen & Gilden |
| [05-wallet-und-mpc.md](./05-wallet-und-mpc.md) | Custodial, MPC, Claim |
| [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) | Wallet-Abstraktion |
| [07-mpc-provider-vergleich.md](./07-mpc-provider-vergleich.md) | Provider-Vergleich |
| [08-entscheidungsmatrix.md](./08-entscheidungsmatrix.md) | Entscheidungsmatrix |
| [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md) | Mint-Credits, Shop |
| [10-player-journeys.md](./10-player-journeys.md) | Player Journeys |
| [11-onboarding-journey.md](./11-onboarding-journey.md) | Onboarding + Metriken |
| [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md) | Pattern vs. Kleeblatt |
| [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) | SDK API v1 |
| [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | Phaser + React |
| [15-game-backend-realtime.md](./15-game-backend-realtime.md) | Backend + Realtime Map |
| [16-developer-guide.md](./16-developer-guide.md) | Developer Guide |
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | **MVP Gameplay Spec** |

## Kurzfassung

Held mit Klasse (Magier/Fern/Nah) auf Abenteuer-Map: bewegen, Kisten, Gegner, XP. Ownership optional. Stack: Phaser + React, Postgres, Colyseus, Immutable + MPC.
