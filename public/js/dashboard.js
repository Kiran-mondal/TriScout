/* ============================================================================
   TriScout v2.4 TAC-OPS Dashboard Controller
   ============================================================================ */
let currentScanData = null;
let sessionScanCount = 0;
let currentTopoScale = 1;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

function showRuntimeError(msg) {
    const banner = document.getElementById('runtime-error-banner');
    const text = document.getElementById('runtime-error-text');
    if (!banner || !text) return;
    text.textContent = msg;
    banner.classList.remove('hidden');
}

// Global Error Boundaries (Check 39)
window.addEventListener('error', (event) => {
    showRuntimeError('Runtime UI error caught: ' + (event.message || 'Unknown error'));
});
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason && event.reason.message ? event.reason.message : 'Network or async operation failed.';
    showRuntimeError('Async error caught: ' + reason);
});

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function signOutSession() {
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/';
}

function toggleMobileSidebar() {
    const sb = document.getElementById('mobileSidebar');
    const ov = document.getElementById('sidebarOverlay');
    const btn = document.getElementById('mobileMenuBtn');
    if (sb && ov) {
        const isOpening = sb.classList.contains('-translate-x-full');
        sb.classList.toggle('-translate-x-full');
        ov.classList.toggle('hidden');
        if (btn) btn.setAttribute('aria-expanded', String(isOpening));
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sb = document.getElementById('mobileSidebar');
        const ov = document.getElementById('sidebarOverlay');
        const btn = document.getElementById('mobileMenuBtn');
        if (sb && !sb.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
            sb.classList.add('-translate-x-full');
            if (ov) ov.classList.add('hidden');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    }
});

function switchTab(e, tabId) {
    if (e) e.preventDefault();

    document.querySelectorAll('.tab-view').forEach(sec => sec.classList.add('hidden'));
    const activeSec = document.getElementById('tab-' + tabId);
    if (activeSec) activeSec.classList.remove('hidden');

    document.querySelectorAll('.sidebar-item').forEach(link => link.classList.remove('sidebar-active'));
    const activeNav = document.querySelector('[data-tab="' + tabId + '"]');
    if (activeNav) activeNav.classList.add('sidebar-active');

    const titles = {
        overview: 'OVERVIEW // COMMAND CENTER',
        scanner: 'TARGET SCANNER // RECONNAISSANCE',
        reports: 'REPORTS & EXPORT // DISPATCH',
        cli: 'CLI TOOL // NPM PACKAGE',
        project: 'MY PROJECTS // PORTFOLIO',
        profile: 'ACCOUNT & SYSTEM // SETTINGS'
    };
    const titleEl = document.getElementById('top-page-title');
    if (titleEl && titles[tabId]) titleEl.textContent = titles[tabId];

    const sb = document.getElementById('mobileSidebar');
    const ov = document.getElementById('sidebarOverlay');
    if (sb && !sb.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        sb.classList.add('-translate-x-full');
        if (ov) ov.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.TriScoutMascot && typeof window.TriScoutMascot.onTabChange === 'function') {
        window.TriScoutMascot.onTabChange();
    }
    return false;
}

// ============================================================================
// Interactive 11-Node Blueprint Topology HUD Controls
// ============================================================================
function zoomTopology(delta) {
    const svg = document.getElementById('topology-svg');
    const label = document.getElementById('topo-zoom-level');
    if (!svg) return;
    currentTopoScale = delta === 0 ? 1 : Math.max(0.7, Math.min(1.45, +(currentTopoScale + delta).toFixed(2)));
    svg.style.transform = `scale(${currentTopoScale})`;
    if (label) label.textContent = Math.round(currentTopoScale * 100) + '%';
}

function filterTopologyZone(zoneClass, btnEl) {
    document.querySelectorAll('.topo-filter-btn').forEach(b => {
        b.className = 'topo-filter-btn px-2.5 py-1 bg-[#091e3d] text-[#bae0ff] hover:text-white border border-[#bae0ff]/40 flex items-center gap-1 cursor-pointer';
    });
    if (btnEl) {
        btnEl.className = 'topo-filter-btn px-2.5 py-1 bg-[#1c539e] text-white font-bold border border-[#bae0ff]/80 flex items-center gap-1 cursor-pointer';
    }
    document.querySelectorAll('.topo-node').forEach(node => {
        node.style.opacity = (zoneClass === 'ALL' || node.classList.contains(zoneClass)) ? '1' : '0.22';
    });
}

function inspectTopoNode(nodeKey) {
    const detail = document.getElementById('tele-inspector-detail');
    if (!detail) return;
    const host = currentScanData ? currentScanData.host : 'standby target';
    const ip = currentScanData ? currentScanData.ip : 'Unresolved';
    const info = {
        WAF: `Edge WAF Ingress for ${host} (${ip}). Evaluates public rate-limit headers, CF-Ray, and ingress posture.`,
        LB: `Core Load Balancer & Google DoH Resolver routing passive HTTPS/443 telemetry for ${host}.`,
        APIGW: `Origin Dispatcher enforcing Token Bucket rate limiting (10 scans/min) and Locked Origin policy.`,
        PRIMARY: currentScanData
            ? `Primary audited target ${host} (${ip}). Posture score: ${currentScanData.score}/100 across ${currentScanData.checks.length} security controls.`
            : `Primary target node is on standby. Run a passive scan in Target Scanner to populate live posture data.`,
        STANDBY: `DOM Surface Scraper passively counts public <script> and <form> tags without injecting active payloads.`,
        AUTH: `Policy Node audits CORS Access-Control-Allow-Origin, HttpOnly/Secure cookie flags, and session expiry.`,
        LEAK: `Source Audit Probe scans public HTML for exposed API keys, private keys, stack traces, and debug source maps.`,
        POSTGRES: `Neon Serverless PostgreSQL enforcing Row-Level Security (RLS) across users, auth_otps, and scan_logs.`,
        REDIS: `In-memory Token Bucket rate limiter and 60-second scan response cache.`,
        S3: `Asset & Content-Security-Policy (CSP) verification node checking XSS script-source hardening.`,
        IAM: `Transport Broker auditing Strict-Transport-Security (HSTS) and MIME nosniff enforcement.`
    };
    detail.textContent = info[nodeKey] || info.PRIMARY;
}

// ============================================================================
// Terminal Stream & Paced Target Reconnaissance (With Mascot Code Inspection)
// ============================================================================
function appendTerm(type, msg) {
    const tb = document.getElementById('terminal-body');
    const ap = document.getElementById('terminal-append-point');
    if (!tb || !ap) return null;

    const div = document.createElement('div');
    div.className = 'term-log-line py-0.5';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'text-[#bae0ff]/65';
    timeSpan.textContent = '[' + new Date().toLocaleTimeString() + '] ';

    const typeSpan = document.createElement('span');
    let color = 'text-[#39ff88]';
    if (type === '[VULN]' || type === '[ERROR]') color = 'text-[#ffb4ab]';
    else if (type === '[RECON]' || type === '[DNS]') color = 'text-[#7ce0ff]';
    typeSpan.className = 'font-bold ' + color;
    typeSpan.textContent = type + ' ';

    const msgNode = document.createTextNode(String(msg == null ? '' : msg));
    div.append(timeSpan, typeSpan, msgNode);
    tb.insertBefore(div, ap);
    tb.scrollTop = tb.scrollHeight;
    return div;
}

function clearTerminalBuffer() {
    const tb = document.getElementById('terminal-body');
    if (tb) tb.innerHTML = '<div id="terminal-append-point"></div>';
}

async function resolveDNS(domain) {
    try {
        const clean = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
        const res = await fetchWithTimeout('https://dns.google/resolve?name=' + encodeURIComponent(clean) + '&type=A', {}, 6000);
        const data = await res.json();
        if (data && data.Answer && data.Answer.length > 0) {
            return { ip: data.Answer[0].data, host: clean };
        }
    } catch (e) {}
    return { ip: 'Resolved via Backend', host: domain.replace(/^https?:\/\//, '').split('/')[0] };
}

function getRemediationAdvice(name) {
    if (name.includes('HSTS')) return 'Add "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload" to your web server response headers.';
    if (name.includes('CSP')) return 'Configure a strict "Content-Security-Policy" header to mitigate XSS and unauthorized script execution.';
    if (name.includes('Isolation') || name.includes('X-Frame')) return 'Set "X-Frame-Options: DENY" or COOP/CORP headers to prevent iframe clickjacking.';
    if (name.includes('MIME')) return 'Add "X-Content-Type-Options: nosniff" to prevent browser MIME-type sniffing.';
    if (name.includes('Fingerprint') || name.includes('Tech Stack')) return 'Disable "X-Powered-By" headers and hide generator version meta tags.';
    if (name.includes('Key') || name.includes('Secrets')) return 'Rotate exposed API keys immediately and store secrets in server-side environment variables.';
    if (name.includes('Error')) return 'Disable raw stack traces and SQL error details in production responses.';
    if (name.includes('CORS') || name.includes('Origin')) return 'Restrict Access-Control-Allow-Origin to explicit trusted origins instead of "*".';
    return 'Enforce strict rate limiting and secure session flags at the reverse proxy or API gateway level.';
}

async function executeTargetAssessment(customTarget) {
    const inputEl = document.getElementById('target-domain-input');
    const target = (customTarget || (inputEl ? inputEl.value : '')).trim();
    if (!target) return alert('Please enter a target domain or URL first!');

    const comp = document.getElementById('compliance-check');
    if (comp && !comp.checked) return alert('Please verify the ethical authorization checkbox first.');

    switchTab(null, 'scanner');
    await sleep(160);

    const btn = document.getElementById('dispatch-recon-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span><span>Scanning Target...</span>';
    }

    setText('mission-status-badge', 'STATE: ACTIVE PROBING');
    setText('sidebar-active-target', target);
    setText('term-stream-badge', 'PROBING');

    const start = performance.now();

    // Step 1: Recon Init + Mascot moves to terminal code line
    const line1 = appendTerm('[RECON]', 'Initiating passive security scan for: ' + target);
    if (window.TriScoutMascot && line1) window.TriScoutMascot.inspectTerminalLine(line1, 'STEP 1: INIT');
    await sleep(360);

    // Step 2: DNS Resolution
    const dns = await resolveDNS(target);
    const line2 = appendTerm('[DNS]', 'Host ' + dns.host + ' resolved to IPv4: ' + dns.ip);
    if (window.TriScoutMascot && line2) window.TriScoutMascot.inspectTerminalLine(line2, 'STEP 2: DNS');
    await sleep(360);

    try {
        const line3 = appendTerm('[RECON]', 'Probing HTTP security headers, DOM surface & source leaks...');
        if (window.TriScoutMascot && line3) window.TriScoutMascot.inspectTerminalLine(line3, 'STEP 3: PROBE');

        const res = await fetchWithTimeout('/api/scan-headers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ target: target })
        }, 15000);

        const data = await res.json();
        const latency = Math.round(performance.now() - start);

        if (res.status === 401 || res.status === 403) {
            appendTerm('[ERROR]', data.error || 'Session expired. Please sign in again.');
            if (res.status === 401) signOutSession();
            return;
        }

        if (!data.success) {
            appendTerm('[ERROR]', data.error || 'Target scan failed.');
            return;
        }

        sessionScanCount++;
        const score = typeof data.score === 'number' ? data.score : 50;
        const checks = Array.isArray(data.checks) ? data.checks : [];

        currentScanData = {
            target: target,
            host: dns.host,
            ip: dns.ip,
            score: score,
            checks: checks,
            report: data.report,
            latency: latency,
            timestamp: new Date().toLocaleString()
        };

        localStorage.setItem('triscout_target', target);
        localStorage.setItem('triscout_report', data.report);
        saveScanHistory(currentScanData);

        // Paced line-by-line streaming so the mascot visibly moves along and scrolls the lines
        const reportLines = String(data.report || '').split('\n').filter(l => l.trim());
        for (let i = 0; i < reportLines.length; i++) {
            const line = reportLines[i];
            const tagType = line.startsWith('[+]') ? '[PASS]' : (line.startsWith('[!]') ? '[VULN]' : '[INFO]');
            const lineEl = appendTerm(tagType, line);
            if (window.TriScoutMascot && lineEl) {
                window.TriScoutMascot.inspectTerminalLine(lineEl, `LINE ${i + 1}/${reportLines.length}`);
            }
            await sleep(220);
        }

        const finalLine = appendTerm('[READY]', 'Scan finished in ' + latency + 'ms. Score: ' + score + '/100.');
        if (window.TriScoutMascot && finalLine) {
            window.TriScoutMascot.inspectTerminalLine(finalLine, 'AUDITED ' + score + '%');
        }
        updateAllDashboardWidgets(currentScanData);
        await sleep(340);

        // Mascot scrolls up & down to review the terminal lines, then perches on the terminal ledge
        if (window.TriScoutMascot) {
            await window.TriScoutMascot.sweepTerminalScrollReview();
        }
    } catch (err) {
        appendTerm('[ERROR]', err.name === 'TimeoutError' ? 'Scan request timed out.' : 'Could not reach scanning API.');
        if (window.TriScoutMascot) window.TriScoutMascot.perchOnRandomBox(true);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span><span>Initiate Target Scan</span>';
        }
        setText('term-stream-badge', 'READY');
    }
}

function updateAllDashboardWidgets(scan) {
    const checks = scan.checks || [];
    const crit = checks.filter(c => c.status === 'CRITICAL').length;
    const high = checks.filter(c => c.status === 'MISSING' || c.status === 'WARNING').length;
    const med = checks.filter(c => c.status === 'NOTICE').length;
    const low = checks.filter(c => c.status === 'SECURE').length;
    const openIssues = crit + high;

    setText('metric-assets-count', checks.length);
    setText('metric-assets-tag', scan.ip);
    setText('metric-vuln-total', openIssues);
    setText('metric-vuln-tag', openIssues > 0 ? 'Action Req' : 'Secure');
    setText('pill-crit', crit);
    setText('pill-high', high);
    setText('pill-low', low);

    setText('nav-badge-vulns', openIssues > 0 ? (openIssues + ' WARN') : 'CLEAN');
    setText('sidebar-defcon-status', scan.score >= 80 ? 'SECURE' : 'AT RISK');
    setText('mission-status-badge', 'STATE: AUDIT COMPLETE');

    setText('metric-crit-big', String(crit).padStart(2, '0'));
    setText('crit-status-label', crit > 0 ? (crit + ' CRITICAL') : '0 EXPOSED');

    setText('metric-score-big', scan.score + '%');
    const scoreBar = document.getElementById('metric-score-bar');
    if (scoreBar) scoreBar.style.width = scan.score + '%';
    setText('scan-state-badge', 'VERIFIED');
    setText('scans-executed-count', sessionScanCount + ' scan(s) in session');
    setText('scan-latency-text', 'Latency: ' + scan.latency + ' ms');

    setText('hud-ping-badge', 'PING: ' + scan.latency + ' ms');
    setText('topo-banner-tag', '[SCAN COMPLETE // ' + scan.host.toUpperCase() + ']');
    setText('topo-banner-desc', 'Evaluated ' + checks.length + ' controls — ' + low + ' secure, ' + openIssues + ' warning/critical.');
    setText('topo-scan-clock', 'LATENCY: ' + scan.latency + ' ms');
    setText('topo-progress-text', scan.score + '/100');

    setText('svg-dns-ip', 'IP: ' + scan.ip);
    setText('svg-target-score', scan.score + '/100');
    setText('svg-target-grade', scan.score >= 85 ? 'GRADE A+' : (scan.score >= 60 ? 'GRADE B' : 'HIGH RISK'));
    setText('svg-target-host', scan.host);
    setText('svg-target-ip', 'IP: ' + scan.ip);

    const findStatus = (needle) => {
        const match = checks.find(c => c.name && c.name.toLowerCase().includes(needle));
        return match ? match.status : 'CHECKED';
    };
    const errStatus = findStatus('error');
    const corsStatus = findStatus('cors');
    const hstsStatus = findStatus('hsts');
    const keyStatus = findStatus('key');
    const cspStatus = findStatus('csp');

    setText('tele-status-pill', scan.score >= 80 ? 'VERIFIED' : 'AT RISK');
    setText('tele-target-title', 'Target: ' + scan.host);
    setText('tele-suite-pct', checks.length + '/12 Controls Audited');
    setText('tele-row-error', errStatus);
    setText('tele-row-origin', corsStatus);
    setText('tele-row-tls', hstsStatus);
    setText('tele-row-keys', keyStatus);
    setText('tele-row-score', scan.score + ' / 100');

    setText('svg-auth-status', 'CORS: ' + corsStatus);
    setText('svg-leak-status', 'KEYS: ' + keyStatus);
    setText('svg-s3-status', 'CSP: ' + cspStatus);
    setText('svg-tls-label', 'HSTS: ' + hstsStatus);
    inspectTopoNode('PRIMARY');

    setText('lf-all', checks.length);
    setText('lf-crit', crit);
    setText('lf-high', high);
    setText('lf-med', med);
    setText('lf-low', low);

    const container = document.getElementById('ledger-items-container');
    if (container) {
        container.innerHTML = checks.map(c => {
            let borderCls = 'border-[#39ff88]/50 bg-[#0b2f24]/45';
            let badgeCls = 'bg-[#39ff88] text-[#003918]';
            if (c.status === 'CRITICAL') {
                borderCls = 'border-red-400/75 bg-red-950/50';
                badgeCls = 'bg-red-400 text-red-950';
            } else if (c.status === 'MISSING' || c.status === 'WARNING') {
                borderCls = 'border-amber-300/65 bg-amber-950/35';
                badgeCls = 'bg-amber-300 text-black';
            } else if (c.status === 'NOTICE') {
                borderCls = 'border-[#7ce0ff]/55 bg-[#091e3d]/80';
                badgeCls = 'bg-[#7ce0ff] text-[#0d2850]';
            }

            const safeStatus = escapeHtml(c.status);
            const safeName = escapeHtml(c.name);
            const safeImpact = escapeHtml(c.impact);
            const safeDetail = escapeHtml(c.detail);
            const safeFix = escapeHtml(getRemediationAdvice(String(c.name || '')));

            return '<div data-mascot-ledge class="ledger-card p-4 rounded-sm border transition-all cursor-pointer ' + borderCls + '" data-status="' + safeStatus + '" onclick="this.querySelector(\'.rem-box\').classList.toggle(\'hidden\')">' +
                '<div class="flex items-center justify-between gap-2 mb-1.5">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="px-2 py-0.5 text-[10px] font-bold uppercase ' + badgeCls + '">' + safeStatus + '</span>' +
                        '<span class="font-bold text-xs sm:text-sm text-white">' + safeName + '</span>' +
                    '</div>' +
                    '<span class="text-[11px] text-[#bae0ff]">' + safeImpact + '</span>' +
                '</div>' +
                '<p class="text-xs text-[#bae0ff] font-sans mb-1">' + safeDetail + '</p>' +
                '<div class="rem-box hidden mt-2.5 pt-2.5 border-t border-[#bae0ff]/25 text-xs text-[#7ce0ff]">' +
                    '<strong>Fix:</strong> ' + safeFix +
                '</div>' +
            '</div>';
        }).join('');
    }

    const preview = document.getElementById('reportPreview');
    if (preview) preview.textContent = 'TARGET: ' + scan.target + '\n\n' + scan.report;
}

function filterLedgerByStatus(status, btn) {
    document.querySelectorAll('.ledger-filter-btn').forEach(b => b.classList.remove('ring-2', 'ring-[#39ff88]'));
    if (btn) btn.classList.add('ring-2', 'ring-[#39ff88]');
    document.querySelectorAll('.ledger-card').forEach(card => {
        const st = card.getAttribute('data-status');
        if (status === 'ALL' || st === status || (status === 'MISSING' && (st === 'MISSING' || st === 'WARNING'))) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function saveScanHistory(scan) {
    try {
        const list = JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
        list.unshift({ target: scan.target, ip: scan.ip, score: scan.score, time: scan.timestamp });
        if (list.length > 10) list.pop();
        localStorage.setItem('triscout_scan_history', JSON.stringify(list));
        renderScanHistory();
    } catch (e) {}
}

function renderScanHistory(overrideList) {
    const container = document.getElementById('scan-history-list');
    if (!container) return;
    try {
        const list = Array.isArray(overrideList)
            ? overrideList
            : JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
        if (!list.length) {
            container.innerHTML = '<div class="p-4 text-center text-[#bae0ff]/80 bg-[#091e3d]/70 border border-[#bae0ff]/25">No scan history recorded in this session yet.</div>';
            return;
        }
        container.innerHTML = list.map(item =>
            '<div class="flex items-center justify-between p-3 bg-[#091e3d]/90 border border-[#bae0ff]/35">' +
                '<div><span class="text-[#7ce0ff] font-bold">' + escapeHtml(item.target) + '</span> ' +
                (item.ip ? '<span class="text-[#bae0ff]/75 text-[11px]">(' + escapeHtml(item.ip) + ')</span>' : '') + '</div>' +
                '<div class="flex items-center gap-3">' +
                    '<span class="text-[#bae0ff]/75 text-[11px] hidden sm:inline">' + escapeHtml(item.time) + '</span>' +
                    '<span class="px-2 py-0.5 bg-[#113466] border border-[#39ff88]/50 text-[#39ff88] font-bold">Score: ' + escapeHtml(item.score) + '/100</span>' +
                '</div>' +
            '</div>'
        ).join('');
    } catch (e) {}
}

function clearScanHistory() {
    localStorage.removeItem('triscout_scan_history');
    renderScanHistory([]);
}

function exportScanReport(format) {
    if (!currentScanData) return alert('Please run a target scan first before exporting!');
    if (format === 'json') {
        const blob = new Blob([JSON.stringify(currentScanData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'triscout-report-' + currentScanData.host + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } else if (format === 'csv') {
        const rows = [['Control', 'Category', 'Status', 'Impact', 'Detail']];
        currentScanData.checks.forEach(c => rows.push([c.name, c.category, c.status, c.impact, '"' + String(c.detail || '').replace(/"/g, '""') + '"']));
        const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'triscout-findings-' + currentScanData.host + '.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } else if (format === 'pdf') {
        window.print();
    }
}

async function sendReportEmail() {
    const email = document.getElementById('emailInput').value.trim();
    const target = localStorage.getItem('triscout_target');
    const reportData = localStorage.getItem('triscout_report');
    const btn = document.getElementById('reportBtn');

    if (!email) return alert('Please enter a recipient email address!');
    if (!reportData || !target) return alert('No scan report found! Run a scan first.');

    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
        const res = await fetchWithTimeout('/api/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ target: target, reportData: reportData, emailTo: email })
        }, 15000);
        const d = await res.json();
        alert(d.success ? 'SUCCESS: Report sent to ' + email : ('FAILED: ' + d.error));
    } catch (e) {
        alert('Error communicating with email server.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-base">send</span><span>Send Report</span>';
    }
}

function handleTerminalCommand(e) {
    e.preventDefault();
    const inp = document.getElementById('terminal-input');
    const cmd = (inp.value || '').trim();
    if (!cmd) return;
    appendTerm('[USER]', '> ' + cmd);
    inp.value = '';

    const lower = cmd.toLowerCase();
    if (lower === 'help') {
        appendTerm('[INFO]', 'Commands: scan <domain>, status, export json, clear');
    } else if (lower.startsWith('scan ')) {
        const t = cmd.slice(5).trim();
        const domInp = document.getElementById('target-domain-input');
        if (domInp) domInp.value = t;
        executeTargetAssessment(t);
    } else if (lower === 'status') {
        appendTerm('[INFO]', currentScanData ? ('Active Target: ' + currentScanData.host + ' | Score: ' + currentScanData.score + '/100') : 'Idle. No target scanned yet.');
    } else if (lower === 'export json') {
        exportScanReport('json');
    } else if (lower === 'clear') {
        clearTerminalBuffer();
    } else {
        appendTerm('[INFO]', 'Unknown command. Type "help".');
    }
}

function pasteTargetClipboard() {
    navigator.clipboard.readText().then(t => {
        const inp = document.getElementById('target-domain-input');
        if (inp && t) inp.value = t.trim();
    }).catch(() => {});
}

async function deleteUserAccount() {
    if (!confirm('WARNING: Permanently delete your account and all associated scan logs from Neon PostgreSQL?')) return;
    try {
        const res = await fetchWithTimeout('/api/account/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        }, 15000);
        const d = await res.json();
        if (d.success) {
            alert(d.message);
            signOutSession();
        } else {
            alert('Error: ' + d.error);
        }
    } catch (e) {
        alert('Failed to reach account deletion API.');
    }
}

// Bootstrap Dashboard on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/');
        return;
    }

    // IME-safe Enter shortcut on target domain input
    const targetInput = document.getElementById('target-domain-input');
    if (targetInput) {
        targetInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                executeTargetAssessment();
            }
        });
    }

    renderScanHistory();

    fetchWithTimeout('/api/scan-history', {
        headers: { 'Authorization': 'Bearer ' + token }
    }, 8000)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data && data.success && Array.isArray(data.history) && data.history.length > 0) {
                renderScanHistory(data.history.map(h => ({
                    target: h.target,
                    ip: '',
                    score: h.score,
                    time: h.time ? new Date(h.time).toLocaleString() : ''
                })));
            }
        })
        .catch(() => {});

    const savedReport = localStorage.getItem('triscout_report');
    const savedTarget = localStorage.getItem('triscout_target');
    if (savedReport && savedTarget) {
        const preview = document.getElementById('reportPreview');
        if (preview) preview.textContent = 'TARGET: ' + savedTarget + '\n\n' + savedReport;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const user = payload.user || 'Operator';
        setText('navProfileName', user);
        setText('profileName', user);

        const actionsEl = document.getElementById('profileActions');
        if (payload.provider === 'github' || payload.provider === 'registered') {
            setText('profileRole', payload.provider === 'github'
                ? 'GitHub OAuth Verified Operator'
                : ('Registered Operator (' + (payload.email || 'Verified') + ')'));

            if (payload.avatar && payload.avatar.startsWith('https://')) {
                const img1 = document.createElement('img');
                img1.src = payload.avatar;
                img1.alt = user;
                img1.className = 'w-full h-full object-cover';
                const av1 = document.getElementById('navProfileAvatar');
                const av2 = document.getElementById('profileAvatar');
                av1.innerHTML = ''; av1.appendChild(img1);
                av2.innerHTML = ''; av2.appendChild(img1.cloneNode(true));
            }
            actionsEl.innerHTML =
                '<button type="button" onclick="signOutSession()" class="p-3 bg-[#091e3d] hover:bg-[#1c539e] text-white border border-[#bae0ff]/60 uppercase font-bold cursor-pointer">Sign Out Session</button>' +
                '<button type="button" onclick="deleteUserAccount()" class="p-3 bg-red-950/75 hover:bg-red-900 text-red-200 uppercase font-bold border border-red-400/70 cursor-pointer">Delete Account Data</button>';
        } else {
            setText('profileRole', 'System Administrator (Local Env)');
            actionsEl.innerHTML =
                '<div class="p-3 bg-[#091e3d] border border-[#bae0ff]/40 text-[#bae0ff]">Local Admin managed via Environment Variables.</div>' +
                '<button type="button" onclick="signOutSession()" class="p-3 bg-red-950/75 hover:bg-red-900 text-red-200 border border-red-400/70 uppercase font-bold cursor-pointer">Sign Out Session</button>';
        }
    } catch (e) {}

    const path = window.location.pathname.replace('/', '');
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
        switchTab(null, tabParam);
    } else if (['reports', 'cli', 'project', 'profile'].includes(path)) {
        switchTab(null, path);
    } else if (path === 'about') {
        switchTab(null, 'profile');
    }
});
