## 2024-05-15 - Bolt initialized
**Learning:** Initializing Bolt
**Action:** Let us look for performance optimizations.

## 2024-05-15 - Redundant Network Requests in Target Scanning
**Learning:** The `/api/scan-headers` endpoint fetches external targets and runs expensive regex checks synchronously without caching. This means subsequent scans for the same target result in redundant network calls and parsing, creating a bottleneck.
**Action:** Always consider caching expensive operations like external network calls and heavy regex parsing, especially when the inputs (target URL) are identical and the results are not expected to change instantly.

## 2024-05-18 - Hoisting Cryptographic Operations
**Learning:** Performing expensive operations like `crypto.randomBytes` per-request in a route handler creates unnecessary CPU overhead and slows down request processing.
**Action:** Extract static/fallback credential generation logic to the module level so it's only executed once during server initialization.
