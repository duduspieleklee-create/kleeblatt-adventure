# 23 – DB-Schema & Migrations

**Version:** 1.0  
**Stand:** 3. August 2026  
**Status:** Design Decision  
**Bezug:** [`game-config.json`](../../game-config.json), [03-item-lifecycle.md](./03-item-lifecycle.md), [15-game-backend-realtime.md](./15-game-backend-realtime.md)

---

## 1. Zweck

Konkretes Datenbank-Schema für den Prototyp (P0–P7).  
ORM-Empfehlung: **Drizzle** oder **Prisma** – Team-Wahl, aber Schema identisch.

---

## 2. ER-Diagramm

```mermaid
erDiagram
    users ||--o| heroes : "1:1"
    users ||--o| wallets : "1:1"
    users ||--o| mint_credits : "1:1"
    users ||--o{ user_onboarding : "1:1"
    users ||--o{ items : "1:N"
    users ||--o{ match_results : "1:N"
    heroes ||--o{ items : "owner via user"
    item_templates ||--o{ items : "templateId"
    matches ||--o{ match_results : "1:N"
    chests ||--o{ chest_opens : "1:N"
    users ||--o{ chest_opens : "1:N"

    users {
        uuid id PK
        text email
        text display_name
        timestamptz created_at
    }
    heroes {
        uuid user_id PK_FK
        text hero_name
        enum class
        int level
        int xp
        jsonb equipped
        timestamptz created_at
    }
    wallets {
        uuid user_id PK_FK
        text address
        text provider_ref
        enum status
        timestamptz created_at
    }
    items {
        uuid id PK
        uuid user_id FK
        text template_id FK
        enum state
        text slot
        enum rarity
        jsonb stats
        text token_id
        timestamptz created_at
    }
    item_templates {
        text id PK
        text name
        text slot
        enum rarity
        jsonb stats
        jsonb allowed_classes
        boolean mint_candidate
    }
    mint_credits {
        uuid user_id PK_FK
        int balance
        timestamptz updated_at
    }
    matches {
        uuid id PK
        timestamptz started_at
        timestamptz ended_at
    }
    match_results {
        uuid id PK
        uuid match_id FK
        uuid user_id FK
        int xp_gained
        jsonb loot
        timestamptz created_at
    }
    chests {
        text id PK
        text map_id
        int x
        int y
    }
    chest_opens {
        uuid id PK
        text chest_id FK
        uuid user_id FK
        text item_template_id
        timestamptz opened_at
    }
    user_onboarding {
        uuid user_id PK_FK
        enum path
        boolean intro_completed
        timestamptz completed_at
    }
```

---

## 3. SQL Schema

### Enums

```sql
CREATE TYPE hero_class AS ENUM ('mage', 'ranged', 'melee');
CREATE TYPE item_state AS ENUM ('web2', 'pending_secure', 'secured', 'active_in_game', 'self_custody');
CREATE TYPE item_slot AS ENUM ('chest', 'weapon');
CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic');
CREATE TYPE wallet_status AS ENUM ('pending', 'ready');
CREATE TYPE onboarding_path AS ENUM ('newcomer', 'expert');
```

### Tables

```sql
-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    display_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auth Identities (Social Login)
CREATE TABLE auth_identities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL,           -- 'google', 'email', 'wallet'
    provider_user_id TEXT NOT NULL,     -- Google Sub-ID, E-Mail, Wallet-Adresse
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_user_id)
);

-- Heroes (1:1 pro User im Prototyp)
CREATE TABLE heroes (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hero_name   TEXT NOT NULL,
    class       hero_class NOT NULL,
    level       INT NOT NULL DEFAULT 1,
    xp          INT NOT NULL DEFAULT 0,
    equipped    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { "chest": "item-uuid", "weapon": "item-uuid" }
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Item Templates (statisch, aus game-config.json geseedet)
CREATE TABLE item_templates (
    id              TEXT PRIMARY KEY,           -- 'starter_melee_weapon'
    name            TEXT NOT NULL,
    slot             item_slot NOT NULL,
    rarity          item_rarity NOT NULL DEFAULT 'common',
    stats           JSONB NOT NULL DEFAULT '{}'::jsonb,
    allowed_classes JSONB NOT NULL DEFAULT '["mage","ranged","melee"]'::jsonb,
    mint_candidate  BOOLEAN NOT NULL DEFAULT false,
    description     TEXT
);

-- Items (Instanzen, pro Spieler)
CREATE TABLE items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL REFERENCES item_templates(id),
    state       item_state NOT NULL DEFAULT 'web2',
    slot        item_slot NOT NULL,
    rarity      item_rarity NOT NULL DEFAULT 'common',
    stats       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Kopie vom Template bei Grant
    token_id    TEXT,                                  -- NFT Token-ID (erst bei secured)
    contract_address TEXT,
    client_request_id TEXT UNIQUE,                    -- Idempotenz für Mint
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_user_state ON items(user_id, state);

-- Wallets (1:1 pro User)
CREATE TABLE wallets (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address     TEXT NOT NULL,
    provider_ref TEXT,                        -- interne ID beim MPC-Provider
    status      wallet_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mint Credits (1:1 pro User)
CREATE TABLE mint_credits (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance     INT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Onboarding
CREATE TABLE user_onboarding (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    path            onboarding_path,
    intro_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at    TIMESTAMPTZ
);

-- Matches (Session-Records)
CREATE TABLE matches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at    TIMESTAMPTZ
);

-- Match Results (XP + Loot pro Spieler pro Match)
CREATE TABLE match_results (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_gained   INT NOT NULL DEFAULT 0,
    loot        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ "templateId": "...", "itemId": "..." }]
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_results_user ON match_results(user_id);

-- Chests (statische Kisten auf der Map)
CREATE TABLE chests (
    id          TEXT PRIMARY KEY,             -- 'prototype_chest_01'
    map_id      TEXT NOT NULL DEFAULT 'prototype_map_01',
    x           INT NOT NULL,
    y           INT NOT NULL
);

-- Chest Opens (einmalig pro Spieler pro Kiste)
CREATE TABLE chest_opens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chest_id        TEXT NOT NULL REFERENCES chests(id),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_template_id TEXT REFERENCES item_templates(id),
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(chest_id, user_id)                -- once_per_player
);

-- Sessions (optional, falls JWT in DB invalidiert werden soll)
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

---

## 4. Seed-Daten

Beim ersten Start werden `item_templates` aus [`game-config.json`](../../game-config.json) geseedet:

```sql
-- Beispiel für Starter-Items
INSERT INTO item_templates (id, name, slot, rarity, stats, allowed_classes, mint_candidate, description)
VALUES
  ('starter_melee_chest', 'Starter-Rüstung', 'chest', 'common',
   '{"maxHp": 20}', '["melee"]', false, 'Solide, wenn auch nicht besonders hübsch.'),
  ('starter_melee_weapon', 'Starter-Schwert', 'weapon', 'common',
   '{"atk": 5}', '["melee"]', false, 'Ein einfaches Schwert. Besser als nichts.'),
  ('starter_ranged_chest', 'Leichte Rüstung', 'chest', 'common',
   '{"maxHp": 10, "speed": 10}', '["ranged"]', false, 'Leicht und beweglich.'),
  ('starter_ranged_weapon', 'Starter-Bogen', 'weapon', 'common',
   '{"atk": 3}', '["ranged"]', false, 'Ein simpler Bogen für den Anfang.'),
  ('starter_mage_chest', 'Leichte Robe', 'chest', 'common',
   '{"maxHp": 5, "maxMana": 10}', '["mage"]', false, 'Stoffgewand, kaum Schutz.'),
  ('starter_mage_weapon', 'Zauberfokus', 'weapon', 'common',
   '{"atk": 4}', '["mage"]', false, 'Konzentriert magische Energie.'),
  ('loot_common_chest_1', 'Verstärkte Lederrüstung', 'chest', 'common',
   '{"maxHp": 15}', '["mage","ranged","melee"]', false, NULL),
  ('loot_uncommon_chest_1', 'Gepanzerter Wams', 'chest', 'uncommon',
   '{"maxHp": 25, "atk": 2}', '["melee","ranged"]', false, NULL),
  ('loot_common_weapon_1', 'Rostige Axt', 'weapon', 'common',
   '{"atk": 6}', '["melee"]', false, NULL),
  ('loot_rare_chest_1', 'Dornenpanzer', 'chest', 'rare',
   '{"maxHp": 30, "atk": 5}', '["melee","ranged","mage"]', true, NULL),
  ('loot_epic_weapon_1', 'Klinge der alten Kriege', 'weapon', 'epic',
   '{"atk": 12, "maxHp": 10}', '["melee","ranged"]', true, NULL);

-- Kisten
INSERT INTO chests (id, map_id, x, y)
VALUES
  ('prototype_chest_01', 'prototype_map_01', 500, 400),
  ('prototype_chest_02', 'prototype_map_01', 900, 700);
```

---

## 5. Wichtige Queries

### Held mit ausgerüsteten Items laden

```sql
SELECT h.*, 
  (SELECT json_agg(i.*) FROM items i 
   WHERE i.user_id = h.user_id AND i.id = ANY(ARRAY(
     SELECT jsonb_array_elements_text(h.equipped -> 'chest') 
     UNION ALL SELECT jsonb_array_elements_text(h.equipped -> 'weapon')
   ))
  ) as equipped_items
FROM heroes h
WHERE h.user_id = $1;
```

### Inventar eines Spielers

```sql
SELECT i.*, t.name as template_name
FROM items i
JOIN item_templates t ON i.template_id = t.id
WHERE i.user_id = $1
ORDER BY i.created_at DESC;
```

### Level-Up prüfen (nach XP-Gain)

```sql
UPDATE heroes SET 
  level = CASE 
    WHEN xp >= 150 AND level < 3 THEN 3
    WHEN xp >= 550 AND level < 5 THEN 5
    -- ... aus game-config.json xpCurve
    ELSE level + CASE WHEN xp >= (SELECT xp_to_next FROM xp_thresholds WHERE level = heroes.level) THEN 1 ELSE 0 END
  END
WHERE user_id = $1;
```

Hinweis: XP-Thresholds sollten als separate Tabelle oder aus `game-config.json` zur Laufzeit gelesen werden.

---

## 6. Migrations-Strategie

- **Drizzle:** `drizzle-kit generate` + `drizzle-kit migrate`
- **Prisma:** `prisma migrate dev` + `prisma migrate deploy`
- Migrationen im Repo unter `apps/api/drizzle/` oder `apps/api/prisma/`
- Seed-Script: `npm run db:seed` liest `game-config.json` und befüllt `item_templates` + `chests`

---

## 7. Ein-Satz-Zusammenfassung

**Sieben Tabellen für den Prototyp – Users, Heroes, Items (mit Templates), Wallets, Credits, Chests, Matches – mit klaren Enums, Idempotenz-Constraints und JSONB für flexible Stats.**
