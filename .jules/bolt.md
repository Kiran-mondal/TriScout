## 2024-05-15 - Bolt initialized
**Learning:** Initializing Bolt
**Action:** Let us look for performance optimizations.

## 2024-05-15 - Redundant Network Requests in Target Scanning
**Learning:** The `/api/scan-headers` endpoint fetches external targets and runs expensive regex checks synchronously without caching. This means subsequent scans for the same target result in redundant network calls and parsing, creating a bottleneck.
**Action:** Always consider caching expensive operations like external network calls and heavy regex parsing, especially when the inputs (target URL) are identical and the results are not expected to change instantly.

## 2026-08-28 - Array Allocation Optimization
**Learning:** Re-declaring static arrays inside frequently called functions causes unnecessary allocations per call.
**Action:** Move static data structures outside function scope into module-level constants to ensure single-time allocation and improve execution speed.
