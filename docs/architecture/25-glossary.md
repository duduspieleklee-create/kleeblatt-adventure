# 25 – Glossar

**Version:** 1.0  
**Stand:** 3. August 2026

---

Kurze Referenz für Begriffe, die in der gesamten Doku verwendet werden.

## Blockchain & Web3

| Begriff | Bedeutung |
|---------|-----------|
| **Immutable zkEVM** | Layer-2-Blockchain (Zero-Knowledge EVM). Gasarm, EVM-kompatibel. Kleeblattadventure läuft nur auf L2, keine native L1-Bridge. |
| **MPC (Multi-Party Computation)** | Key-Management-Verfahren. Private Key wird in Shares aufgeteilt, nie vollständig rekonstruiert. Mehrere Parteien signieren gemeinsam. |
| **MPC-Provider** | Externer Service für MPC-Keys. Empfehlung Prototyp/MVP: Turnkey. Alternative: Dfns, Fireblocks. |
| **Custodial** | Studio kontrolliert die Wallet-Keys (über MPC-Provider). Standard für alle Spieler nach Registrierung. |
| **Self-Custody** | Spieler verwaltet seine eigenen Keys. Erreichbar durch Claim. |
| **Claim (to Self-Custody)** | Spieler transferiert NFTs/Token von custodialer Wallet auf eigene externe Wallet. Optionaler Exit, mit 2FA/Policies. |
| **Mint** | NFT auf der Blockchain erstellen. Bei Kleeblattadventure automatisch im Hintergrund nach Mint-Credit-Kauf. |
| **NFT** | Non-Fungible Token. Einzigartiges on-chain Asset. Bei Kleeblattadventure: wertvolle Items (Rüstung, Waffen). |
| **Staking** | NFT im Staking-Contract sperren, um es im Spiel nutzbar zu machen ("Zum Spielen aktivieren"). |
| **Unstake** | NFT aus dem Staking-Contract freigeben. Item wird im Spiel sofort gesperrt (`is_usable = false`). |
| **L2 (Layer 2)** | Skalierungslösung auf einer L1 (Ethereum). Günstigere Transaktionen. Immutable zkEVM ist L2. |
| **Gas** | Transaktionsgebühr auf der Blockchain. Spieler zahlt bei Kleeblattadventure keine Gas-Kosten. |
| **Gilden-Bank** | Custodiale Wallet pro Händler-Gilde. Sammelt Token aus Käufen. Gemeinsame Buchhaltung statt einzelner Händler-Wallets. |

## Game Economy

| Begriff | Bedeutung |
|---------|-----------|
| **Mint-Credit** | Account-gebundener Gutschein. 1 Credit = 1× Item als NFT sichern. Kaufbar im Fiat-Shop. Nicht handelbar, nicht auszahlbar. |
| **In-Game-Währung** | Web2-Währung für Alltag (Nahrung, Tränke, kleine Käufe). Nicht on-chain. |
| **Token** | On-chain Währung für wertvolle Güter. Entsteht durch Spielen, Gilden, Events. Nicht direkt mit Fiat kaufbar. |
| **Pay-to-Mint** | Spieler zahlt Gebühr (via Mint-Credit), um ein Item als NFT zu sichern. |
| **Internal Swap** | Eigener Smart Contract (kein öffentlicher DEX). Nur Backend darf aufrufen. Spieler nutzt über In-Game-Oberfläche. |
| **Farming Pool** | Smart Contract für Token-Staking/Yielding. Studio-kontrolliert. |

## Item Lifecycle

| Begriff | Bedeutung |
|---------|-----------|
| **Template-ID** | Statische ID für Item-Typ aus `game-config.json` (z. B. `starter_melee_weapon`). |
| **Item-ID** | Eindeutige UUID pro Item-Instanz in der DB. Wird beim Grant generiert. |
| **Item-States** | `web2` → `pending_secure` → `secured` → `active_in_game` → `self_custody` |
| **Rarity** | Seltenheitsstufe: `common`, `uncommon`, `rare`, `epic`. Bestimmt Mintbarkeit. |
| **Mint Candidate** | Item mit `rarity ≥ uncommon`, das als NFT gesichert werden kann. |

## Architecture

| Begriff | Bedeutung |
|---------|-----------|
| **gameBridge** | Typed Event Emitter zwischen Phaser und React. Siehe [14-phaser-react-bridge.md](./14-phaser-react-bridge.md). |
| **RuleEngine** | Combat-Logik-Schicht. `Intent + WorldState + now → RuleEvent[]`. Phaser-frei, unit-testbar. Siehe [19-phaser-rule-engine.md](./19-phaser-rule-engine.md). |
| **Wallet-Abstraktionsschicht** | Provider-agnostisches Interface. Provider-Wechsel via Env-Variable, kein Code-Change. Siehe [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md). |
| **BullMQ** | Redis-basierte Job-Queue für asynchrone On-Chain-Operationen (Mint, Transfer, Claim). |
| **Colyseus** | Room-basierter Realtime-Server für Map-Presence (M9+). Nicht im Prototyp. |
| **Embedded Wallet** | Custodiale Wallet, die bei Registrierung automatisch erstellt wird. Spieler sieht sie nicht. |
| **Event Watcher** | Service, der On-Chain-Events (Stake/Unstake) hört und die Game-DB synchronisiert. |

## UX & Onboarding

| Begriff | Bedeutung |
|---------|-----------|
| **Neuling-Intro** | Kurzes Gameplay-first Intro nach Registrierung. Keine Crypto-Begriffe. |
| **Experten-Intro** | Kurzes Ownership-Intro (Wallet, Sichern, Claim in 30 Sek.). |
| **"Item sichern"** | UI-Begriff für Mint. Nicht "Minten" oder "On-Chain bringen". |
| **"Zum Spielen aktivieren"** | UI-Begriff für Stake. Nicht "Staken". |
| **Persona** | Alex (Casual, 60%), Sam (Engaged, 30%), Jordan (Crypto-Native, 10%). |

## Development

| Begriff | Bedeutung |
|---------|-----------|
| **P0–P7** | Prototyp-Phasen. Siehe [20-prototyp-checkliste.md](./20-prototyp-checkliste.md). |
| **M0–M10** | MVP-Build-Order Meilensteine. Siehe [16-developer-guide.md](./16-developer-guide.md). |
| **Vertical Slice** | End-to-End spielbarer Prototyp-Durchstich (Auth → Match → Loot → Persistenz). |
| **MockAdapter** | Wallet-Service-Adapter für lokale Entwicklung. Kein echter MPC-Provider nötig. |
