# 17 – MVP Gameplay Spec

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Draft – Grundlage für M4/M5 Content

---

## 1. Spielidee (MVP)

Der Spieler steuert einen **Helden**, der auf **Abenteuer** geht.

Nach der Registrierung legt er **Heldenname** und **Klasse** fest. Anschließend startet er auf einer **Map**, kann sich frei bewegen, **Lootkisten** öffnen, **NPCs/Gegner** angreifen, **Erfahrungspunkte** sammeln und **stärker werden**.

Kern-Loop:

```
Map erkunden → Gegner / Kisten → XP + Loot → stärker werden → schwerere Herausforderungen
```

Optional später (nicht MVP-Pflicht): seltene Loot-Items **on-chain sichern** (siehe Ownership-Docs).

---

## 2. Nach der Registrierung – Helden-Erstellung

Direkt nach Login / Onboarding-Intro (oder als Teil davon):

### 2.1 Pflicht-Schritte

1. **Heldenname** festlegen (Display-Name im Spiel / auf der Map)
2. **Klasse** wählen – genau eine:

| Klasse | Rolle (MVP) |
|--------|-------------|
| **Magier** | Magie / Distanzzauber (genaue Skills TBD) |
| **Fernkämpfer** | Fernkampf (Bogen/Kreuz etc. – Darstellung TBD) |
| **Nahkämpfer** | Nahkampf |

### 2.2 Starter-Ausrüstung

Je nach Klasse erhält der Spieler **geschenkte Start-Rüstung / Start-Gear** (Web2-Inventar, State `web2`):

| Klasse | Starter-Paket (Beispiel-Richtung) |
|--------|-----------------------------------|
| Magier | Leichte Robe / Stoff-Set + Einsteiger-Zauberfokus |
| Fernkämpfer | Leichte Rüstung + Einsteiger-Fernkampfwaffe |
| Nahkämpfer | Mittelere Starter-Rüstung + Einsteiger-Nahkampfwaffe |

**Regeln:**

- Starter-Gear ist **sofort ausrüstbar** und für das erste Abenteuer gedacht
- Kein Mint-Credit nötig
- Optional später: besonders seltene Drops (nicht Starter) können gesichert werden

### 2.3 Daten (Backend)

| Feld | Bedeutung |
|------|----------|
| `hero_name` | Anzeigename |
| `class` | `mage` \| `ranged` \| `melee` |
| `level` / `xp` | Progression |
| Start-Items | Zeilen in `items` mit Template-IDs der Klasse |

Helden-Erstellung **einmalig** im MVP (kein voller Respec-Baum nötig).

---

## 3. Die Map (Abenteuer-Welt)

### 3.1 Was der Spieler kann

| Aktion | Beschreibung |
|--------|--------------|
| **Bewegen** | Held auf der Map steuern (WASD/Klick – Input TBD) |
| **Lootkisten** | Kisten finden und öffnen → Rüstung/Items/Consumables (In-Game) |
| **NPCs** | Interaktion minimal (Dialog optional); Fokus MVP: **Gegner** |
| **Gegner angreifen** | Kampf gegen Enemy-NPCs |
| **XP sammeln** | Für Siege / Ziele → Level-Ups |

### 3.2 Map-Scope MVP

- **Mindestens eine** spielbare Abenteuer-Map (nicht die Social-Hub-Map)
- Ausreichend Fläche für Erkunden, 2–4 Enemy-Typen, mehrere Kisten-Spawns
- Social-Hub („andere Spieler sehen“) ist **separat** ([15](./15-game-backend-realtime.md)) – kann später dieselbe oder eine andere Zone sein

**Empfehlung:** MVP-Abenteuer zuerst **Single-Player / instanziiert** (M4), Hub-Multiplayer parallel (M9).

---

## 4. Kampf (MVP-Rahmen)

| Thema | MVP-Festlegung |
|-------|----------------|
| Perspektive | 2D (Phaser), heldenzentriert |
| Ziel | Gegner besiegen, nicht sterben / Mission erfüllen |
| Klassen-Unterschied | Mind. unterschiedliches Starter-Gear; Skills können v1 einfach sein (z. B. Angriff + 1 Klassenfähigkeit) |
| Tod / Niederlage | TBD (Respawn an Checkpoint vs. Match-Ende) – **offen** |
| Schwierigkeit | Mit Level/Gear skalierend oder feste Zonen – **offen** |

Konkrete Zahlen (HP, Schaden, Cooldowns) kommen in eine Balance-Tabelle, sobald erste Combat-Iteration steht.

---

## 5. Loot & Rüstung

### 5.1 Lootkisten

- Auf der Map verteilte Kisten
- Öffnen → Belohnung ins **Inventar** (Web2)
- Inhalt: vor allem **Rüstungsteile / Gear**, ggf. Consumables (Nahrung/Tränke = In-Game-Währung später, MVP kann Gear-only sein)

### 5.2 Rarity (Vorschlag)

| Stufe | Bedeutung | On-Chain-Sichern |
|-------|-----------|------------------|
| Gewöhnlich | Häufige Kisten-Drops | Nein (MVP) |
| Ungewöhnlich / Selten | Bessere Stats | Optional später „Sichern“ |
| Episch / Boss | Sehr selten | Kandidat für Mint |

Starter-Gear: immer gewöhnlich, nicht mint-fokussiert.

### 5.3 Anlegen

- Spieler rüstet gefundene/geschenkte Teile im Inventar (React-UI)
- Aktives Loadout geht ins nächste Abenteuer / in die Phaser-Session

---

## 6. Progression (XP & Stärke)

| Element | MVP |
|---------|-----|
| **XP** | Durch Gegner besiegen (und optional Kisten/Quests) |
| **Level** | Steigt mit XP; erhöht Basis-Werte (HP/Schaden o. Ä.) |
| **Gear** | Zweiter Stärke-Hebel neben Level |
| **Skill-Baum** | Nicht MVP (höchstens 1 Fähigkeit pro Klasse) |

Kurve: Frühe Level schnell, später langsamer – exakte Tabelle TBD.

---

## 7. Verbindung zu Ownership (nicht Gameplay-Blocker)

| Spiel-Moment | Platform-Feature |
|--------------|------------------|
| Starter-Gear & normale Kisten | Bleibt Web2 |
| Seltenes/Episches Teil | Button „Als NFT sichern“ (Mint-Credit) |
| Gesichertes Teil im Kampf nutzen | „Zum Spielen aktivieren“ (Stake) |
| Voll besitzen | Claim |

Gameplay muss **ohne** Mint vollständig spaßig und progressiv sein.

---

## 8. Session-Flow (Spieler)

```
Registrierung
  → Onboarding-Intro (Neuling/Experte)
  → Heldenname + Klasse wählen
  → Starter-Rüstung erhalten
  → Hub oder direkt Abenteuer-Map
  → Bewegen, kämpfen, Kisten, XP
  → Inventar: neue Rüstung anlegen
  → Optional: seltenes Item sichern
```

---

## 9. Abgrenzung MVP vs. später

| Im MVP | Später |
|--------|--------|
| 1 Abenteuer-Map | Weitere Biome / Dungeons |
| 3 Klassen + Starter-Sets | Mehr Klassen, Transmog, Sets-Boni |
| Kisten + Gegner + XP | Quests, Bosse, Crafting |
| Einfacher Kampf | Tiefes Skill-System |
| Single-Player-Abenteuer | Koop / PvP |
| Social-Hub separat | Geteilte Offene Welt |

---

## 10. Offene Punkte (nächste Iteration)

- [ ] Input-Schema (WASD vs. Klick-to-move)
- [ ] Tod/Respawn-Regeln
- [ ] Exakte Starter-Item-IDs und Stats pro Klasse
- [ ] Enemy-Liste (2–4 Typen) + XP-Werte
- [ ] Kisten-Loot-Tabellen
- [ ] Level-Kurve (XP pro Level)
- [ ] Win-Condition pro Session (nur Sandbox-Erkunden vs. Missionen)
- [ ] Ob Abenteuer-Map und Social-Hub dieselbe Phaser-Scene teilen

---

## 11. Auswirkungen auf Build-Order

| Phase | Gameplay-Bezug |
|-------|----------------|
| **M3** | Heldenname + Klasse ideal hier oder direkt danach |
| **M4** | Map, Bewegung, Kampf, Kisten (Client) |
| **M5** | Starter-Gear + Kisten-Loot in DB, XP/Level speichern |
| **M6–M8** | Nur für seltene Drops / Ownership – nicht für Starter |

---

## 12. Ein-Satz-Zusammenfassung

**Nach Reg wählt der Spieler Name und Klasse (Magier/Fern/Nah), bekommt Starter-Rüstung und erkundet eine Map mit Kisten, Gegnern und XP – stärker durch Level und Gear, optionale NFT-Sicherung nur für besondere Items.**

---

## Verwandte Docs

- [16-developer-guide.md](./16-developer-guide.md) – Build-Order M4/M5
- [10-player-journeys.md](./10-player-journeys.md) – Sichern/Shop
- [03-item-lifecycle.md](./03-item-lifecycle.md) – Item-States
- [15-game-backend-realtime.md](./15-game-backend-realtime.md) – Hub vs. Abenteuer-Map
