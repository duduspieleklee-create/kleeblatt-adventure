---
name: "sessions-send-message"
description: "Send a message/report to another session (Telegram direct, agent) via sessions_send; use sessionKey, never target."
---

# Send a message to another session via sessions_send

Use when reporting status to another session (e.g., Telegram direct chat) or triggering a visible run on another session. Do not confuse with `message`/`conversations_send`, which use `target`.

## Procedure
1. Identify target sessionKey. Telegram direct format observed: `agent:main:telegram:direct:<chatId>`.
2. Call `sessions_send` with `message` + `sessionKey` (or `label`). Never pass `target` — sessions_send rejects it with "Either sessionKey or label is required" (costs a full round trip each time).
3. Accept `delivery.mode: "announce"` with `status: "ok"` as success; delivery may stay `pending` until the target's delivery context announces it. The tool may wait for the target's reply.
4. Do not re-send the identical message after a success — a duplicated call re-delivers the same report.

## Pitfalls
- `target` belongs to `message`/`conversations_send`; using it on `sessions_send` fails every time. If you get the "Either sessionKey or label is required" error, you misnamed/omitted the selector — fix the parameter, not the message content.
- A `tool_call` wrapper that fails returns the same error; retry the corrected call directly.

## Verification
Result JSON echoes the `sessionKey` and shows `status: "ok"`. Error string "Either sessionKey or label is required" = wrong/missing selector parameter.
