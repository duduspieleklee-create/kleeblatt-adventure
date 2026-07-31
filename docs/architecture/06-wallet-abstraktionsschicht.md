# 06 – Wallet-Abstraktionsschicht

Ziel: Provider-agnostische Schicht, damit später relativ schmerzfrei zwischen Turnkey, Dfns, Fireblocks etc. gewechselt werden kann.

## Architektur

```
[Game Backend / Worker]
        ↓
[Wallet Service Interface]          ← Abstraktion
        ↓
[Provider Adapter]                  ← TurnkeyAdapter | DfnsAdapter | MockAdapter
        ↓
[MPC Provider]
```

## Core Interface (Auszug)

```typescript
export interface WalletService {
  createWallet(params: CreateWalletParams): Promise<{ walletId: string; address: string }>;
  getAddress(walletId: string): Promise<string>;
  transfer(params: TransferParams): Promise<{ txHash: string; status: string }>;
  setPolicy(walletId: string, rules: PolicyRule): Promise<void>;
  initiateClaimToExternal(walletId: string, toAddress: string, assets: Asset[]): Promise<{ claimId: string }>;
  getBalance(walletId: string, tokenAddress?: string): Promise<bigint>;
  healthCheck(): Promise<boolean>;
}
```

## Factory-Pattern

```typescript
export function createWalletService(): WalletService {
  const provider = process.env.WALLET_PROVIDER || "turnkey";

  switch (provider) {
    case "turnkey": return new TurnkeyAdapter({ ... });
    case "dfns":    return new DfnsAdapter({ ... });
    case "mock":    return new MockAdapter();
    default: throw new Error(`Unknown WALLET_PROVIDER: ${provider}`);
  }
}
```

Durch Ändern der Environment-Variable `WALLET_PROVIDER` wechselt ihr den Provider, ohne den Rest des Codes anzufassen.

## Empfohlene Ordnerstruktur

```
src/wallet/
├── interface.ts
├── types.ts
├── wallet.service.ts          # Facade / Factory
├── adapters/
│   ├── turnkey.adapter.ts
│   ├── dfns.adapter.ts
│   └── mock.adapter.ts
└── policies/
    └── policy.engine.ts
```

## Wichtige Zusatzregeln

- Einheitliche Error-Typen (`WalletError`, `PolicyViolation`, …)
- Idempotenz über `clientRequestId`
- Jede Operation wird geloggt (walletId, action, provider, txHash)
- MockAdapter für Tests und lokale Entwicklung
