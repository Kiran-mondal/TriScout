💡 **What:**
Moved the `scanCache.has(target)` check above the DNS resolution block (`dns.promises.lookup`) and IP address validation in the `/api/scan-headers` route.

🎯 **Why:**
Previously, the endpoint would always perform a DNS lookup for the target URL to validate against private IPs (SSRF protection) before checking if the result was already cached in memory. DNS lookups can be slow. By moving the cache check up, we skip the unnecessary DNS query and IP validation entirely for cached hits, serving them much faster. The user agreed that relying on the SSRF check at insertion time for the duration of the short cache TTL (60s) is an acceptable trade-off.

📊 **Measured Improvement:**
A benchmark was created hitting the API 100 times with a cached URL using 100 unique user tokens to bypass rate limiting.
* **Baseline (Cache after DNS):** 430ms total | 4.30ms avg latency | 232.56 Requests/Sec
* **Optimized (Cache before DNS):** 250ms total | 2.50ms avg latency | 400.00 Requests/Sec

This optimization yielded a ~72% increase in throughput and nearly halved the average latency for cache hits.
