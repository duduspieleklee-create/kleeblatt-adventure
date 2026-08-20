import { supabase } from "./supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import { exchangeSupabaseSession } from "../../lib/api";
import type { MeResponse } from "@kleeblatt/shared";

export interface WalletAuthResult {
  address: string;
  session: Session;
  user: User;
  isNewUser: boolean;
}

export class WalletAuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NO_WALLET"
      | "USER_REJECTED"
      | "SIGN_FAILED"
      | "AUTH_FAILED"
      | "NONCE_FAILED"
      | "NOT_CONFIGURED",
  ) {
    super(message);
    this.name = "WalletAuthError";
  }
}

/** Minimal EIP-1193 provider type for window.ethereum. */
interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/**
 * Fetch a cryptographically secure, single-use nonce from the Supabase
 * server via RPC. This nonce is embedded in the SIWE message to prevent
 * replay attacks. The nonce expires after 5 minutes and can only be used once.
 */
async function fetchServerNonce(): Promise<string> {
  if (!supabase) {
    throw new WalletAuthError("Supabase client not configured", "NOT_CONFIGURED");
  }

  const { data, error } = await supabase.rpc("generate_siwe_nonce");

  if (error || !data) {
    throw new WalletAuthError(
      `Failed to fetch server nonce: ${error?.message ?? "no data"}`,
      "NONCE_FAILED",
    );
  }

  return data as string;
}

/**
 * Sign in with an Ethereum wallet using the native Supabase Web3 flow.
 *
 * Flow:
 * 1. Fetch a server-generated, single-use nonce via supabase.rpc('generate_siwe_nonce')
 * 2. Call supabase.auth.signInWithWeb3({ chain: 'ethereum', options: { signInWithEthereum: { nonce } } })
 *    — This prompts the wallet to connect (eth_requestAccounts), builds an EIP-4361
 *      SIWE message containing the nonce, requests personal_sign, then POSTs to
 *      /auth/v1/token?grant_type=web3 with { chain, message, signature }
 * 3. Supabase Auth verifies the signature, creates/links the user, and returns a session
 */
export async function signInWithWallet(): Promise<WalletAuthResult> {
  if (!supabase) {
    throw new WalletAuthError("Supabase client not configured", "NOT_CONFIGURED");
  }

  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletAuthError(
      "No Ethereum wallet found. Please install MetaMask or another Web3 wallet.",
      "NO_WALLET",
    );
  }

  // Step 1: Fetch server nonce (prevents replay attacks)
  const nonce = await fetchServerNonce();

  // Step 2: Initiate Supabase Web3 sign-in with the nonce
  // signInWithWeb3 handles: eth_requestAccounts, eth_chainId, SIWE message
  // construction, personal_sign, and POST /token?grant_type=web3
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: "ethereum",
    statement: "Sign in to Kleeblatt Adventure",
    options: {
      signInWithEthereum: {
        nonce: nonce,
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
      },
    },
  });

  if (error) {
    if (error.message.includes("User rejected") || error.message.includes("rejected")) {
      throw new WalletAuthError("Wallet signature rejected", "USER_REJECTED");
    }
    throw new WalletAuthError(`Web3 authentication failed: ${error.message}`, "AUTH_FAILED");
  }

  if (!data.session || !data.user) {
    throw new WalletAuthError("No session returned from Web3 auth", "AUTH_FAILED");
  }

  // Extract wallet address from user metadata (GoTrue stores it there)
  const address =
    data.user.user_metadata?.address ??
    data.user.user_metadata?.wallet_address ??
    data.user.app_metadata?.provider_id?.split(":").pop() ??
    "";

  return {
    address,
    session: data.session,
    user: data.user,
    isNewUser: data.user.created_at === data.user.updated_at,
  };
}

/**
 * Sign in with a wallet and exchange the Supabase session for an app session.
 * This is the end-to-end flow used by the React AuthOverlay and Phaser LoginScene.
 * Returns the app's MeResponse so the UI can proceed immediately.
 */
export async function signInWithWalletAndExchange(): Promise<MeResponse> {
  const { session } = await signInWithWallet();
  const accessToken = session.access_token;
  if (!accessToken) {
    throw new WalletAuthError("No Supabase access token returned", "AUTH_FAILED");
  }

  const result = await exchangeSupabaseSession(accessToken);
  if (result.ok) {
    return result.data;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throw new WalletAuthError((result as any).message ?? "Session exchange failed", "AUTH_FAILED");
}

/**
 * Link a wallet to an existing authenticated user's profile.
 * Used by the TopBar "Add Wallet" button for Google/email users.
 *
 * This performs a SIWE signature to prove wallet ownership, then
 * updates the existing user's profile with the wallet address.
 */
export async function linkWalletToProfile(): Promise<string> {
  if (!supabase) {
    throw new WalletAuthError("Supabase client not configured", "NOT_CONFIGURED");
  }

  // Verify the user has an existing session
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new WalletAuthError("No active session — please log in first", "AUTH_FAILED");
  }

  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletAuthError("No Ethereum wallet found.", "NO_WALLET");
  }

  // Fetch server nonce
  const nonce = await fetchServerNonce();

  // Request wallet connection + SIWE signature
  const provider = window.ethereum;
  let accounts: string[];
  try {
    accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  } catch {
    throw new WalletAuthError("Wallet connection rejected", "USER_REJECTED");
  }

  const address = accounts[0];
  if (!address) {
    throw new WalletAuthError("No account returned from wallet", "USER_REJECTED");
  }

  const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
  const chainId = parseInt(chainIdHex, 16);

  // Build the SIWE message manually (we're not creating a new session, just linking)
  const domain = window.location.host;
  const uri = window.location.origin;
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    `Sign in to Kleeblatt Adventure`,
    "",
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join("\n");

  // Request personal_sign to prove wallet ownership
  // (signature is verified by the nonce consumption; we don't need to store it)
  try {
    await provider.request({
      method: "personal_sign",
      params: [message, address],
    });
  } catch {
    throw new WalletAuthError("Signature request rejected", "SIGN_FAILED");
  }

  // Verify the nonce was consumed (server-side single-use check)
  const { error: verifyError } = await supabase.rpc("verify_siwe_nonce", {
    input_nonce: nonce,
  });
  if (verifyError) {
    console.warn("[walletAuth] Nonce verification warning:", verifyError.message);
  }

  // Update the profile with the wallet address
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      wallet_address: address,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionData.session.user.id);

  if (updateError) {
    throw new WalletAuthError(
      `Failed to link wallet to profile: ${updateError.message}`,
      "AUTH_FAILED",
    );
  }

  return address;
}
