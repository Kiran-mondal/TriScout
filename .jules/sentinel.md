## 2024-05-18 - Hardcoded JWT Secret Removal
**Vulnerability:** Found a hardcoded JWT Secret in `web_dashboard/middleware/auth.js`.
**Learning:** Developer may have used hardcoded keys during testing or development and forgot to implement environment variables for secure pipeline token verification.
**Prevention:** Use `crypto.randomBytes(32).toString('hex')` as a secure fallback when `process.env.JWT_SECRET` is not configured to avoid insecure defaults in production.
