# 03 – Item-Lifecycle

## Zustände eines Items

| Status | Beschreibung |
|--------|--------------|
| `owned_web2` | Item existiert nur in der Web2-Datenbank |
| `pending_mint` | Mint-Gebühr bezahlt, Job in Queue |
| `on_chain_custodial` | NFT auf custodialer Spieler-Adresse |
| `staked_custodial` | NFT im Staking-Contract (custodial) |
| `usable` | Im Spiel freigeschaltet und nutzbar |
| `self_custody` | Spieler hat Claim durchgeführt |
| `staked_self` | Nach Claim erneut gestaked (Spieler signet selbst) |

## Ablaufmatrix

| Schritt | Aktion des Spielers | System-Ebene | Besitz-Status |
|---------|---------------------|--------------|---------------|
| 1 | Findet seltenes Item | Eintrag in Web2-DB | `owned_web2` |
| 2 | Zahlt Mint-Gebühr | Job in BullMQ | `pending_mint` |
| 3 | — | **Automatischer Mint** auf custodiale Adresse | `on_chain_custodial` |
| 4 | Stakt Item | NFT wird im Staking-Contract gesperrt | `staked_custodial` |
| 5 | Nutzt Item im Match | Watcher setzt `is_usable = true` | `usable` |
| 6 | Kauft große Rüstung beim Händler | Token → Gilden-Bank | Item freigeschaltet |
| 7 | Kauft Nahrung beim Händler | In-Game-Währung abgezogen | Nur Web2 |
| 8 | Klickt „Claim to Self-Custody“ | Transfer auf Spieler-Wallet | `self_custody` |
| 9 | (Optional) Stakt nach Claim | Spieler muss selbst signen | `staked_self` |

## Wichtige Regeln

- Ein Item existiert logisch immer nur an **einem Ort**.
- Unstake → Item wird sofort im Spiel gesperrt (`is_usable = false`).
- Mint ist idempotent (gleiche Item-ID kann nicht doppelt gemintet werden).
- Web2-Eintrag wird erst nach finaler On-Chain-Bestätigung entfernt.
