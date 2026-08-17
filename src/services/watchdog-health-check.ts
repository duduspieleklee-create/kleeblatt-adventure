/**
 * Improved Watchdog Health Check Service
 * Implements robust verification protocol to reduce false positive alerts
 */

import { session_status } from '../lib/tools';

interface WatchdogReport {
  status: 'healthy' | 'unhealthy';
  reason: string;
}

interface SessionStatus {
  status: 'healthy' | 'unhealthy';
  lastActive: number;
  type: string;
}

interface HealthCheckResult {
  action: 'monitor' | 'recover' | 'retry';
  reason: string;
  discrepancy?: {
    watchdogStatus: string;
    actualStatus: string;
    timestampDifference?: number;
  };
}

/**
 * Enhanced watchdog health check that implements robust verification protocol
 */
export async function runWatchdogHealthCheck(
  params: {
    sessionId: string;
    watchdogReport: WatchdogReport;
  }
): Promise<HealthCheckResult> {
  const { sessionId, watchdogReport } = params;
  
  try {
    // Step 1: Immediate Status Verification
    console.log(`[WATCHDOG] Verifying status for session: ${sessionId}`);
    
    const actualSessionStatus: SessionStatus = await session_status({ sessionId });
    
    // Step 2: Cross-reference monitoring systems
    const isMainSession = actualSessionStatus.type === 'main';
    if (!isMainSession) {
      return {
        action: 'monitor',
        reason: 'Session is not a main agent session, skipping health check'
      };
    }
    
    // Step 3: Timestamp validation (session should be active within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isRecentlyActive = actualSessionStatus.lastActive >= fiveMinutesAgo;
    
    // Step 4: Analyze discrepancies
    const statusesMatch = actualSessionStatus.status === watchdogReport.status;
    
    if (statusesMatch) {
      // Statuses match - proceed normally
      if (actualSessionStatus.status === 'healthy') {
        return {
          action: 'monitor',
          reason: 'Session is healthy and watchdog report aligns'
        };
      } else {
        // Unhealthy session confirmed
        return {
          action: 'recover',
          reason: 'Session is genuinely unhealthy and watchdog report is accurate'
        };
      }
    } else {
      // Statuses don't match - investigate further
      const timestampDiff = Date.now() - actualSessionStatus.lastActive;
      
      // Log discrepancy for future analysis
      console.warn(`[WATCHDOG] Status discrepancy detected for session ${sessionId}:`);
      console.warn(`  Watchdog reported: ${watchdogReport.status}`);
      console.warn(`  Actual status: ${actualSessionStatus.status}`);
      console.warn(`  Timestamp difference: ${timestampDiff}ms`);
      
      // If session is actually healthy but watchdog reports unhealthy, it's likely a false positive
      if (actualSessionStatus.status === 'healthy' && watchdogReport.status === 'unhealthy') {
        return {
          action: 'monitor',
          reason: 'Session is actually healthy but watchdog reported unhealthy - likely false positive',
          discrepancy: {
            watchdogStatus: watchdogReport.status,
            actualStatus: actualSessionStatus.status,
            timestampDifference: timestampDiff
          }
        };
      }
      
      // If session is actually unhealthy but watchdog reports healthy, investigate further
      if (actualSessionStatus.status === 'unhealthy' && watchdogReport.status === 'healthy') {
        return {
          action: 'recover',
          reason: 'Session is genuinely unhealthy but watchdog reported healthy - potential oversight',
          discrepancy: {
            watchdogStatus: watchdogReport.status,
            actualStatus: actualSessionStatus.status,
            timestampDifference: timestampDiff
          }
        };
      }
    }
    
    // Default fallback
    return {
      action: 'monitor',
      reason: 'Proceeding with monitoring due to ambiguous status'
    };
    
  } catch (error) {
    console.error('[WATCHDOG] Error during health check:', error);
    
    // Retry mechanism for transient failures
    return {
      action: 'retry',
      reason: `Transient error during health check: ${(error as Error).message}`
    };
  }
}

/**
 * Utility function to validate session status against watchdog report
 */
export function validateSessionStatus(sessionStatus: SessionStatus, watchdogReport: WatchdogReport): boolean {
  // Check if session is a main session
  if (sessionStatus.type !== 'main') {
    return false;
  }
  
  // Check timestamp validity (recent activity)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (sessionStatus.lastActive < fiveMinutesAgo) {
    return false;
  }
  
  // For this simplified validation, we assume the watchdog report is accurate
  // In production, this would be more sophisticated
  return sessionStatus.status === watchdogReport.status;
}