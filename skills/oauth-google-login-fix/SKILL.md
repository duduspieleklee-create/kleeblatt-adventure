---
name: "oauth-google-login-fix"
description: "Handle Google OAuth login failures with CSRF protection and detailed error reporting for production debugging"
---

# Skill: oauth-google-login-fix

## When to use

Use this skill when debugging Google OAuth login failures in production environments where users encounter generic `?auth=error` redirects without specific error context. This occurs when the OAuth flow lacks CSRF protection or error handling lacks sufficient diagnostic information.

## Procedure

1. **Verify CSRF protection is enabled**:
   - Check that OAuth state parameter is included in authorization requests
   - Confirm state is stored in a secure httpOnly cookie with short TTL
   - Validate state is verified in the callback handler

2. **Implement detailed error reporting**:
   - Add specific error reasons to redirects (e.g., `?auth=error&reason=oauth`)
   - Include error details in redirects (e.g., `?auth=error&reason=oauth&detail=redirect_uri_mismatch`)
   - Log error contexts with stack traces for debugging

3. **Ensure proper cookie handling**:
   - Delete state cookies after use (one-time use)
   - Set secure cookie attributes (HttpOnly, SameSite, Secure)
   - Configure appropriate cookie paths for OAuth callbacks

4. **Validate error scenarios**:
   - Test missing authorization code
   - Test invalid state parameter
   - Test token exchange failures
   - Test profile fetch failures
   - Test general exceptions

## Pitfalls

- **Never embed tokens in remote URLs** (`https://x-access-token:TOKEN@...`) - leaks credentials and fails on modern GitHub
- **Incorrect cookie attributes** - missing HttpOnly, SameSite, or Secure flags
- **Inadequate error context** - generic `?auth=error` without reasons/detailed info
- **Missing CSRF protection** - vulnerable to cross-site request forgery attacks
- **Cookie cleanup failure** - state cookies persist longer than needed

## Verification

After implementation, verify:
1. OAuth authorization requests include state parameter
2. State cookies are set with proper security attributes
3. Callback handler validates state against cookie value
4. Error redirects include specific `reason` and optional `detail` parameters
5. Session cookies are properly set on successful login
6. State cookies are deleted after use
7. Error logs contain sufficient context for debugging

## References
- Docs: `docs/architecture/26-auth-fehlerbehebung.md`
- Implementation: `apps/api/src/routes/auth.ts`
- Tests: `apps/api/src/routes/auth.test.ts`
