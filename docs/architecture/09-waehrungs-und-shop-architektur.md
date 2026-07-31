# 09 – Währungs- und Shop-Architektur

**Version:** 1.0  
**Stand:** 31. Juli 2026  
**Status:** Design Decision

---

## 1. Ziel dieses Dokuments

Klare Trennung zwischen:

- dem, was Spieler **mit Fiat kaufen** dürfen
- dem, was **Token** sind und wie sie entstehen
- dem, was **auszahlbar / claimbar** ist

Damit vermeiden wir:
- „Fiat rein → Token kaufen → sofort auszahlen“
- unnötige regulatorische Nähe zu Finanzprodukten
- eine kaputte Spielwirtschaft

---

## 2. Grundregel

> **Fiat kauft nur Nutzen und Kosmetik – nie frei auszahlbare Token.**  
> Token entstehen vor allem durchs Spielen und kontrollierte Senken.  
> Auszahlung und Claim sind getrennte, bewusst reibungsbehaftete Pfade.

---

## 3. Die drei „Währungen“ / Werteinheiten

| Einheit | Zweck | Mit Fiat kaufbar? | On-Chain? | Auszahlbar? |
|---------|--------|-------------------|-----------|-------------|
| **In-Game-Währung** | Alltag: Nahrung, Tränke, kleine Käufe, Reparaturen | Optional (später) | Nein (Web2) | Nein |
| **Mint-Credit** | 1× Recht, ein Item als NFT zu sichern | **Ja** (Haupt-Fiat-Produkt) | Nein (Gutschein) | Nein |
| **Token** | Werthaltige Güter, Gilden-Käufe, Staking, Secondary Market | **Nein** (nicht direkt) | Ja | Nur über Claim / später stark limitierte Auszahlung |

### Kurz erklärt

**In-Game-Währung**  
Klassische Spielwährung. Wird verdient und für Consumables ausgegeben. Bleibt Web2.

**Mint-Credit**  
Genau für euer Pay-to-Mint. Spieler kauft z. B. „1× Item sichern“ für 2,49 €.  
Kein handelbarer Token – nur ein Verbrauchsgutschein im Account.

**Token**  
Der eigentliche on-chain Wert. Wird gespielt, über Gilden und Wirtschaft bewegt, kann gestaked und später geclaimt werden.  
**Wird nicht direkt im Fiat-Shop verkauft.**

---

## 4. In-Game-Shop (Fiat) – Was verkauft wird

Der Shop fühlt sich für Casuals an wie in jedem normalen Spiel.

### Erlaubte Kategorien

| Kategorie | Beispiele | Warum ok |
|-----------|-----------|----------|
| **Kosmetik** | Skins, Effekte, Emotes, Haustiere | Rein optisch, kein Cash-out |
| **Komfort / Vorteile** | XP-Boost, Inventar-Slots, Convenience | Spielnutzen, nicht auszahlbar |
| **Mint-Credits** | 1× / 3× / 10× „Item als NFT sichern“ | Direkter Fit zu Pay-to-Mint, kein frei handelbarer Token |
| **Battle-Pass / Event-Pässe** | Saisonale Belohnungen | Übliches Game-Monetarisierungsmodell |
| **Zeitlich begrenzte Bundles** | Kosmetik + Mint-Credit + Boost | Erhöht Conversion, bleibt kontrolliert |

### Was **nicht** im Fiat-Shop verkauft wird

- Token-Pakete („100 TOKEN für 4,99 €“)
- Beliebig auszahlbare Guthaben in Token
- Alles, was „Fiat → sofort liquidierbarer Token“ ermöglicht

---

## 5. Wie Token in die Wirtschaft kommen (Sources)

| Quelle | Beschreibung | Steuerung |
|--------|--------------|----------|
| Spiel-Belohnungen | Match-Rewards, Achievements, Seasons | Stark kontrollierbar (Inflation) |
| Gilden / Wirtschaft | Spieler verkaufen Items an Gilden oder später an andere | Marktnäher, aber begrenzbar |
| Events / Quests | Zeitlich begrenzte Token-Quellen | Gut für Live-Ops |
| Optional: In-Game-Währung → Token | Interner Tausch mit **Limits** | Nur mit täglichen/wöchentlichen Caps und Gebühr |

**Nicht als Hauptquelle:** Direkter Fiat-Kauf von Token.

---

## 6. Wie Token die Wirtschaft verlassen (Sinks)

Ohne Senken inflationiert jeder Token.

| Sink | Beschreibung |
|------|--------------|
| Gilden-Käufe | Große Items (Rüstung etc.) kosten Token → fließen in Gilden-Banks |
| Staking / Utility | Token oder NFTs werden gebunden, um Nutzen freizuschalten |
| Farming-Pool / interner Swap | Gebühren, Lockups |
| Burn (optional) | Ein Teil der Gilden-Einnahmen oder Gebühren wird verbrannt |
| Mint-Nebenkosten (optional) | Kleiner Token-Anteil zusätzlich zum Mint-Credit |

Ziel: Token haben **spielerischen Nutzen** und sind nicht nur „Cash auf der Chain“.

---

## 7. Mint-Credit im Detail

### Was es ist
- Ein Account-gebundener Gutschein
- Verbrauch: „1 seltenes Item als NFT sichern“
- Nicht übertragbar, nicht auszahlbar, nicht handelbar

### Shop-Beispiel

| Produkt | Preis | Wirkung |
|---------|-------|--------|
| 1× Item sichern | 2,49 € | Ein Mint-Vorgang |
| 3× Item sichern | 6,99 € | Kleiner Rabatt |
| 10× Item sichern | 19,99 € | Besserer Rabatt |

### Flow
1. Spieler kauft Mint-Credit im Shop (Karte/PayPal/Apple Pay)
2. Credit erscheint im Account
3. Beim „Item sichern“ wird 1 Credit verbraucht
4. Backend mintet NFT auf custodiale Adresse

**Vorteil:**  
Casual zahlt wie gewohnt mit Fiat – ohne jemals „Token kaufen“ zu müssen.

---

## 8. Optionaler Tausch: In-Game-Währung → Token

Falls später gewünscht:

- Nur in begrenzter Menge pro Tag/Woche
- Mit Gebühr oder ungünstigem Kurs
- Kein freier Marktpreis ohne Limit
- Nicht als Hauptweg, um an große Token-Mengen zu kommen

Damit bleibt Token knapp und spielbezogen.

---

## 9. Claim vs. Auszahlen

| Pfad | Was passiert | Für wen | Risiko |
|------|--------------|---------|--------|
| **Claim to Self-Custody** | NFT/Token gehen auf die eigene Wallet des Spielers | Engaged + Crypto-Native | Mittel – Ownership, kein Fiat-Cash-out |
| **Auszahlen (Fiat/liquid)** | Wert verlässt das Spiel-Ökosystem | Später / stark limitiert | Hoch – bewusst erschweren oder im MVP weglassen |

### Regeln

- **Claim** ist Teil des Konzepts (Trust + echte Ownership).
- **Fiat-Auszahlung** ist kein MVP-Feature und darf nie der Grund sein, warum jemand Mint-Credits oder Token kauft.
- Niemals: Fiat-Shop → Token → sofortige Auszahlung ohne echten Spielbezug.

---

## 10. Player-sichtbare Shop-Journey (Casual)

1. Spieler will Item sichern oder braucht Komfort/Kosmetik  
2. Öffnet **Shop** (nicht „Einzahlen“)  
3. Kauft z. B. Mint-Credit oder Skin mit Karte/PayPal  
4. Sofortige Gutschrift im Account  
5. Nutzt Credit zum Sichern oder zieht sich Skin an  
6. Token sieht er nur, wenn er sie im Spiel verdient oder über Wirtschaft bewegt  

Kein Crypto-Jargon. Kein „Token-Paket für 14,99 €“.

---

## 11. Was das Studio damit gewinnt

| Ziel | Wie diese Architektur hilft |
|------|----------------------------|
| Einfache UX für Casuals | Normaler Shop, Fiat, vertraute Methoden |
| Pay-to-Mint Umsatz | Über Mint-Credits, nicht über Token-Verkauf |
| Weniger Regulierungsrisiko | Kein direkter Fiat→Token→Cash-out-Kreislauf |
| Kontrollierte Wirtschaft | Token-Sources und -Sinks bleiben steuerbar |
| Trust | Claim möglich, ohne Casino-Charakter |
| Secondary Market | Echte NFTs/Token später handelbar, ohne Shop zu verwässern |

---

## 12. Entscheidungen (festgehalten)

1. **Kein direkter Token-Verkauf gegen Fiat** im In-Game-Shop.  
2. **Mint-Credits** sind das primäre Fiat-Produkt für Pay-to-Mint.  
3. **Kosmetik + Komfort + Pässe** ergänzen den Shop.  
4. **Token** kommen vor allem aus Spiel und Wirtschaft.  
5. **In-Game-Währung → Token** nur optional und limitiert.  
6. **Claim to Self-Custody** ja; **Fiat-Auszahlung** nicht im MVP / stark beschränkt.  
7. Shop-Sprache bleibt Web2: „Token kaufen“ vermeiden, „Item sichern“, „Shop“, „Guthaben“ nur wo nötig.

---

## 13. Offene Punkte (nächste Iteration)

- Exakte Preise und Paketgrößen für Mint-Credits  
- Welche Kosmetik/Komfort-Items im MVP  
- Ob In-Game-Währung überhaupt gegen Fiat verkauft wird  
- Konkrete Token-Emissionskurve (Belohnungen pro Match/Season)  
- Anteil Burn vs. Gilden-Bank vs. Rewards  
- Legal-Review (DE/EU) zu Mint-Credits + Custodial + Claim  

---

## 14. Ein-Satz-Zusammenfassung

**Casuals kaufen im normalen Shop Mint-Credits und Kosmetik mit Karte – Token verdient man im Spiel, claimen kann man optional, auszahlen ist kein Feature zum Reichwerden.**
