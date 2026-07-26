# Bevy Rewrite Implementation Plan

Goal: Replace the existing Phaser/Vite browser game with a Bevy 0.15 / WebGPU + WASM build, keeping gameplay, API integration, and deployment parity.

## Constraints
- Same origin serving; `game-api` CORS unchanged.
- Hybrid asset pipeline: Rust-generated placeholder textures + reserved `game/assets/` for future art.
- Manual distance collection; no `bevy_rapier2d`.
- Bootstrap JS stays in `game/index.html`; wallet/session/joystick/debug remain DOM-managed.
- Persistent Bevy state machine for session screens; no scene destructive transitions.
- Default backend: WebGPU via trunk + wgpu, with optional `webgl2` feature fallback.

## Tasks

1. Scaffold Rust workspace
   - Add `game/Cargo.toml`, `game/src/main.rs`, `game/src/game/mod.rs`, module tree under `game/src/game/{scenes,systems,resources}.rs`.
   - Set Bevy 0.15 default dependency; add optional `bevy_webgl2` fallback feature.
   - Add `trunk` toolchain and a minimal `game/index.html` WASM bootstrap.

2. Build bridge layer
   - Create JS-bridged APIs in `game/index.html` for session init, username prompt, joystick axis, wallet connect events, debug logging, and WebGPU fallback banner.
   - Define `window.__INIT_STATE__`, `window.__GALA_CONNECT__`, and `joystick` custom DOM events.

3. Implement API and wallet modules
   - Create `game/game/api.rs` HTTP client wrapping exact `game-api` endpoints.
   - Create `game/game/wallet.rs` Bevy resource populated from JS wallet shim.

4. Implement runtime systems
   - Add movement, spawn, collision, score-submit systems under `game/src/game/systems/`.
   - Use generated RGBA textures for player/treasure/UI panels in startup code.

5. Implement screens/state machine
   - Build persistent states: `Welcome`, `Adventure`, `Leaderboard`.
   - Wire state transitions for guest/wallet login, logout, settings, leaderboard open.

6. Validation and fallback
   - Run functional validation checklist from plan.
   - Add runtime WebGPU check; build and serve fallback bundle if needed.
   - Commit finalized plan and this task list on branch.
