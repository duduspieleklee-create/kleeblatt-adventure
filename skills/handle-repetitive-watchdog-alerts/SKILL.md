---
name: "handle-repetitive-watchdog-alerts"
description: "Handle repetitive watchdog alerts by detecting and breaking infinite loops while maintaining proper status communication"
---

# Handle Repetitive Watchdog Alerts

## When to use
When receiving repetitive watchdog alerts that trigger circuit breaker protections, particularly when the underlying session is actually functioning normally.

## Procedure
1. **Detect Repetition**: Monitor for identical messages being sent repeatedly
2. **Check Actual Status**: Verify real session status using `session_status` tool
3. **Break Infinite Loop**: Stop sending identical messages when repetition detected
4. **Log and Report**: Document the repetition pattern and actual session status
5. **Escalate When Needed**: Only send definitive status updates when actual issues exist

## Evidenced Pitfalls
- Circuit breaker prevents progress when sending repeated identical messages
- False positive alerts from watchdog systems that don't distinguish between idle and failed states
- Wasted computational resources from redundant alert processing
- Model gets trapped in repetitive response patterns

## Verification Step
After detecting repetition, verify actual session status against watchdog report. If they differ, document the false positive and recommend watchdog logic improvements to prevent similar occurrences. Only communicate definitive status when actual problems exist.
