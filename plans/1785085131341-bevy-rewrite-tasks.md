# Bevy Rewrite Tasks

Branch: `kleeblatt-adventure-engine-test`
Plan: `/root/.local/share/kilo/plans/1785085131341-bevy-rewrite-plan.md`

## Task 1 — Scaffold Rust workspace
- Add `game/Cargo.toml` with Bevy 0.15 dependencies.
- Add `game/src/main.rs` and `game/src/game/mod.rs`.
- Add `bevy_webgl2` optional feature for fallback.
- Add minimal `game/index.html` Trunk bootstrap.
- Verify `trunk serve` boots empty window.

## Task 2 — Build bridge layer
- Implement JS session init and `window.__INIT_STATE__`.
- Implement username prompt bridge in `game/index.html`.
- Implement mobile joystick DOM bridge and custom events.
- Implement wallet JS shim `window.__GALA_CONNECT__`.
- Implement debug panel and WebGPU fallback banner.

## Task 3 — Implement API and wallet modules
- Create `game/game/api.rs` with all preserved endpoints.
- Create `game/game/wallet.rs` Bevy resource.
- Wire init state into Bevy startup.

## Task 4 — Implement runtime systems
- Add movement, spawn, collision, score-submit systems.
- Generate placeholder RGBA textures at startup.
- Wire input resource from keyboard and joystick bridge.

## Task 5 — Implement screens/state machine
- Build persistent states: `Welcome`, `Adventure`, `Leaderboard`.
- Wire state transitions for login/logout/settings/leaderboard.
- Replace scene switches with state changes.

## Task 6 — Validation and fallback
- Run functional validation checklist.
- Add runtime WebGPU detection.
- Build fallback bundle with `webgl2` feature if required.
- Confirm same-origin serving and CORS behavior.
