# 13 – SDK API-Skizze v1

**Version:** 0.1 (Draft)  
**Stand:** 3. August 2026  
**Status:** Vision / interne Schnittstelle – zuerst für Kleeblatt, später extrahierbar

---

## 1. Ziel von v1

Opinionated **Gameplay-First Integration Layer** für Spiele:

- Auth (Social / E-Mail / Wallet)
- Embedded Wallet (custodial via MPC)
- Item sichern (Mint)
- Zum Spielen aktivieren (Stake) / deaktivieren
- Claim to Self-Custody
- Onboarding-Pfad + Analytics-Events

**Nicht in v1:** komplette Spielwirtschaft, Gilden-Logik, Fiat-Payment-Provider, Token-Emission, Matchmaking.

---

## 2. Design-Prinzipien

| Prinzip | Bedeutung |
|---------|-----------|
| Gameplay-first | APIs sprechen Spiel-Sprache (`secureItem`, nicht nur `mintNFT`) |
| Eine Wallet-Pipeline | Jeder User nach Auth hat genau eine linked Embedded Wallet |
| Provider-agnostisch | MPC/WaaS hinter Adapter (Turnkey, Dfns, …) |
| Idempotent | Alle Mutationen mit `clientRequestId` |
| Events first | Webhooks + client events für Game-Backend |
| Minimal scope | v1 löst Onboarding + Ownership-Lebenszyklus, nicht das ganze Spiel |

---

## 3. Module Übersicht

```
@kleeblatt/sdk  (Arbeitsname)
├── auth
├── wallet
├── items          (secure / activate / deactivate)
├── claim
├── onboarding
└── analytics
```

Basis-URL (Hosted später): `https://api.example.com/v1`  
Auth: Bearer Session-Token nach Login.

---

## 4. Auth

### `POST /v1/auth/login`

Startet oder schließt Login ab (Social OAuth, E-Mail Magic Link, oder Wallet SIWE).

**Request (Beispiel E-Mail):**
```json
{
  "method": "email",
  "email": "player@example.com",
  "emailToken": "..."
}
```

**Request (Wallet):**
```json
{
  "method": "wallet",
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

**Response:**
```json
{
  "sessionToken": "...",
  "userId": "usr_...",
  "isNewUser": true,
  "walletStatus": "pending" | "ready"
}
```

### `POST /v1/auth/logout`
Session invalidieren.

### `GET /v1/auth/me`
```json
{
  "userId": "usr_...",
  "loginMethods": ["google"],
  "wallet": {
    "address": "0x...",
    "status": "ready",
    "type": "embedded_custodial"
  },
  "onboardingPath": "newcomer" | "expert" | null
}
```

**SDK-Helper (Client):**
```ts
await sdk.auth.loginWithGoogle();
await sdk.auth.loginWithEmail(email);
await sdk.auth.loginWithWallet();
await sdk.auth.getMe();
```

Nach erfolgreichem Login triggert das Backend intern `wallet.ensure` (Embedded Wallet anlegen/verknüpfen).

---

## 5. Wallet

### `POST /v1/wallet/ensure`
Idempotent: stellt sicher, dass der User eine Embedded Wallet hat.

**Response:**
```json
{
  "walletId": "wal_...",
  "address": "0x...",
  "chainId": 13371,
  "status": "ready"
}
```

### `GET /v1/wallet`
Aktuelle custodiale Wallet des Users.

### `GET /v1/wallet/balances`
```json
{
  "native": "0",
  "tokens": [{ "address": "0x...", "symbol": "TOKEN", "balance": "1000000000000000000" }]
}
```

**Hinweis v1:** Kein fiat on-ramp in der SDK. Shop/Payments bleiben Host-Spiel.

---

## 6. Items – Secure / Activate / Deactivate

Spiel-Items werden über eine **externe `itemId`** referenziert (ID aus der Game-DB). Die SDK mapped intern auf TokenIds/Contracts.

### `POST /v1/items/secure`  (Mint / „Als NFT sichern“)

**Request:**
```json
{
  "clientRequestId": "uuid",
  "itemId": "item_dornenpanzer_001",
  "collectionId": "col_gear",
  "metadata": {
    "name": "Dornenpanzer",
    "image": "https://...",
    "attributes": []
  }
}
```

**Response:**
```json
{
  "requestId": "req_...",
  "status": "pending" | "secured",
  "itemId": "item_dornenpanzer_001",
  "tokenId": "1234",
  "txHash": null,
  "walletAddress": "0x..."
}
```

**Voraussetzung (Host-Spiel):** Mint-Credit / Berechtigung prüft das **Game-Backend** vor dem Call – oder optional:
```json
"paymentRef": "credit_consumed_abc"
```
SDK v1 erzwingt kein Payment, erwartet aber idempotente, autorisierte Aufrufe vom Game-Server (Service-Key) oder Session + Server-Validation.

### `GET /v1/items/:itemId`
```json
{
  "itemId": "item_dornenpanzer_001",
  "state": "web2" | "pending_secure" | "secured" | "active_in_game" | "self_custody",
  "tokenId": "1234",
  "contractAddress": "0x...",
  "ownerType": "custodial" | "self"
}
```

### `POST /v1/items/:itemId/activate`  („Zum Spielen aktivieren“ / Stake)

**Request:**
```json
{ "clientRequestId": "uuid" }
```

**Response:**
```json
{
  "status": "pending" | "active_in_game",
  "txHash": "0x..."
}
```

### `POST /v1/items/:itemId/deactivate`  (Unstake)
Analog – Item wird on-chain freigegeben, Spiel soll `is_usable = false` setzen (via Webhook).

### Webhooks (Game-Backend)

```
item.secure.pending
item.secure.confirmed
item.secure.failed
item.activated
item.deactivated
```

Payload enthält `userId`, `itemId`, `tokenId`, `txHash`, `state`.

---

## 7. Claim to Self-Custody

### `POST /v1/claim`

**Request:**
```json
{
  "clientRequestId": "uuid",
  "toAddress": "0x...",
  "assets": [
    { "type": "nft", "itemId": "item_dornenpanzer_001" },
    { "type": "token", "tokenAddress": "0x...", "amount": "1000000000000000000" }
  ]
}
```

**Response:**
```json
{
  "claimId": "claim_...",
  "status": "pending" | "processing" | "completed" | "failed",
  "toAddress": "0x..."
}
```

### `GET /v1/claim/:claimId`
Status abfragen.

### Policies (Server-Config, nicht pro Request)

- Max. Claims / Tag
- Timelock ab Schwellenwert
- 2FA / Step-up vom **Host** vor dem API-Call

SDK liefert Claim-Ausführung; Verifizierung bleibt beim Spiel.

---

## 8. Onboarding

### `POST /v1/onboarding/path`

**Request:**
```json
{
  "path": "newcomer" | "expert"
}
```

**Response:**
```json
{
  "path": "newcomer",
  "introVersion": "v1",
  "completed": false
}
```

### `POST /v1/onboarding/complete`
Markiert Intro als abgeschlossen (für Funnel-Metriken).

### `GET /v1/onboarding/status`
```json
{
  "path": "expert",
  "introCompleted": true,
  "walletReady": true,
  "firstMatchStarted": false
}
```

`firstMatchStarted` setzt das **Spiel** per Analytics-Event (siehe unten), nicht die SDK allein.

---

## 9. Analytics (Events)

### Client oder Server: `POST /v1/analytics/events`

```json
{
  "events": [
    {
      "name": "onboarding_reg_completed",
      "timestamp": "2026-08-03T00:00:00Z",
      "userId": "usr_...",
      "properties": { "method": "google" }
    }
  ]
}
```

### Empfohlene Event-Namen (v1)

```
onboarding_reg_started
onboarding_reg_completed
onboarding_wallet_provisioned
onboarding_wallet_failed
onboarding_path_chosen
onboarding_intro_completed
onboarding_first_match_started
onboarding_first_match_completed
item_secure_started
item_secure_confirmed
item_activated
item_deactivated
claim_started
claim_completed
claim_failed
```

SDK kann Funnel-Dashboards später aggregieren; v1 = zuverlässige Event-Ingestion + eure Auswertung.

---

## 10. Client-SDK Oberfläche (TypeScript-Skizze)

```ts
const sdk = createGameSDK({
  apiKey: process.env.GAME_SDK_KEY!,
  environment: "production",
});

// Auth
await sdk.auth.loginWithGoogle();
const me = await sdk.auth.getMe();

// Wallet (meist implizit nach Login)
const wallet = await sdk.wallet.ensure();

// Onboarding
await sdk.onboarding.setPath("newcomer");
await sdk.onboarding.completeIntro();

// Item lifecycle (typisch vom Game-Server mit User-Context)
await sdk.items.secure({
  clientRequestId,
  itemId: "item_001",
  collectionId: "col_gear",
  metadata: { name: "Dornenpanzer", image: "https://..." },
});
await sdk.items.activate("item_001", { clientRequestId });
await sdk.items.deactivate("item_001", { clientRequestId });

// Claim
await sdk.claim.submit({
  clientRequestId,
  toAddress: "0x...",
  assets: [{ type: "nft", itemId: "item_001" }],
});

// Analytics
sdk.analytics.track("onboarding_first_match_started", { matchId: "m_1" });
```

**Server-to-Server:** gleiche Ressourcen mit `Authorization: Bearer sk_live_...` + `X-User-Id`.

---

## 11. Webhooks (Outbound an Game-Backend)

| Event | Wann |
|-------|------|
| `wallet.ready` | Embedded Wallet provisioniert |
| `item.secure.confirmed` | Mint final |
| `item.secure.failed` | Mint fehlgeschlagen |
| `item.activated` | Stake bestätigt |
| `item.deactivated` | Unstake bestätigt |
| `claim.completed` | Assets auf Ziel-Adresse |
| `claim.failed` | Claim fehlgeschlagen |

Signatur: HMAC-SHA256 Header `X-SDK-Signature`.

---

## 12. Fehlerformat

```json
{
  "error": {
    "code": "WALLET_PROVISION_FAILED",
    "message": "Could not create embedded wallet",
    "retryable": true,
    "requestId": "req_..."
  }
}
```

Wichtige Codes v1:  
`UNAUTHORIZED` · `WALLET_PROVISION_FAILED` · `ITEM_NOT_SECURABLE` · `ITEM_ALREADY_SECURED` · `ITEM_NOT_ACTIVE` · `CLAIM_POLICY_VIOLATION` · `INVALID_ADDRESS` · `PROVIDER_UNAVAILABLE`

---

## 13. Was v1 bewusst **nicht** enthält

| Thema | Warum später / außerhalb |
|-------|---------------------------|
| Fiat-Payments / Mint-Credit-Kauf | Pro Spiel + Payment-Provider |
| Token-Verkauf / DEX | Wirtschaft des Spiels |
| Gilden-Banks | Spiel-Design |
| Matchmaking / Inventar-DB | Host-Game |
| Multi-Chain | v1 = eine Chain (z. B. Immutable zkEVM) |
| Fiat-Off-Ramp | Nicht Teil des Ownership-MVP |

---

## 14. Security-Modell (kurz)

| Akteur | Rechte |
|--------|--------|
| Spiel-Client | Login, Onboarding, Analytics, Status lesen |
| Game-Backend (Service-Key) | Secure/Activate/Claim im Namen des Users nach eigener AuthZ |
| MPC-Provider | Signaturen, Keys nie im Klartext beim Studio |
| Spieler (Self-Custody nach Claim) | Volle Kontrolle außerhalb der SDK |

---

## 15. Roadmap-Skizze

| Stufe | Inhalt |
|-------|--------|
| **Intern v0** | Module nur in Kleeblatt, gleiche Interface-Namen |
| **v1 API** | Hosted oder self-hosted Endpunkte wie oben |
| **v1 SDK** | TS Client + Webhook-Verifier + Event-Listen |
| **v1.1** | Dashboard Funnel (TTFM, Pfad-Split) |
| **v2** | Multi-Game Tenancy, Policy-UI, weitere Chains |

---

## 16. Ein-Satz-Zusammenfassung

**v1 gibt Spielen eine einheitliche API für Login-Wallet, Item sichern/aktivieren und Claim – plus Onboarding-Pfad und Events – ohne Economy, Payments oder Matchmaking zu übernehmen.**

---

## Verwandte Docs

- [12-pattern-zusammenfassung.md](./12-pattern-zusammenfassung.md) – allgemeines Muster
- [11-onboarding-journey.md](./11-onboarding-journey.md) – Funnel & Metriken
- [06-wallet-abstraktionsschicht.md](./06-wallet-abstraktionsschicht.md) – Provider-Adapter
- [10-player-journeys.md](./10-player-journeys.md) – UX-Flows
