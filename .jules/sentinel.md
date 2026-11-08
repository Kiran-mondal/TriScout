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

## 2024-11-20 - SSRF via HTTP Redirect Bypass
**Vulnerability:** The `/api/scan-headers` endpoint prevented direct SSRF but could be bypassed if the remote server returned an HTTP redirect to an internal IP, because `axios.get` follows redirects by default.
**Learning:** Checking the initial target IP for SSRF is not enough if the HTTP client automatically follows redirects. An attacker can provide a valid public IP that redirects to an internal network address (e.g. `127.0.0.1`).
**Prevention:** Always disable automatic redirects in HTTP clients used for fetching user-supplied URLs by explicitly setting `maxRedirects: 0` in `axios`, or manually validating the redirected URL before following it.
## 2024-11-07 - DNS Rebinding & SSRF Mitigation
**Vulnerability:** Server-Side Request Forgery via DNS Rebinding and Redirects
**Learning:** Even with an initial check for private IPs, `axios` resolves domains separately and follows redirects, allowing bypass of URL-based validation via DNS rebinding (changing the IP resolution mid-request) or malicious redirects pointing to private subnets.
**Prevention:** Implement custom HTTP/HTTPS agents overriding `dns.lookup` to perform OS-level IP validation *after* resolution but *before* TCP connection establishment, combined with disabling automatic redirects (`maxRedirects: 0`).
