# 05 – Wallet & MPC

## Besitz-Modell

| Status | Beschreibung | Key-Kontrolle |
|--------|--------------|---------------|
| **Custodial** | Standardzustand nach Registrierung / Mint | Studio (über MPC-Provider) |
| **Self-Custody** | Nach Claim to Self-Custody | Spieler selbst |

## Was ist ein MPC-Provider?

Ein MPC-Provider (Multi-Party Computation) verwaltet Private Keys, **ohne dass jemals ein vollständiger Private Key an einem Ort existiert**.

Der Key wird in Shares aufgeteilt. Mehrere Parteien müssen zusammenarbeiten, um eine Transaktion zu signieren. Kein einzelner Server oder Hacker kann alleine an die Assets.

### Warum brauchen wir das?

Wir betreiben custodiale Wallets und müssen im Hintergrund Transaktionen signieren (Mint, Transfer, Claim).  
Private Keys selbst zu speichern wäre extrem riskant. MPC löst genau dieses Problem.

## MPC-Signaturprozess (vereinfacht)

1. Private Key wird bei Erstellung in Shares zerlegt (z. B. 3 Shares).
2. Backend schickt Signatur-Anfrage an den MPC-Provider.
3. Shares rechnen gemeinsam, ohne sich gegenseitig ihre Geheimnisse zu verraten.
4. Es entsteht eine gültige Signatur – der vollständige Key wird nie rekonstruiert.
5. Signierte Transaktion wird an Immutable zkEVM gesendet.

## Claim to Self-Custody

Spieler kann jederzeit Assets auf eine eigene Wallet ziehen:

1. Spieler wählt Assets und Ziel-Adresse
2. System prüft Policies (Limits, Timelock, Verifizierung)
3. MPC-Provider signiert den Transfer
4. Assets landen auf der Spieler-Wallet
5. Status wird auf `self_custody` gesetzt

## Eigenen Node hosten?

**Empfehlung: Nein (zumindest am Anfang).**

- Managed RPC (QuickNode, Alchemy etc.) ist zuverlässiger und meist günstiger
- Eigenen Node zu betreiben spart selten Geld und erhöht den Betriebsaufwand
- Die kritischen Keys liegen ohnehin beim MPC-Provider – ein eigener Node macht das System nicht sicherer
