## 2024-05-18 - Hardcoded JWT Secret Removal
**Vulnerability:** Found a hardcoded JWT Secret in `web_dashboard/middleware/auth.js`.
**Learning:** Developer may have used hardcoded keys during testing or development and forgot to implement environment variables for secure pipeline token verification.
**Prevention:** Use `crypto.randomBytes(32).toString('hex')` as a secure fallback when `process.env.JWT_SECRET` is not configured to avoid insecure defaults in production.

## 2024-05-24 - SSRF in Scan Headers API
**Vulnerability:** Found a Server-Side Request Forgery (SSRF) vulnerability in the `/api/scan-headers` endpoint. The `target` parameter is blindly trusted and passed to `axios.get()` without any validation to prevent requests to internal or private IP addresses.
**Learning:** External libraries like Axios follow redirects and execute HTTP requests blindly, allowing attackers to scan internal networks, access cloud metadata services (e.g. `169.254.169.254`), or hit local services.
**Prevention:** Implement strict URL parsing and validate the hostname against a denylist of private, loopback, and internal IP ranges before making outbound HTTP requests.
