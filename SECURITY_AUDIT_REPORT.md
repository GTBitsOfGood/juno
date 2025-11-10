# Security Audit Report - Juno API Platform
**Date:** 2025-11-10
**Auditor:** Security Review
**Codebase:** Juno API Gateway & Microservices

---

## Executive Summary

This security audit identified **CRITICAL** vulnerabilities that expose sensitive user and project data to unauthenticated access, along with multiple high and medium severity issues that could lead to data breaches, unauthorized access, and denial of service attacks.

### Risk Summary
- **Critical Issues:** 5
- **High Severity:** 6
- **Medium Severity:** 5
- **Low Severity:** 3

**Recommendation:** Immediate action required to address critical vulnerabilities before production deployment.

---

## CRITICAL VULNERABILITIES

### 1. Unauthenticated User Information Disclosure
**Severity:** CRITICAL
**CWE:** CWE-306 (Missing Authentication for Critical Function)
**Location:** `packages/api-gateway/src/modules/user/user.controller.ts:95-126`

**Issue:**
The `GET /user/id/:id` endpoint is completely unauthenticated and returns full user details including:
- User ID
- Email address
- Full name
- User type (SUPERADMIN/ADMIN/USER)
- All associated project IDs

**Proof of Concept:**
```bash
curl http://localhost:3000/user/id/1
# Returns complete user profile without any authentication
```

**Impact:**
- Attackers can enumerate all users in the system
- User emails can be harvested for phishing attacks
- User types reveal administrative accounts (targets for attacks)
- Project associations expose organizational structure

**Remediation:**
Apply `CredentialsMiddleware` to the `GET /user/id/:id` route in `user.module.ts`:
```typescript
consumer
  .apply(CredentialsMiddleware)
  .forRoutes(
    { path: 'user/id/:id', method: RequestMethod.GET }, // ADD THIS
    { path: 'user', method: RequestMethod.POST },
    // ... other routes
  );
```

Additionally, add authorization checks to ensure users can only view their own profile unless they are SUPERADMIN.

---

### 2. Unauthenticated Project Information Disclosure
**Severity:** CRITICAL
**CWE:** CWE-306 (Missing Authentication for Critical Function)
**Locations:**
- `packages/api-gateway/src/modules/project/project.controller.ts:54-79` (GET by ID)
- `packages/api-gateway/src/modules/project/project.controller.ts:182-200` (GET by name)

**Issue:**
Both `GET /project/id/:id` and `GET /project/name/:name` endpoints are completely unauthenticated.

**Proof of Concept:**
```bash
curl http://localhost:3000/project/id/1
curl http://localhost:3000/project/name/my-secret-project
# Both return full project details without authentication
```

**Impact:**
- Project enumeration (brute force IDs or guess names)
- Exposure of project names and configurations
- Information gathering for targeted attacks
- Competitive intelligence leakage

**Remediation:**
Apply authentication middleware in `project.module.ts`:
```typescript
consumer
  .apply(CredentialsMiddleware)
  .forRoutes(
    { path: 'project/id/:id', method: RequestMethod.GET }, // ADD THIS
    { path: 'project/name/:name', method: RequestMethod.GET }, // ADD THIS
    { path: 'project', method: RequestMethod.POST },
    // ... other routes
  );
```

Add authorization to ensure users can only view projects they're associated with.

---

### 3. No CORS Policy Configured
**Severity:** CRITICAL
**CWE:** CWE-942 (Overly Permissive Cross-domain Whitelist)
**Location:** `packages/api-gateway/src/main.ts`

**Issue:**
No CORS (Cross-Origin Resource Sharing) policy is configured, meaning the API will accept requests from any origin by default in browsers.

**Impact:**
- Cross-site request forgery (CSRF) attacks
- Data theft from authenticated users via malicious websites
- Session hijacking
- Unauthorized API access from untrusted domains

**Remediation:**
Add CORS configuration in `main.ts`:
```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email', 'X-User-Password'],
});
```

---

### 4. No Rate Limiting Protection
**Severity:** CRITICAL
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
**Location:** `packages/api-gateway/src/main.ts`

**Issue:**
No rate limiting is implemented on any endpoints. This enables:
- Brute force attacks on authentication endpoints
- API abuse and resource exhaustion
- Denial of Service (DoS) attacks
- User/project enumeration at scale

**Impact:**
- Account takeover via password brute forcing
- System overload and service disruption
- Excessive costs from cloud resource consumption
- Data scraping of all users/projects

**Remediation:**
Install and configure `@nestjs/throttler`:
```bash
pnpm add @nestjs/throttler
```

Configure in `app.module.ts`:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute
      limit: 100,  // 100 requests per minute
    }]),
    // ... other imports
  ],
})
```

Apply stricter limits to authentication endpoints (e.g., 5 attempts per minute).

---

### 5. No Security Headers (Helmet.js Missing)
**Severity:** CRITICAL
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)
**Location:** `packages/api-gateway/src/main.ts`

**Issue:**
No security headers are configured (no Helmet.js). Missing critical headers:
- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options` (MIME sniffing protection)
- `Strict-Transport-Security` (HTTPS enforcement)
- `Content-Security-Policy` (XSS protection)
- `X-XSS-Protection`

**Impact:**
- Clickjacking attacks
- Man-in-the-middle attacks
- Cross-site scripting (XSS)
- MIME confusion attacks

**Remediation:**
Install and configure Helmet:
```bash
pnpm add helmet
```

Add to `main.ts`:
```typescript
import helmet from 'helmet';

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

---

## HIGH SEVERITY VULNERABILITIES

### 6. Plain Text Password Transmission in Headers
**Severity:** HIGH
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)
**Location:** `packages/api-gateway/src/middleware/credentials.middleware.ts:38-39`

**Issue:**
Passwords are transmitted in plain text via `X-User-Password` HTTP header. While this may be encrypted via HTTPS in production, the pattern is insecure:
- Headers are logged by proxies, load balancers, and application logs
- Headers may be cached
- Development/testing often uses HTTP, not HTTPS

**Current Code:**
```typescript
const passwordHeader = req.header('X-User-Password');
```

**Impact:**
- Password exposure in logs
- Credential theft from monitoring systems
- Compliance violations (PCI-DSS, GDPR)

**Remediation:**
1. **Immediate:** Ensure all logs explicitly exclude `X-User-Password` header
2. **Long-term:** Migrate to standard Bearer token authentication only
3. Remove password headers and require JWT tokens for all authenticated requests
4. Document that the email/password flow should only be used for initial JWT generation

---

### 7. Excessive Payload Size Allowed (50MB)
**Severity:** HIGH
**CWE:** CWE-400 (Uncontrolled Resource Consumption)
**Location:** `packages/api-gateway/src/main.ts:17-18`

**Issue:**
The API accepts payloads up to 50MB without authentication:
```typescript
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb' }));
```

**Impact:**
- Denial of Service via memory exhaustion
- Server crashes from processing large payloads
- Bandwidth consumption
- Storage exhaustion

**Remediation:**
1. Reduce default limit to 1MB for most endpoints
2. Apply larger limits only to authenticated file upload endpoints
3. Use streaming for file uploads instead of buffering entire payloads

```typescript
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ limit: '1mb' }));

// In file upload routes, use multipart/form-data with streaming
```

---

### 8. Sensitive Information in API Responses
**Severity:** HIGH
**CWE:** CWE-213 (Exposure of Sensitive Information Due to Incompatible Policies)
**Location:** `packages/api-gateway/src/models/user.dto.ts:47-80`

**Issue:**
User API responses expose sensitive metadata:
- User type (SUPERADMIN/ADMIN/USER) - reveals high-value targets
- All project IDs associated with user
- This information aids attackers in privilege escalation

**Exposed Data:**
```typescript
export class UserResponse {
  id: number;
  email: string;
  name: string;
  type: CommonProto.UserType;  // ← SENSITIVE
  projectIds: number[];         // ← SENSITIVE
}
```

**Impact:**
- Attackers can identify admin accounts for targeted attacks
- Project associations reveal organizational structure
- Information leakage aids reconnaissance

**Remediation:**
1. Create different response DTOs based on requester's authorization level
2. Only include `type` and `projectIds` if requester is SUPERADMIN
3. Implement field-level access control

---

### 9. Verbose Error Messages
**Severity:** HIGH
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
**Location:** `packages/api-gateway/src/rpc_exception_filter.ts:33-46`

**Issue:**
Error messages are returned directly to clients:
```typescript
response.status(rpcStatusToHttp(error.code)).send(ex.message);
```

This can expose:
- Stack traces
- Internal system paths
- Database schema information
- Implementation details

**Impact:**
- Information disclosure aids attackers
- System architecture exposure
- Potential code execution if error messages contain user input

**Remediation:**
Sanitize error messages before sending to client:
```typescript
const clientMessage = error.code === status.INTERNAL
  ? 'An internal error occurred'
  : ex.message;
response.status(rpcStatusToHttp(error.code)).send(clientMessage);
```

Log full error details server-side only.

---

### 10. No Input Sanitization for HTML/Script Content
**Severity:** HIGH
**CWE:** CWE-79 (Cross-site Scripting)
**Locations:** Multiple endpoints accepting user input

**Issue:**
While `class-validator` validates input format, there's no sanitization of HTML/script content in fields like:
- User names
- Project names
- Email content
- Analytics custom properties

**Impact:**
- Stored XSS attacks
- Script injection
- Data corruption
- Phishing via injected content

**Remediation:**
Install DOMPurify or similar:
```bash
pnpm add isomorphic-dompurify
```

Sanitize all user-provided text before storage:
```typescript
import DOMPurify from 'isomorphic-dompurify';

name: DOMPurify.sanitize(params.name);
```

---

### 11. Missing Authorization on File Provider Registration
**Severity:** HIGH
**CWE:** CWE-862 (Missing Authorization)
**Location:** `packages/api-gateway/src/modules/file_provider/file_provider.controller.ts:43-66`

**Issue:**
The `POST /file/provider` endpoint has a TODO comment suggesting it should be auth-protected, and while `ApiKeyMiddleware` is applied in the module configuration (line 70 of file_provider.module.ts), this is a sensitive operation that:
- Registers cloud storage providers (AWS S3, Azure)
- Accepts access keys/credentials
- Should have stricter authorization (SUPERADMIN only)

**Current Protection:**
- Has API Key middleware ✓
- Missing role-based authorization ✗

**Impact:**
- Any user with an API key can register file providers
- Potential for unauthorized cloud resource access
- Cloud cost implications

**Remediation:**
Add authorization check in controller:
```typescript
async registerFileProvider(
  @ApiKey() apiKey: AuthCommonProto.ApiKey,
  @Body('') params: RegisterFileProviderModel,
): Promise<FileProviderResponse> {
  // Verify the API key belongs to a SUPERADMIN user
  // Or implement project-level permissions check
}
```

---

## MEDIUM SEVERITY ISSUES

### 12. Misleading TODO Comments
**Severity:** MEDIUM
**Locations:**
- `packages/api-gateway/src/modules/project/project.module.ts:29`
- `packages/api-gateway/src/modules/file_provider/file_provider.module.ts:29`
- `packages/api-gateway/src/modules/file_download/file_download.module.ts:29`

**Issue:**
These modules have `// TODO: Make this module Auth protected` comments, but they DO have middleware applied. This creates confusion and suggests security controls may not have been verified.

**Impact:**
- Developer confusion
- Security controls may be accidentally removed
- Audit trail unclear

**Remediation:**
Remove or update TODO comments to reflect actual implementation:
```typescript
// Auth protection applied via ApiKeyMiddleware (configured in middleware consumer)
```

---

### 13. No JWT Revocation Mechanism
**Severity:** MEDIUM
**CWE:** CWE-613 (Insufficient Session Expiration)
**Locations:** JWT implementation across auth-service

**Issue:**
JWTs have 1-hour expiration but cannot be revoked if compromised. No token blacklist or refresh token rotation.

**Impact:**
- Compromised tokens valid until expiration
- No way to force user logout
- Stolen tokens grant access for up to 1 hour

**Remediation:**
Implement one of:
1. Token blacklist in Redis with expiration
2. Refresh token rotation pattern
3. Shorter JWT expiration (5-15 minutes) with refresh tokens

---

### 14. API Keys Stored as SHA-256 Hashes Only
**Severity:** MEDIUM
**CWE:** CWE-916 (Use of Password Hash With Insufficient Computational Effort)
**Location:** Database schema and auth-service

**Issue:**
API keys are hashed with SHA-256, which is fast and susceptible to brute force if keys are weak. Better to use bcrypt or Argon2 (like passwords).

**Impact:**
- Brute force attacks on leaked database
- Rainbow table attacks possible
- Weak API keys easily cracked

**Remediation:**
Use bcrypt for API key hashing:
```typescript
const hash = await bcrypt.hash(apiKey, 12);
```

---

### 15. Input Event Text Values Not Length-Limited
**Severity:** MEDIUM
**CWE:** CWE-770 (Allocation of Resources Without Limits)
**Location:** `packages/api-gateway/src/modules/analytics/analytics.controller.ts:144`

**Issue:**
The `textValue` field in input events has no length limit, allowing arbitrarily large strings to be stored.

**Impact:**
- Database storage exhaustion
- Query performance degradation
- Denial of service

**Remediation:**
Add length validation to DTO:
```typescript
@MaxLength(10000)
textValue: string;
```

---

### 16. No Account Lockout After Failed Login Attempts
**Severity:** MEDIUM
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**Location:** `packages/api-gateway/src/middleware/credentials.middleware.ts`

**Issue:**
Failed authentication attempts are not tracked or limited. Combined with no rate limiting, this enables unlimited password guessing.

**Impact:**
- Brute force password attacks
- Credential stuffing attacks
- Account takeover

**Remediation:**
Implement account lockout:
1. Track failed login attempts per email in Redis
2. Lock account for 15 minutes after 5 failed attempts
3. Require CAPTCHA after 3 failed attempts

---

## LOW SEVERITY ISSUES

### 17. Duplicate Case in Switch Statement
**Severity:** LOW
**Location:** `packages/api-gateway/src/rpc_exception_filter.ts:54-62`

**Issue:**
`status.UNAUTHENTICATED` appears twice in the switch statement (lines 54 and 62).

**Remediation:**
Remove duplicate case.

---

### 18. TODO Comment for Interval Validation
**Severity:** LOW
**Location:** `packages/api-gateway/src/modules/email/email.controller.ts:341`

**Issue:**
Comment suggests validation may not be working: `//TODO: Validate that this works`

**Remediation:**
Add test case to verify interval mapping and remove comment.

---

### 19. No Environment Variable Validation
**Severity:** LOW
**Location:** All module configurations using `process.env`

**Issue:**
No validation that required environment variables are set before startup.

**Impact:**
- Runtime failures
- Unclear error messages
- Service misconfiguration

**Remediation:**
Add environment validation in main.ts:
```typescript
const requiredEnvVars = ['JWT_SECRET', 'DB_SERVICE_ADDR', 'AUTH_SERVICE_ADDR'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}
```

---

## POSITIVE SECURITY CONTROLS OBSERVED

1. ✓ **Password Hashing:** bcrypt used for password storage (in auth-service)
2. ✓ **Input Validation:** class-validator decorators on all DTOs
3. ✓ **Parameterized Queries:** Prisma ORM prevents SQL injection
4. ✓ **JWT Implementation:** Standard JWT library with signature verification
5. ✓ **gRPC for Internal Services:** Reduces attack surface
6. ✓ **Sentry Integration:** Error monitoring for 5xx errors
7. ✓ **API Key Scoping:** API keys tied to specific projects and environments

---

## COMPLIANCE CONCERNS

### GDPR (EU General Data Protection Regulation)
- **Issue:** User data accessible without authentication violates data minimization
- **Issue:** No user consent tracking for data processing
- **Issue:** No data retention policies implemented
- **Issue:** No "right to be forgotten" implementation

### PCI-DSS (if handling payments)
- **Issue:** No network segmentation
- **Issue:** Passwords in headers may violate transmission requirements
- **Issue:** No logging/monitoring of authentication attempts

### SOC 2
- **Issue:** No access logging/audit trail
- **Issue:** Insufficient access controls
- **Issue:** No encryption at rest verification

---

## REMEDIATION PRIORITY

### Immediate (Within 24 hours)
1. Add authentication to `GET /user/id/:id`
2. Add authentication to `GET /project/id/:id` and `GET /project/name/:name`
3. Implement rate limiting on all endpoints
4. Add CORS policy
5. Add Helmet.js for security headers

### Short-term (Within 1 week)
6. Reduce payload size limits
7. Implement input sanitization
8. Add authorization checks beyond authentication
9. Sanitize error messages
10. Add environment variable validation

### Medium-term (Within 1 month)
11. Implement JWT revocation mechanism
12. Add account lockout policy
13. Migrate from password headers to token-only auth
14. Implement comprehensive audit logging
15. Add field-level access control for sensitive data

### Long-term (Within 3 months)
16. Security awareness training for developers
17. Implement automated security scanning in CI/CD
18. Conduct penetration testing
19. Implement GDPR compliance features
20. Add comprehensive security testing suite

---

## TESTING RECOMMENDATIONS

1. **Penetration Testing:** Engage external security firm
2. **Automated Scanning:** Integrate OWASP ZAP or similar into CI/CD
3. **Static Analysis:** Add ESLint security plugins
4. **Dependency Scanning:** Use `npm audit` or Snyk
5. **Fuzz Testing:** Test all endpoints with malformed input
6. **Load Testing:** Verify rate limiting and DoS protection

---

## CONCLUSION

The Juno API platform has several **critical security vulnerabilities** that must be addressed before production deployment. The most severe issues are:

1. Unauthenticated access to sensitive user and project data
2. Missing rate limiting enabling brute force attacks
3. No CORS or security headers
4. Excessive information disclosure

**The platform should NOT be deployed to production until at minimum the "Immediate" priority items are addressed.**

However, the codebase does demonstrate some good security practices including password hashing, input validation, and use of Prisma ORM. With the recommended remediations, the platform can achieve a strong security posture.

---

**Report End**
