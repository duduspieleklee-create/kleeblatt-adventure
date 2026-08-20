# Staking UI Plan

## Overview

Add a **KleeblattToken Staking** page accessible from the TopBar user dropdown.
When a user with a connected wallet opens it they see live staking stats and can
stake/unstake KLT tokens.  Users without a wallet see a read-only view of the
pool with a prompt to connect.

The feature is scoped to the **Immutable zkEVM testnet** where the KLT token is
already deployed. Because no staking contract exists yet we need to deploy one
first, then build the UI on top of it.

**Branch:** `feat/staking-ui`

---

## Architecture

```
TopBar dropdown
  └─ "KleeBlatt Staking" button
       └─ HomePage state: activePage = "staking"
            ├─ StakingPage.tsx   (React, modal/overlay over game)
            │   ├─ useStaking()  hook (reads contract via window.ethereum JSON-RPC)
            │   ├─ PoolStats panel (TVL, APR, total stakers)
            │   ├─ UserPosition panel (staked amount, earned rewards, claimable)
            │   └─ ActionPanel  (stake / unstake / claim)
            └─ staking.css
```

No React Router needed.  A simple `activePage` state in `HomePage` controls
whether the game or staking page is visible — same pattern the app uses for
`AuthOverlay`.

No new API routes needed for on-chain reads.  The staking hook reads the contract
directly from the browser via `window.ethereum` (JSON-RPC `eth_call`).  Only
write operations (stake/unstake/claim) send transactions.

---

## Contracts on testnet

The staking contract reads KLT token balance and locks tokens on behalf of users.
It must be deployed to **Immutable zkEVM testnet** (chainId 13371) before the UI
can be wired up.

---

## Sub-Tasks

### T1 — Create feature branch
**Status:** [ ] pending

**Intent:** All staking work lives on an isolated branch so it can be reviewed
separately before merging to main.

**Todo:**
- [ ] `git checkout bob_dev_branch`
- [ ] `git checkout -b feat/staking-ui`

**Relevant context:** Current active branch is `bob_dev_branch`.

---

### T2 — Write KleeblattStaking.sol contract
**Status:** [ ] pending

**Intent:** The token contract has no staking functions.  We need a dedicated
staking contract that:
- Accepts KLT deposits (stake)
- Tracks per-user staked amounts and timestamps
- Accumulates rewards over time (simple linear APR model)
- Allows reward claims and full/partial unstake
- Exposes read functions the UI needs (totalStaked, userStaked, earned, apr)

**Expected outcomes:**
- `contracts/contracts/staking/KleeblattStaking.sol` compiles with Solidity 0.8.24
- Hardhat tests pass (stake, unstake, claim, reward accrual)
- Contract is verified compatible with Immutable zkEVM (EVM cancun)

**Todo:**
- [ ] Create `contracts/contracts/staking/KleeblattStaking.sol`
  - Constructor: `(address kltToken, uint256 rewardRatePerSecond)`
  - `stake(uint256 amount)` — transfers KLT from user, updates position
  - `unstake(uint256 amount)` — returns KLT, claims pending rewards first
  - `claim()` — transfers accumulated rewards to user
  - `earned(address user)` — view: pending rewards
  - `getPool()` — view: `{ totalStaked, rewardRate, apr }`
  - `getPosition(address user)` — view: `{ staked, earned, stakedAt }`
  - Owner: `setRewardRate(uint256)`, `fundRewards(uint256)`, `pause/unpause`
- [ ] Add staking test to `contracts/test/KleeblattStaking.test.ts`
- [ ] Add deploy step for staking contract to `contracts/scripts/deploy.ts`
- [ ] `npx hardhat compile` passes with no errors

**Relevant context:**
- `contracts/contracts/tokens/KleeblattToken.sol` — ERC20 + ERC20Permit, minter roles
- `contracts/hardhat.config.ts` — targets `immutableTestnet` chainId 13371
- Deployer must call `klt.addMinter(stakingAddress)` so staking contract can mint rewards

---

### T3 — Deploy staking contract to testnet
**Status:** [ ] pending

**Intent:** Get a live contract address on Immutable zkEVM testnet so the UI can
read real on-chain data.

**Expected outcomes:**
- `KleeblattStaking` contract deployed to testnet, address known
- Staking contract is funded with initial KLT rewards
- `STAKING_CONTRACT_ADDRESS` and `KLT_CONTRACT_ADDRESS` recorded in
  `contracts/.env` and added as GitHub secrets

**Todo:**
- [ ] Ensure `contracts/.env` has `IMX_TESTNET_PRIVATE_KEY` and `IMX_TESTNET_RPC`
- [ ] Run `npx hardhat run scripts/deploy.ts --network immutableTestnet`
- [ ] Save deployed addresses to `contracts/deployments/testnet.json`
- [ ] Fund staking contract with initial KLT rewards via Hardhat task or script
- [ ] Add `VITE_KLT_CONTRACT_ADDRESS` and `VITE_STAKING_CONTRACT_ADDRESS` to
  `.env.example` and local `.env`

**Relevant context:**
- Wallet is already funded on testnet (confirmed by user)
- `IMX_TESTNET_RPC = https://rpc.testnet.immutable.com`, chainId 13371
- KLT, KLI, KleeblattMarketplace deploy script already exists — extend it

---

### T4 — Add `useStaking` hook
**Status:** [ ] pending

**Intent:** A single hook that encapsulates all contract interaction — reads pool
stats and user position, and exposes stake/unstake/claim functions.  Uses raw
`window.ethereum` JSON-RPC (`eth_call` for reads, `eth_sendTransaction` for
writes) consistent with the existing wallet integration pattern in the codebase
(no ethers/wagmi/viem added).

**Expected outcomes:**
- `apps/web/src/hooks/useStaking.ts` works for both connected and
  disconnected wallet states
- Read-only mode (pool stats) available without wallet
- Write functions (stake/unstake/claim) gate on `walletAddress` being set

**Todo:**
- [ ] Create `apps/web/src/hooks/useStaking.ts`
  - State: `{ pool, position, loading, error }`
  - `pool`: `{ totalStaked, apr, rewardRate }`
  - `position`: `{ staked, earned, kltBalance }` (null if no wallet)
  - `stake(amount: string): Promise<void>`
  - `unstake(amount: string): Promise<void>`
  - `claim(): Promise<void>`
  - Reads via `eth_call` to staking contract ABI-encoded calls
  - Writes via `eth_sendTransaction` + `wallet_switchEthereumChain` to chainId 13371
  - Polls on 15s interval for live updates
- [ ] Export minimal ABI constants for KLT + KleeblattStaking in
  `apps/web/src/lib/contracts.ts`

**Relevant context:**
- `apps/web/src/game/utils/walletAuth.ts` — shows existing `window.ethereum` usage pattern
- `apps/web/src/hooks/useWalletBalance.ts` — pattern to follow for hook shape
- `walletAddress` prop flows from `HomePage` → `TopBar`, same source for staking page

---

### T5 — Build StakingPage component
**Status:** [ ] pending

**Intent:** A full-page React component that replaces the game view when active.
Shown as an overlay/panel in front of the game (same approach as `AuthOverlay`).
Matches the existing dark pixel-art aesthetic.

**Expected outcomes:**
- `apps/web/src/pages/StakingPage.tsx` renders pool stats, user position and
  action forms
- Works in read-only mode (no wallet) showing pool stats + "Connect Wallet" prompt
- Works in full mode (wallet connected) with stake/unstake/claim forms
- Consistent visual style with existing dark theme

**Todo:**
- [ ] Create `apps/web/src/pages/StakingPage.tsx` with sections:
  - **Header**: title, close button (returns to game), testnet badge
  - **Pool Stats card**: Total Value Locked, APR %, reward rate, staker count
  - **Your Position card** (wallet connected only):
    - KLT balance in wallet
    - Currently staked
    - Pending rewards (live)
    - "Claim Rewards" button
  - **Stake form**: amount input + "Stake" button (requires ERC20 approve first)
  - **Unstake form**: amount input + "Unstake" button
  - **No wallet state**: read-only pool stats + "Connect Wallet to Stake" message
- [ ] Create `apps/web/src/styles/staking.css` matching existing CSS variable scheme
  - Dark background (`#0f1410`), green accent (`#4cc95a`), pixel font for numbers
  - Glassmorphism card style matching topbar (`backdrop-filter: blur`)
  - Responsive — works at 1280px and above

**Relevant context:**
- `apps/web/src/styles/global.css` — CSS variables and patterns to follow
- `apps/web/src/components/AuthOverlay.tsx` — overlay pattern
- Import `staking.css` in `main.tsx` alongside `global.css`

---

### T6 — Wire StakingPage into TopBar + HomePage
**Status:** [ ] pending

**Intent:** Add "KleeBlatt Staking" to the TopBar dropdown and control page
visibility from `HomePage` state.

**Expected outcomes:**
- Clicking "KleeBlatt Staking" in the dropdown opens the staking page overlay
- The game canvas stays mounted underneath (no unmount/remount flicker)
- Closing the staking page returns to normal game view
- TopBar remains visible on the staking page

**Todo:**
- [ ] Update `apps/web/src/pages/HomePage.tsx`:
  - Add `const [showStaking, setShowStaking] = useState(false)` state
  - Pass `onStaking={() => setShowStaking(true)}` to `TopBar`
  - Render `<StakingPage ... />` conditionally (as overlay when `showStaking`)
  - Pass `walletAddress` and `onClose` to `StakingPage`
- [ ] Update `apps/web/src/components/TopBar.tsx`:
  - Add `onStaking?: () => void` to `TopBarProps`
  - Add "KleeBlatt Staking" button to the `topbar-dropdown` menu above "Abmelden"
  - Close the dropdown on click before calling `onStaking()`

**Relevant context:**
- `apps/web/src/pages/HomePage.tsx` lines 37–58 — render structure
- `apps/web/src/components/TopBar.tsx` lines 131–145 — dropdown structure
- Pattern: `showStaking` overlay works identically to how `AuthOverlay` uses
  `meState.status === "anonymous"` to show/hide

---

### T7 — Validate end-to-end on local dev
**Status:** [ ] pending

**Intent:** Verify the full flow works locally before pushing.

**Todo:**
- [ ] `npm run dev:api` + `npm run dev:web` running
- [ ] Login → TopBar visible → open dropdown → click "KleeBlatt Staking"
- [ ] Staking page opens, pool stats load (read from testnet contract)
- [ ] Without wallet: read-only mode renders correctly
- [ ] With MetaMask connected to IMX testnet (chainId 13371):
  - KLT balance shows
  - Stake N tokens → tx signed → position updates
  - Pending rewards increment
  - Claim rewards → tx signed → rewards transferred
  - Unstake → position clears
- [ ] Close button returns to game view cleanly
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no warnings

---

## Environment Variables Needed

Add to `.env.example`:
```
# Staking / Blockchain (Immutable zkEVM testnet)
VITE_KLT_CONTRACT_ADDRESS=0x...
VITE_STAKING_CONTRACT_ADDRESS=0x...
VITE_IMX_CHAIN_ID=13371
VITE_IMX_RPC_URL=https://rpc.testnet.immutable.com
```

---

## Files Created / Modified

| File | Change |
|---|---|
| `contracts/contracts/staking/KleeblattStaking.sol` | New — staking contract |
| `contracts/test/KleeblattStaking.test.ts` | New — contract tests |
| `contracts/scripts/deploy.ts` | Modified — add staking deploy step |
| `contracts/deployments/testnet.json` | New — deployed addresses |
| `apps/web/src/hooks/useStaking.ts` | New — staking hook |
| `apps/web/src/lib/contracts.ts` | New — ABI + address constants |
| `apps/web/src/pages/StakingPage.tsx` | New — staking page component |
| `apps/web/src/styles/staking.css` | New — staking styles |
| `apps/web/src/pages/HomePage.tsx` | Modified — showStaking state + overlay |
| `apps/web/src/components/TopBar.tsx` | Modified — dropdown menu item |
| `apps/web/src/main.tsx` | Modified — import staking.css |
| `.env.example` | Modified — VITE_KLT_CONTRACT_ADDRESS etc. |
