/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GAME_VERSION: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_STAKING_CONTRACT_ADDRESS?: string;
  readonly VITE_KLT_CONTRACT_ADDRESS?: string;
  readonly VITE_FAUCET_CONTRACT_ADDRESS?: string;
  readonly VITE_SHOP_TREASURY_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
