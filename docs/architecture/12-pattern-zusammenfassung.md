# 12 – Pattern-Zusammenfassung

**Version:** 1.0  
**Stand:** 2. August 2026  
**Zweck:** 1-Seiten-Klarheit für Team, Pitch und Wiederverwendung

---

## Das allgemeine Muster

**Name (Arbeits Titel):**  
*Gameplay-First Blockchain Integration – Embedded Wallet, duale Intro-Tiefe*

**Ein Satz:**  
Blockchain ist unsichtbare Infrastruktur für Anfänger und optionale Ownership-Schicht für Experten – mit **einer** Registrierung, **einer** Wallet-Pipeline und **zwei** Intro-Tiefen.

### Kernprinzipien (übertragbar auf viele Spiele)

| Prinzip | Inhalt |
|---------|--------|
| Registrierung für alle | Social / E-Mail / Wallet – kein Wallet-only-Zwang |
| Embedded Wallet | Bei Login automatisch erstellen und verknüpfen |
| Gleicher Tech-Pfad | Bis zur Wallet identisch für Casual und Crypto-Native |
| Duale Intro-Tiefe | Neuling = Gameplay-first · Experte = kurze Ownership-Infos |
| Gasfrei im Spiel | Chain nur bei bewusster Aktion (Sichern, Claim, große Käufe) |
| Fiat ≠ auszahlbarer Token | Shop verkauft Nutzen/Kosmetik/Credits – keine Cash-out-Token-Pakete |
| Custodial + Exit | Default: Studio/MPC steuert · optional: Claim to Self-Custody |
| Erfolg messen | Time-to-First-Match, Funnel Reg → Wallet → Intro → Match – nicht nur TVL/Mints |

### Was vielen Blockchain-Spielen fehlt

- Connect-Wallet-first statt Account-first  
- Tokenomics im Tutorial statt Kern-Gameplay  
- Entweder rein custodial (Trust-Problem) **oder** rein self-custodial (UX-Problem)  
- Fiat → Token → sofort auszahlbar (Wirtschafts- und Regulierungsrisiko)  
- Metriken nur on-chain, nicht Onboarding-Funnel  

### Für wen das Muster gilt

Jedes Spiel, das:
- Casuals **und** Crypto-Natives will,
- echte On-Chain-Assets anbieten will,
- aber nicht die ersten 5 Minuten mit Seed, Gas und Bridge verbrennen will.

---

## Was bei Kleeblattadventure spezifisch ist

| Bereich | Kleeblatt-spezifische Ausprägung |
|---------|----------------------------------|
| **Chain** | Immutable zkEVM (L2-only, keine native L1-Bridge) |
| **Key-Management** | MPC-Provider (z. B. Turnkey/Dfns) + Wallet-Abstraktionsschicht |
| **Pay-to-Mint** | Mint-Credits im Fiat-Shop → automatisches Mint auf custodiale Adresse |
| **Nutzung on-chain** | Staking = „Zum Spielen aktivieren“ · Unstake sperrt Item im Spiel |
| **Wirtschaft** | Zwei Währungen: In-Game (Consumables) + Token (wertvolle Güter) |
| **Händler** | Gilden mit gemeinsamer Gilden-Bank · Item muss nicht on-chain beim Händler liegen |
| **Shop** | Mint-Credits, Kosmetik, Komfort, Pässe – **keine** Token-Pakete zum Auszahlen |
| **Token-Sources** | Vor allem Spielen, Gilden, Events · optional limitierter Währungstausch |
| **Token-Sinks** | Gilden-Käufe, Staking/Utility, optional Burn |
| **Claim** | Optionaler Exit auf Spieler-Wallet · Fiat-Auszahlung nicht MVP |
| **Onboarding** | Pflicht-Reg → Embedded Wallet → Choice Neuling/Experte → Match |
| **Personas** | Alex (Casual), Sam (Engaged), Jordan (Crypto-Native) – eine Journey bis Intro |

---

## Muster vs. Umsetzung (Merksatz)

| Ebene | Frage |
|-------|--------|
| **Pattern** | Wie integrieren wir Blockchain, ohne Anfänger zu verlieren und Experten zu unterfordern? |
| **Kleeblatt** | Wie setzen wir das mit Immutable, MPC, Mint-Credits, Gilden und Claim konkret um? |

Das Pattern ist wiederverwendbar.  
Contracts, Wirtschaft, UX-Copy und Chain-Wahl sind Produktentscheidungen von Kleeblattadventure.

---

## Kurz für Pitch / Stakeholder

> Wir bauen kein „Connect Wallet und hoffe“-Spiel.  
> Jeder registriert sich normal, bekommt eine sichere Embedded Wallet, startet mit einem kurzen Gameplay- oder Ownership-Einstieg und spielt gasfrei.  
> Wertvolle Items können optional on-chain gesichert, im Spiel aktiviert und später geclaimt werden.  
> Der Shop verkauft Sicherungen und Kosmetik – keine auszahlbaren Token.  
> Technik: Immutable zkEVM + MPC + klare Trennung von Web2-Alltag und On-Chain-Ownership.

---

## Verwandte Docs

| Doc | Inhalt |
|-----|--------|
| [00-einfuehrung](./00-einfuehrung-vorteile-usecases.md) | Warum dieses Konzept |
| [09-waehrung-shop](./09-waehrungs-und-shop-architektur.md) | Mint-Credits, Token-Regeln |
| [10-player-journeys](./10-player-journeys.md) | User Flows |
| [11-onboarding](./11-onboarding-journey.md) | Reg, Intro, Metriken |
| [05–08](./05-wallet-und-mpc.md) | Wallet, MPC, Provider |
