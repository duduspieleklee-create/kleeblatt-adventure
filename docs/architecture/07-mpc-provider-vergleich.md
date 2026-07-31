# 07 – MPC-Provider Vergleich

Stand: Juli 2026

## Übersicht

| Anbieter | Technologie | Fokus | Ideal für uns? | Preisniveau |
|----------|-------------|-------|----------------|-------------|
| **Dfns** | Echtes MPC (TSS) | API-first WaaS | Sehr stark | Enterprise / usage |
| **Turnkey** | TEE (AWS Nitro) | Low-level Key-Mgmt + Policy | Stark | Usage-based (günstig starten) |
| **Fireblocks** | MPC-CMP | Institutionelle Custody | Gut, aber teuer | Sehr hoch |
| **Utila** | MPC | Crypto-native Treasury | Gut | Mittel–hoch |
| **Sequence** | — | Gaming-spezifisch | Interessant | Custom |

## Kurzbewertung

### Dfns
- Echtes MPC, starke Policies, hohe Skalierbarkeit, SOC 2
- Gut für automatisierte Mint-/Transfer-Jobs + strenge Claim-Regeln
- Eher Enterprise-Sales

### Turnkey
- Beste Developer Experience, sehr schnelle Signaturen
- Günstiger Einstieg
- Technisch TEE statt klassischem MPC

### Fireblocks
- Industriestandard, maximale Sicherheit & Compliance
- Sehr teuer, lange Sales-Zyklen → oft Overkill für den Start

### Utila
- Gute Balance, stark bei Treasury & Multi-Wallet-Management

## Empfehlung nach Phase

| Phase | Empfehlung |
|-------|------------|
| MVP / erste 6–12 Monate | **Turnkey** |
| Wachstum (ab ~10–50k Wallets) | **Dfns** |
| Später / institutionell | Fireblocks oder Hybrid |

**Pragmatisch:** Mit Turnkey starten und Architektur so bauen, dass ein Wechsel später möglich ist (Abstraktionsschicht).
