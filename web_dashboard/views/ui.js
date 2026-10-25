function generateLayout(pageTitle, content) {
    const isDashboard = pageTitle === 'COMMAND CENTER';
    const activeCls = "bg-surface-container-high text-on-surface border-l-2 border-primary-container shadow-[inset_0_0_12px_rgba(57,255,136,0.1)]";
    const normalCls = "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface";

    return `<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>TriScout v2.4 TAC-OPS // ${pageTitle}</title>
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..900&display=swap" rel="stylesheet"/>
    <style>
        html, body { margin: 0; padding: 0; background-color: #10131b; color: #e0e2ed; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0b0e15; }
        ::-webkit-scrollbar-thumb { background: #272a32; border-radius: 4px; }
        #mobileSidebar { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "background": "#10131b", "surface-variant": "#32353d",
                        "surface-container-lowest": "#0b0e15", "primary": "#f5fff2", "error": "#ffb4ab",
                        "surface": "#10131b", "on-error": "#690005", "error-container": "#93000a",
                        "surface-bright": "#363941", "surface-container-high": "#272a32",
                        "on-background": "#e0e2ed", "surface-container": "#1d2027", "secondary-fixed-dim": "#00d9ff",
                        "surface-container-low": "#181b23", "primary-fixed-dim": "#00e473",
                        "secondary-container": "#00d9ff", "primary-fixed": "#63ff95", "primary-container": "#39ff88",
                        "on-primary": "#003918", "on-surface-variant": "#bacbb9", "secondary": "#aeecff",
                        "on-surface": "#e0e2ed", "surface-container-highest": "#32353d", "outline": "#849584"
                    },
                    fontFamily: {
                        "sans": ["Inter", "sans-serif"],
                        "mono": ["JetBrains Mono", "monospace"]
                    }
                }
            }
        };
    </script>
</head>
<body class="bg-surface font-sans text-on-surface antialiased selection:bg-primary-container selection:text-on-primary">

    <div id="sidebarOverlay" onclick="toggleMobileSidebar()" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 hidden lg:hidden"></div>

    <aside id="mobileSidebar" class="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between select-none shadow-[2px_0_16px_rgba(0,0,0,0.6)] transform -translate-x-full lg:translate-x-0">
        <div class="flex flex-col flex-1 min-h-0">
            <div class="h-16 px-4 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-variant/20">
                <div class="flex items-center gap-2">
                    <span class="flex h-2 w-2 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
                    </span>
                    <span class="font-mono text-xs font-semibold tracking-wider text-on-surface uppercase">OP-CONSOLE // ACTIVE</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-mono text-[10px] text-secondary px-1.5 py-0.5 bg-surface-container rounded">NODE.01</span>
                    <button onclick="toggleMobileSidebar()" class="lg:hidden text-on-surface-variant hover:text-on-surface p-1">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div class="px-4 py-2.5">
                <div class="flex items-center justify-between text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
                    <span>TACTICAL WORKSPACES</span>
                    <span class="text-secondary">12 MODULES</span>
                </div>
            </div>

            <nav class="flex-1 px-2 overflow-y-auto space-y-0.5 font-mono text-xs" id="sidebar-nav">
                <a href="/dashboard?tab=overview" onclick="return switchView(event, 'overview')" data-nav="overview" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${isDashboard ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base ${isDashboard ? 'text-primary-container' : ''}">grid_view</span><span>Overview</span></div>
                    <span class="text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">HOME</span>
                </a>
                <a href="/dashboard?tab=recon" onclick="return switchView(event, 'recon')" data-nav="recon" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">radar</span><span>Reconnaissance</span></div>
                    <span class="text-[10px] text-secondary px-1.5 py-0.5 rounded bg-surface-container">SCAN</span>
                </a>
                <a href="/dashboard?tab=discovery" onclick="return switchView(event, 'discovery')" data-nav="discovery" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">hub</span><span>Asset Discovery</span></div>
                    <span id="nav-badge-assets" class="text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">0</span>
                </a>
                <a href="/dashboard?tab=ledger" onclick="return switchView(event, 'ledger')" data-nav="ledger" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">bug_report</span><span>Vulnerability Assessment</span></div>
                    <span id="nav-badge-vulns" class="text-[10px] text-error px-1.5 py-0.5 rounded bg-error-container/30">0</span>
                </a>
                <a href="/dashboard?tab=posture" onclick="return switchView(event, 'posture')" data-nav="posture" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">donut_large</span><span>Web Security &amp; Posture</span></div>
                    <span class="text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">DAST</span>
                </a>
                <a href="/dashboard?tab=topology" onclick="return switchView(event, 'topology')" data-nav="topology" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">lan</span><span>Network Topology HUD</span></div>
                    <span class="text-[10px] text-primary-container px-1.5 py-0.5 rounded bg-surface-container font-semibold">HUD</span>
                </a>
                <a href="/dashboard?tab=history" onclick="return switchView(event, 'history')" data-nav="history" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${normalCls}">
                    <div class="flex items-center gap-2.5"><span class="nav-icon material-symbols-outlined text-base">history</span><span>Scan History</span></div>
                    <span id="nav-badge-history" class="text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">0</span>
                </a>
                <a href="/reports" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${pageTitle === 'SECURITY REPORTS' ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-base ${pageTitle === 'SECURITY REPORTS' ? 'text-primary-container' : ''}">description</span><span>Security Reports</span></div>
                    <span class="text-[10px] text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">MAIL/PDF</span>
                </a>
                <a href="/cli" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${pageTitle === 'CLI & INTEGRATIONS' ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-base ${pageTitle === 'CLI & INTEGRATIONS' ? 'text-primary-container' : ''}">terminal</span><span>CLI &amp; Integrations</span></div>
                    <span class="text-[10px] text-primary-container px-1.5 py-0.5 rounded bg-surface-container">NPM</span>
                </a>
                <a href="/project" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${pageTitle === 'MY PROJECTS' ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-base ${pageTitle === 'MY PROJECTS' ? 'text-primary-container' : ''}">work</span><span>My Projects</span></div>
                </a>
                <a href="/about" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${pageTitle === 'ABOUT TRISCOUT' ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-base ${pageTitle === 'ABOUT TRISCOUT' ? 'text-primary-container' : ''}">info</span><span>About System</span></div>
                </a>
                <a href="/profile" class="sidebar-item flex items-center justify-between px-3 py-2.5 rounded transition-all group ${pageTitle === 'USER PROFILE' ? activeCls : normalCls}">
                    <div class="flex items-center gap-2.5"><span class="material-symbols-outlined text-base ${pageTitle === 'USER PROFILE' ? 'text-primary-container' : ''}">settings</span><span>Account Settings</span></div>
                </a>
            </nav>
        </div>

        <div class="p-3 bg-surface-container-lowest/90 border-t border-surface-variant/20">
            <div class="p-2.5 rounded bg-surface-container border border-surface-variant/40">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-primary-container">lock</span>
                        <span class="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">ACTIVE TARGET SCOPE</span>
                    </div>
                    <span class="font-mono text-[10px] text-primary-container bg-surface-container-high px-1.5 py-0.5 rounded">AUTH-OK</span>
                </div>
                <div id="sidebar-active-target" class="font-mono text-xs text-secondary font-medium truncate mb-1.5">No Active Target (Idle)</div>
                <div class="flex items-center justify-between pt-1.5 border-t border-surface-variant/30">
                    <span id="sidebar-defcon-status" class="font-mono text-[10px] text-primary-container font-semibold">STANDBY</span>
                    <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="font-mono text-[10px] text-error hover:underline flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-xs">logout</span> LOGOUT
                    </button>
                </div>
            </div>
        </div>
    </aside>

    <div class="lg:pl-72">
        <header class="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-30 flex items-center justify-between px-4 lg:px-6 border-b border-surface-variant/20">
            <div class="flex items-center gap-3">
                <button onclick="toggleMobileSidebar()" aria-label="Open menu" class="lg:hidden p-2 -ml-1 rounded text-on-surface hover:bg-surface-container-high">
                    <span class="material-symbols-outlined text-2xl">menu</span>
                </button>
                <div class="flex items-center gap-2.5">
                    <img alt="TriScout" class="h-8 w-8 object-contain" src="/logo.svg"/>
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-base text-on-surface font-bold tracking-tight">TriScout</span>
                            <span class="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 text-secondary border border-surface-variant rounded uppercase font-semibold">v2.4 TAC-OPS</span>
                        </div>
                    </div>
                </div>
                <div class="hidden md:flex items-center gap-2 pl-4 py-1 border-l border-surface-variant">
                    <span class="h-2 w-2 rounded-full bg-primary-container animate-pulse"></span>
                    <span class="font-mono text-[10px] text-primary-container font-medium tracking-wide uppercase">SYSTEM READY / ON-DEMAND MODE</span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="relative hidden md:block w-56 xl:w-64">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
                    <input oninput="filterFindingsGlobal(this.value)" class="w-full h-9 pl-9 pr-3 rounded bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-mono text-xs border border-surface-variant/40 focus:outline-none focus:border-secondary" placeholder="Filter findings, headers..." type="text"/>
                </div>
                <button onclick="openNewScanModal()" class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container text-on-primary font-mono text-xs uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_12px_rgba(57,255,136,0.35)] cursor-pointer" type="button">
                    <span class="material-symbols-outlined text-sm font-bold">add_circle</span>
                    <span class="hidden sm:inline">New Scan</span>
                </button>
                <a href="/profile" class="flex items-center gap-2 pl-2 py-1 border-l border-surface-variant">
                    <div id="navProfileAvatar" class="w-8 h-8 rounded-full bg-surface-container-high text-primary-container flex items-center justify-center font-bold ring-1 ring-surface-variant overflow-hidden">
                        <span class="material-symbols-outlined text-base">person</span>
                    </div>
                    <div class="hidden xl:flex flex-col text-left">
                        <span id="navProfileName" class="font-mono text-xs text-on-surface font-semibold leading-tight">Operator</span>
                        <span class="font-mono text-[10px] text-primary-container leading-tight">Authorized</span>
                    </div>
                </a>
            </div>
        </header>

        <main class="relative pt-20 min-h-screen bg-surface bg-[radial-gradient(#1d2027_1px,transparent_1px)] [background-size:20px_20px] px-4 lg:px-6 pb-12">
            ${content}
        </main>
    </div>

    <script>
        function toggleMobileSidebar() {
            const sb = document.getElementById('mobileSidebar');
            const ov = document.getElementById('sidebarOverlay');
            if (sb && ov) {
                sb.classList.toggle('-translate-x-full');
                ov.classList.toggle('hidden');
            }
        }
        function openNewScanModal() {
            if (window.location.pathname !== '/dashboard') {
                window.location.href = '/dashboard?tab=recon';
                return;
            }
            const modal = document.getElementById('launch-modal');
            if (modal) modal.classList.remove('hidden');
        }
        document.addEventListener("DOMContentLoaded", () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    const navName = document.getElementById('navProfileName');
                    const navAvatar = document.getElementById('navProfileAvatar');
                    const modalOp = document.getElementById('modal-operator-name');
                    if (navName && payload.user) navName.innerText = payload.user;
                    if (modalOp && payload.user) modalOp.innerText = payload.user + ' (SecOps Verified)';
                    if (navAvatar && payload.avatar && payload.avatar.startsWith('https://')) {
                        const img = document.createElement('img');
                        img.src = payload.avatar;
                        img.className = "w-full h-full object-cover";
                        navAvatar.innerHTML = '';
                        navAvatar.appendChild(img);
                    }
                } catch(e) {}
            }
        });
    </script>
</body>
</html>`;
}

function getOverviewTab() {
    return `
    <div id="view-overview" class="view-section flex flex-col gap-6">
        <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-surface-container-low p-6 rounded-xl shadow-xl relative overflow-hidden border border-surface-variant/20">
            <div class="flex flex-col z-10 max-w-3xl">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="px-2.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-primary-container tracking-wider uppercase font-semibold">DEFENSIVE RECON CONSOLE</span>
                    <span id="mission-status-badge" class="px-2.5 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-secondary tracking-wide">STATE: ON-DEMAND STANDBY</span>
                </div>
                <h1 class="text-2xl sm:text-3xl text-on-surface tracking-tight font-bold mb-2">Welcome to TriScout</h1>
                <p class="text-sm sm:text-base text-on-surface-variant max-w-2xl">
                    Unified workspace for authorized security reconnaissance and tactical vulnerability assessment. Switch between dedicated modules using the menu bar or tabs below.
                </p>
                <div class="flex flex-wrap items-center gap-2 mt-4 font-mono text-xs">
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface">
                        <span class="h-2 w-2 rounded-full bg-secondary"></span>
                        <span class="text-on-surface-variant">Active Scope:</span>
                        <span id="briefing-scope-text" class="text-on-surface font-semibold">Awaiting Target Input</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface">
                        <span class="text-on-surface-variant">Engine:</span>
                        <span class="text-secondary font-semibold">Tri-Recon Core v2.4</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 z-10 w-full xl:w-auto">
                <button onclick="switchView(null, 'recon')" class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary-container text-on-primary font-mono text-xs uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_20px_rgba(57,255,136,0.3)] cursor-pointer" type="button">
                    <span class="material-symbols-outlined text-lg">radar</span>
                    <span>Go To Scanner</span>
                </button>
                <button onclick="openNewScanModal()" class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-surface-container text-secondary hover:bg-surface-container-high font-mono text-xs uppercase font-semibold transition-all border border-surface-variant/40 cursor-pointer" type="button">
                    <span class="material-symbols-outlined text-lg">bolt</span>
                    <span>Quick Launch</span>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div onclick="switchView(null, 'discovery')" class="bg-surface-container-low p-5 rounded-xl shadow-lg border border-surface-variant/20 hover:border-secondary/50 cursor-pointer transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] text-on-surface-variant uppercase">Evaluated Controls</span>
                    <span id="metric-assets-tag" class="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded font-semibold">Idle</span>
                </div>
                <div class="flex items-baseline justify-between mb-3">
                    <span id="metric-assets-count" class="text-3xl text-on-surface font-bold font-mono">0</span>
                    <span class="material-symbols-outlined text-secondary text-2xl">hub</span>
                </div>
                <div class="grid grid-cols-3 gap-1 pt-2 font-mono text-[11px] text-on-surface-variant border-t border-surface-variant/20">
                    <div><span id="sub-count-headers" class="text-on-surface font-bold">0</span> Headers</div>
                    <div><span id="sub-count-dns" class="text-on-surface font-bold">0</span> DNS IP</div>
                    <div><span id="sub-count-leaks" class="text-on-surface font-bold">0</span> Probes</div>
                </div>
            </div>

            <div onclick="switchView(null, 'ledger')" class="bg-surface-container-low p-5 rounded-xl shadow-lg border border-surface-variant/20 hover:border-error/50 cursor-pointer transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] text-on-surface-variant uppercase">Detected Issues</span>
                    <span id="metric-vuln-tag" class="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-semibold">No Scan</span>
                </div>
                <div class="flex items-baseline justify-between mb-3">
                    <span id="metric-vuln-total" class="text-3xl text-on-surface font-bold font-mono">0</span>
                    <span class="material-symbols-outlined text-error text-2xl">bug_report</span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-variant/20 font-mono text-[10px]">
                    <span class="px-2 py-0.5 bg-error-container text-on-error rounded font-bold"><span id="pill-crit">0</span> Crit</span>
                    <span class="px-2 py-0.5 bg-surface-container-high text-error rounded"><span id="pill-high">0</span> Warn</span>
                    <span class="px-2 py-0.5 bg-surface-container text-secondary rounded"><span id="pill-med">0</span> Info</span>
                    <span class="px-2 py-0.5 bg-surface-container text-primary-container rounded"><span id="pill-low">0</span> Pass</span>
                </div>
            </div>

            <div onclick="switchView(null, 'ledger')" class="bg-surface-container-low p-5 rounded-xl shadow-lg border border-surface-variant/20 hover:border-error/50 cursor-pointer transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] text-on-surface-variant uppercase">Critical Findings</span>
                    <span id="crit-status-label" class="font-mono text-[10px] text-error font-bold">0 EXPOSED</span>
                </div>
                <div class="flex items-baseline justify-between mb-3">
                    <span id="metric-crit-big" class="text-3xl text-error font-bold font-mono">00</span>
                    <span class="material-symbols-outlined text-error text-2xl">priority_high</span>
                </div>
                <div class="text-xs font-mono text-on-surface-variant pt-2 border-t border-surface-variant/20">
                    Click to inspect vulnerability ledger &rarr;
                </div>
            </div>

            <div onclick="switchView(null, 'posture')" class="bg-surface-container-low p-5 rounded-xl shadow-lg border border-surface-variant/20 hover:border-primary-container/50 cursor-pointer transition-all">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-mono text-[11px] text-on-surface-variant uppercase">Posture Score</span>
                    <span id="scan-state-badge" class="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded font-semibold">READY</span>
                </div>
                <div class="flex items-baseline justify-between mb-2">
                    <span id="metric-score-big" class="text-3xl text-primary-container font-bold font-mono">--%</span>
                    <span class="material-symbols-outlined text-primary-container text-2xl">task_alt</span>
                </div>
                <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden my-2">
                    <div id="metric-score-bar" class="bg-primary-container h-full rounded-full transition-all duration-700" style="width: 0%;"></div>
                </div>
                <div class="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                    <span id="scans-executed-count">0 scans</span>
                    <span id="scan-latency-text">Latency: -- ms</span>
                </div>
            </div>
        </div>
    </div>`;
}

function getReconTab() {
    return `
    <div id="view-recon" class="view-section hidden flex flex-col gap-6">
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-5 bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-secondary">radar</span>
                            <h3 class="text-base text-on-surface font-bold">Target Reconnaissance Launcher</h3>
                        </div>
                        <span class="font-mono text-[10px] text-primary-container bg-surface-container px-2 py-0.5 rounded">ETHICAL-ROE</span>
                    </div>

                    <label class="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1.5 block">Authorized Target Domain / URL</label>
                    <div class="flex rounded-lg bg-surface-container p-1.5 mb-4 border border-surface-variant/40 focus-within:border-primary-container">
                        <span class="px-2.5 py-1.5 font-mono text-xs text-secondary bg-surface-container-high rounded mr-1">HTTPS</span>
                        <input class="w-full bg-transparent px-2 font-mono text-sm text-on-surface focus:outline-none" id="target-domain-input" placeholder="example.com" type="text"/>
                        <button onclick="pasteTargetClipboard()" class="px-2 text-on-surface-variant hover:text-secondary cursor-pointer" title="Paste" type="button">
                            <span class="material-symbols-outlined text-base">content_paste</span>
                        </button>
                    </div>

                    <label class="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-2 block">Active Recon Modules</label>
                    <div class="space-y-2 mb-4 font-mono text-xs">
                        <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                            <div class="flex items-center gap-2">
                                <input checked type="checkbox" class="accent-primary-container rounded"/>
                                <span>Public DNS &amp; IPv4 Resolution</span>
                            </div>
                            <span class="text-[10px] text-secondary">DoH Free</span>
                        </label>
                        <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                            <div class="flex items-center gap-2">
                                <input checked type="checkbox" class="accent-primary-container rounded"/>
                                <span>HTTP Security Header Inspection</span>
                            </div>
                            <span class="text-[10px] text-primary-container">HSTS/CSP/XFO</span>
                        </label>
                        <label class="flex items-center justify-between p-2.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer">
                            <div class="flex items-center gap-2">
                                <input checked type="checkbox" class="accent-primary-container rounded"/>
                                <span>Source Leak &amp; API Key Detector</span>
                            </div>
                            <span class="text-[10px] text-on-surface-variant">Regex Engine</span>
                        </label>
                    </div>

                    <div class="p-3 bg-surface-container rounded mb-5 border border-surface-variant/30">
                        <label class="flex items-start gap-2 cursor-pointer text-xs text-on-surface-variant">
                            <input checked class="mt-0.5 accent-primary-container" id="compliance-check" type="checkbox"/>
                            <span>I verify explicit authorization to evaluate this domain under passive ethical testing rules.</span>
                        </label>
                    </div>
                </div>

                <button onclick="executeTargetAssessment()" class="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-primary-container text-on-primary font-mono text-xs uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_16px_rgba(57,255,136,0.3)] cursor-pointer" id="dispatch-recon-btn" type="button">
                    <span class="material-symbols-outlined text-base">rocket_launch</span>
                    <span>Dispatch Active Recon Sweep</span>
                </button>
            </div>

            <div class="xl:col-span-7 bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col justify-between">
                <div>
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
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-surface-variant/20">
                    <button onclick="switchView(null, 'discovery')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-secondary text-center cursor-pointer">View Assets &rarr;</button>
                    <button onclick="switchView(null, 'ledger')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-error text-center cursor-pointer">View Vulns &rarr;</button>
                    <button onclick="switchView(null, 'posture')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-primary-container text-center cursor-pointer">Posture Gauge &rarr;</button>
                    <button onclick="switchView(null, 'topology')" class="p-2.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-xs text-on-surface text-center cursor-pointer">Topology HUD &rarr;</button>
                </div>
            </div>
        </div>
    </div>`;
}
function getDiscoveryTab() {
    return `
    <div id="view-discovery" class="view-section hidden flex flex-col gap-6">
        <div class="bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-surface-variant/20">
                <div>
                    <h3 class="text-base text-on-surface font-bold">Asset Discovery &amp; Header Telemetry</h3>
                    <p class="text-xs text-on-surface-variant">Real-time HTTP controls and DNS records discovered on target scope[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)</p>
                </div>
                <span id="telemetry-scope-badge" class="font-mono text-xs text-secondary px-2.5 py-1 bg-surface-container rounded">0 Controls Evaluated</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left font-mono text-xs">
                    <thead>
                        <tr class="bg-surface-container text-on-surface-variant uppercase">
                            <th class="py-2.5 px-3 rounded-l">Control / Check</th>
                            <th class="py-2.5 px-3">Category</th>
                            <th class="py-2.5 px-3">Telemetry Detail</th>
                            <th class="py-2.5 px-3">Impact</th>
                            <th class="py-2.5 px-3 rounded-r text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-on-surface divide-y divide-surface-variant/20" id="recon-telemetry-tbody">
                        <tr>
                            <td colspan="5" class="py-10 text-center text-on-surface-variant">
                                [IDLE] No target scanned yet. Run a scan from the Reconnaissance tab.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function getLedgerTab() {
    return `
    <div id="view-ledger" class="view-section hidden flex flex-col gap-6">
        <div class="bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-3 mb-4 border-b border-surface-variant/20">
                <div>
                    <h3 class="text-base text-on-surface font-bold">Tactical Vulnerability Assessment Ledger[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)</h3>
                    <p class="text-xs text-on-surface-variant">Filter findings by severity and inspect remediation steps[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)</p>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    <button onclick="filterLedgerByStatus('ALL', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container-high text-primary-container font-bold cursor-pointer">ALL (<span id="lf-all">0</span>)</button>
                    <button onclick="filterLedgerByStatus('CRITICAL', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-error-container/60 text-on-error font-bold cursor-pointer">CRITICAL (<span id="lf-crit">0</span>)</button>
                    <button onclick="filterLedgerByStatus('MISSING', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">MISSING/WARN (<span id="lf-high">0</span>)</button>
                    <button onclick="filterLedgerByStatus('NOTICE', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">NOTICE (<span id="lf-med">0</span>)</button>
                    <button onclick="filterLedgerByStatus('SECURE', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SECURE (<span id="lf-low">0</span>)</button>
                </div>
            </div>
            <div class="space-y-3" id="ledger-items-container">
                <div class="p-8 text-center text-on-surface-variant font-mono text-xs bg-surface-container rounded-lg">
                    [LEDGER EMPTY] Run a target scan to populate vulnerability cards and remediation guidance.
                </div>
            </div>
        </div>
    </div>`;
}
function getPostureTab() {
    return `
    <div id="view-posture" class="view-section hidden flex flex-col gap-6">
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-6 bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                    <div>
                        <h3 class="text-base text-on-surface font-bold">Attack Surface &amp; Posture Gauge</h3>
                        <p class="text-xs text-on-surface-variant">Calculated Defensive Posture Index from live HTTP &amp; source checks</p>
                    </div>
                    <span class="font-mono text-[10px] text-secondary bg-surface-container px-2 py-1 rounded">EVAL: ON-DEMAND</span>
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                    <div class="relative w-40 h-40 flex items-center justify-center shrink-0">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle class="text-surface-container-high" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="8"></circle>
                            <circle id="posture-gauge-circle" class="text-primary-container transition-all duration-700" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round" stroke-width="8"></circle>
                        </svg>
                        <div class="absolute flex flex-col items-center justify-center text-center">
                            <span id="posture-gauge-score" class="text-3xl font-bold font-mono text-on-surface">--</span>
                            <span id="posture-gauge-grade" class="font-mono text-[10px] text-secondary font-semibold uppercase tracking-wider">STANDBY</span>
                        </div>
                    </div>

                    <div class="flex-1 w-full space-y-3 font-mono text-xs">
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-error font-semibold">Critical (<span id="dist-crit-count">0</span>)</span>
                                <span id="dist-crit-pct" class="text-on-surface">0%</span>
                            </div>
                            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                <div id="dist-crit-bar" class="bg-error h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-amber-400 font-semibold">Missing / Warn (<span id="dist-high-count">0</span>)</span>
                                <span id="dist-high-pct" class="text-on-surface">0%</span>
                            </div>
                            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                <div id="dist-high-bar" class="bg-amber-400 h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-secondary font-semibold">Notice (<span id="dist-med-count">0</span>)</span>
                                <span id="dist-med-pct" class="text-on-surface">0%</span>
                            </div>
                            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                <div id="dist-med-bar" class="bg-secondary h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-primary-container font-semibold">Secure (<span id="dist-low-count">0</span>)</span>
                                <span id="dist-low-pct" class="text-on-surface">0%</span>
                            </div>
                            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                <div id="dist-low-bar" class="bg-primary-container h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-surface-container rounded mt-auto flex items-center justify-between font-mono text-xs">
                    <span class="text-on-surface-variant">Recommendation:</span>
                    <span id="posture-recommendation" class="text-secondary font-semibold">Run a target scan first.</span>
                </div>
            </div>

            <div class="xl:col-span-6 bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                    <div>
                        <h3 class="text-base text-on-surface font-bold">Live Recon Activity Feed</h3>
                        <p class="text-xs text-on-surface-variant">Real-time audit events from your current session</p>
                    </div>
                    <span class="font-mono text-[10px] text-primary-container bg-surface-container px-2 py-0.5 rounded flex items-center gap-1">
                        <span class="h-1.5 w-1.5 rounded-full bg-primary-container animate-pulse"></span> LIVE FEED
                    </span>
                </div>
                <div class="space-y-2.5 overflow-y-auto max-h-72 pr-1 font-mono text-xs" id="activity-timeline-feed">
                    <div class="p-6 text-center text-on-surface-variant">
                        No scan events recorded yet in this session.
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function getTopologyTab() {
    return `
    <div id="view-topology" class="view-section hidden flex flex-col gap-6">
        <div class="bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20 flex flex-col gap-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-surface-variant/30">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="material-symbols-outlined text-secondary text-xl">hub</span>
                        <h3 class="text-base text-on-surface font-bold">Interactive Network Topology HUD</h3>
                        <span id="hud-ping-badge" class="font-mono text-[10px] text-primary-container bg-surface-container px-2 py-0.5 rounded border border-surface-variant/40">STANDBY</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Click any node in the topology map to inspect live target telemetry.</p>
                </div>
                <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded border border-surface-variant/30 font-mono text-xs">
                    <button onclick="zoomTopology(0.15)" class="text-on-surface-variant hover:text-secondary p-1 cursor-pointer" type="button"><span class="material-symbols-outlined text-sm">zoom_in</span></button>
                    <span id="hud-zoom-label" class="text-on-surface-variant px-1">100%</span>
                    <button onclick="zoomTopology(-0.15)" class="text-on-surface-variant hover:text-secondary p-1 cursor-pointer" type="button"><span class="material-symbols-outlined text-sm">zoom_out</span></button>
                    <button onclick="zoomTopology(0)" class="text-on-surface-variant hover:text-secondary p-1 cursor-pointer" type="button"><span class="material-symbols-outlined text-sm">center_focus_strong</span></button>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div class="xl:col-span-8 bg-surface-container-lowest rounded-xl p-4 relative overflow-hidden border border-surface-variant/30 flex items-center justify-center min-h-[340px]">
                    <svg id="topology-svg-canvas" class="w-full h-[340px] select-none transition-transform duration-300" fill="none" viewBox="0 0 800 340">
                        <path d="M140 170 L380 85" stroke="#00d9ff" stroke-dasharray="4 4" stroke-width="2"></path>
                        <path d="M140 170 L380 255" stroke="#39ff88" stroke-width="2.5"></path>
                        <path d="M380 85 L640 170" stroke="#aeecff" stroke-dasharray="3 3" stroke-width="1.5"></path>
                        <path d="M380 255 L640 170" stroke="#39ff88" stroke-width="2.5"></path>

                        <g class="cursor-pointer" onclick="inspectTopologyNode('probe')" transform="translate(140, 170)">
                            <circle fill="#181b23" r="28" stroke="#39ff88" stroke-width="2.5"></circle>
                            <text fill="#39ff88" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4">TRISCOUT</text>
                            <text fill="#e0e2ed" font-family="Inter" font-size="11" text-anchor="middle" y="44">Recon Probe</text>
                        </g>

                        <g class="cursor-pointer" onclick="inspectTopologyNode('dns')" transform="translate(380, 85)">
                            <circle fill="#181b23" r="25" stroke="#00d9ff" stroke-width="2"></circle>
                            <text fill="#00d9ff" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4">DNS-DOH</text>
                            <text fill="#e0e2ed" font-family="Inter" font-size="11" text-anchor="middle" y="40">Google DNS</text>
                        </g>

                        <g class="cursor-pointer" onclick="inspectTopologyNode('shield')" transform="translate(380, 255)">
                            <circle fill="#181b23" r="25" stroke="#39ff88" stroke-width="2"></circle>
                            <text fill="#39ff88" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4">HEADERS</text>
                            <text fill="#e0e2ed" font-family="Inter" font-size="11" text-anchor="middle" y="40">Policy Audit</text>
                        </g>

                        <g class="cursor-pointer" onclick="inspectTopologyNode('target')" transform="translate(640, 170)">
                            <circle fill="#181b23" r="30" stroke="#aeecff" stroke-width="2.5"></circle>
                            <text fill="#aeecff" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4" id="svg-target-score">IDLE</text>
                            <text fill="#e0e2ed" font-family="Inter" font-size="11" font-weight="bold" text-anchor="middle" y="46" id="svg-target-host">No Target</text>
                            <text fill="#849584" font-family="JetBrains Mono" font-size="9.5" text-anchor="middle" y="60" id="svg-target-ip">IP: --</text>
                        </g>
                    </svg>
                </div>

                <div class="xl:col-span-4 bg-surface-container rounded-xl p-4 border border-surface-variant/40 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between pb-2 border-b border-surface-variant/30 mb-3 font-mono text-xs">
                            <span class="text-on-surface font-bold uppercase">NODE INSPECTOR</span>
                            <span id="hud-inspector-badge" class="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-bold">IDLE</span>
                        </div>
                        <div class="bg-surface-container-high p-3 rounded-lg mb-3 border border-secondary/30">
                            <div class="font-mono text-[10px] text-secondary uppercase font-semibold mb-1" id="insp-node-title">SELECTED NODE</div>
                            <div class="font-mono text-sm text-on-surface font-bold truncate" id="insp-node-host">Awaiting Target Scan</div>
                        </div>
                        <div class="space-y-2 mb-4 font-mono text-xs">
                            <div class="flex justify-between py-1 border-b border-surface-variant/20">
                                <span class="text-on-surface-variant">Resolved IP:</span>
                                <span id="insp-ip" class="text-secondary font-semibold">--</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-surface-variant/20">
                                <span class="text-on-surface-variant">HSTS Policy:</span>
                                <span id="insp-hsts" class="text-on-surface font-semibold">--</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-surface-variant/20">
                                <span class="text-on-surface-variant">CSP Header:</span>
                                <span id="insp-csp" class="text-on-surface font-semibold">--</span>
                            </div>
                            <div class="flex justify-between py-1">
                                <span class="text-on-surface-variant">Posture Score:</span>
                                <span id="insp-score" class="text-primary-container font-bold">-- / 100</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="switchView(null, 'recon')" class="w-full py-2 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-secondary font-mono text-xs uppercase font-bold transition-colors cursor-pointer" type="button">
                        Go To Recon Launcher
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}
function getHistoryTab() {
    return `
    <div id="view-history" class="view-section hidden flex flex-col gap-6">
        <div class="bg-surface-container-low p-6 rounded-xl shadow-lg border border-surface-variant/20">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20">
                <div>
                    <h3 class="text-base text-on-surface font-bold">Session Scan History</h3>
                    <p class="text-xs text-on-surface-variant">Locally cached assessment records from your browser session</p>
                </div>
                <button onclick="clearScanHistory()" class="px-3 py-1 rounded bg-error-container/40 text-error font-mono text-xs hover:bg-error-container/70 cursor-pointer">
                    Clear History
                </button>
            </div>
            <div class="space-y-2 font-mono text-xs" id="scan-history-list">
                <div class="p-6 text-center text-on-surface-variant">No scan history recorded yet.</div>
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

        <!-- Quick Export Bar -->
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
                <button onclick="exportScanReport('pdf')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">Print / PDF</button>
                <button onclick="exportScanReport('json')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">Export JSON</button>
                <button onclick="exportScanReport('csv')" class="flex-1 md:flex-initial px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high uppercase font-semibold cursor-pointer">Export CSV</button>
                <a href="/reports" class="flex-1 md:flex-initial px-4 py-2 rounded bg-primary-container text-on-primary uppercase font-bold text-center">Email Report</a>
            </div>
        </section>

        <!-- Live Activity Terminal Console -->
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
                <input class="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant focus:outline-none" id="terminal-input" placeholder="Type command ('scan example.com', 'help', 'status')..." type="text"/>
                <button class="px-3 py-1 rounded bg-surface-container text-secondary uppercase font-semibold cursor-pointer" type="submit">Run</button>
            </form>
        </section>

        <!-- New Scan Modal -->
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md hidden p-4" id="launch-modal">
            <div class="bg-surface-container-low p-6 rounded-xl shadow-2xl max-w-lg w-full border border-surface-variant/40 font-mono text-xs">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-surface-variant/20 text-on-surface font-bold text-sm">
                    <span>ROE Authorization &amp; Target Launch</span>
                    <button onclick="document.getElementById('launch-modal').classList.add('hidden')" class="cursor-pointer"><span class="material-symbols-outlined text-base">close</span></button>
                </div>
                <div class="space-y-3 mb-5 text-on-surface-variant">
                    <p>Enter the target domain or URL you are authorized to evaluate:</p>
                    <input id="modal-target-input" type="text" class="w-full p-3 bg-surface-container rounded text-secondary font-bold border border-surface-variant/40 focus:outline-none focus:border-primary-container text-sm" placeholder="https://example.com" />
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
            div.innerHTML = '<span class="text-cyan-400">[' + new Date().toLocaleTimeString() + ']</span> <span class="font-bold text-emerald-400">' + type + '</span> ' + String(msg).replace(/</g, "&lt;");
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
            div.className = "flex items-start gap-2.5 p-2.5 rounded bg-surface-container font-mono text-xs";
            div.innerHTML = \`<div class="mt-1 h-2 w-2 rounded-full \${color} shrink-0"></div><div class="flex-1"><div class="flex justify-between font-bold text-on-surface"><span>\${title}</span><span class="text-on-surface-variant text-[10px]">\${new Date().toLocaleTimeString()}</span></div><p class="text-on-surface-variant text-[11px] truncate">\${detail}</p></div>\`;
            feed.prepend(div);
        }

        async function resolveDNS(domain) {
            try {
                const clean = domain.replace(/^https?:\\/\\//, '').split('/')[0].split(':')[0];
                const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(clean) + '&type=A');
                const data = await res.json();
                if (data && data.Answer && data.Answer.length > 0) {
                    return { ip: data.Answer[0].data, host: clean };
                }
            } catch(e){}
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

                data.report.split('\\n').forEach(l => { if (l.trim()) appendTerm('[RESULT]', l); });
                appendTerm('[SUCCESS]', 'Scan complete in ' + latency + 'ms. Score: ' + score + '/100');
                pushActivity('Scan Complete (' + score + '/100)', 'Evaluated ' + checks.length + ' controls on ' + dns.host, 'bg-primary-container');

                renderAllViews(currentScanData);
                document.getElementById('recon-live-summary').innerHTML = '<div class="text-emerald-400 font-bold">Scan Successful! Target Score: ' + score + '/100</div><div class="text-on-surface-variant mt-1">Evaluated ' + checks.length + ' controls. Check Ledger &amp; Assets tabs for details.</div>';
            } catch(e) {
                appendTerm('[ERROR]', 'Failed to reach scanner API endpoint.');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-base">radar</span> Start Scan';
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

            // Telemetry table
            const tbody = document.getElementById('recon-telemetry-tbody');
            document.getElementById('telemetry-scope-badge').innerText = checks.length + ' Controls Evaluated';
            tbody.innerHTML = checks.map(c => \`
                <tr class="hover:bg-surface-container-high transition-colors">
                    <td class="py-3 px-3 font-bold text-secondary">\${c.name}</td>
                    <td class="py-3 px-3 text-on-surface-variant">\${c.category}</td>
                    <td class="py-3 px-3 text-on-surface">\${c.detail}</td>
                    <td class="py-3 px-3">\${c.impact}</td>
                    <td class="py-3 px-3 text-right font-bold \${c.status === 'SECURE' ? 'text-primary-container' : 'text-error'}">\${c.status}</td>
                </tr>
            \`).join('');

            // Ledger
            document.getElementById('lf-all').innerText = checks.length;
            document.getElementById('lf-crit').innerText = crit;
            document.getElementById('lf-high').innerText = high;
            document.getElementById('lf-med').innerText = med;
            document.getElementById('lf-low').innerText = low;
            
            const lContainer = document.getElementById('ledger-items-container');
            lContainer.innerHTML = checks.map(c => \`
                <div class="p-4 rounded-lg bg-surface-container border border-surface-variant/30" data-status="\${c.status}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm text-on-surface">\${c.name}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold \${c.status === 'SECURE' ? 'bg-primary-container text-on-primary' : 'bg-error text-background'}">\${c.status}</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">\${c.detail}</p>
                </div>
            \`).join('');

            // Posture
            const offset = 251.2 - (251.2 * (scan.score / 100));
            document.getElementById('posture-gauge-circle').style.strokeDashoffset = offset;
            document.getElementById('posture-gauge-score').innerText = scan.score;
            document.getElementById('posture-gauge-grade').innerText = scan.score >= 85 ? 'GRADE A+' : 'GRADE B';

            // Topology HUD
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
            } catch(e){}
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
                listEl.innerHTML = list.map(i => \`<div class="flex justify-between items-center p-3 rounded bg-surface-container"><span>\${i.target} (\${i.ip})</span><span class="text-primary-container font-bold">\${i.score}/100</span></div>\`).join('');
            } catch(e){}
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
                const blob = new Blob([rows.map(r => r.join(',')).join('\\n')], { type: 'text/csv' });
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
