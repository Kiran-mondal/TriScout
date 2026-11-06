## 2024-05-18 - Hardcoded JWT Secret Removal
**Vulnerability:** Found a hardcoded JWT Secret in `web_dashboard/middleware/auth.js`.
**Learning:** Developer may have used hardcoded keys during testing or development and forgot to implement environment variables for secure pipeline token verification.
**Prevention:** Use `crypto.randomBytes(32).toString('hex')` as a secure fallback when `process.env.JWT_SECRET` is not configured to avoid insecure defaults in production.

## 2024-05-24 - SSRF in Scan Headers API
**Vulnerability:** Found a Server-Side Request Forgery (SSRF) vulnerability in the `/api/scan-headers` endpoint. The `target` parameter is blindly trusted and passed to `axios.get()` without any validation to prevent requests to internal or private IP addresses.
**Learning:** External libraries like Axios follow redirects and execute HTTP requests blindly, allowing attackers to scan internal networks, access cloud metadata services (e.g. `169.254.169.254`), or hit local services.
**Prevention:** Implement strict URL parsing and validate the hostname against a denylist of private, loopback, and internal IP ranges before making outbound HTTP requests.

## 2024-05-25 - Missing Authentication on Sensitive API Endpoints
**Vulnerability:** The `/api/scan-headers` and `/api/send-report` endpoints lacked authentication and authorization controls, allowing anonymous access.
**Learning:** Forgetting to apply authentication middleware to specific internal or sensitive API endpoints is a common risk that allows unauthorized actions, such as consuming resources or sending spam emails.
**Prevention:** Apply `requireHTTPAuth` middleware systematically to any endpoint handling sensitive logic or mutating state. Ensure frontend `fetch` calls dynamically include the stored JWT in the `Authorization` header.

## 2024-11-06 - IPv4-mapped IPv6 SSRF Bypass
**Vulnerability:** The `isPrivateIp` validation function for SSRF protection could be bypassed by using an IPv4-mapped IPv6 address format (e.g., `::ffff:127.0.0.1` or `[::ffff:127.0.0.1]`). DNS lookup resolution can return these IP formats which pass basic substring checks.
**Learning:** Checking for standard IPv4 and IPv6 string prefixes is insufficient if the IP string check does not normalize IPv4-mapped IPv6 strings.
**Prevention:** Always parse or normalize IPv4-mapped IPv6 addresses (by stripping the `::ffff:` prefix) before applying private IP range checks.
