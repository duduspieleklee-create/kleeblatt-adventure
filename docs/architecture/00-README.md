# Kleeblattadventure – Immutable zkEVM Architektur-Dokumentation

**Version:** 1.5  
**Stand:** 31. Juli 2026  
**Zielplattform:** Immutable zkEVM (L2) + Web2 Game Backend

## Dokumentenübersicht

| Datei | Inhalt |
|-------|--------|
| [00-einfuehrung-vorteile-usecases.md](./00-einfuehrung-vorteile-usecases.md) | Warum dieses Konzept? Vorteile, Begründung, Use-Cases |
| [01-konzept-uebersicht.md](./01-konzept-uebersicht.md) | Vision, Kernprinzipien, High-Level-Modell |
| [02-architektur.md](./02-architektur.md) | Systemarchitektur, Komponenten, Datenflüsse |
| [03-item-lifecycle.md](./03-item-lifecycle.md) | Vollständiger Lebenszyklus von Items & NFTs |
| [04-waehrungs-und-haendler-system.md](./04-waehrungs-und-haendler-system.md) | Zwei-Währungs-System & Gilden-Händler |
| [05-wallet-und-mpc.md](./05-wallet-und-mpc.md) | Custodial Wallets, MPC-Erklärung, Claim-to-Self-Custody |
| [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) | Provider-agnostische Wallet Service Schicht |
| [07-mpc-provider-vergleich.md](./07-mpc-provider-vergleich.md) | Vergleich Turnkey, Dfns, Fireblocks, Utila |
| [08-entscheidungsmatrix.md](./08-entscheidungsmatrix.md) | Bewertungsmatrix & Empfehlung |
| [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md) | In-Game-Währung, Token, Mint-Credits, Shop, Sinks/Sources |
| [10-player-journeys.md](./10-player-journeys.md) | **User Flows & Player Journeys** (Account, Shop, Mint, Stake, Händler, Claim) |

## Kurzfassung des Modells

- **Gameplay bleibt gasfrei** für den Spieler
- Standardmäßig **Custodial** (Studio kontrolliert Keys über MPC-Provider)
- Optionaler **Claim to Self-Custody**
- **Fiat-Shop** verkauft Mint-Credits & Kosmetik – **keine** frei auszahlbaren Token
- **Token** entstehen vor allem durch Spielen und Wirtschaft
- Händler in **Gilden** mit gemeinsamer Gilden-Bank
- Automatisches NFT-Minten im Hintergrund
- Alles Wertvolle läuft trotzdem on-chain auf Immutable zkEVM

## Einstieg

- Konzept & Warum: [00-einfuehrung-vorteile-usecases.md](./00-einfuehrung-vorteile-usecases.md)
- Shop & Währungen: [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md)
- Spieler-Flows: [10-player-journeys.md](./10-player-journeys.md)
