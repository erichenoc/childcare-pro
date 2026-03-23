# Security Audit Skill

## Description
Performs comprehensive security audits on the codebase following OWASP Top 10 guidelines. Identifies vulnerabilities, suggests fixes, and generates remediation plans.

## Triggers
- "security audit", "security review", "vulnerability scan"
- "check for XSS", "check for SQL injection"
- "OWASP check", "security vulnerabilities"

## Instructions

### When triggered, perform the following security audit:

#### 1. Input Validation & Injection (OWASP A03)
- Search for unsanitized user inputs in API routes and Server Actions
- Check for SQL injection in raw queries (especially Supabase `.rpc()` calls)
- Verify Zod schemas are used for ALL user-facing inputs
- Check for XSS in React components (dangerouslySetInnerHTML, unescaped outputs)

#### 2. Authentication & Authorization (OWASP A01, A07)
- Verify Supabase RLS policies exist on ALL tables
- Check that auth middleware/proxy.ts protects all routes
- Verify JWT token handling and session management
- Check for broken access control (users accessing other users' data)

#### 3. Sensitive Data Exposure (OWASP A02)
- Scan for hardcoded secrets, API keys, passwords in code
- Check .env.local is in .gitignore
- Verify sensitive data is not logged (console.log with user data)
- Check that HTTPS is enforced in production

#### 4. Security Misconfiguration (OWASP A05)
- Verify CORS configuration is restrictive (not wildcard *)
- Check Content-Security-Policy headers
- Verify rate limiting exists on auth endpoints
- Check for debug mode in production

#### 5. Dependency Vulnerabilities (OWASP A06)
- Run `npm audit` and analyze results
- Check for known vulnerable packages
- Verify dependencies are up to date

### Output Format
```markdown
## Security Audit Report - [Date]

### Critical Issues (Fix Immediately)
- [Issue]: [Location] - [Remediation]

### High Risk Issues
- [Issue]: [Location] - [Remediation]

### Medium Risk Issues
- [Issue]: [Location] - [Remediation]

### Low Risk / Informational
- [Issue]: [Location] - [Remediation]

### Summary
- Total issues found: X
- Critical: X | High: X | Medium: X | Low: X
```
