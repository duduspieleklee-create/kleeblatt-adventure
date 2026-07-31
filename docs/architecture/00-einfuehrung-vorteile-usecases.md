# Einführung: Warum dieses Konzept?

**Kleeblattadventure – Immutable zkEVM Integration**  
Pay-to-Mint · In-Game Staking · L2-Only · Custodial + Claim-to-Self-Custody

---

## 1. Das Problem, das wir lösen

Die meisten Blockchain-Spiele scheitern an einem von drei Punkten:

| Problem | Folge |
|---------|--------|
| **Hohe Gas-Kosten** | Spieler zahlen für jede kleine Aktion → Frustration, Abbruch |
| **Komplexe Wallet-UX** | Seed Phrases, Signing-Popups, Netzwerkwechsel → nur Crypto-Natives bleiben |
| **Kein echtes Ownership** | Items nur in der Spieldatenbank → Spieler fühlen sich nicht als Besitzer |

Gleichzeitig wollen Studios:
- Umsatz generieren (nicht nur „Play-to-Earn“-Illusionen)
- Die Wirtschaft kontrollieren können
- Nicht von Ethereum-Mainnet-Gaspreisen abhängig sein
- Rechtlich und sicher vertretbar bleiben

**Unser Konzept löst genau diesen Zielkonflikt.**

---

## 2. Die Kernidee in einem Satz

> Der Spieler spielt komplett gasfrei und ohne Wallet-Friction.  
> Sobald er etwas Wertvolles besitzt oder handeln will, läuft alles trotzdem ehrlich on-chain – zuerst custodial, jederzeit claimbar.

---

## 3. Warum dieses Modell gut ist

### 3.1 Vorteile für den Spieler

| Vorteil | Erklärung |
|---------|----------|
| **Null Gas im Gameplay** | Kämpfe, Loot, Crafting, Handel mit Kleinigkeiten – alles ohne Gebühren |
| **Keine Wallet-Hürde am Anfang** | Registrierung wie in jedem normalen Spiel (E-Mail / Social Login) |
| **Echte Ownership möglich** | Mit einem Klick kann er seine NFTs und Token auf eine eigene Wallet ziehen |
| **Klare Trennung** | Alltag = In-Game-Währung · Wertvolle Items = Token/NFT |
| **Immersive Wirtschaft** | Händler-Gilden, echte Token-Bewegungen, Staking – fühlt sich lebendig an |

### 3.2 Vorteile für das Studio

| Vorteil | Erklärung |
|---------|----------|
| **Neue Umsatzquelle** | Pay-to-Mint-Gebühr (z. B. 2,50 $) bei sehr geringen L2-Gas-Kosten |
| **Secondary Royalties** | 2 % bei jedem Weiterverkauf auf externen Marktplätzen |
| **Volle Kontrolle über die Wirtschaft** | Interner Swap, Farming-Pool, Gilden-Banks – kein öffentlicher DEX der alles durcheinanderbringt |
| **Skalierbar & günstig** | Immutable zkEVM hält Gas extrem niedrig; Batching macht es noch günstiger |
| **Sicherheit ohne eigenen Key-Hell** | MPC-Provider verwaltet Keys – kein vollständiger Private Key auf euren Servern |
| **Später dezentralisierbar** | Claim-to-Self-Custody + Abstraktionsschicht ermöglichen schrittweisen Übergang |

### 3.3 Vorteile technisch / strategisch

- **L2-first**: Keine Abhängigkeit von Ethereum-Mainnet-Gaspreisen
- **Hybrid-Ansatz**: Web2-Geschwindigkeit + Blockchain-Glaubwürdigkeit
- **Anti-Double-Spend**: Item existiert logisch immer nur an einem Ort (Web2 → Mint → Stake)
- **Provider-unabhängig**: Wallet-Abstraktionsschicht erlaubt Wechsel zwischen Turnkey, Dfns, Fireblocks etc.
- **Regulatorisch robuster**: Custodial + klare Auszahlungsregeln + optionale Self-Custody ist besser argumentierbar als reine Black-Box-Balances

---

## 4. Warum wir es genau so machen (Begründung der Entscheidungen)

| Entscheidung | Warum |
|--------------|------|
| **Custodial als Standard** | Beste UX für 95 % der Spieler. Self-Custody ist optional, nicht Pflicht. |
| **Automatisches Minten** | Spieler zahlt Gebühr → System mintet im Hintergrund. Kein manuelles Signing, kein Warten auf den User. |
| **Claim to Self-Custody** | Gibt den Crypto-Spielern echte Ownership und reduziert Trust-Vorwürfe („Ihr könnt meine Items jederzeit stehlen“). |
| **Zwei Währungen** | In-Game-Währung für massenhaften Alltag (günstig). Token nur für werthaltige Güter (on-chain sinnvoll). |
| **Gilden-Banks statt einzelner Händler-Wallets** | Weniger Wallets, klarere Buchhaltung, immersives „Gilden“-Feeling. |
| **Kein nativer L1-Bridge** | Weniger Support-Aufwand, weniger regulatorische Komplexität. Spieler, die auf Ethereum wollen, nutzen externe Bridges selbst. |
| **Interner Swap statt öffentlichem DEX** | Wir kontrollieren Kurse, Liquidität und Wirtschaft. Kein MEV, kein Slippage-Chaos für normale Spieler. |
| **MPC statt eigener Private Keys** | Ein gehackter Server darf nicht alle Spieler-Assets vernichten können. |

---

## 5. Use-Cases (konkrete Spieler-Journeys)

### Use-Case 1: Casual Spieler – „Ich will einfach spielen“

1. Registriert sich per E-Mail / Social Login  
2. Spielt Matches, findet seltene Rüstung  
3. Behält sie als Web2-Item (0 Gas)  
4. Kauft Nahrung und Tränke mit In-Game-Währung  
5. Merkt von Blockchain nichts  

→ **Ergebnis:** Frictionless Experience, wie jedes normale Spiel.

---

### Use-Case 2: Engagierter Spieler – „Das Item ist mir was wert“

1. Findet eine seltene Rüstung  
2. Klickt „Als NFT minten“ und zahlt 2,50 $  
3. NFT erscheint automatisch in seinem Inventar (custodial)  
4. Stakt die Rüstung → kann sie im Match ausrüsten  
5. Später: Verkauft sie intern oder claimt sie auf seine eigene Wallet  

→ **Ergebnis:** Echtes Ownership + Studio verdient an der Mint-Gebühr.

---

### Use-Case 3: Händler-Kauf – „Ich brauche bessere Ausrüstung“

1. Spieler geht zur Rüstungsgilde  
2. Kauft eine epische Rüstung und zahlt mit Token  
3. Token fließen in die Gilden-Bank  
4. Rüstung wird freigeschaltet (Web2 oder als vorbereitetes NFT)  
5. Optional kann er sie danach noch minten  

→ **Ergebnis:** Immersive Wirtschaft + echte Token-Bewegung on-chain.

---

### Use-Case 4: Crypto-Nativer – „Ich will meine Assets selbst halten“

1. Hat bereits mehrere NFTs und Token im Spiel  
2. Geht auf „Meine Assets“ → „Claim to Self-Custody“  
3. Gibt seine eigene Wallet-Adresse an  
4. Assets werden transferiert  
5. Ab jetzt verwaltet er sie selbst (kann sie auf Marktplätzen handeln, erneut staken etc.)  

→ **Ergebnis:** Volle Ownership, Studio bleibt vertrauenswürdig.

---

### Use-Case 5: Studio-Seite – „Wir verdienen und steuern“

1. Spieler minten täglich Items → Mint-Gebühren  
2. Gilden-Banks sammeln Token aus Verkäufen  
3. Token können für Rewards, Liquidity, Burns oder weitere Entwicklung verwendet werden  
4. Secondary Sales bringen laufende Royalties  
5. Wirtschaft bleibt durch internen Swap und Policies steuerbar  

→ **Ergebnis:** Nachhaltiges Geschäftsmodell statt reinem Inflations-Token.

---

## 6. Was dieses Konzept bewusst nicht ist

- Kein reines „Play-to-Earn“ mit inflationärem Token
- Kein Zwang zur Self-Custody für jeden Spieler
- Kein offener DeFi-Casino-Charakter
- Keine Abhängigkeit von Ethereum-Mainnet-Gas
- Keine Black-Box, in der Items nur in einer privaten Datenbank existieren

Es ist ein **Hybrid**, der die Stärken von Web2 (UX, Geschwindigkeit, Kontrolle) mit den Stärken von Blockchain (Ownership, Transparenz, Secondary Market) verbindet.

---

## 7. Zusammenfassung – Warum wir das so bauen

| Ziel | Wie das Konzept es erreicht |
|------|------------------------------|
| Maximale Spieler-UX | Gasfrei + keine Wallet-Pflicht am Anfang |
| Echte Ownership | Claim-to-Self-Custody + On-Chain-NFTs |
| Studio-Umsatz | Pay-to-Mint + Royalties + kontrollierte Wirtschaft |
| Sicherheit | MPC statt eigener Private Keys |
| Zukunftsfähigkeit | Abstraktionsschicht + optionaler Weg zur Dezentralisierung |
| Immersion | Gilden, Staking, echte Token-Flüsse |

**Das Konzept ist nicht „maximal dezentral“. Es ist maximal spielbar – und trotzdem ehrlich on-chain, sobald es darauf ankommt.**
