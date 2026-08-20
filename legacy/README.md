# Legacy archive (kleeblock-port consolidation)

These files were part of the pre-port kleeblatt React layer and are no longer
referenced by the running app after the Phaser game was replaced with the
standalone kleeblock game. They are kept here (not deleted) as a "storage place
for later" — see notes below for which are candidates to re-wire.

Nothing under `legacy/` is compiled, linted, or bundled: it sits outside every
workspace's `src/`. Re-adding a file means `git mv` it back into `apps/web/src/...`
and fixing its imports.

## components/

| File | Purpose | Notes |
|---|---|---|
| `AuthCard.tsx` | Auth form card | superseded by `AuthOverlay` |
| `CharacterCreationScreen.tsx` (+ css) | Character creation | superseded by `OnboardingChoice` / `LandingPage` flow |
| `HeroDashboardCard.tsx` | Hero stat dashboard | orphaned |
| `HeroSetupCard.tsx` | Hero setup | orphaned |
| `MobileControls.tsx` (+ css) | Touch controls overlay | game now uses Phaser-native `VirtualJoystick` |
| `NextStepsCard.tsx` | Roadmap/next-steps card | orphaned |
| `StatusCard.tsx` | HP/resource status bar | game now renders via `UIScene` (Phaser) |
| `WalletCard.tsx` | zkEVM wallet card | orphaned |

## hooks/

| File | Purpose | Notes |
|---|---|---|
| `useHealth.ts` | health polling | orphaned |
| `useWalletBalance.ts` | wallet balance | orphaned |
| `useInventoryPersistence.ts` | hydrate/save inventory | **candidate for later** — see inventoryPersistence below |

## lib/

| File | Purpose | Notes |
|---|---|---|
| `gameBridge.ts` | lib-level bridge shim | stale duplicate of `@kleeblatt/shared` `gameBridge` singleton |
| `gameStats.ts` | HP/resource stat helpers | consumed only by archived cards |
| `inventoryPersistence.ts` | React↔Phaser inventory bridge | **IMPORTANT / candidate for later** — already emits `inventory:hydrate` and subscribes `inventory:updated` through `@kleeblatt/shared` `gameBridge`. This is the template for requirement B "bridge access to inventory values later". |
| `roadmap.ts` | NEXT_STEPS / PATCH_LOG | orphaned |
| `uiAssets.ts` | UI_ASSETS icon map | consumed only by archived `StatusCard` |

## styles/

| File | Purpose |
|---|---|
| `CharacterCreationScreen.css` | paired with archived `CharacterCreationScreen` |
| `InventoryScreen.css` | orphaned (no matching component ever present) |
