---
name: "handle-watchdog-false-positive"
description: "Handle false positive watchdog alerts by verifying actual session status before taking action"
---

# Handle Watchdog False Positive Alerts

## When to use
When a watchdog system incorrectly flags a healthy session as unhealthy, particularly when the session is in an idle state.

## Procedure
1. **Receive Alert**: Get watchdog alert about session health issues
2. **Verify Status**: Immediately check actual session status using `session_status` tool
3. **Cross-reference**: Compare watchdog report with actual session findings
4. **Decision Logic**:
   - If session is truly unhealthy: Proceed with appropriate recovery actions
   - If session is healthy (false positive): Document the discrepancy and avoid unnecessary actions
5. **Communication**: Only send definitive status updates when actual issues exist

## Evidenced Pitfalls
- Circuit breaker prevents progress when sending repeated identical messages
- False positive alerts from watchdog systems that don't distinguish between idle and failed states
- Wasted computational resources from redundant alert processing

## Verification Step
After verifying session status, confirm that the actual status matches or differs from the watchdog's initial report. If they differ, document the false positive and recommend watchdog logic improvements to prevent similar occurrences.
