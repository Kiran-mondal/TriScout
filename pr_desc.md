💡 What: Extracted several inline regular expressions used in request validation and HTML parsing (`/<title[^>]*>([^<]+)<\/title>/i`, `/<script\b/gi`, `/<form\b/gi`, `/<form[^>]+action=["']http:\/\/[^"']+["']/i`, `/\bon(?:error|load|mouseover|focus)\s*=\s*["'][^"']*javascript:/i`, `/^[a-zA-Z0-9_-]{3,30}$/`) and hoisted them to constant variables at the module scope in `web_dashboard/server.js`.

🎯 Why: Instantiating complex regex objects inside hot request paths (like `/api/scan-headers` and `/api/auth/register-request`) causes unnecessary CPU and memory allocation on every request.

📊 Impact: Prevents the V8 engine from recompiling and allocating memory for these regexes on every request, improving CPU usage and reducing garbage collection overhead during high-volume scans or registrations.

🔬 Measurement: Verify functionality by successfully creating an account and running a scan, ensuring no performance or behavioral regressions.
