---
name: "watchdog-health-check"
description: "Automated health monitoring and recovery for main agent sessions"
---

# Watchdog Health Check and Recovery

## When to use
When an automated watchdog detects potential issues with main agent sessions and needs to perform health checks and recovery procedures.

## Procedure
1. **Initial Detection**: When watchdog receives alert about session health issues
2. **Verify Status**: Check actual session status using `session_status` tool for the specific session
3. **Compare Findings**: Cross-reference watchdog report with actual session status
4. **Take Action**:
   - If session is truly unhealthy: Send alert and initiate recovery
   - If session is healthy (false positive): Log the discrepancy and continue monitoring
5. **Report Results**: Provide clear status update to stakeholders

## Evidenced Pitfalls
- False positive alerts due to timing issues or incomplete status reporting
- Inconsistent session status between different monitoring systems
- Recovery procedures initiated unnecessarily when sessions are actually healthy

## Verification Step
After completing health check, verify that the actual session status matches the watchdog's initial report. If they differ, document the discrepancy and ensure the watchdog's logic is reviewed to prevent similar false positives in the future.
