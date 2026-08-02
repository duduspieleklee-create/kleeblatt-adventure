# 21 – Game-Konfiguration

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design Decision  
**Datei:** [`game-config.json`](../../game-config.json)

---

## 1. Zweck

Zentrale, datengesteuerte Konfiguration für alle Gameplay-Werte des Prototyps (P0–P7).  
Ein Entwickler soll alle spielerrelevanten Zahlen aus **einer Datei** lesen können, ohne Code durchsuchen zu müssen.

> **Regel:** Phaser-Szene, API und RuleEngine lesen aus dieser Datei. Keine hardcodierten Werte in der Combat-Logik.

---

## 2. Struktur

| Sektion | Inhalt | Primärer Konsument |
|---------|--------|--------------------|
| `auth` | Login-Provider, Session, Env-Variablen, Routen | Game API |
| `statStacking` | Formel für finale Stats (base + gear + level) | RuleEngine, API |
| `hero.classes` | Basis-Stats, Basic-Attack, Skills pro Klasse | Phaser, RuleEngine |
| `skills` | CDs, Kosten, Schaden, Effekte pro Skill | RuleEngine |
| `enemies` | Stats, FSM-States, Spawn-Config pro Archetyp | Phaser (Enemy-AI) |
| `xpCurve` | XP-Schwellen, Unlocks, Regeln | API, Phaser (HUD) |
| `starterGear` | Template-Items pro Klasse | API (Seed bei Helder-Estellung) |
| `lootTables` | Weighted-Loot für Kisten | API (Loot-Roll) |
| `respawn` | Tod → Delay → Respawn-Regeln | Phaser |
| `match` | Map-Größe, Spawns, Kisten, Win-Condition | Phaser |
| `itemStateEnum` / `rarityEnum` | Erlaubte Werte | API, DB, RuleEngine |
| `rarityMintRules` | Welche Rarity gemintet werden darf | API (Mint-Logik) |

---

## 3. Auth-Entscheidung (Prototyp)

| Thema | Festlegung |
|-------|------------|
| Provider | **Google OAuth 2.0** |
| Mock-Login | **Nein** – echter Provider ab Prototyp |
| Session | JWT in HttpOnly-Cookie, 7 Tage TTL |
| Weitere Login-Methoden | Später (E-Mail-Magic-Link, Wallet-Connect ab M1+) |

### Benötigte Env-Variablen

```bash
GOOGLE_CLIENT_ID=         # aus Google Cloud Console
GOOGLE_CLIENT_SECRET=     # aus Google Cloud Console
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
SESSION_SECRET=           # zufälliger String ≥ 32 Zeichen
API_URL=http://localhost:4000
WEB_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

Siehe auch: [11-onboarding-journey.md](./11-onboarding-journey.md) – Login-Methoden Reihenfolge.

---

## 4. Stat-Stacking

```
final_maxHp  = hero.baseStats.maxHp  + (level - 1) * hpPerLevel  + sum(gear.maxHp)
final_atk    = hero.baseStats.atk    + (level - 1) * atkPerLevel  + sum(gear.atk)
final_speed  = hero.baseStats.speed  + sum(gear.speed)
final_maxRes = hero.baseStats.maxResource + sum(gear.maxMana oder gear.maxStamina)
```

Alle Boni sind **additiv**. Keine Multiplikatoren im Prototyp.

---

## 5. XP-Kurve

Mode: `prototype_fast` – Level 3 (E-Skill) nach ca. 10 Bruiser-Kills erreichbar.

| Level | XP gesamt | XP bis Next | Unlock |
|-------|----------:|-------------|--------|
| 1 | 0 | 60 | Q-Skill |
| 2 | 60 | 90 | — |
| 3 | 150 | 150 | E-Skill |
| 4 | 300 | 250 | — |
| 5 | 550 | 400 | — |
| 10 | 5050 | — | Max Level |

XP-Quelle ist `enemies.archetypes.<type>.stats.xp` (Source of Truth pro Archetyp).  
Bruiser gibt 15 XP → Level 3 nach ~10 Kills.

---

## 6. Template-IDs vs. Item-Instanzen

Starter-Gear und Loot-Einträge verwenden `templateId`.  
Die **Game API** generiert beim Grant eine eindeutige `itemId` (DB-Primary-Key) und kopiert die Stats vom Template.

```
templateId: "starter_melee_weapon"  (statisch, aus game-config.json)
    ↓ API grant
itemId: "item_01HX..."  (UUID, in DB mit user_id, state, slot, stats)
```

---

## 7. Loot-Kisten

| Regel | Wert |
|-------|------|
| Kisten pro Map | 2 |
| Rolls pro Kiste | 1 |
| Respawn | `once_per_player` (einmalig pro Spieler) |
| Interaktion | Nähe (48px) + Taste E |
| Loot-Auswahl | Weighted Random über `weight` |

Rare und Epic Items sind `mintCandidate: true` (siehe [03-item-lifecycle.md](./03-item-lifecycle.md)).

---

## 8. Item-Klassen-Beschränkung

Jedes Item hat `allowedClasses`. Die API prüft beim Ausrüsten, ob die Klasse des Helden erlaubt ist.

Beispiel: `loot_uncommon_chest_1` ("Gepanzerter Wams") ist nur für `melee` und `ranged`, nicht für `mage`.

---

## 9. Enemy-Activierung im Prototyp

| Archetyp | `enabledInPrototype` |
|----------|---------------------|
| Bruiser | `true` |
| Runner | `false` |
| Spitter | `false` |

Runner und Spitter sind vollständig spezifiziert (inkl. Stats und FSM) und können in P8 optional aktiviert werden.

---

## 10. Bezug zu anderen Docs

| Doc | Bezug |
|-----|-------|
| [17-mvp-gameplay.md](./17-mvp-gameplay.md) | Klassen, Skills, Map – Config liefert konkrete Zahlen |
| [18-enemy-ai.md](./18-enemy-ai.md) | Enemy-Stats und FSM – Config übernimmt Werte 1:1 |
| [19-phaser-rule-engine.md](./19-phaser-rule-engine.md) | TypeScript-Interfaces – Config ist die Datenquelle für SkillDefs |
| [20-prototyp-checkliste.md](./20-prototyp-checkliste.md) | P0–P7 Phasen – Config deckt P2 (Held), P5 (Combat), P6 (XP), P7 (Loot) ab |
| [03-item-lifecycle.md](./03-item-lifecycle.md) | Item-States – Config definiert `itemStateEnum` und `rarityMintRules` |
| [11-onboarding-journey.md](./11-onboarding-journey.md) | Auth – Config trifft die Provider-Entscheidung |

---

## 11. Ein-Satz-Zusammenfassung

**`game-config.json` ist die einzige Quelle für Gameplay-Werte im Prototyp – Helden, Skills, Gegner, XP, Loot und Auth-Provider, alles datengesteuert und ohne hardcodierte Werte in Phaser oder API.**
