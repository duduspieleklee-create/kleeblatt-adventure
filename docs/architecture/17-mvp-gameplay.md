# 17 – MVP Gameplay Spec

**Version:** 1.1  
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

| Klasse | ID | Rolle |
|--------|-----|--------|
| **Magier** | `mage` | Distanzzauber, Burst, Blink |
| **Fernkämpfer** | `ranged` | Distanz, Kiting, Slow |
| **Nahkämpfer** | `melee` | Frontline, Dash, Schildwall |

### 2.2 Starter-Ausrüstung

Je nach Klasse erhält der Spieler **geschenkte Start-Rüstung / Start-Gear** (Web2-Inventar, State `web2`):

| Klasse | Starter-Paket |
|--------|---------------|
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

## 3. Klassenfähigkeiten (MVP)

Pro Klasse: **Basisangriff + 2 Fähigkeiten**.  
Fähigkeit Q ab Level 1, Fähigkeit E ab **Level 3**.

### 3.1 Gemeinsame Regeln

| Regel | Festlegung |
|--------|------------|
| Ressourcen | **Mana** (Magier) bzw. **Stamina** (Fern + Nah) |
| Basisangriff | Unbegrenzt, leichter Schaden, kurzer Rhythmus |
| Fähigkeiten | Cooldown-basiert |
| Level-Ups | +Max-HP, +Basis-Schaden; E-Skill ab Level 3 |
| Unterbrechung | Längere Casts (Magier-Basis) können unterbrochen werden |

### 3.2 Nahkämpfer (`melee`)

| Fähigkeit | Taste | Ab | Wirkung |
|-----------|-------|-----|--------|
| **Schlag** (Basis) | LMB | Lv1 | Nahkegel, mittlerer Schaden |
| **Sturmangriff** | Q | Lv1 | Kurzer Dash nach vorne + Schaden; ~6–8 s CD |
| **Schildwall** | E | Lv3 | ~2,5 s stark reduzierter eingehender Schaden; ~12 s CD |

**Spielgefühl:** Rein, zuschlagen, Lücke mit Dash schließen, Bursts mit Schild überleben.

### 3.3 Fernkämpfer (`ranged`)

| Fähigkeit | Taste | Ab | Wirkung |
|-----------|-------|-----|--------|
| **Schuss** (Basis) | LMB | Lv1 | Projektil, geringer–mittlerer Schaden |
| **Schnellfeuer** | Q | Lv1 | 3 schnelle Schüsse; ~7 s CD |
| **Netzfalle / Slow** | E | Lv3 | Verlangsamt Gegner 2–3 s; ~10 s CD |

**Spielgefühl:** Distanz halten, Spike mit Schnellfeuer, mit Slow entkommen oder fokussieren.

### 3.4 Magier (`mage`)

| Fähigkeit | Taste | Ab | Wirkung |
|-----------|-------|-----|--------|
| **Zauberspruch** (Basis) | LMB | Lv1 | Kurzer Cast, Projektil, guter Schaden, wenig Mana |
| **Feuerball** | Q | Lv1 | Stärkeres Projektil + kleiner Einschlag-AoE; ~8 s CD |
| **Blink** | E | Lv3 | Kurzer Teleport (Escape); ~14 s CD |

**Spielgefühl:** Burst auf Distanz, bei Gefahr blinken, Mana im Blick.

### 3.5 Vergleich

| | Nahkämpfer | Fernkämpfer | Magier |
|--|------------|-------------|--------|
| Reichweite | Sehr nah | Weit | Weit |
| Überleben | Schildwall | Kiting + Slow | Blink |
| Burst | Dash-Engage | Schnellfeuer | Feuerball-AoE |
| Ressource | Stamina | Stamina | Mana |

### 3.6 Progression Skills

| Level | Effekt |
|-------|--------|
| 1 | Basis + Q |
| 3 | E freigeschaltet |
| 5+ | Nur Zahlen-Scaling (kein neuer Button im MVP) |

Exakte Schadens-/CD-Zahlen: Balance-Pass nach erster Combat-Iteration.  
Gegner-KI und Archetypen: [18-enemy-ai.md](./18-enemy-ai.md).

---

## 4. Die Map (Abenteuer-Welt)

### 4.1 Was der Spieler kann

| Aktion | Beschreibung |
|--------|--------------|
| **Bewegen** | Held auf der Map steuern (WASD/Klick – Input TBD) |
| **Lootkisten** | Kisten öffnen → Rüstung/Items (In-Game) |
| **Gegner angreifen** | Kampf gegen Enemy-NPCs |
| **XP sammeln** | Siege → Level-Ups |

### 4.2 Map-Scope MVP

- **Mindestens eine** spielbare Abenteuer-Map (nicht die Social-Hub-Map)
- Fläche für Erkunden, 3 Enemy-Archetypen, mehrere Kisten-Spawns
- Social-Hub separat ([15](./15-game-backend-realtime.md))

**Empfehlung:** Abenteuer zuerst **Single-Player / instanziiert** (M4), Hub-Multiplayer parallel (M9).

---

## 5. Kampf (MVP-Rahmen)

| Thema | MVP-Festlegung |
|-------|----------------|
| Perspektive | 2D (Phaser), heldenzentriert |
| Ziel | Gegner besiegen, Map erkunden |
| Klassen | Skills laut Abschnitt 3 |
| Tod / Niederlage | TBD (Respawn vs. Session-Ende) – **offen** |
| Schwierigkeit | Erste Balance über Enemy-Stats ([18](./18-enemy-ai.md)) |

---

## 6. Loot & Rüstung

### 6.1 Lootkisten

- Auf der Map verteilte Kisten → Belohnung ins **Inventar** (Web2)
- Fokus: **Rüstungsteile / Gear**

### 6.2 Rarity (Vorschlag)

| Stufe | On-Chain-Sichern |
|-------|------------------|
| Gewöhnlich | Nein (MVP) |
| Ungewöhnlich / Selten | Optional |
| Episch / Boss | Kandidat für Mint |

Starter-Gear: gewöhnlich, nicht mint-fokussiert.

### 6.3 Anlegen

- Ausrüsten in React-UI; Loadout in die Phaser-Session

---

## 7. Progression (XP & Stärke)

| Element | MVP |
|---------|-----|
| **XP** | Gegner besiegen (optional Kisten) |
| **Level** | +Basis-Werte; Skill E ab Level 3 |
| **Gear** | Zweiter Stärke-Hebel |
| **Skill-Baum** | Nicht MVP – feste Q/E pro Klasse |

---

## 8. Verbindung zu Ownership

| Spiel-Moment | Platform-Feature |
|--------------|------------------|
| Starter & normale Kisten | Web2 |
| Seltenes/Episches Teil | „Als NFT sichern“ |
| Gesichertes Teil im Kampf | „Zum Spielen aktivieren“ |
| Voll besitzen | Claim |

Gameplay muss **ohne** Mint spaßig sein.

---

## 9. Session-Flow

```
Registrierung
  → Onboarding-Intro (Neuling/Experte)
  → Heldenname + Klasse wählen
  → Starter-Rüstung erhalten
  → Hub oder Abenteuer-Map
  → Bewegen, kämpfen, Kisten, XP
  → Inventar: Rüstung anlegen
  → Optional: seltenes Item sichern
```

---

## 10. Abgrenzung MVP vs. später

| Im MVP | Später |
|--------|--------|
| 1 Abenteuer-Map | Weitere Biome |
| 3 Klassen, Q+E | Skill-Bäume, mehr Klassen |
| Kisten + Gegner + XP | Quests, Bosse, Crafting |
| Single-Player-Abenteuer | Koop / PvP |
| Social-Hub separat | Geteilte offene Welt |

---

## 11. Offene Punkte

- [ ] Input-Schema (WASD vs. Klick-to-move)
- [ ] Tod/Respawn-Regeln
- [ ] Exakte Starter-Item-IDs und Stats
- [ ] Exakte Schadens-/CD-Zahlen Skills
- [ ] Kisten-Loot-Tabellen
- [ ] Level-Kurve (XP pro Level)
- [ ] Win-Condition (Sandbox vs. Mission)

---

## 12. Auswirkungen auf Build-Order

| Phase | Gameplay-Bezug |
|-------|----------------|
| **M3** | Heldenname + Klasse |
| **M4** | Map, Bewegung, Skills, Gegner-KI, Kisten |
| **M5** | Starter-Gear, Loot, XP/Level in DB |
| **M6–M8** | Nur seltene Drops / Ownership |

---

## 13. Ein-Satz-Zusammenfassung

**Nach Reg wählt der Spieler Name und Klasse (Magier/Fern/Nah mit Q/E-Skills), bekommt Starter-Rüstung und erkundet eine Map mit Kisten, Gegnern und XP – stärker durch Level und Gear, NFT-Sicherung nur optional für besondere Items.**

---

## Verwandte Docs

- [18-enemy-ai.md](./18-enemy-ai.md) – Gegner-KI & Archetypen
- [16-developer-guide.md](./16-developer-guide.md) – Build-Order
- [10-player-journeys.md](./10-player-journeys.md) – Sichern/Shop
- [15-game-backend-realtime.md](./15-game-backend-realtime.md) – Hub vs. Abenteuer
