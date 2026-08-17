import { describe, it, expect, vi } from 'vitest';
import { runWatchdogHealthCheck } from '../services/watchdog-health-check';

// Mock the session_status tool
vi.mock('../lib/tools', () => ({
  session_status: vi.fn()
}));

describe('Watchdog Health Check', () => {
  it('should correctly identify healthy sessions and avoid false positives', async () => {
    // Mock a healthy session status
    const mockSessionStatus = {
      status: 'healthy',
      lastActive: Date.now(),
      type: 'main'
    };
    
    // Mock the session_status tool to return our mock status
    const { session_status } = await import('../lib/tools');
    vi.mocked(session_status).mockResolvedValue(mockSessionStatus);
    
    // Run the watchdog health check
    const result = await runWatchdogHealthCheck({
      sessionId: 'test-session-123',
      watchdogReport: {
        status: 'unhealthy',
        reason: 'Timeout detected'
      }
    });
    
    // Should recognize the session is actually healthy despite watchdog report
    expect(result.action).toBe('monitor');
    expect(result.reason).toContain('session is actually healthy');
  });

  it('should properly handle genuinely unhealthy sessions', async () => {
    // Mock an unhealthy session status
    const mockSessionStatus = {
      status: 'unhealthy',
      lastActive: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      type: 'main'
    };
    
    // Mock the session_status tool to return our mock status
    const { session_status } = await import('../lib/tools');
    vi.mocked(session_status).mockResolvedValue(mockSessionStatus);
    
    // Run the watchdog health check
    const result = await runWatchdogHealthCheck({
      sessionId: 'test-session-123',
      watchdogReport: {
        status: 'unhealthy',
        reason: 'Timeout detected'
      }
    });
    
    // Should trigger recovery action
    expect(result.action).toBe('recover');
    expect(result.reason).toContain('session is genuinely unhealthy');
  });

  it('should detect timestamp inconsistencies', async () => {
    // Mock a session that appears healthy but has stale activity
    const mockSessionStatus = {
      status: 'healthy',
      lastActive: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      type: 'main'
    };
    
    // Mock the session_status tool to return our mock status
    const { session_status } = await import('../lib/tools');
    vi.mocked(session_status).mockResolvedValue(mockSessionStatus);
    
    // Run the watchdog health check
    const result = await runWatchdogHealthCheck({
      sessionId: 'test-session-123',
      watchdogReport: {
        status: 'healthy',
        reason: 'Recent activity'
      }
    });
    
    // Should flag timestamp inconsistency
    expect(result.action).toBe('monitor');
    expect(result.reason).toContain('timestamp validation');
  });
});