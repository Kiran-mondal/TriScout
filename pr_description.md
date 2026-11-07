🚨 Severity: CRITICAL
💡 Vulnerability: SSRF Bypass via HTTP Redirects in `/api/scan-headers`. The `axios` client blindly followed HTTP redirects by default, allowing attackers to supply a valid public URL that redirects to internal/private IPs (e.g., 127.0.0.1 or cloud metadata), bypassing the initial `isPrivateIp` check.
🎯 Impact: Attackers could scan internal network infrastructure and potentially access internal endpoints or cloud metadata.
🔧 Fix: Configured `axios.get` with `maxRedirects: 0` to prevent following redirects automatically, safely stopping the SSRF chain at the first request.
✅ Verification: Tested locally by verifying that axios correctly stops at 3xx responses without following the redirect to the target location. Syntax check passes via `node -c web_dashboard/server.js`.
