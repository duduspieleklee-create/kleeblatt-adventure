# 10 – Player Journeys & User Flows

**Version:** 1.0  
**Stand:** 31. Juli 2026  
**Status:** Design Draft

---

## 1. Zweck

Dieses Dokument beschreibt die zentralen Spieler-Journeys rund um Account, Shop, Mint, Staking, Händler und Claim.  
Fokus: Was der Spieler **sieht, denkt und fühlt** – plus Abbruchrisiken und Copy-Richtung.

Zugehörige Architektur: [09-waehrungs-und-shop-architektur.md](./09-waehrungs-und-shop-architektur.md)

---

## 2. Personas (kurz)

| Persona | Anteil (geschätzt) | Haltung |
|---------|-------------------|--------|
| **Alex (Casual)** | ~60 % | Will nur spielen. Kein Crypto-Jargon. |
| **Sam (Engaged)** | ~30 % | Mag Fortschritt & seltene Items. Offen für optionales Ownership. |
| **Jordan (Crypto-Native)** | ~10 % | Will echte Keys, Claim, Marktplätze. Misstraut reinem Custodial. |

Alle Flows müssen für Alex einfach bleiben und für Jordan trotzdem glaubwürdig sein.

---

## 3. Gesamtüberblick der Journeys

```
1. Account erstellen
2. Spielen / Item finden
3. Shop (Mint-Credits, Kosmetik) – bei Bedarf
4. Item sichern (Mint)
5. Zum Spielen aktivieren (Stake)
6. Händler (klein = In-Game-Währung, groß = Token)
7. Optional: Claim to Self-Custody
8. Optional später: Auszahlen (nicht MVP)
```

---

## 4. Journey: Account erstellen

### Ziel
Spieler ist in unter einer Minute im Spiel. Custodiale Wallet entsteht unsichtbar im Hintergrund.

### Flow

1. **Start** – „Spielen“ / „Registrieren“
2. **Login-Methode** – E-Mail, Google, Apple, o. ä. (kein Wallet-Connect als Pflicht)
3. **Account wird angelegt**
   - Im Hintergrund: custodiale Deposit-Adresse über MPC-Provider
   - Spieler sieht davon nichts
4. **Optional (später oder bei erstem Claim)** – Auszahlungs-/Claim-Adresse hinterlegen
5. **Tutorial / erstes Match** – sofort spielbar

### Copy-Richtung
- „Account erstellen“ / „Mit Google weiter“
- Nicht: „Wallet wird eingerichtet“

### Abbruchrisiken
- Zu viele Pflichtfelder
- Frühe Erwähnung von Blockchain/Wallet
- Lange Ladezeiten ohne Feedback

### Erfolg
Spieler ist im Spiel. Inventar leer oder mit Starter-Items. Kein Crypto-UI.

---

## 5. Journey: Item finden (ohne Blockchain)

### Flow

1. Match endet
2. Loot-Reveal: z. B. „Seltene Rüstung: Dornenpanzer“
3. Kurzer Highlight-Moment (Sound, Partikel)
4. Item landet im Inventar mit Badge **„Selten“**

### Prinzip
**Noch kein Blockchain-Wort.** Pure Spiel-Freude.

### Spieler-Gedanke
„Nice, das sieht stark aus.“

---

## 6. Journey: Shop (Fiat → Mint-Credits & Kosmetik)

### Grundprinzip
Normaler In-Game-Shop. Casuals kaufen **keine Token**, sondern:
- Mint-Credits („Item sichern“)
- Kosmetik
- Komfort / Pässe

Siehe Währungs-Dokument: Kein Fiat → Token → Auszahlen.

### Einstieg (Trigger)
- „Item sichern“ und kein Mint-Credit vorhanden
- Shop-Tab / Button „Shop“
- Kosmetik entdeckt

**Button-Text überall:** „Shop“ oder „Item-Sicherung kaufen“  
**Nie:** „Einzahlen“, „Token kaufen“, „Deposit“

### Shop-Übersicht

| Produkt-Beispiel | Preis | Nutzen |
|------------------|-------|--------|
| 1× Item sichern | 2,49 € | Ein Mint-Vorgang |
| 3× Item sichern | 6,99 € | Kleiner Rabatt |
| Skin / Effekt | z. B. 4,99 € | Rein kosmetisch |
| Battle-Pass | z. B. 9,99 € | Saisonale Belohnungen |

### Flow

1. Spieler öffnet Shop
2. Wählt Produkt (z. B. 1× Item sichern)
3. Kurze Bestätigung: Preis inkl. aller Gebühren, „sofort nutzbar“
4. Zahlung: Apple Pay / Google Pay / Karte / PayPal zuerst
5. Kurzer Wartezustand: „Wird gutgeschrieben…“
6. Erfolg: „1× Item-Sicherung erhalten“ + Kontostand/Credits
7. **Direkt zurück** zum ursprünglichen Ziel (Mint-Screen / Inventar), wenn er von dort kam

### Copy-Richtung
- „Item sichern“ statt „Minten“
- „Sofort nutzbar“ statt „on-chain“
- Keine Chain-Namen, keine Gas-Hinweise

### Abbruchrisiken
- Crypto-Jargon
- Versteckte Gebühren
- Langer Weg zurück zum Item nach dem Kauf
- Zu viele Pakete / unklare Preise

### Fehlerfälle
| Situation | Meldung |
|-----------|--------|
| Zahlung abgebrochen | „Es wurde nichts abgebucht.“ + Erneut versuchen |
| Karte abgelehnt | „Bitte andere Zahlungsmethode wählen.“ |
| Verzögerung | Nach ~20–30 s ehrliche Meldung + Support-Link |

---

## 7. Journey: Item sichern (Mint)

### Einstieg im Inventar
Dezenten Button am seltenen Item:

> **„Als NFT sichern“**  
> Optional · Einmalig · Du behältst es wirklich

### Entscheidungs-Screen

**Titel:** Dieses Item wirklich besitzen

**Inhalt:**
- Was du bekommst: Item wird als NFT gesichert. Später handelbar und auf eigene Wallet claimbar.
- Kosten: 1× Item-Sicherung (Mint-Credit) **oder** Hinweis „Du brauchst noch eine Sicherung → zum Shop“
- Gas: 0 € für dich

**Buttons:**
- Primär: „Jetzt sichern“
- Sekundär: „Später“
- Link: „Was bedeutet das?“ → kurze FAQ

### Ablauf nach Bestätigung

1. Mint-Credit wird verbraucht (oder Zahlung über Shop-Flow)
2. UI: „Wird gesichert…“ (Web2-Tempo, 5–20 s)
3. Backend: Queue → automatischer Mint auf custodiale Adresse
4. Erfolg: Badge wechselt auf **„NFT · Gesichert“**
5. Bei Fehler: klare Meldung, Credit zurück oder automatischer Retry

### Spieler-Gedanken nach Persona
| Persona | Gedanke |
|---------|--------|
| Alex | „Optional – vielleicht später.“ |
| Sam | „Sichern klingt nach Ownership. Passt.“ |
| Jordan | „Hoffentlich echte Chain und Claim möglich.“ |

### Abbruchrisiken
- Unklarer Nutzen
- Zu crypto-lastige Sprache
- Stille bei Fehlschlag
- Credit weg, aber kein NFT

---

## 8. Journey: Zum Spielen aktivieren (Stake)

### Warum
NFT soll nicht gleichzeitig frei handelbar und im Match ausrüstbar sein. Ein Ort – eine Wahrheit.

### Flow

1. Inventar → gesichertes NFT-Item
2. Button: **„Zum Spielen aktivieren“** (nicht „Staken“)
3. Kurze Erklärung:  
   „Wird für das Spiel gesperrt. Verkaufen/Claim erst wieder möglich, wenn du es deaktivierst.“
4. Bestätigung → Staking-Contract (Hintergrund)
5. Watcher setzt Item auf nutzbar
6. Status-Badge: **„Aktiv im Spiel“**

### Deaktivieren (Unstake)
- Button: „Aus dem Spiel nehmen“
- Item sofort unusable im Spiel
- On-chain Unstake
- Danach wieder claim-/handelbar

### Design-Entscheidung
Optimistic UI möglich (sofort freischalten, bei Fehler zurückrollen) – klar festlegen.

---

## 9. Journey: Händler

### Kleiner Kauf (Consumables)
1. Spieler zum Kräuterhändler
2. Kauft Nahrung / Tränke
3. Zahlt **In-Game-Währung**
4. Sofort fertig – kein On-Chain, kein Warten

**Gefühl:** Wie in jedem normalen Spiel.

### Großer Kauf (Rüstung etc.)
1. Spieler zur Rüstungsgilde
2. Wählt epische Rüstung – Preis in **Token**
3. Bestätigung: „X TOKEN gehen an die Rüstungsgilde“
4. Token-Transfer custodial → Gilden-Bank (Hintergrund)
5. Item wird freigeschaltet (Web2 und/oder als NFT vorbereitet)
6. Bei zu wenig Token: klarer Hinweis, woher Token kommen (Spielen, Wirtschaft) – **nicht** „Token im Shop kaufen“

---

## 10. Journey: Claim to Self-Custody

### Zweck
Spieler übernimmt volle Kontrolle. Trust-Feature für Sam/Jordan.

### Einstieg
Bereich „Meine Assets“ / Account:

> **„Auf eigene Wallet übertragen“**  
> Du übernimmst die volle Kontrolle. Danach können wir nichts mehr für dich bewegen.

### Flow

1. Assets auswählen (einzeln oder alle)
2. Ziel-Adresse eingeben oder hinterlegte Adresse wählen
3. Verifizierung (E-Mail-Code / 2FA – Pflicht)
4. Zusammenfassung: Was, Wohin, Hinweis auf Eigenverantwortung
5. Optional: Timelock bei hohen Werten („Ausführung in 30 Minuten“)
6. Bestätigung → MPC-Transfer
7. Erfolg: Explorer-Link + „Assets sind auf deiner Wallet“
8. Status im Spiel: **„Self-Custody“** (oder aus custodialem Inventar entfernt)

### Danach
Um das Item wieder im Spiel zu nutzen, muss der Spieler selbst staken (signen) – klar kommunizieren.

### Abbruch- / Trust-Risiken
- Falsche Adresse → Validierung + Checksum-Hinweis
- „Kann ich rückgängig machen?“ → Nein, klar sagen
- Lange Unsicherheit ohne Status → Fortschritt + Support

---

## 11. Journey: Auszahlen (nicht MVP)

Nur zur Abgrenzung:

| | Claim | Auszahlen |
|--|-------|----------|
| Ziel | Ownership auf eigener Wallet | Wert liquid / aus dem Ökosystem |
| MVP | Ja | Nein / stark beschränkt |
| Risiko | Mittel | Hoch |

Fiat-Auszahlung ist **kein** Verkaufsargument und kein Shop-Ziel.

---

## 12. Status-Badges im Inventar (Vorschlag)

| Badge | Bedeutung |
|-------|----------|
| Selten / Episch | Web2-Item, noch nicht gesichert |
| NFT · Gesichert | On-chain, custodial |
| Aktiv im Spiel | Gestaked, ausrüstbar |
| Self-Custody | Auf Spieler-Wallet, Studio bewegt es nicht mehr |

---

## 13. Emotionale Kurve (gesamt)

```
Account          → Leichtigkeit
Item finden      → Freude
Shop             → Vertraut (wie jedes Spiel)
Item sichern     → Stolz / optionale Aufwertung
Aktivieren       → Klarheit („jetzt spielbar")
Händler klein    → Normal
Händler groß     → Immersion (echte Wirtschaft)
Claim            → Kontrolle / Empowerment
Fehlerfall       → Trust-Test (muss abgefangen werden)
```

---

## 14. Sprachregeln (UI)

| Vermeiden | Verwenden |
|-----------|----------|
| Minten, Mint | Item sichern / Als NFT sichern |
| Staken | Zum Spielen aktivieren |
| Einzahlen, Deposit | Shop / Item-Sicherung kaufen |
| Gas, Chain, Blockchain | (weglassen oder nur in FAQ) |
| Wallet (bei Casuals) | Account / eigene Wallet nur beim Claim |
| Token kaufen (Fiat) | Nicht anbieten |

---

## 15. Checkliste für Implementation

- [ ] Account-Erstellung ohne Wallet-UI
- [ ] Shop nur Mint-Credits + Kosmetik + Komfort
- [ ] Mint-Flow mit Credit-Verbrauch und Fehler-Retry
- [ ] Stake/Unstake mit klaren Status-Badges
- [ ] Händler: klein = In-Game-Währung, groß = Token
- [ ] Claim mit 2FA, Adress-Check, Status-Tracking
- [ ] Überall: zurück zum Kontext nach Shop-Kauf
- [ ] Keine Crypto-Sprache in Primär-UI
- [ ] Fehlerzustände mit ehrlicher Copy + Support

---

## 16. Ein-Satz-Zusammenfassung

**Casuals registrieren sich normal, spielen gasfrei, kaufen im Shop Sicherungen und Kosmetik, sichern Items optional, aktivieren sie zum Spielen und können später claimen – ohne jemals Token gegen Fiat kaufen oder auszahlen zu müssen.**
