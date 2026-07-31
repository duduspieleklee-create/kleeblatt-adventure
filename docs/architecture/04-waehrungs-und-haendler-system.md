# 04 – Währungs- & Händler-System

## Zwei-Währungs-System

| Währung | Verwendung | On-Chain? | Beispiel |
|---------|------------|-----------|----------|
| **In-Game-Währung** | Alltag, Consumables, Reparaturen, kleine Käufe | Nein (nur Web2) | Nahrung, Tränke, Basics |
| **Token** | Wertvolle Güter, Mint-Gebühren, Staking, Farming | Ja | Rüstung, Waffen, seltene Items, Swaps |

## Händler-Gilden-Modell

Händler sind in **Gilden** organisiert. Jede Gilde besitzt eine gemeinsame **Gilden-Bank-Wallet** (custodial).

### Beispiel-Gilden

- Schmiedegilde
- Rüstungsgilde
- Alchemisten- / Kräutergilde
- Handelshaus

### Kauf-Logik

| Item-Typ | Bezahlung | Ablauf |
|----------|-----------|--------|
| **Kleine Items / Consumables** | In-Game-Währung | Nur Web2-Buchung. Kein On-Chain-Vorgang. |
| **Große / wertvolle Items** | Token | Token von Spieler-Wallet → Gilden-Bank. Item wird freigeschaltet. |

### Wichtige Design-Entscheidung

Der Händler muss das Item **nicht** selbst on-chain besitzen.  
Er verkauft lediglich das **Recht** am Item. Das Item selbst kann als Web2-Eintrag oder als NFT existieren.

## Interner Swap & Farming

- Eigene Smart Contracts (kein öffentlicher DEX)
- Nur das Backend darf die Funktionen aufrufen (Access Control)
- Spieler nutzt alles über die In-Game-Oberfläche
- Nach Claim to Self-Custody kann der Spieler Token auch extern handeln
