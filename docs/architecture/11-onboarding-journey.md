# 11 – Onboarding-Journey Struktur

**Version:** 1.0  
**Stand:** 2. August 2026  
**Status:** Design Decision

---

## 1. Prinzip

- **Jeder** muss sich registrieren (kein Guest-Play als Hauptpfad).
- **Für jeden** wird eine Embedded Wallet erstellt und mit dem Login verknüpft.
- Die **technische Journey bis zur Wallet ist für alle identisch**.
- **Erst danach** unterschiedliche Einführung:
  - **Neuling** → gameplay-first, wenig Text, Reibung und Churn senken
  - **Experte** → kurze Ownership-/Setup-Infos

---

## 2. Gesamtablauf

```
Landing Page
    ↓
Registrierung / Login
  (Social | E-Mail | Wallet)
    ↓
Embedded Wallet wird erstellt + mit Login verknüpft
    ↓
Pfad-Wahl (einmalig)
  ├─ „Einfach spielen“           → Neuling-Intro
  └─ „Ownership kurz erklären“   → Experten-Intro
    ↓
Jeweiliges Intro (kurz)
    ↓
Ins Spiel (erstes Match / Hub)
```

Optional alternativ zur Frage:  
Social/E-Mail-Login → Default Neuling · Wallet-Login → Default Experte · jeweils mit „Anderen Einstieg wählen“.

---

## 3. Phase A – Landing

**Ziel:** Klarer Call-to-Action, kein Crypto-Overload.

| Element | Inhalt |
|---------|--------|
| Primär-CTA | „Jetzt spielen“ / „Account erstellen“ |
| Sekundär | Trailer, Features, kurzer Value-Satz |
| Vermeiden | Seed Phrases, Chain-Namen, „Connect Wallet“ als Hauptbutton |

Spieler landet bewusst in der Registrierung – nicht in einem leeren Guest-Modus ohne Persistenz.

---

## 4. Phase B – Registrierung (für alle gleich)

### Login-Methoden (Reihenfolge in der UI)

1. **Google / Apple / Social** (primär, groß)
2. **E-Mail** (primär)
3. **Wallet verbinden** (sekundär, kleiner) – für Crypto-Natives

### Was im Hintergrund passiert

| Schritt | System |
|---------|--------|
| Account anlegen | User-ID, Session, Profil |
| Embedded Wallet | MPC/WaaS: custodiale Adresse erzeugen |
| Verknüpfung | Wallet ↔ Login-Identität speichern |
| Startzustand | Leeres oder Starter-Inventar, 0 Mint-Credits |

**Spieler sieht:** „Account wird eingerichtet…“ / „Gleich geht’s los.“  
**Spieler sieht nicht:** Private Keys, MPC, Chain-IDs, Gas.

### Copy-Richtung

- „Mit Google weiter“
- „Mit E-Mail registrieren“
- „Mit Wallet verbinden“ (nicht „Wallet erstellen“)
- Nicht: „Immutable-Wallet wird deployed“

### Abbruchrisiken

- Zu viele Felder vor dem ersten Erfolg
- Wallet-Connect als gleich großer Default-Button
- Fehlermeldungen in Crypto-Jargon
- Lange Wartezeit ohne Fortschrittsfeedback

---

## 5. Phase C – Pfad-Wahl

**Ein Screen, einmalig, überspringbar nur mit Default.**

### Variante A – Explizite Choice (empfohlen)

**Titel:** Wie willst du starten?

| Option | Unterzeile | Führt zu |
|--------|------------|----------|
| **Einfach spielen** | Wenig Erklärung, direkt ins Spiel | Neuling-Intro |
| **Ownership kurz erklären** | Wallet, Sichern, Claim in 30 Sekunden | Experten-Intro |

### Variante B – Aus Login ableiten

| Login | Default-Pfad |
|-------|----------------|
| Social / E-Mail | Neuling |
| Externe Wallet | Experte |

Immer: Link „Anderen Einstieg wählen“.

---

## 6. Phase D – Neuling-Intro (Gameplay-first)

**Ziel:** Friction ↓, Churn ↓, sofort spielbar.

### Inhalt (max. 1–2 Screens / 20–40 Sekunden)

1. **Willkommen** – „Dein Account ist bereit.“
2. **Ein Satz zu optionalem Ownership** (nicht mehr):  
   „Seltene Items kannst du später optional sichern – musst du nicht.“
3. **Gameplay-Fokus** – Steuerung, Ziel des ersten Matches, oder direkter „Match starten“-Button

### Was bewusst weggelassen wird

- Wallet-Adresse
- Claim
- Token-Wirtschaft
- Gilden-Banks
- Chain-Namen

### Danach

Direkt ins Hub oder erste Matchmaking-Warteschlange.  
Blockchain-Features erst bei **Bedarf** (erstes seltenes Item, Shop, „Meine Assets“).

---

## 7. Phase E – Experten-Intro (Infos + Setup)

**Ziel:** Trust und Klarheit, ohne langes Tutorial.

### Inhalt (1 Screen oder kurzes Karussell, 30–60 Sekunden)

**Bullets (Beispiel):**

1. An deinem Login hängt eine sichere Embedded Wallet – du musst keinen Seed verwalten.
2. Seltene Items kannst du optional on-chain **sichern** (NFT).
3. Gesicherte Items kannst du **zum Spielen aktivieren** und später auf eine **eigene Wallet claimen**.
4. Im Shop gibt es **Item-Sicherungen & Kosmetik** – keine frei auszahlbaren Token-Pakete.
5. Token verdienst du vor allem im Spiel und über die Wirtschaft.

### Optionales Setup (nicht blockierend)

- Claim-/Auszahlungsadresse hinterlegen (überspringbar)
- Kurz „Meine Assets“ zeigen
- Link zur FAQ / Explorer (klein)

### CTA

**„Ins Spiel“** – primär.  
Alles andere ist sekundär.

---

## 8. Phase F – Erste Spielminute (beide Pfade)

| Schritt | Erwartung |
|---------|-----------|
| Hub / Match starten | Sofort verständlich |
| Erstes Match | Kern-Gameplay, kein Crypto-UI |
| Erster Loot | Badge „Selten“ – noch ohne Mint-Zwang |
| Erster „Sichern“-Moment | Nur wenn Spieler selbst tippt oder sanfter Hint |

Neuling und Experte spielen **dieselbe** Core-Loop. Unterschied war nur die Intro-Tiefe.

---

## 9. Spätere Heranführung (Neuling)

| Trigger | Was passiert |
|---------|----------------|
| Erstes seltenes Item | Button „Als NFT sichern“ + 2 Zeilen Erklärung |
| Kein Mint-Credit | Weg in den Shop (Credits/Kosmetik) |
| „Meine Assets“ geöffnet | Claim erst hier erklären |
| Wiederkehrender Spieler (Session 2–3) | Optional kurzer Tipp: „Du kannst Items wirklich besitzen“ |

Kein erzwungenes Blockchain-Tutorial am Tag 1.

---

## 10. Mapping auf Personas

| Persona | Registrierung | Intro | Frühe Features |
|---------|---------------|-------|----------------|
| Alex (Casual) | Social/E-Mail | Neuling | Gameplay, später Sichern |
| Sam (Engaged) | Social/E-Mail oder Choice Experte | Je nach Choice | Sichern + Shop relativ früh |
| Jordan (Crypto-Native) | Wallet oder Choice Experte | Experte | Assets, Claim, Klarheit zu Custodial |

Technisch: **eine** Wallet-Pipeline.  
Produkt: **zwei** Intro-Tiefen.

---

## 11. UI-Sprachregeln (Onboarding)

| Vermeiden | Verwenden |
|-----------|----------|
| Mint, Stake, Gas, Chain | Sichern, Zum Spielen aktivieren, Account |
| „Wallet wird generiert“ | „Account wird eingerichtet“ |
| Seed, Private Key | (nie in Primär-UI) |
| Token kaufen | Item-Sicherung / Shop |
| Immutable zkEVM | (nur FAQ / Experten-Details) |

---

## 12. Erfolgs- und Abbruch-Metriken (Vorschlag)

| Metrik | Ziel-Richtung |
|--------|----------------|
| Reg → Wallet verknüpft | Nah an 100 % |
| Reg → Intro abgeschlossen | Hoch |
| Intro → erstes Match gestartet | Hoch (bes. Neuling) |
| Drop-off auf Login-Screen | Senken |
| Choice „Einfach spielen“ vs. Experte | Beobachten (kein hartes KPI) |
| Zeit bis erster Match | Möglichst kurz |

---

## 13. Checkliste Implementation

- [ ] Login: Social, E-Mail, Wallet (Wallet sekundär in UI)
- [ ] Nach Login: Embedded Wallet create + link (MPC/WaaS)
- [ ] Einheitlicher Loading-State ohne Crypto-Jargon
- [ ] Pfad-Wahl-Screen (oder Ableitung + Wechsel-Option)
- [ ] Neuling-Intro ≤ 2 Screens, dann Match/Hub
- [ ] Experten-Intro ≤ 60 s, optionales Adress-Setup, dann Match/Hub
- [ ] Feature-Flags / Analytics-Events pro Phase
- [ ] Fehlerpfade: Login fail, Wallet-Provision fail (Retry + Support)

---

## 14. Ein-Satz-Zusammenfassung

**Alle registrieren sich gleich und bekommen eine Embedded Wallet – danach wählen sie einen kurzen Gameplay- oder Ownership-Einstieg, bevor sie ins Spiel gehen.**
