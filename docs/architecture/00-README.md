# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 2.0  
**Stand:** 3. August 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00-einfuehrung-vorteile-usecases.md](./00-einfuehrung-vorteile-usecases.md) | Warum dieses Konzept? |
| [01-konzept-uebersicht.md](./01-konzept-uebersicht.md) | Vision, Kernprinzipien |
| [02-architektur.md](./02-architektur.md) | Systemarchitektur |
| [03-item-lifecycle.md](./03-item-lifecycle.md) | Item-/NFT-Lebenszyklus |
| [04-waehrungs-und-haendler-system.md](./04-waehrungs-und-haendler-system.md) | Währungen & Gilden-Händler |
| [05-wallet-und-mpc.md](./05-wallet-und-mpc.md) | Custodial, MPC, Claim |
| [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) | Wallet Service Abstraktion |
| [07-mpc-provider-vergleich.md](./07-mpc-provider-vergleich.md) | Provider-Vergleich |
| [08-entscheidungsmatrix.md](./08-entscheidungsmatrix.md) | Entscheidungsmatrix |
| [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md) | Mint-Credits, Shop, Sinks |
| [10-player-journeys.md](./10-player-journeys.md) | Player Journeys |
| [11-onboarding-journey.md](./11-onboarding-journey.md) | Onboarding + Metriken |
| [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md) | Pattern vs. Kleeblatt |
| [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md) | SDK API-Skizze v1 |
| [14-phaser-react-bridge.md](./14-phaser-react-bridge.md) | Phaser 3 + React Bridge |
| [15-game-backend-realtime.md](./15-game-backend-realtime.md) | **Postgres, Redis, Realtime Map / Colyseus** |

## Kurzfassung

Gameplay-first Blockchain-Integration auf Immutable zkEVM. Client: Phaser 3 + React. Backend: **PostgreSQL + Redis + Room-Server (Colyseus)** für Map-Präsenz; Web3 über HTTP API + MPC.

## Einstieg

- Backend & Map: [15-game-backend-realtime.md](./15-game-backend-realtime.md)
- Client Bridge: [14-phaser-react-bridge.md](./14-phaser-react-bridge.md)
- Pattern: [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md)
- Onboarding: [11-onboarding-journey.md](./11-onboarding-journey.md)
