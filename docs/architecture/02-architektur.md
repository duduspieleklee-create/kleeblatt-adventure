# 02 – Systemarchitektur

## High-Level Übersicht

```
[Game Client]
      ↕
[Game Backend (Web2)]
      ↕
[Redis / BullMQ Queue]
      ↕
[Blockchain Worker]
      ↕
[Wallet Service Interface]          ← Abstraktionsschicht
      ↕
[MPC Provider Adapter]              ← Turnkey / Dfns / Fireblocks
      ↕
[Immutable zkEVM]
      ├── NFT Contract
      ├── Staking Contract
      ├── Internal Swap & Farming Pool
      └── Gilden-Bank Wallets (Custodial)
      ↕
[Event Watcher] → [Game Backend]
```

## Komponenten

| Komponente | Aufgabe |
|------------|--------|
| **Game Backend** | Spiel-Logik, Inventar (Web2), Zahlungsverbuchung, Queue-Producer |
| **Redis / BullMQ** | Zuverlässige asynchrone On-Chain-Jobs (Mint, Transfer, Claim) |
| **Blockchain Worker** | Konsumiert Queue, ruft Wallet Service + Smart Contracts auf |
| **Wallet Service** | Provider-agnostische Schicht für alle Wallet-Operationen |
| **MPC Provider** | Sichere Key-Verwaltung + Signaturen (kein vollständiger Key existiert) |
| **Event Watcher** | Hört auf Staking-/Unstaking-Events und aktualisiert die Game-DB |
| **Smart Contracts** | NFT, Staking, Internal Swap/Farming, Access Control |

## Wichtige Design-Entscheidungen

- **Custodial als Standard** → beste UX
- **Claim to Self-Custody** als Exit → echte Ownership möglich
- **Abstraktionsschicht** → Provider später austauschbar
- **Queue + Retries** → robustes automatisches Minten
- **Gilden-Banks** statt einzelner Händler-Wallets → einfachere Verwaltung

## Sicherheitsgrundsätze

- Keine Private Keys auf eigenen Servern
- Alle wertvollen Bewegungen über MPC + Policies
- Idempotente Jobs (gleiche Item-ID kann nicht doppelt gemintet werden)
- State-Machine für jedes Item (siehe Item-Lifecycle)
