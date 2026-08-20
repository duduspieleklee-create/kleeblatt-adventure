/**
 * Centralized on-chain contract address resolution for the web client.
 *
 * Resolution order per address:
 *   1. Vite build-time env (VITE_*), injected at build time. In CI these come
 *      from GitHub secrets (see .github/workflows/deploy.yml).
 *   2. Fallback to the addresses committed in
 *      contracts/deployments/testnet.json (Immutable zkEVM Testnet, chainId
 *      13473). This keeps local dev (`npm run dev`) and preview builds working
 *      even when the secrets are absent.
 *
 * A resolver always returns a string — it only throws if an address is
 * completely unknown (should never happen on testnet given the committed
 * fallback). Prefer this over reading `import.meta.env` directly so the
 * Staking / Shop / Faucet surfaces share one source of truth.
 */

export const IMMUTABLE_TESTNET_CHAIN_ID = 13473;
export const IMMUTABLE_TESTNET_CHAIN_ID_HEX = "0x349d"; // 13473

// Committed testnet deployment — source of truth: contracts/deployments/testnet.json
const TESTNET_FALLBACK = {
  klt: "0x2fafEd30191509571Ed4Ca302a599A9d7ccCEFD4",
  staking: "0x3a4e037F4Bf020a430A75822d01d23f0fe19b75F",
  faucet: "0x294C16418798e9F110CB64649eB7dBaA8c44abb1",
} as const;

function resolve(viteName: string, fallback: string, label: string): string {
  const fromEnv = (import.meta.env as Record<string, string | undefined>)[viteName];
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();
  if (import.meta.env.DEV) {
    console.warn(
      `[contracts] ${label} address not set via ${viteName} — ` +
        `falling back to committed testnet address.`,
    );
  }
  return fallback;
}

export function getKltTokenAddress(): string {
  return resolve("VITE_KLT_CONTRACT_ADDRESS", TESTNET_FALLBACK.klt, "KLT token");
}

export function getStakingContractAddress(): string {
  return resolve("VITE_STAKING_CONTRACT_ADDRESS", TESTNET_FALLBACK.staking, "Staking contract");
}

export function getFaucetContractAddress(): string {
  return resolve("VITE_FAUCET_CONTRACT_ADDRESS", TESTNET_FALLBACK.faucet, "Faucet contract");
}
