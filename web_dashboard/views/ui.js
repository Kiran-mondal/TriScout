function getOverviewTab() {
    return `
    <div id="view-overview" class="view-section flex flex-col gap-6">
        <div class="bg-surface-container-low p-5 sm:p-6 rounded-xl border border-surface-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="px-2.5 py-1 rounded bg-surface-container text-[10px] font-mono uppercase tracking-[0.2em] text-primary-container">OFFENSIVE OPS CONSOLE</span>
                        <span class="px-2.5 py-1 rounded bg-surface-container-high text-[10px] font-mono uppercase tracking-[0.2em] text-secondary">MISSION: SECURE + ACTIVE</span>
                    </div>
                    <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-on-surface mb-2">Welcome to TriScout</h1>
                    <p class="max-w-3xl text-sm sm:text-base text-on-surface-variant leading-relaxed">
                        Your unified workspace for authorized security reconnaissance and tactical vulnerability assessment.
                        Verify scopes, launch stealth sweeps, and inspect target telemetry from a single command center.
                    </p>
                    <div class="flex flex-wrap items-center gap-2 mt-4 font-mono text-[10px] text-on-surface-variant">
                        <span class="px-2.5 py-1 rounded bg-surface-container text-secondary">Active Scope: <span class="text-on-surface font-semibold">Awaiting Target Input</span></span>
                        <span class="px-2.5 py-1 rounded bg-surface-container text-secondary">Engine: <span class="text-on-surface font-semibold">Tri-Recon Core v2.4</span></span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-3">
                    <button onclick="switchView(null, 'recon')" class="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary-container text-on-primary font-mono text-[11px] uppercase font-bold shadow-lg shadow-primary-container/20 hover:brightness-110 transition-all">
                        <span class="material-symbols-outlined text-base">radar</span>
                        <span>Start Assessment</span>
                    </button>
                    <button onclick="openNewScanModal()" class="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-[11px] font-mono uppercase font-bold transition-all">
                        <span class="material-symbols-outlined text-base">bolt</span>
                        <span>Quick Launch</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="bg-surface-container-low p-5 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[10px] uppercase text-on-surface-variant tracking-[0.2em]">Evaluated Controls</span>
                    <span id="metric-assets-tag" class="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">Idle</span>
                </div>
                <div class="flex items-end justify-between gap-3">
                    <span id="metric-assets-count" class="text-3xl font-bold font-mono text-on-surface">0</span>
                    <span class="material-symbols-outlined text-2xl text-secondary">hub</span>
                </div>
                <div class="mt-3 grid grid-cols-3 gap-1 pt-2 border-t border-surface-variant/20 text-[10px] font-mono text-on-surface-variant">
                    <div><span id="sub-count-headers" class="text-on-surface font-bold">0</span> Headers</div>
                    <div><span id="sub-count-dns" class="text-on-surface font-bold">0</span> DNS</div>
                    <div><span id="sub-count-leaks" class="text-on-surface font-bold">0</span> Probes</div>
                </div>
            </div>

            <div class="bg-surface-container-low p-5 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[10px] uppercase text-on-surface-variant tracking-[0.2em]">Detected Issues</span>
                    <span id="metric-vuln-tag" class="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">No Scan</span>
                </div>
                <div class="flex items-end justify-between gap-3">
                    <span id="metric-vuln-total" class="text-3xl font-bold font-mono text-on-surface">0</span>
                    <span class="material-symbols-outlined text-2xl text-error">bug_report</span>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-variant/20 font-mono text-[10px]">
                    <span class="px-2 py-0.5 bg-error-container text-on-error rounded font-bold"><span id="pill-crit">0</span> Crit</span>
                    <span class="px-2 py-0.5 bg-surface-container-high text-error rounded"><span id="pill-high">0</span> Warn</span>
                    <span class="px-2 py-0.5 bg-surface-container text-secondary rounded"><span id="pill-med">0</span> Info</span>
                    <span class="px-2 py-0.5 bg-surface-container text-primary-container rounded"><span id="pill-low">0</span> Pass</span>
                </div>
            </div>

            <div class="bg-surface-container-low p-5 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[10px] uppercase text-on-surface-variant tracking-[0.2em]">Critical Findings</span>
                    <span id="crit-status-label" class="font-mono text-[10px] text-error">0 EXPOSED</span>
                </div>
                <div class="flex items-end justify-between gap-3">
                    <span id="metric-crit-big" class="text-3xl font-bold font-mono text-error">00</span>
                    <span class="material-symbols-outlined text-2xl text-error">priority_high</span>
                </div>
                <div class="mt-3 pt-2 border-t border-surface-variant/20 text-[10px] font-mono text-on-surface-variant">
                    Click to inspect vulnerability ledger →
                </div>
            </div>

            <div class="bg-surface-container-low p-5 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[10px] uppercase text-on-surface-variant tracking-[0.2em]">Posture Score</span>
                    <span id="scan-state-badge" class="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">READY</span>
                </div>
                <div class="flex items-end justify-between gap-3 mb-2">
                    <span id="metric-score-big" class="text-3xl font-bold font-mono text-primary-container">--%</span>
                    <span class="material-symbols-outlined text-2xl text-primary-container">task_alt</span>
                </div>
                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden my-2">
                    <div id="metric-score-bar" class="bg-primary-container h-full rounded-full transition-all duration-700" style="width: 0%;"></div>
                </div>
                <div class="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                    <span id="scans-executed-count">0 scans</span>
                    <span id="scan-latency-text">Latency: -- ms</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-5 bg-surface-container-low p-6 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">radar</span>
                        <h3 class="text-base text-on-surface font-bold">Target Reconnaissance Launcher</h3>
                    </div>
                    <span class="font-mono text-[10px] text-primary-container bg-surface-container px-2 py-0.5 rounded">ETHICAL-ROE</span>
                </div>

                <label class="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant block mb-2">Authorized Target Domain / URL</label>
                <div class="flex items-center rounded-lg bg-surface-container p-1.5 mb-4 border border-surface-variant/40 focus-within:border-primary-container">
                    <span class="px-2.5 py-1.5 font-mono text-[10px] text-secondary bg-surface-container-high rounded mr-1">HTTPS</span>
                    <input id="target-domain-input" type="text" placeholder="example.com" class="w-full bg-transparent px-2 font-mono text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none">
                    <button onclick="pasteTargetClipboard()" type="button" class="px-2 text-on-surface-variant hover:text-secondary" title="Paste">
                        <span class="material-symbols-outlined text-base">content_paste</span>
                    </button>
                </div>

                <label class="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant block mb-2">Active Recon Modules</label>
                <div class="space-y-2 mb-4 font-mono text-xs">
                    <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                        <div class="flex items-center gap-2">
                            <input checked type="checkbox" class="accent-primary-container rounded" />
                            <span>Public DNS &amp; IPv4 Resolution</span>
                        </div>
                        <span class="text-[10px] text-secondary">DoH Free</span>
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                        <div class="flex items-center gap-2">
                            <input checked type="checkbox" class="accent-primary-container rounded" />
                            <span>HTTP Security Header Inspection</span>
                        </div>
                        <span class="text-[10px] text-primary-container">HSTS/CSP/XFO</span>
                    </label>
                    <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                        <div class="flex items-center gap-2">
                            <input checked type="checkbox" class="accent-primary-container rounded" />
                            <span>Source Leak &amp; API Key Detector</span>
                        </div>
                        <span class="text-[10px] text-on-surface-variant">Regex Engine</span>
                    </label>
                </div>

                <div class="p-3 bg-surface-container rounded mb-5 border border-surface-variant/30">
                    <label class="flex items-start gap-2 cursor-pointer text-xs text-on-surface-variant">
                        <input checked class="mt-0.5 accent-primary-container" id="compliance-check" type="checkbox" />
                        <span>I verify explicit authorization to evaluate this domain under passive ethical testing rules.</span>
                    </label>
                </div>

                <button onclick="executeTargetAssessment()" id="dispatch-recon-btn" class="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-primary-container text-on-primary font-mono text-[11px] uppercase font-bold hover:brightness-110 transition-all">
                    <span class="material-symbols-outlined text-base">rocket_launch</span>
                    <span>Dispatch Active Recon Sweep</span>
                </button>
            </div>

            <div class="xl:col-span-7 bg-surface-container-low p-6 rounded-xl border border-surface-variant/20 shadow-lg">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                    <h3 class="text-base text-on-surface font-bold flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary-container">bolt</span>
                        Live Reconnaissance Summary
                    </h3>
                    <span id="recon-quick-status" class="font-mono text-xs text-secondary">Idle / Awaiting Target</span>
                </div>
                <div id="recon-live-summary" class="p-6 rounded-lg bg-surface-container text-center font-mono text-xs text-on-surface-variant space-y-2">
                    <div>No target scanned yet. Enter a domain on the left and click "Dispatch Active Recon Sweep".</div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-surface-variant/20">
                    <button onclick="switchView(null, 'discovery')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-secondary text-center cursor-pointer">Asset Discovery</button>
                    <button onclick="switchView(null, 'ledger')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-error text-center cursor-pointer">Vulnerabilities</button>
                    <button onclick="switchView(null, 'posture')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-primary-container text-center cursor-pointer">Security Posture</button>
                    <button onclick="switchView(null, 'topology')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-on-surface text-center cursor-pointer">Topology HUD</button>
                </div>
            </div>
        </div>
    </div>`;
}

function getDashboardPage() {
    return `
    <div class="flex flex-col w-full gap-6">
        ${getOverviewTab()}
        ${getReconTab()}
        ${getDiscoveryTab()}
        ${getLedgerTab()}
        ${getPostureTab()}
        ${getTopologyTab()}
        ${getHistoryTab()}

        <section class="mt-4 bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col md:flex-row items-center justify-between gap-4" id="reports-section">
            <div class="flex items-center gap-4">
                <div class="p-3 rounded-lg bg-surface-container text-secondary">
                    <span class="material-symbols-outlined text-2xl">file_download</span>
                </div>
                <div>
                    <h4 class="text-base text-on-surface font-bold">Security Reports Quick Export</h4>
                    <p class="text-xs text-on-surface-variant">Download validated findings locally or dispatch via Gmail</p>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
                <button onclick="exportScanReport('pdf')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">PDF</button>
                <button onclick="exportScanReport('json')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">JSON</button>
                <button onclick="exportScanReport('csv')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">CSV</button>
                <a href="/reports" class="flex-1 md:flex-initial px-4 py-2 rounded bg-primary-container text-on-primary uppercase font-bold text-center">Email Report</a>
            </div>
        </section>

        <section class="mt-4 bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-surface-variant/30">
            <div class="bg-surface-container-low px-4 py-2.5 flex items-center justify-between border-b border-surface-variant/20 font-mono text-xs">
                <div class="flex items-center gap-2">
                    <span class="h-3 w-3 rounded-full bg-error inline-block"></span>
                    <span class="h-3 w-3 rounded-full bg-surface-bright inline-block"></span>
                    <span class="h-3 w-3 rounded-full bg-primary-container inline-block"></span>
                    <span class="text-on-surface-variant ml-2">triscout-core@terminal-node-01: ~</span>
                </div>
                <button onclick="clearTerminalBuffer()" class="text-on-surface-variant hover:text-on-surface cursor-pointer p-1" title="Clear"><span class="material-symbols-outlined text-base">delete</span></button>
            </div>
            <div class="p-4 font-mono text-xs space-y-1 overflow-y-auto max-h-48 bg-surface-container-lowest text-slate-300" id="terminal-body">
                <div><span class="text-emerald-400 font-bold">[READY]</span> TriScout v2.4 On-Demand Engine initialized. Zero pre-loaded reports.</div>
                <div id="terminal-append-point"></div>
            </div>
            <form onsubmit="handleTerminalCommand(event)" class="bg-surface-container-low px-4 py-2 flex items-center gap-2 border-t border-surface-variant/20 font-mono text-xs">
                <span class="text-primary-container font-bold">&gt;</span>
                <input class="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant focus:outline-none" id="terminal-input" placeholder="Type command ('scan example.com', 'help', 'status')" type="text" />
                <button class="px-3 py-1 rounded bg-surface-container text-secondary uppercase font-semibold cursor-pointer" type="submit">Run</button>
            </form>
        </section>

        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md hidden p-4" id="launch-modal">
            <div class="bg-surface-container-low p-6 rounded-xl shadow-2xl max-w-lg w-full border border-surface-variant/40 font-mono text-xs">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20 text-on-surface font-bold text-sm">
                    <span>ROE Authorization &amp; Target Launch</span>
                    <button onclick="document.getElementById('launch-modal').classList.add('hidden')" class="cursor-pointer"><span class="material-symbols-outlined text-base">close</span></button>
                </div>
                <div class="space-y-3 mb-5 text-on-surface-variant">
                    <p>Enter the target domain or URL you are authorized to evaluate:</p>
                    <input id="modal-target-input" type="text" class="w-full p-3 bg-surface-container rounded text-secondary font-bold border border-surface-variant/40 focus:outline-none focus:border-primary-container" placeholder="example.com" />
                </div>
                <div class="flex items-center justify-end gap-2">
                    <button onclick="document.getElementById('launch-modal').classList.add('hidden')" class="px-4 py-2 rounded bg-surface-container text-on-surface uppercase cursor-pointer">Cancel</button>
                    <button onclick="confirmModalScan()" class="px-5 py-2 rounded bg-primary-container text-on-primary uppercase font-bold cursor-pointer">Engage Scan</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentScanData = null;
        let currentZoom = 1;

        function switchView(e, viewId) {
            if (e) e.preventDefault();
            document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
            const target = document.getElementById('view-' + viewId);
            if (target) target.classList.remove('hidden');

            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('bg-surface-container-high', 'text-on-surface', 'border-l-2', 'border-primary-container');
                item.classList.add('text-on-surface-variant');
            });
            const activeNav = document.querySelector('[data-nav="' + viewId + '"]');
            if (activeNav) {
                activeNav.classList.add('bg-surface-container-high', 'text-on-surface', 'border-l-2', 'border-primary-container');
                activeNav.classList.remove('text-on-surface-variant');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function appendTerm(type, msg) {
            const tb = document.getElementById('terminal-body');
            const ap = document.getElementById('terminal-append-point');
            if (!tb || !ap) return;
            const div = document.createElement('div');
            div.innerHTML = '<span class="text-cyan-400">[' + new Date().toLocaleTimeString() + ']</span> <span class="font-bold text-emerald-400">' + type + '</span> ' + String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            tb.insertBefore(div, ap);
            tb.scrollTop = tb.scrollHeight;
        }

        function clearTerminalBuffer() {
            const tb = document.getElementById('terminal-body');
            const ap = document.getElementById('terminal-append-point');
            if (tb && ap) tb.innerHTML = '<div id="terminal-append-point"></div>';
        }

        function pushActivity(title, detail, color) {
            const feed = document.getElementById('activity-timeline-feed');
            if (!feed) return;
            if (feed.innerText.includes('No scan events')) feed.innerHTML = '';
            const div = document.createElement('div');
            div.className = 'flex items-start gap-2.5 p-2.5 rounded bg-surface-container font-mono text-xs';
            div.innerHTML = '<div class="mt-1 h-2 w-2 rounded-full ' + color + ' shrink-0"></div><div class="flex-1"><div class="flex justify-between font-bold text-on-surface"><span>' + title + '</span><span class="text-[10px] text-on-surface-variant">now</span></div><div class="mt-1 text-on-surface-variant">' + detail + '</div></div>';
            feed.prepend(div);
        }

        async function resolveDNS(domain) {
            try {
                const clean = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
                const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(clean) + '&type=A');
                const data = await res.json();
                if (data && data.Answer && data.Answer.length > 0) {
                    return { ip: data.Answer[0].data, host: clean };
                }
            } catch(e) {}
            return { ip: 'Resolved via Backend', host: domain };
        }

        async function executeTargetAssessment(customTarget) {
            const target = (customTarget || document.getElementById('target-domain-input')?.value || '').trim();
            if (!target) return alert('Please enter a target domain!');

            const comp = document.getElementById('compliance-check');
            if (comp && !comp.checked) return alert('Please verify ethical authorization checkbox.');

            const btn = document.getElementById('dispatch-recon-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Scanning...';
            }

            document.getElementById('mission-status-badge').innerText = 'STATE: ACTIVE PROBING';
            document.getElementById('briefing-scope-text').innerText = target;
            document.getElementById('sidebar-active-target').innerText = target;
            document.getElementById('recon-quick-status').innerText = 'Probing ' + target + '...';

            const start = performance.now();
            appendTerm('[RECON]', 'Initializing active assessment sweep for: ' + target);
            pushActivity('Scan Dispatched', 'Target scope locked: ' + target, 'bg-secondary');

            const dns = await resolveDNS(target);
            appendTerm('[DNS]', 'Host ' + dns.host + ' resolved to IP: ' + dns.ip);

            try {
                const res = await fetch('/api/scan-headers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                    body: JSON.stringify({ target })
                });
                const data = await res.json();
                const latency = Math.round(performance.now() - start);

                if (!data.success) {
                    appendTerm('[ERROR]', data.error || 'Scan failed.');
                    return;
                }

                const score = typeof data.score === 'number' ? data.score : 50;
                const checks = Array.isArray(data.checks) ? data.checks : [];

                currentScanData = { target, host: dns.host, ip: dns.ip, score, checks, report: data.report, latency, timestamp: new Date().toLocaleString() };

                localStorage.setItem('triscout_target', target);
                localStorage.setItem('triscout_report', data.report);
                saveScanHistory(currentScanData);

                data.report.split('\n').forEach(l => { if (l.trim()) appendTerm('[RESULT]', l); });
                appendTerm('[SUCCESS]', 'Scan complete in ' + latency + 'ms. Score: ' + score + '/100');
                pushActivity('Scan Complete (' + score + '/100)', 'Evaluated ' + checks.length + ' controls on ' + dns.host, 'bg-primary-container');

                renderAllViews(currentScanData);
                document.getElementById('recon-live-summary').innerHTML = '<div class="text-emerald-400 font-bold">Scan Successful! Target Score: ' + score + '/100</div><div class="text-on-surface-variant">Host: ' + dns.host + ' • IP: ' + dns.ip + '</div>';
            } catch(e) {
                appendTerm('[ERROR]', 'Failed to reach scanner API endpoint.');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-base">radar</span> Dispatch Active Recon Sweep';
                }
            }
        }

        function renderAllViews(scan) {
            const checks = scan.checks || [];
            const crit = checks.filter(c => c.status === 'CRITICAL').length;
            const high = checks.filter(c => c.status === 'MISSING' || c.status === 'WARNING').length;
            const med = checks.filter(c => c.status === 'NOTICE').length;
            const low = checks.filter(c => c.status === 'SECURE').length;
            const open = crit + high;

            document.getElementById('metric-assets-count').innerText = checks.length + 1;
            document.getElementById('metric-assets-tag').innerText = scan.ip;
            document.getElementById('sub-count-headers').innerText = checks.length;
            document.getElementById('sub-count-dns').innerText = '1';
            document.getElementById('sub-count-leaks').innerText = '2';

            document.getElementById('metric-vuln-total').innerText = open;
            document.getElementById('metric-vuln-tag').innerText = open > 0 ? 'Action Req' : 'Clean';
            document.getElementById('pill-crit').innerText = crit;
            document.getElementById('pill-high').innerText = high;
            document.getElementById('pill-med').innerText = med;
            document.getElementById('pill-low').innerText = low;

            document.getElementById('nav-badge-assets').innerText = checks.length;
            document.getElementById('nav-badge-vulns').innerText = open;
            document.getElementById('sidebar-defcon-status').innerText = scan.score >= 80 ? 'DEFCON 5 (SECURE)' : 'DEFCON 3 (WARN)';

            document.getElementById('metric-crit-big').innerText = String(crit).padStart(2, '0');
            document.getElementById('crit-status-label').innerText = crit > 0 ? (crit + ' CRITICAL') : '0 EXPOSED';

            document.getElementById('metric-score-big').innerText = scan.score + '%';
            document.getElementById('metric-score-bar').style.width = scan.score + '%';
            document.getElementById('scan-state-badge').innerText = 'VERIFIED';
            document.getElementById('scans-executed-count').innerText = '1 session scan';
            document.getElementById('scan-latency-text').innerText = 'Latency: ' + scan.latency + 'ms';

            const tbody = document.getElementById('recon-telemetry-tbody');
            document.getElementById('telemetry-scope-badge').innerText = checks.length + ' Controls Evaluated';
            tbody.innerHTML = checks.map(c => `
                <tr class="hover:bg-surface-container-high transition-colors">
                    <td class="py-3 px-3 font-bold text-secondary">${c.name}</td>
                    <td class="py-3 px-3 text-on-surface-variant">${c.category}</td>
                    <td class="py-3 px-3 text-on-surface">${c.detail}</td>
                    <td class="py-3 px-3">${c.impact}</td>
                    <td class="py-3 px-3 text-right font-bold ${c.status === 'SECURE' ? 'text-primary-container' : 'text-error'}">${c.status}</td>
                </tr>
            `).join('');

            document.getElementById('lf-all').innerText = checks.length;
            document.getElementById('lf-crit').innerText = crit;
            document.getElementById('lf-high').innerText = high;
            document.getElementById('lf-med').innerText = med;
            document.getElementById('lf-low').innerText = low;

            const lContainer = document.getElementById('ledger-items-container');
            lContainer.innerHTML = checks.map(c => `
                <div class="p-4 rounded-lg bg-surface-container border border-surface-variant/30" data-status="${c.status}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm text-on-surface">${c.name}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'SECURE' ? 'bg-primary-container text-on-primary' : 'bg-error text-background'}">${c.status}</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">${c.detail}</p>
                </div>
            `).join('');

            const offset = 251.2 - (251.2 * (scan.score / 100));
            document.getElementById('posture-gauge-circle').style.strokeDashoffset = offset;
            document.getElementById('posture-gauge-score').innerText = scan.score;
            document.getElementById('posture-gauge-grade').innerText = scan.score >= 85 ? 'GRADE A+' : 'GRADE B';

            document.getElementById('hud-ping-badge').innerText = scan.latency + 'ms';
            document.getElementById('svg-target-score').innerText = scan.score + '/100';
            document.getElementById('svg-target-host').innerText = scan.host;
            document.getElementById('svg-target-ip').innerText = 'IP: ' + scan.ip;
            document.getElementById('insp-node-title').innerText = 'TARGET PERIMETER';
            document.getElementById('insp-node-host').innerText = scan.host;
            document.getElementById('insp-ip').innerText = scan.ip;
            document.getElementById('insp-score').innerText = scan.score + ' / 100';
        }

        function filterLedgerByStatus(status, btn) {
            document.querySelectorAll('.ledger-filter-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-container'));
            if (btn) btn.classList.add('ring-2', 'ring-primary-container');
            document.querySelectorAll('#ledger-items-container > div').forEach(card => {
                const st = card.getAttribute('data-status');
                if (status === 'ALL' || st === status || (status === 'MISSING' && (st === 'MISSING' || st === 'WARNING'))) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }

        function zoomTopology(delta) {
            const svg = document.getElementById('topology-svg-canvas');
            const lbl = document.getElementById('hud-zoom-label');
            if (!svg) return;
            if (delta === 0) currentZoom = 1;
            else currentZoom = Math.min(Math.max(0.6, currentZoom + delta), 1.6);
            svg.style.transform = 'scale(' + currentZoom + ')';
            if (lbl) lbl.innerText = Math.round(currentZoom * 100) + '%';
        }

        function inspectTopologyNode(nodeKey) {
            const title = document.getElementById('insp-node-title');
            const host = document.getElementById('insp-node-host');
            if (nodeKey === 'probe') {
                title.innerText = 'TRISCOUT PROBE'; host.innerText = 'Vercel Serverless Node';
            } else if (nodeKey === 'dns') {
                title.innerText = 'DNS RESOLVER'; host.innerText = 'dns.google (Public DoH)';
            } else {
                title.innerText = 'TARGET HOST'; host.innerText = currentScanData ? currentScanData.host : 'No Target Scanned';
            }
        }

        function saveScanHistory(scan) {
            try {
                const list = JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
                list.unshift({ target: scan.target, ip: scan.ip, score: scan.score, time: scan.timestamp });
                if (list.length > 15) list.pop();
                localStorage.setItem('triscout_scan_history', JSON.stringify(list));
                renderHistory();
            } catch(e) {}
        }

        function renderHistory() {
            const listEl = document.getElementById('scan-history-list');
            const badge = document.getElementById('nav-badge-history');
            if (!listEl) return;
            try {
                const list = JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
                if (badge) badge.innerText = list.length;
                if (!list.length) {
                    listEl.innerHTML = '<div class="p-6 text-center text-on-surface-variant">No scan history recorded yet.</div>';
                    return;
                }
                listEl.innerHTML = list.map(i => '<div class="flex justify-between items-center p-3 rounded bg-surface-container"><span>' + i.target + ' (' + i.ip + ')</span><span class="text-primary-container font-bold">' + i.score + '</span></div>').join('');
            } catch(e) {}
        }

        function clearScanHistory() {
            localStorage.removeItem('triscout_scan_history');
            renderHistory();
        }

        function exportScanReport(format) {
            if (!currentScanData) return alert('No active scan report found.');
            if (format === 'json') {
                const blob = new Blob([JSON.stringify(currentScanData, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'triscout-report.json'; a.click();
            } else if (format === 'csv') {
                const rows = [["Control", "Status", "Detail"]];
                currentScanData.checks.forEach(c => rows.push([c.name, c.status, '"' + c.detail + '"']));
                const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'triscout-findings.csv'; a.click();
            } else if (format === 'pdf') {
                window.print();
            }
        }

        function handleTerminalCommand(e) {
            e.preventDefault();
            const input = document.getElementById('terminal-input');
            const cmd = input.value.trim();
            if (!cmd) return;
            appendTerm('[USER]', '> ' + cmd);
            input.value = '';

            const lower = cmd.toLowerCase();
            if (lower === 'help') {
                appendTerm('[INFO]', 'Commands: scan <domain>, status, export json, clear');
            } else if (lower.startsWith('scan ')) {
                executeTargetAssessment(cmd.slice(5).trim());
            } else if (lower === 'status') {
                appendTerm('[INFO]', currentScanData ? ('Target: ' + currentScanData.host + ' | Score: ' + currentScanData.score) : 'Idle.');
            } else if (lower === 'clear') {
                clearTerminalBuffer();
            } else {
                appendTerm('[INFO]', 'Unknown command.');
            }
        }

        function pasteTargetClipboard() {
            navigator.clipboard.readText().then(t => {
                const inp = document.getElementById('target-domain-input');
                if (inp && t) inp.value = t.trim();
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            renderHistory();
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab) switchView(null, tab);
        });
    </script>
    `;
}

module.exports = {
    generateLayout,
    getDashboardPage,
    getReportsPage,
    getCliPage,
    getAboutPage,
    getProjectPage,
    getProfilePage
};
