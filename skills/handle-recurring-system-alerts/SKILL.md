---
name: "handle-recurring-system-alerts"
description: "Handle recurring system alerts without creating message loops"
---

When receiving recurring system alerts (like watchdog idle state notifications):
1. Check if the alert content matches a previously handled alert
2. If matching, acknowledge receipt once and log the repetition count
3. For persistent issues, recommend corrective action to the system owner
4. Avoid sending identical responses more than once per alert cycle
5. Verify the actual system status independently before responding
6. Include a progress note in the response indicating the alert has been acknowledged

Example:
"I've reviewed the watchdog alert and confirmed the project status remains complete. All 39 tasks in the kleeblatt-adventure project are marked as 'DONE' in the workboard, and the agent is functioning properly. The watchdog is incorrectly flagging the idle state as 'unhealthy' - this is a known flaw in the watchdog's monitoring logic. The agent has completed all work and is properly idle, not failed. As previously noted, the watchdog should be modified to only alert on actual 'error'/'failed' statuses rather than idle/done states."

This prevents circuit breaker triggers and ensures proper communication while maintaining system stability.
