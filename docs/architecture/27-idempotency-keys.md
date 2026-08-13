# 27 – Idempotency Keys (API Write-Schutz)

**Version:** 1.0  
**Stand:** 13. August 2026  
**Status:** Spec (noch nicht implementiert)  
**Bezug:** gameBridge, Economy, Inventory, Mint/Stake, Security

---

## 1. Zweck

Kritische Write-Operationen (Gold, Items, Mint, Shop, Stake …) müssen **idempotent** sein.

Ohne Schutz führen doppelte Requests (Retry, Doppelklick, Network-Replay, Client-Injection) zu:

- doppeltem Gold-Abzug / Gutschrift
- doppeltem Item-Remove
- doppeltem Mint-Intent

**Regel:** Jeder kritische Write trägt einen Client-`idempotencyKey`. Der Server speichert Key → Response und liefert bei Wiederholung dasselbe Ergebnis, ohne die Business-Logik erneut auszuführen.

---

## 2. Scope – wo Pflicht?

| Aktion | Idempotenz | Bemerkung |
|--------|------------|-----------|
| Economy spend / grant | ✅ Pflicht | |
| Inventory remove (z.B. vor Mint) | ✅ Pflicht | |
| Shop-Kauf | ✅ Pflicht | |
| Mint prepare / confirm | ✅ Pflicht | |
| Stake / unstake / deposit / withdraw | ✅ Pflicht | |
| Chest open | ✅ bereits via `UNIQUE(user_id, chest_id)` | |
| Reads (query, hydrate, hero get) | ❌ nicht nötig | |

---

## 3. Client-Vertrag

### 3.1 Key-Format

- UUID v4 **oder** `req_` + 16–32 hex (kompatibel mit `newId("req")`)
- Pro **logischer User-Aktion** genau ein Key
- Bei Retry denselben Key erneut senden
- Bei neuem User-Klick → **neuer** Key

### 3.2 Transport

Bevorzugt Header:

```http
Idempotency-Key: req_a1b2c3d4e5f67890
```

Alternativ Body-Feld (gleichwertig, wenn Header fehlt):

```json
{ "idempotencyKey": "req_a1b2c3d4e5f67890", ... }
```

### 3.3 Bridge-Kopplung

`requestId` in gameBridge-Events **ist** der Idempotency-Key für den nachfolgenden API-Call.

```ts
// Phaser → React
"economy:request": {
  requestId: string; // = Idempotency-Key
  action: "spend" | "grant";
  currency: string;
  amount: number;
  reason: string;
}
```

React reicht `requestId` als `Idempotency-Key` an die API durch.

---

## 4. Server – Datenmodell

Neue Tabelle `idempotency_keys`:

| Spalte | Typ | Bedeutung |
|--------|-----|-----------|
| `user_id` | text FK | Besitzer des Keys |
| `key` | text | Client-Key |
| `endpoint` | text | z.B. `economy.spend`, `mint.confirm` |
| `request_hash` | text nullable | Hash des relevanten Request-Bodies |
| `response_status` | integer | HTTP-Status der gespeicherten Antwort |
| `response_body` | jsonb | gespeicherte Antwort |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | TTL, Default **24h** |

**Unique Index:** `(user_id, key, endpoint)`

Damit gilt ein Key nur pro User und Endpoint – kein Cross-User-Leak, kein Cross-Action-Reuse.

---

## 5. Server – Ablauf

```text
Request mit Key
    ↓
Lookup (user_id, key, endpoint)
    ↓
Gefunden?
  → ja: optional request_hash prüfen
       → Hash abweichend → 409 Conflict
       → Hash ok / kein Hash → gespeicherte Response zurück (kein Re-Execute)
  → nein: Business-Logik in Transaction ausführen
       → Ergebnis in idempotency_keys speichern
       → Response an Client
```

### 5.1 Anforderungen

1. **Lookup + Insert + Business-Write in einer DB-Transaction** (Race bei parallelen gleichen Keys).
2. Bei Unique-Violation am Insert: erneut lesen und gespeicherte Response liefern.
3. Abgelaufene Keys (`expires_at < now()`) dürfen neu belegt werden (Cleanup-Job optional).
4. Fehlende Keys auf Pflicht-Endpoints → `400 Bad Request`.

### 5.2 Helper (geplant)

```ts
// apps/api/src/lib/idempotency.ts
withIdempotency({
  userId,
  key,
  endpoint,      // "economy.spend"
  requestBody,   // für Hash
  handler,       // () => Promise<{ status, body }>
})
```

---

## 6. Fehlercodes

| Situation | Status |
|-----------|--------|
| Key fehlt (Pflicht-Endpoint) | 400 |
| Key bekannt, Body/Hash weicht ab | 409 |
| Key bekannt, gleiche Aktion | 200/201 mit cached body |
| Business-Fehler (z.B. zu wenig Gold) | normaler 4xx, **trotzdem speichern** (damit Retry denselben Fehler liefert und nicht „beim zweiten Versuch klappt’s“) |

**Hinweis:** Auch Fehler-Responses cachen (für die TTL), sonst kann ein Retry nach transientem Client-Bug zu doppelter Ausführung führen, wenn der erste Versuch doch durchging.

Empfehlung v1: **Erfolgreiche und definitive 4xx-Business-Fehler cachen**; reine 5xx optional nicht cachen oder mit kurzer TTL.

---

## 7. Security-Kontext

Idempotenz ersetzt **keine** Auth und keine Ownership-Checks.

Zusätzlich weiterhin Pflicht:

- Session/JWT an jedem Write
- Server prüft Besitz (Item gehört User, Balance reicht)
- Amounts/IDs nie dem Client glauben ohne Server-Validierung
- Rate-Limits pro User/Endpoint
- Audit-Log für kritische Aktionen (später)

Die Bridge bleibt untrusted. Idempotency schützt vor **Doppel-Ausführung**, nicht vor **gefälschten Absichten**. Gefälschte Absichten scheitern an der API-Validierung.

---

## 8. Implementierungs-Reihenfolge (später Code)

1. Drizzle-Schema + Migration `idempotency_keys`
2. `withIdempotency` Helper
3. Einbau in erste Write-Routes (Inventory-Remove, später Economy/Mint)
4. React: Key aus Bridge-`requestId` durchreichen
5. Cleanup-Job / TTL-Index (optional)

---

## 9. Ein-Satz-Zusammenfassung

**Jeder kritische Write braucht einen Idempotency-Key; der Server führt die Aktion höchstens einmal pro (user, key, endpoint) aus und cached die Antwort.**
