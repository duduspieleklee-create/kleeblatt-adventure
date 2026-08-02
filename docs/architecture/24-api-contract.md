# 24 – REST-API-Vertrag (Prototyp)

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design Decision  
**Bezug:** [13-sdk-api-skizze-v1.md](./13-sdk-api-skizze-v1.md), [21-game-config.md](./21-game-config.md), [23-db-schema.md](./23-db-schema.md)

---

## 1. Überblick

REST-API für den Prototyp (P0–P7). Basis-URL: `http://localhost:4000`  
Auth: JWT in HttpOnly-Cookie. Alle geschützten Routen benötigen gültige Session.

```text
GET    /health
GET    /auth/google              → OAuth Redirect
GET    /auth/google/callback     → OAuth Callback → Set Cookie → Redirect
POST   /auth/logout
GET    /me

POST   /hero                     → Helden erstellen (Name + Klasse)
GET    /hero

GET    /inventory
POST   /inventory/:itemId/equip
POST   /inventory/:itemId/unequip

GET    /wallet                   → Mock-Wallet (P3)

POST   /match/start              → Match-Session starten
POST   /match/result             → XP + Loot server-authoritativ

GET    /chests                    → Verfügbare Kisten
POST   /chests/:chestId/open     → Loot-Roll, einmalig pro Spieler
```

---

## 2. Endpoints

### 2.1 Health

```http
GET /health
```

**Response 200:**
```json
{ "status": "ok", "timestamp": "2026-08-03T00:00:00Z" }
```

---

### 2.2 Auth – Google OAuth

```http
GET /auth/google
```

Leitet zu Google OAuth Consent weiter.  
Redirect-URI: `GOOGLE_CALLBACK_URL` (siehe [.env.example](../../.env.example)).

```http
GET /auth/google/callback?code=...
```

OAuth-Code austauschen, User in DB anlegen (falls neu), JWT-Cookie setzen, Redirect zu `WEB_URL`.

**Cookie:** `kleeblatt_session` (HttpOnly, SameSite=Lax, 7 Tage TTL)

```http
POST /auth/logout
```

Session invalidieren, Cookie löschen.

**Response 200:**
```json
{ "ok": true }
```

---

### 2.3 Me

```http
GET /me
```

Gibt aktuellen User + Helden-Status zurück.

**Response 200:**
```json
{
  "userId": "usr_abc123",
  "email": "player@example.com",
  "hero": {
    "heroName": "Testheld",
    "class": "melee",
    "level": 3,
    "xp": 180
  } | null
}
```

---

### 2.4 Hero erstellen

```http
POST /hero
Content-Type: application/json

{
  "heroName": "Testheld",
  "class": "melee"
}
```

**Validierung:**
- `heroName`: 2–20 Zeichen, alphanumerisch + Leerzeichen
- `class`: `"mage" | "ranged" | "melee"`

**Nebenwirkung:** Starter-Items aus `game-config.json` → `starterGear[class]` werden in `items` angelegt (State `web2`).

**Response 201:**
```json
{
  "userId": "usr_abc123",
  "heroName": "Testheld",
  "class": "melee",
  "level": 1,
  "xp": 0,
  "starterItems": [
    { "itemId": "item_01HX...", "templateId": "starter_melee_chest", "name": "Starter-Rüstung", "slot": "chest", "rarity": "common", "state": "web2" },
    { "itemId": "item_01HX...", "templateId": "starter_melee_weapon", "name": "Starter-Schwert", "slot": "weapon", "rarity": "common", "state": "web2" }
  ]
}
```

**Response 409:** Held existiert bereits.

```http
GET /hero
```

**Response 200:** Wie oben ohne `starterItems`.  
**Response 404:** Noch kein Held erstellt.

---

### 2.5 Inventory

```http
GET /inventory
```

**Response 200:**
```json
{
  "items": [
    {
      "itemId": "item_01HX...",
      "templateId": "starter_melee_chest",
      "name": "Starter-Rüstung",
      "slot": "chest",
      "rarity": "common",
      "state": "web2",
      "stats": { "maxHp": 20 },
      "equipped": true
    }
  ],
  "equipped": {
    "chest": "item_01HX...",
    "weapon": "item_01HX..."
  }
}
```

---

### 2.6 Equip / Unequip

```http
POST /inventory/:itemId/equip
```

Prüft: Item gehört User, `allowedClasses` enthält Helden-Klasse, Slot nicht doppelt belegt.  
Setzt `heroes.equipped[slot] = itemId`.

**Response 200:**
```json
{ "itemId": "item_01HX...", "slot": "chest", "equipped": true }
```

**Response 409:** Slot bereits belegt (erst unequippen).

```http
POST /inventory/:itemId/unequip
```

Entfernt Item aus `equipped[slot]`.

---

### 2.7 Wallet (Mock, P3)

```http
GET /wallet
```

**Response 200:**
```json
{
  "address": "0xMock...",
  "status": "ready",
  "provider": "mock"
}
```

---

### 2.8 Match

```http
POST /match/start
```

Erstellt Match-Record in DB.

**Response 201:**
```json
{
  "matchId": "match_01HX...",
  "startedAt": "2026-08-03T00:00:00Z",
  "config": {
    "mapId": "prototype_map_01",
    "playerSpawn": { "x": 100, "y": 100 }
  }
}
```

```http
POST /match/result
Content-Type: application/json

{
  "matchId": "match_01HX...",
  "enemiesKilled": 5,
  "chestsOpened": 1
}
```

**Server-authoritativ:** XP berechnet sich aus `enemiesKilled * enemyXp` (aus `game-config.json`).  
Loot wird serverseitig gewürfelt (weighted random aus `lootTables`).

**Response 200:**
```json
{
  "xpGained": 75,
  "newLevel": 3,
  "leveledUp": true,
  "loot": [
    {
      "itemId": "item_01HX...",
      "templateId": "loot_rare_chest_1",
      "name": "Dornenpanzer",
      "slot": "chest",
      "rarity": "rare",
      "stats": { "maxHp": 30, "atk": 5 }
    }
  ]
}
```

---

### 2.9 Chests

```http
GET /chests
```

**Response 200:**
```json
{
  "chests": [
    { "chestId": "prototype_chest_01", "x": 500, "y": 400, "opened": false },
    { "chestId": "prototype_chest_02", "x": 900, "y": 700, "opened": false }
  ]
}
```

`opened` = `true` wenn Spieler diese Kiste bereits geöffnet hat (`chest_opens` Tabelle).

```http
POST /chests/:chestId/open
```

**Nebenwirkung:** Weighted-Loot-Roll aus `game-config.json` → `lootTables.prototype_chest`.  
Item wird in `items` angelegt (State `web2`).  
Eintrag in `chest_opens` (Unique Constraint verhindert Doppel-Open).

**Response 200:**
```json
{
  "item": {
    "itemId": "item_01HX...",
    "templateId": "loot_common_chest_1",
    "name": "Verstärkte Lederrüstung",
    "slot": "chest",
    "rarity": "common",
    "stats": { "maxHp": 15 }
  }
}
```

**Response 409:** Kiste bereits geöffnet.

---

## 3. Fehlerformat

Alle Fehler nutzen ein einheitliches Format:

```json
{
  "error": {
    "code": "HERO_ALREADY_EXISTS",
    "message": "Du hast bereits einen Helden erstellt.",
    "retryable": false
  }
}
```

### Fehlercodes (Prototyp)

| Code | HTTP | Bedeutung |
|------|------|-----------|
| `UNAUTHORIZED` | 401 | Keine gültige Session |
| `HERO_NOT_FOUND` | 404 | Noch kein Held erstellt |
| `HERO_ALREADY_EXISTS` | 409 | Held bereits angelegt |
| `ITEM_NOT_FOUND` | 404 | Item existiert nicht |
| `ITEM_NOT_OWNED` | 403 | Item gehört nicht dem User |
| `SLOT_ALREADY_EQUIPPED` | 409 | Slot bereits belegt |
| `CLASS_NOT_ALLOWED` | 403 | Klasse darf Item nicht ausrüsten |
| `CHEST_ALREADY_OPENED` | 409 | Kiste bereits geöffnet |
| `CHEST_NOT_FOUND` | 404 | Kiste existiert nicht |
| `VALIDATION_ERROR` | 400 | Eingabe ungültig |
| `MATCH_NOT_FOUND` | 404 | Match existiert nicht |
| `INTERNAL_ERROR` | 500 | Server-Fehler |

---

## 4. Middleware

| Middleware | Zweck |
|------------|------|
| `auth` | JWT validieren, User an Request hängen. Ausgenommen: `/health`, `/auth/google*` |
| `validateBody(schema)` | Zod-Schema validieren bei POST/PUT |
| `rateLimit` | Redis-basiert, besonders `/auth/*` und `/chests/:id/open` |
| `errorHandler` | Fehler als JSON-Response, nie Stack-Traces leaken |

---

## 5. Hono-Router-Struktur

```text
apps/api/src/
├── index.ts                 # App erstellen, Middleware, Routes mounten
├── routes/
│   ├── health.ts            # GET /health
│   ├── auth.ts              # /auth/google, /auth/google/callback, /auth/logout
│   ├── me.ts                # GET /me
│   ├── hero.ts              # POST /hero, GET /hero
│   ├── inventory.ts         # GET /inventory, POST /:id/equip, /:id/unequip
│   ├── wallet.ts            # GET /wallet (mock)
│   ├── match.ts             # POST /match/start, /match/result
│   └── chests.ts            # GET /chests, POST /:id/open
├── services/
│   ├── auth.service.ts
│   ├── hero.service.ts
│   ├── inventory.service.ts
│   ├── loot.service.ts      # Weighted-Random aus game-config.json
│   └── match.service.ts
├── middleware/
│   ├── auth.ts
│   ├── validate.ts
│   ├── rateLimit.ts
│   └── errorHandler.ts
├── db/
│   ├── schema.ts            # Drizzle/Prisma Schema
│   └── seed.ts              # game-config.json → item_templates
└── config/
    └── game-config.ts       # Lädt und typisiert game-config.json
```

---

## 6. Ein-Satz-Zusammenfassung

**15 REST-Endpunkte für den Prototyp – Auth, Hero, Inventory, Match und Chests – mit einheitlichem Fehlerformat, Zod-Validierung und server-authoritativem Loot/XP.**
