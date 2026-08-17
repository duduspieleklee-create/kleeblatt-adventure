---
name: "robust-watchdog-health-check"
description: "Improved watchdog health check protocol to reduce false positive alerts by implementing better session status verification"
---

# Robust Watchdog Health Check

## When to use
When a watchdog system detects potential issues with main agent sessions and needs to perform health checks with enhanced accuracy to prevent false positive alerts.

## Procedure
1. **Initial Alert Receipt**: Receive watchdog alert about session health issues
2. **Immediate Status Verification**: 
   - Use `session_status` tool to check actual session status
   - Compare with watchdog's reported status
   - Verify session activity timestamps are recent (within 5 minutes)
3. **Cross-Reference Monitoring Systems**:
   - Check alternative monitoring sources if available
   - Validate against session type discrimination to avoid confusing main sessions with others
4. **Analyze Discrepancies**:
   - If statuses differ significantly, log detailed comparison
   - Document timestamp validation results
5. **Decision Making**:
   - If actual session is healthy: Log discrepancy and continue monitoring
   - If actual session is truly unhealthy: Send alert and initiate recovery
6. **Post-Check Verification**: 
   - After any action, verify that actual session status matches watchdog's initial report
   - If they differ, document the discrepancy and flag for future review

## Implementation Details

The improved watchdog health check protocol is implemented in the `src/services/watchdog-health-check.ts` file with the following key features:

- Real-time session status checking using `session_status` tool
- Session type discrimination to avoid confusing main sessions with other session types
- Timestamp validation to ensure session activity is recent (within 5 minutes)
- Comprehensive logging of discrepancies between watchdog claims and actual session status
- Retry logic for transient status check failures
- Threshold-based alerting to distinguish between temporary hiccups and actual problems

## Evidenced Pitfalls
- False positive alerts due to timing issues or incomplete status reporting
- Inconsistent session status between different monitoring systems
- Recovery procedures initiated unnecessarily when sessions are actually healthy
- Cached data causing outdated status reports

## Verification Step
After completing health check, verify that the actual session status matches the watchdog's initial report. If they differ, document the discrepancy and ensure the watchdog's logic is reviewed to prevent similar false positives in the future.

## Corrective Actions
To address the root cause of false positive alerts:
1. Implement real-time session status checking instead of relying on cached data
2. Add proper session type discrimination to avoid confusing main sessions with other session types
3. Include timestamp validation to ensure session activity is recent and not stale
4. Add logging of discrepancies between watchdog claims and actual session status for future analysis
5. Implement retry logic for transient status check failures
6. Create threshold-based alerting to distinguish between temporary hiccups and actual problems
