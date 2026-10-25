// ==========================================
// ফাইল: web_dashboard/views/ui.js (Part 1 of 5)
// TriScout v2.4 TAC-OPS - Responsive Shell & Navigation
// ==========================================

function generateLayout(pageTitle, content) {
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
        @layer base { html, body { margin: 0; padding: 0; } body { overscroll-behavior: none; } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0b0e15; }
        ::-webkit-scrollbar-thumb { background: #272a32; border-radius: 4px; }
        #mobileSidebar { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
    <script src="https://cdn.tailwindcss.com"></script>
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "tertiary-container": "#ffd6d7", "background": "#10131b", "surface-variant": "#32353d",
                        "surface-container-lowest": "#0b0e15", "primary": "#f5fff2", "error": "#ffb4ab",
                        "tertiary-fixed": "#ffdada", "surface": "#10131b", "on-error": "#690005",
                        "error-container": "#93000a", "on-tertiary-fixed": "#40000c", "surface-bright": "#363941",
                        "on-primary-fixed-variant": "#005225", "surface-container-high": "#272a32",
                        "on-background": "#e0e2ed", "surface-container": "#1d2027", "secondary-fixed-dim": "#00d9ff",
                        "on-tertiary-fixed-variant": "#920027", "surface-dim": "#10131b", "surface-container-low": "#181b23",
                        "tertiary-fixed-dim": "#ffb3b5", "on-tertiary-container": "#c3113a", "on-secondary": "#003641",
                        "primary-fixed-dim": "#00e473", "secondary-fixed": "#aeecff", "on-tertiary": "#680019",
                        "inverse-primary": "#006d34", "on-secondary-container": "#005b6c", "secondary-container": "#00d9ff",
                        "on-secondary-fixed": "#001f26", "inverse-on-surface": "#2d3038", "on-primary-container": "#007236",
                        "primary-fixed": "#63ff95", "primary-container": "#39ff88", "inverse-surface": "#e0e2ed",
                        "on-primary": "#003918", "on-surface-variant": "#bacbb9", "secondary": "#aeecff",
                        "on-secondary-fixed-variant": "#004e5d", "on-primary-fixed": "#00210b", "on-surface": "#e0e2ed",
                        "surface-container-highest": "#32353d", "on-error-container": "#ffdad6",
                        "outline-variant": "#3b4a3d", "surface-tint": "#00e473", "tertiary": "#fffbff", "outline": "#849584"
                    },
                    borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
                    spacing: {
                        "space-lg": "1rem", "space-xs": "0.25rem", "gutter": "1rem", "margin-md": "1.5rem",
                        "space-md": "0.75rem", "margin": "1rem", "gutter-lg": "1.5rem", "space-xl": "1.5rem",
                        "space-sm": "0.5rem", "margin-lg": "2rem", "space-2xl": "2.5rem"
                    },
                    fontFamily: {
                        "headline-md": ["Inter"], "body-lg": ["Inter"], "headline-sm": ["Inter"],
                        "label-md": ["JetBrains Mono"], "mono-stream": ["JetBrains Mono"], "body-md": ["Inter"],
                        "label-sm": ["JetBrains Mono"], "body-sm": ["Inter"], "label-lg": ["JetBrains Mono"],
                        "headline-lg": ["Inter"], "headline-xl": ["Inter"]
                    },
                    fontSize: {
                        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-sm": ["16px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.03em", "fontWeight": "500" }],
                        "mono-stream": ["13px", { "lineHeight": "18px", "fontWeight": "400" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-sm": ["10px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "500" }],
                        "body-sm": ["12px", { "lineHeight": "18px", "fontWeight": "400" }],
                        "label-lg": ["14px", { "lineHeight": "20px", "fontWeight": "600" }],
                        "headline-lg": ["28px", { "lineHeight": "36px", "fontWeight": "600" }],
                        "headline-xl": ["36px", { "lineHeight": "44px", "fontWeight": "700" }]
                    }
                }
            }
        };
    </script>
</head>
<body class="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary">

    <!-- Mobile Backdrop Overlay -->
    <div id="sidebarOverlay" onclick="toggleMobileSidebar()" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 hidden lg:hidden"></div>

    <!-- Responsive Tactical Sidebar (Mobile Drawer + Desktop Fixed) -->
    <aside id="mobileSidebar" class="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between select-none shadow-[2px_0_16px_rgba(0,0,0,0.6)] transform -translate-x-full lg:translate-x-0">
        <div class="flex flex-col flex-1 min-h-0">
            <div class="h-16 px-space-md flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-variant/20">
                <div class="flex items-center gap-space-sm">
                    <span class="flex h-2 w-2 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
                    </span>
                    <span class="font-label-md text-label-md tracking-wider text-on-surface uppercase">OP-CONSOLE // ACTIVE</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-label-sm text-label-sm text-secondary px-space-xs py-0.5 bg-surface-container rounded">NODE.01</span>
                    <button onclick="toggleMobileSidebar()" class="lg:hidden text-on-surface-variant hover:text-on-surface p-1">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>

            <div class="px-space-md py-space-sm">
                <div class="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
                    <span>TACTICAL WORKSPACES</span>
                    <span class="text-secondary">10 MODULES</span>
                </div>
            </div>

            <!-- Dynamic Sidebar Navigation -->
            <nav class="flex-1 px-space-sm overflow-y-auto space-y-0.5" id="sidebar-nav">
                <a href="/dashboard#overview" onclick="handleSidebarNav(event, 'overview')" data-nav="overview" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded transition-all group font-label-md text-label-md bg-surface-container-high text-on-surface border-l-2 border-primary-container shadow-[inset_0_0_12px_rgba(57,255,136,0.1)]">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base text-primary-container">grid_view</span><span>Overview</span></div>
                    <span class="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">ALT+1</span>
                </a>
                <a href="/dashboard#recon" onclick="handleSidebarNav(event, 'recon')" data-nav="recon" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">radar</span><span>Reconnaissance</span></div>
                    <span class="font-label-sm text-label-sm text-secondary px-1.5 py-0.5 rounded bg-surface-container">LIVE</span>
                </a>
                <a href="/dashboard#discovery" onclick="handleSidebarNav(event, 'discovery')" data-nav="discovery" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">hub</span><span>Asset Discovery</span></div>
                    <span id="nav-badge-assets" class="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">0</span>
                </a>
                <a href="/dashboard#ledger" onclick="handleSidebarNav(event, 'ledger')" data-nav="ledger" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">bug_report</span><span>Vulnerability Assessment</span></div>
                    <span id="nav-badge-vulns" class="font-label-sm text-label-sm text-error px-1.5 py-0.5 rounded bg-error-container/30">0</span>
                </a>
                <a href="/dashboard#posture" onclick="handleSidebarNav(event, 'posture')" data-nav="posture" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">donut_large</span><span>Web Security & Posture</span></div>
                    <span class="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">DAST</span>
                </a>
                <a href="/dashboard#topology" onclick="handleSidebarNav(event, 'topology')" data-nav="topology" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">lan</span><span>Network Topology HUD</span></div>
                    <span class="font-label-sm text-label-sm text-primary-container px-1.5 py-0.5 rounded bg-surface-container font-semibold">HUD</span>
                </a>
                <a href="/dashboard#history" onclick="handleSidebarNav(event, 'history')" data-nav="history" class="sidebar-link flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">history</span><span>Scan History</span></div>
                    <span id="nav-badge-history" class="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">0</span>
                </a>
                <a href="/reports" class="flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">description</span><span>Security Reports</span></div>
                    <span class="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">MAIL/PDF</span>
                </a>
                <a href="/cli" class="flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">terminal</span><span>CLI & Integrations</span></div>
                    <span class="font-label-sm text-label-sm text-primary-container px-1.5 py-0.5 rounded bg-surface-container">NPM</span>
                </a>
                <a href="/project" class="flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">work</span><span>My Projects</span></div>
                </a>
                <a href="/about" class="flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">info</span><span>About System</span></div>
                </a>
                <a href="/profile" class="flex items-center justify-between px-space-sm py-2 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all group font-label-md text-label-md">
                    <div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-base group-hover:text-primary-container">settings</span><span>Account Settings</span></div>
                </a>
            </nav>
        </div>

        <!-- Sidebar Bottom Active Target Scope Box -->
        <div class="p-space-md bg-surface-container-lowest/90 border-t border-surface-variant/20">
            <div class="p-space-sm rounded bg-surface-container border border-surface-variant/40">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm text-primary-container">lock</span>
                        <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">ACTIVE TARGET SCOPE</span>
                    </div>
                    <span class="font-label-sm text-label-sm text-primary-container bg-surface-container-high px-1 py-0.5 rounded">AUTH-OK</span>
                </div>
                <div id="sidebar-active-target" class="font-mono-stream text-mono-stream text-secondary font-medium truncate mb-1">No Active Target (Idle)</div>
                <div class="flex items-center justify-between pt-1 border-t border-surface-variant/30 text-on-surface-variant">
                    <span id="sidebar-defcon-status" class="font-label-sm text-label-sm text-primary-container font-semibold">STANDBY</span>
                    <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="font-label-sm text-label-sm text-error hover:underline flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">logout</span> LOGOUT
                    </button>
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Content Wrapper (Responsive Padding) -->
    <div class="lg:pl-72">
        <!-- Top Header Bar -->
        <header class="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/85 backdrop-blur-xl z-30 flex items-center justify-between px-gutter lg:px-gutter-lg border-b border-surface-variant/20">
            <div class="flex items-center gap-space-sm sm:gap-space-md">
                <!-- Mobile Hamburger Button -->
                <button onclick="toggleMobileSidebar()" aria-label="Open menu" class="lg:hidden p-2 -ml-1 rounded text-on-surface hover:bg-surface-container-high">
                    <span class="material-symbols-outlined text-2xl">menu</span>
                </button>
                <div class="flex items-center gap-space-sm">
                    <img alt="TriScout Vector Logo" class="h-8 w-8 object-contain" src="/logo.svg"/>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-space-xs">
                            <span class="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">TriScout</span>
                            <span class="font-label-sm text-label-sm bg-surface-container px-space-xs py-0.5 text-secondary border border-surface-variant rounded uppercase font-semibold">v2.4 TAC-OPS</span>
                        </div>
                        <span class="hidden xl:block font-label-sm text-label-sm text-on-surface-variant tracking-wider">Scout Smart. Test Secure. Defend Strong.</span>
                    </div>
                </div>
                <div class="hidden md:flex items-center gap-2 pl-space-md py-1 border-l border-surface-variant">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
                    </span>
                    <span id="header-system-status" class="font-label-sm text-label-sm text-primary-container font-medium tracking-wide uppercase">SYSTEM READY / ON-DEMAND MODE</span>
                </div>
            </div>
              <div class="flex items-center gap-space-sm sm:gap-space-md">
                <!-- Quick Search / Filter Input -->
                <div class="relative hidden md:block w-56 xl:w-72">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
                    <input id="global-search-input" oninput="filterFindingsGlobal(this.value)" class="w-full h-9 pl-9 pr-3 rounded bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-label-sm text-label-sm border border-surface-variant/40 focus:outline-none focus:border-secondary transition-all" placeholder="Filter findings, headers, ports..." type="text"/>
                </div>
                <button onclick="triggerQuickNewScan()" class="flex items-center gap-1.5 px-space-sm py-1.5 rounded bg-primary-container text-on-primary font-label-md text-label-md tracking-wider uppercase font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_12px_rgba(57,255,136,0.35)]" type="button">
                    <span class="material-symbols-outlined text-sm font-bold">add_circle</span>
                    <span class="hidden sm:inline">New Scan</span>
                </button>
                <a href="/profile" class="flex items-center gap-space-sm pl-space-sm py-1 border-l border-surface-variant hover:opacity-90">
                    <div id="navProfileAvatar" class="w-8 h-8 rounded-full bg-surface-container-high text-primary-container flex items-center justify-center font-bold ring-1 ring-surface-variant overflow-hidden">
                        <span class="material-symbols-outlined text-base">person</span>
                    </div>
                    <div class="hidden xl:flex flex-col text-left">
                        <span id="navProfileName" class="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">Operator</span>
                        <span class="font-label-sm text-label-sm text-primary-container leading-tight">Authorized SecOps</span>
                    </div>
                </a>
            </div>
        </header>

        <!-- Main Workspace Body -->
        <main class="relative pt-16 min-h-screen bg-surface bg-[radial-gradient(#1d2027_1px,transparent_1px)] [background-size:20px_20px]">
            <div class="w-full px-gutter lg:px-gutter-lg py-margin-md">
            
            </div>
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

        function triggerQuickNewScan() {
            if (window.location.pathname !== '/dashboard') {
                window.location.href = '/dashboard#recon';
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

// ==========================================
// ফাইল: web_dashboard/views/ui.js (Part 2 of 5)
// Dashboard Core: Briefing, Zero-Preload Metrics, Tab 1 (Recon) & Tab 2 (Posture)
// ==========================================

function getDashboardPage() {
    const content = `
<div class="flex flex-col w-full">

    <!-- TOP OPERATIONAL BRIEFING -->
    <section class="flex flex-col gap-space-lg mb-margin-lg" id="section-overview">
        <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md bg-surface-container-low p-space-lg sm:p-space-xl rounded-xl shadow-xl relative overflow-hidden border border-surface-variant/20">
            <div class="absolute -right-24 -top-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute right-1/3 -bottom-20 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex flex-col z-10 max-w-3xl">
                <div class="flex flex-wrap items-center gap-space-sm mb-space-xs">
                    <span class="px-space-sm py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary-container tracking-wider uppercase font-semibold">
                        DEFENSIVE RECON CONSOLE
                    </span>
                    <span id="mission-status-badge" class="px-space-sm py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-secondary tracking-wide">
                        STATE: ON-DEMAND STANDBY
                    </span>
                </div>
                <h1 class="font-headline-lg sm:font-headline-xl text-headline-lg sm:text-headline-xl text-on-surface tracking-tight font-bold mb-space-xs">
                    Welcome to TriScout
                </h1>
                <p class="font-body-md sm:font-body-lg text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl">
                    Your unified workspace for authorized security reconnaissance and tactical vulnerability assessment. No pre-generated reports are stored—enter a target scope to launch live telemetry.
                </p>
                
                <div class="flex flex-wrap items-center gap-space-sm mt-space-md">
                    <div class="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
                        <span id="scope-dot" class="h-2 w-2 rounded-full bg-secondary"></span>
                        <span class="text-on-surface-variant">Active Scope:</span>
                        <span id="briefing-scope-text" class="text-on-surface font-medium">Awaiting Target Input</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
                        <span class="material-symbols-outlined text-xs text-secondary">memory</span>
                        <span class="text-on-surface-variant">Engine:</span>
                        <span class="text-secondary font-medium">Tri-Recon Core v2.4</span>
                    </div>
                    <div class="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
                        <span class="material-symbols-outlined text-xs text-primary-container">security</span>
                        <span class="text-on-surface-variant">Mode:</span>
                        <span class="text-primary-container font-medium">Passive / Ethical Guardrail</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap sm:flex-nowrap items-center gap-space-md z-10 w-full xl:w-auto mt-space-md xl:mt-0">
                <button class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-space-lg py-3 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg tracking-wider uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_24px_rgba(57,255,136,0.3)] cursor-pointer" id="open-launch-modal" type="button">
                    <span class="material-symbols-outlined text-xl">radar</span>
                    <span>Start Assessment</span>
                </button>
                <button class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-space-lg py-3 rounded-lg bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg tracking-wider uppercase font-semibold transition-all shadow-md cursor-pointer" onclick="document.getElementById('reports-section').scrollIntoView({behavior:'smooth'})" type="button">
                    <span class="material-symbols-outlined text-xl text-secondary">description</span>
                    <span>Export Center</span>
                </button>
            </div>
        </div>

        <!-- METRIC CARDS (4 TACTICAL GRIDS - ZERO PRELOAD UNTIL SCAN) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            
            <!-- Card 1: Evaluated Controls & Endpoints -->
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 transition-all relative overflow-hidden group">
                <div class="flex items-center justify-between mb-space-sm">
                    <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Controls & DNS Nodes</span>
                    <span id="metric-assets-tag" class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-semibold">Idle</span>
                </div>
                <div class="flex items-baseline justify-between mb-space-sm">
                    <span id="metric-assets-count" class="font-headline-xl text-headline-xl text-on-surface font-bold">0</span>
                    <span class="material-symbols-outlined text-secondary text-2xl group-hover:scale-110 transition-transform">hub</span>
                </div>
                <div class="h-6 w-full text-secondary mb-space-xs">
                    <svg class="w-full h-full" fill="none" viewBox="0 0 120 24">
                        <path d="M0 20 L20 20 L40 16 L60 18 L80 10 L100 12 L120 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                </div>
                <div class="grid grid-cols-3 gap-1 pt-2 font-label-sm text-label-sm text-on-surface-variant border-t border-surface-variant/20">
                    <div><span id="sub-count-headers" class="text-on-surface font-semibold">0</span> Headers</div>
                    <div><span id="sub-count-dns" class="text-on-surface font-semibold">0</span> DNS IP</div>
                    <div><span id="sub-count-leaks" class="text-on-surface font-semibold">0</span> Probes</div>
                </div>
            </div>

            <!-- Card 2: Open Vulnerabilities / Missing Controls -->
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 transition-all relative overflow-hidden group">
                <div class="flex items-center justify-between mb-space-sm">
                    <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Detected Issues</span>
                    <span id="metric-vuln-tag" class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-semibold">No Scan</span>
                </div>
                <div class="flex items-baseline justify-between mb-space-sm">
                    <span id="metric-vuln-total" class="font-headline-xl text-headline-xl text-on-surface font-bold">0</span>
                    <span class="material-symbols-outlined text-error text-2xl group-hover:scale-110 transition-transform">bug_report</span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-variant/20 mt-4">
                    <span class="px-2 py-0.5 bg-error-container text-on-error font-label-sm text-label-sm rounded font-bold"><span id="pill-crit">0</span> Crit</span>
                    <span class="px-2 py-0.5 bg-surface-container-high text-error font-label-sm text-label-sm rounded"><span id="pill-high">0</span> Missing</span>
                    <span class="px-2 py-0.5 bg-surface-container text-secondary font-label-sm text-label-sm rounded"><span id="pill-med">0</span> Notice</span>
                    <span class="px-2 py-0.5 bg-surface-container text-primary-container font-label-sm text-label-sm rounded"><span id="pill-low">0</span> Secure</span>
                </div>
            </div>

            <!-- Card 3: Critical Findings -->
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 transition-all relative overflow-hidden group">
                <div class="flex items-center justify-between mb-space-sm">
                    <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Critical Findings</span>
                    <div class="flex items-center gap-1">
                        <span id="crit-ping-dot" class="h-2 w-2 rounded-full bg-outline"></span>
                        <span id="crit-status-label" class="font-label-sm text-label-sm text-on-surface-variant font-bold">0 EXPOSED</span>
                    </div>
                </div>
                <div class="flex items-baseline justify-between mb-space-sm">
                    <span id="metric-crit-big" class="font-headline-xl text-headline-xl text-on-surface font-bold">00</span>
                    <span class="material-symbols-outlined text-error text-2xl">priority_high</span>
                </div>
                <div class="space-y-1 pt-1" id="crit-mini-list">
                    <div class="flex items-center justify-between font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded">
                        <span class="text-on-surface-variant">Source Leak Check</span>
                        <span class="text-secondary font-mono-stream">STANDBY</span>
                    </div>
                    <div class="flex items-center justify-between font-label-sm text-label-sm bg-surface-container px-2 py-1 rounded">
                        <span class="text-on-surface-variant">API Key Exposure</span>
                        <span class="text-secondary font-mono-stream">STANDBY</span>
                    </div>
                </div>
            </div>

            <!-- Card 4: Security Posture Score -->
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 transition-all relative overflow-hidden group">
                <div class="flex items-center justify-between mb-space-sm">
                    <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target Posture Score</span>
                    <div class="flex items-center gap-1.5">
                        <span id="scan-state-badge" class="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-mono-stream font-semibold">READY</span>
                    </div>
                </div>
                <div class="flex items-baseline justify-between mb-space-sm">
                    <span id="metric-score-big" class="font-headline-xl text-headline-xl text-on-surface font-bold">--%</span>
                    <span class="material-symbols-outlined text-primary-container text-2xl group-hover:scale-110 transition-transform">task_alt</span>
                </div>
                <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden my-2">
                    <div id="metric-score-bar" class="bg-primary-container h-full rounded-full transition-all duration-700" style="width: 0%;"></div>
                </div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                    <span id="scans-executed-count">0 scans in session</span>
                    <span id="scan-latency-text">Latency: -- ms</span>
                </div>
            </div>
        </div>
    </section>

    <!-- OPERATIONAL TABS NAVIGATION (Responsive Scrollable on Mobile) -->
    <div class="bg-surface-container-low rounded-xl shadow-md p-space-xs mb-space-lg flex overflow-x-auto gap-space-xs border border-surface-variant/20">
        <button class="tab-button active shrink-0 flex items-center gap-2 px-space-md py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-all bg-surface-container-high text-primary-container shadow-sm cursor-pointer" data-tab-target="recon">
            <span class="material-symbols-outlined text-sm">satellite_alt</span>
            <span>1. Recon &amp; Target Scope</span>
        </button>
        <button class="tab-button shrink-0 flex items-center gap-2 px-space-md py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" data-tab-target="posture">
            <span class="material-symbols-outlined text-sm">donut_large</span>
            <span>2. Posture &amp; Distribution</span>
        </button>
        <button class="tab-button shrink-0 flex items-center gap-2 px-space-md py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" data-tab-target="ledger">
            <span class="material-symbols-outlined text-sm">security</span>
            <span>3. Vulnerability Ledger</span>
            <span id="tab-badge-ledger" class="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm ml-1 font-bold">0</span>
        </button>
        <button class="tab-button shrink-0 flex items-center gap-2 px-space-md py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" data-tab-target="topology">
            <span class="material-symbols-outlined text-sm">polyline</span>
            <span>4. Network Topology HUD</span>
            <span class="h-2 w-2 rounded-full bg-primary-container animate-pulse"></span>
        </button>
        <button class="tab-button shrink-0 flex items-center gap-2 px-space-md py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" data-tab-target="history">
            <span class="material-symbols-outlined text-sm">history</span>
            <span>5. Scan History</span>
        </button>
    </div>

    <!-- WORKSPACE TAB PANELS -->
    <div class="flex flex-col gap-space-lg">

        <!-- TAB 1: RECONNAISSANCE WORKSPACE & SCOPE (Default Active for On-Demand Scanning) -->
        <div class="tab-pane flex flex-col gap-space-lg" id="tab-pane-recon">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
                
                <!-- Target Scope Configurator Box -->
                <div class="xl:col-span-4 bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 flex flex-col justify-between">
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-secondary">tune</span>
                                <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Active Scope Config</h3>
                            </div>
                            <span class="font-label-sm text-label-sm text-primary-container bg-surface-container px-2 py-0.5 rounded">ETHICAL-ROE</span>
                        </div>

                        <label class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 block">Authorized Target Domain / URL</label>
                        <div class="flex rounded bg-surface-container p-1 mb-space-md border border-surface-variant/40 focus-within:border-secondary">
                            <span class="px-2 py-1.5 font-label-sm text-label-sm text-secondary bg-surface-container-high rounded mr-1">TARGET</span>
                            <input class="w-full bg-transparent px-2 font-mono-stream text-mono-stream text-on-surface focus:outline-none" id="target-domain-input" placeholder="e.g. example.com" type="text"/>
                            <button onclick="pasteTargetClipboard()" class="px-2 text-on-surface-variant hover:text-secondary" title="Paste from clipboard" type="button">
                                <span class="material-symbols-outlined text-sm">content_paste</span>
                            </button>
                        </div>

                        <label class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2 block">On-Demand Tactical Modules</label>
                        <div class="space-y-2 mb-space-md">
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-dns" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">Public DNS &amp; IP Resolution</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-secondary font-mono-stream">DoH Free</span>
                            </label>
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-headers" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">HTTP Defensive Header Audit</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-primary-container font-mono-stream">HSTS/CSP</span>
                            </label>
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-leaks" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">Source &amp; API Secret Leak Check</span>
                                </div>
                                 <span class="font-label-sm text-label-sm text-secondary font-mono-stream">DoH Free</span>
                            </label>
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-headers" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">HTTP Defensive Header Audit</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-primary-container font-mono-stream">HSTS/CSP</span>
                            </label>
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-leaks" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">Source &amp; API Secret Leak Check</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-on-surface-variant font-mono-stream">Regex v2</span>
                            </label>
                            <label class="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors">
                                <div class="flex items-center gap-2">
                                    <input checked id="mod-tech" class="accent-primary-container rounded" type="checkbox"/>
                                    <span class="font-label-md text-label-md text-on-surface">Server &amp; Tech Stack Fingerprint</span>
                                </div>
                                <span class="font-label-sm text-label-sm text-on-surface-variant font-mono-stream">Passive</span>
                            </label>
                        </div>

                        <div class="p-space-sm bg-surface-container rounded mb-space-md border border-surface-variant/30">
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input checked class="mt-0.5 accent-primary-container" id="compliance-check" type="checkbox"/>
                                <span class="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                                    I verify explicit authorization to test this target. <strong class="text-on-surface">Passive Ethical Mode</strong> enforced.
                                </span>
                            </label>
                        </div>
                    </div>

                    <button class="w-full flex items-center justify-center gap-2 py-3 rounded bg-primary-container text-on-primary font-label-md text-label-md tracking-wider uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_16px_rgba(57,255,136,0.3)] cursor-pointer" id="dispatch-recon-btn" type="button">
                        <span class="material-symbols-outlined text-base">rocket_launch</span>
                        <span>Dispatch Active Recon Sweep</span>
                    </button>
                </div>

                <!-- Discovered Hosts & Services Telemetry Table -->
                <div class="xl:col-span-8 bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
                    <div class="flex flex-wrap items-center justify-between gap-2 pb-space-sm mb-space-md border-b border-surface-variant/20">
                        <div>
                            <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Live Target Telemetry &amp; Control Matrix</h3>
                            <p class="font-body-sm text-body-sm text-on-surface-variant">Real-time results populated on demand when you initiate a scan</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="telemetry-scope-badge" class="font-label-sm text-label-sm text-secondary px-2 py-1 bg-surface-container rounded">0 Controls Evaluated</span>
                        </div>
                    </div>

                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-left font-mono-stream text-mono-stream">
                            <thead>
                                <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                                    <th class="py-2.5 px-3 rounded-l">Control / Check</th>
                                    <th class="py-2.5 px-3">Category</th>
                                    <th class="py-2.5 px-3">Telemetry Detail</th>
                                    <th class="py-2.5 px-3">Impact</th>
                                    <th class="py-2.5 px-3 rounded-r text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="text-on-surface divide-y divide-surface-variant/20" id="recon-telemetry-tbody">
                                <tr>
                                    <td colspan="5" class="py-12 text-center text-on-surface-variant font-mono-stream">
                                        [IDLE] No pre-loaded report. Enter a target domain on the left and click "Dispatch Active Recon Sweep".
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>

        <!-- TAB 2: POSTURE & DISTRIBUTION -->
        <div class="tab-pane hidden flex flex-col gap-space-lg" id="tab-pane-posture">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
                
                <!-- Posture Gauge & Severity Distribution -->
                <div class="xl:col-span-6 bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
                    <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                        <div>
                            <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Attack Surface &amp; Posture Gauge</h3>
                            <p class="font-body-sm text-body-sm text-on-surface-variant">Calculated Defensive Posture Index from live HTTP &amp; source checks</p>
                        </div>
                        <span class="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-1 rounded">EVAL: ON-DEMAND</span>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-around gap-space-lg my-space-md">
                        <!-- Dynamic SVG Circular Gauge -->
                        <div class="relative w-44 h-44 flex items-center justify-center shrink-0">
                            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle class="text-surface-container-high" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-width="8"></circle>
                                <circle id="posture-gauge-circle" class="text-primary-container transition-all duration-700" cx="50" cy="50" fill="none" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round" stroke-width="8"></circle>
                            </svg>
                            <div class="absolute flex flex-col items-center justify-center text-center">
                                <span id="posture-gauge-score" class="font-headline-xl text-headline-xl font-bold text-on-surface">--</span>
                                <span id="posture-gauge-grade" class="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">STANDBY</span>
                            </div>
                        </div>

                        <!-- Severity Bar Breakdown -->
                        <div class="flex-1 w-full space-y-space-sm">
                            <div>
                                <div class="flex justify-between font-label-sm text-label-sm mb-1">
                                    <span class="text-error font-semibold">Critical (<span id="dist-crit-count">0</span>)</span>
                                    <span id="dist-crit-pct" class="text-on-surface font-mono-stream">0%</span>
                                </div>
                                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                    <div id="dist-crit-bar" class="bg-error h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between font-label-sm text-label-sm mb-1">
                                    <span class="text-amber-400 font-semibold">Missing / Warning (<span id="dist-high-count">0</span>)</span>
                                    <span id="dist-high-pct" class="text-on-surface font-mono-stream">0%</span>
                                </div>
                                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                    <div id="dist-high-bar" class="bg-amber-400 h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between font-label-sm text-label-sm mb-1">
                                    <span class="text-secondary font-semibold">Notice (<span id="dist-med-count">0</span>)</span>
                                    <span id="dist-med-pct" class="text-on-surface font-mono-stream">0%</span>
                                </div>
                                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                    <div id="dist-med-bar" class="bg-secondary h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between font-label-sm text-label-sm mb-1">
                                    <span class="text-primary-container font-semibold">Secure / Passed (<span id="dist-low-count">0</span>)</span>
                                    <span id="dist-low-pct" class="text-on-surface font-mono-stream">0%</span>
                                </div>
                                <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                    <div id="dist-low-bar" class="bg-primary-container h-full rounded-full transition-all duration-500" style="width: 0%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-space-sm bg-surface-container rounded mt-auto flex items-center justify-between font-label-sm text-label-sm">
                        <span class="text-on-surface-variant">Recommendation:</span>
                        <span id="posture-recommendation" class="text-secondary font-semibold">Run a target assessment to generate remediation advice.</span>
                    </div>
                </div>
                 <!-- Recent Scan Activity Timeline Feed -->
                <div class="xl:col-span-6 bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 flex flex-col">
                    <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                        <div>
                            <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Live Recon Activity Feed</h3>
                            <p class="font-body-sm text-body-sm text-on-surface-variant">Real-time audit events from your current session</p>
                        </div>
                        <span class="font-label-sm text-label-sm text-primary-container bg-surface-container px-2 py-0.5 rounded flex items-center gap-1">
                            <span class="h-1.5 w-1.5 rounded-full bg-primary-container animate-pulse"></span> LIVE FEED
                        </span>
                    </div>
                    <div class="space-y-space-sm overflow-y-auto max-h-80 pr-1 font-mono-stream text-mono-stream" id="activity-timeline-feed">
                        <div class="p-space-md text-center text-on-surface-variant">
                            No scan events recorded yet in this session.
                        </div>
                    </div>
                </div>

            </div>
        </div>
        
        <!-- TAB 3: VULNERABILITY ASSESSMENT LEDGER -->
        <div class="tab-pane hidden flex flex-col gap-space-md" id="tab-pane-ledger">
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20">
                <div class="flex flex-wrap items-center justify-between gap-space-md pb-space-sm mb-space-md border-b border-surface-variant/20">
                    <div>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Tactical Vulnerability &amp; Missing Control Ledger</h3>
                        <p class="font-body-sm text-body-sm text-on-surface-variant">Click any filter button below to isolate findings by severity</p>
                    </div>
                    <!-- Interactive Filter Tags -->
                    <div class="flex flex-wrap items-center gap-1.5" id="ledger-filter-bar">
                        <button onclick="filterLedgerByStatus('ALL', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container-high text-primary-container font-label-sm text-label-sm font-semibold cursor-pointer">ALL (<span id="lf-all">0</span>)</button>
                        <button onclick="filterLedgerByStatus('CRITICAL', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-error-container/60 text-on-error font-label-sm text-label-sm font-bold cursor-pointer">CRITICAL (<span id="lf-crit">0</span>)</button>
                        <button onclick="filterLedgerByStatus('MISSING', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm cursor-pointer">MISSING / WARN (<span id="lf-high">0</span>)</button>
                        <button onclick="filterLedgerByStatus('NOTICE', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm cursor-pointer">NOTICE (<span id="lf-med">0</span>)</button>
                        <button onclick="filterLedgerByStatus('SECURE', this)" class="ledger-filter-btn px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm cursor-pointer">SECURE (<span id="lf-low">0</span>)</button>
                    </div>
                </div>

                <!-- Dynamic Ledger Items Container -->
                <div class="space-y-space-sm" id="ledger-items-container">
                    <div class="p-space-xl text-center text-on-surface-variant font-mono-stream bg-surface-container rounded-lg">
                        [LEDGER EMPTY] Run a target scan to populate vulnerability cards and remediation guidance.
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 4: NETWORK ANALYSIS & ASSET TOPOLOGY HUD -->
        <div class="tab-pane hidden flex flex-col gap-space-lg" id="tab-pane-topology">
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 relative overflow-hidden flex flex-col gap-space-md">
                
                <!-- HUD Control and Filter Bar -->
                <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md pb-space-sm border-b border-surface-variant/40">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-secondary text-2xl">hub</span>
                            <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Interactive Network Topology HUD</h3>
                            <span id="hud-ping-badge" class="font-label-sm text-label-sm text-primary-container bg-surface-container px-2 py-0.5 rounded border border-surface-variant/40 flex items-center gap-1">
                                <span class="h-1.5 w-1.5 rounded-full bg-primary-container animate-ping"></span> STANDBY
                            </span>
                        </div>
                        <p class="font-body-sm text-body-sm text-on-surface-variant">Live visual mapping of TriScout Scanner Node, Public DNS Resolver, Target Edge Gateway, and HTTP Header Shield.</p>
                    </div>

                    <!-- Zoom Controls -->
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded border border-surface-variant/30">
                            <button onclick="zoomTopology(0.15)" class="text-on-surface-variant hover:text-secondary p-1 rounded cursor-pointer" title="Zoom In" type="button">
                                <span class="material-symbols-outlined text-sm font-bold">zoom_in</span>
                            </button>
                            <span id="hud-zoom-label" class="font-mono-stream text-label-sm text-on-surface-variant px-1">100%</span>
                            <button onclick="zoomTopology(-0.15)" class="text-on-surface-variant hover:text-secondary p-1 rounded cursor-pointer" title="Zoom Out" type="button">
                                <span class="material-symbols-outlined text-sm font-bold">zoom_out</span>
                            </button>
                            <button onclick="zoomTopology(0)" class="text-on-surface-variant hover:text-secondary p-1 rounded ml-1 cursor-pointer" title="Reset Zoom" type="button">
                                <span class="material-symbols-outlined text-sm">center_focus_strong</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Interactive Topology Mainstage (SVG Canvas + Node Inspector Drawer) -->
                <div class="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
                    
                    <!-- SVG Topology Stage -->
                    <div class="xl:col-span-8 bg-surface-container-lowest rounded-xl p-space-md relative overflow-hidden border border-surface-variant/30 flex items-center justify-center min-h-[380px]">
                        <div class="absolute top-3 left-4 font-mono-stream text-label-sm text-secondary/70 uppercase tracking-widest pointer-events-none">[ZONE 01: TRISCOUT PROBE]</div>
                        <div class="absolute top-3 right-4 font-mono-stream text-label-sm text-primary-container/70 uppercase tracking-widest pointer-events-none">[ZONE 02: TARGET PERIMETER]</div>
                        
                        <svg id="topology-svg-canvas" class="w-full h-[380px] select-none transition-transform duration-300" fill="none" viewBox="0 0 800 380">
                            <defs>
                                <pattern height="20" id="hud-grid" patternUnits="userSpaceOnUse" width="20">
                                    <circle cx="2" cy="2" fill="#1d2027" r="1"></circle>
                                </pattern>
                            </defs>
                            <rect fill="url(#hud-grid)" height="100%" width="100%"></rect>

                            <!-- Connection Lines -->
                            <path d="M140 190 L380 100" stroke="#00d9ff" stroke-dasharray="4 4" stroke-width="2"></path>
                            <path d="M140 190 L380 280" stroke="#39ff88" stroke-width="2.5"></path>
                            <path d="M380 100 L640 190" stroke="#aeecff" stroke-dasharray="3 3" stroke-width="1.5"></path>
                            <path d="M380 280 L640 190" id="hud-target-link" stroke="#39ff88" stroke-width="3"></path>

                            <!-- Node 1: TriScout Probe -->
                            <g class="cursor-pointer" onclick="inspectTopologyNode('probe')" transform="translate(140, 190)">
                                <circle class="animate-ping opacity-25" fill="#39ff88" r="32"></circle>
                                <circle fill="#181b23" r="28" stroke="#39ff88" stroke-width="2.5"></circle>
                                <text fill="#39ff88" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4">TRISCOUT</text>
                                <text fill="#e0e2ed" font-family="Inter" font-size="11" font-weight="600" text-anchor="middle" y="45">Passive Recon Node</text>
                            </g>

                            <!-- Node 2: DNS Resolver -->
                            <g class="cursor-pointer" onclick="inspectTopologyNode('dns')" transform="translate(380, 100)">
                                <circle fill="#181b23" r="26" stroke="#00d9ff" stroke-width="2"></circle>
                                <text fill="#00d9ff" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4">DNS-DOH</text>
                                <text fill="#e0e2ed" font-family="Inter" font-size="11" text-anchor="middle" y="42" id="svg-dns-label">Google DoH Resolver</text>
                            </g>

                            <!-- Node 3: HTTP Header Shield -->
                            <g class="cursor-pointer" onclick="inspectTopologyNode('shield')" transform="translate(380, 280)">
                                <circle fill="#181b23" r="26" stroke="#39ff88" stroke-width="2" id="svg-shield-circle"></circle>
                                <text fill="#39ff88" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4" id="svg-shield-code">HEADERS</text>
                                <text fill="#e0e2ed" font-family="Inter" font-size="11" text-anchor="middle" y="42" id="svg-shield-label">Policy Inspector</text>
                            </g>

                            <!-- Node 4: Target Host -->
                            <g class="cursor-pointer" onclick="inspectTopologyNode('target')" transform="translate(640, 190)">
                                <circle fill="#181b23" r="32" stroke="#aeecff" stroke-width="2.5" id="svg-target-circle"></circle>
                                <text fill="#aeecff" font-family="JetBrains Mono" font-size="10" font-weight="bold" text-anchor="middle" y="4" id="svg-target-score">STANDBY</text>
                                <text fill="#e0e2ed" font-family="Inter" font-size="11" font-weight="bold" text-anchor="middle" y="48" id="svg-target-host">No Target Scanned</text>
                                <text fill="#849584" font-family="JetBrains Mono" font-size="9.5" text-anchor="middle" y="62" id="svg-target-ip">IP: --</text>
                            </g>
                        </svg>
                    </div>

                    <!-- Node Inspector Side Panel -->
                    <div class="xl:col-span-4 bg-surface-container rounded-xl p-space-md border border-surface-variant/40 flex flex-col justify-between shadow-xl">
                        <div>
                            <div class="flex items-center justify-between pb-space-xs border-b border-surface-variant/30 mb-space-sm">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-secondary">radar</span>
                                    <span class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">NODE TELEMETRY INSPECTOR</span>
                                </div>
                                <span id="hud-inspector-badge" class="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm font-bold">IDLE</span>
                            </div>

                            <div class="bg-surface-container-high p-space-sm rounded-lg mb-space-sm border border-secondary/30">
                                <div class="font-label-sm text-label-sm text-secondary uppercase font-semibold mb-1" id="insp-node-title">Click any node in the graph</div>
                                <div class="font-mono-stream text-body-md text-on-surface font-bold truncate" id="insp-node-host">Awaiting Target Selection</div>
                            </div>

                            <div class="space-y-space-xs mb-space-md font-mono-stream text-mono-stream">
                                <div class="flex justify-between items-center py-1.5 border-b border-surface-variant/20 text-body-sm">
                                    <span class="text-on-surface-variant">Resolved IPv4:</span>
                                    <span id="insp-ip" class="text-secondary font-semibold">--</span>
                                </div>
                                <div class="flex justify-between items-center py-1.5 border-b border-surface-variant/20 text-body-sm">
                                    <span class="text-on-surface-variant">HSTS Enforcement:</span>
                                    <span id="insp-hsts" class="text-on-surface font-semibold">--</span>
                                </div>
                                <div class="flex justify-between items-center py-1.5 border-b border-surface-variant/20 text-body-sm">
                                    <span class="text-on-surface-variant">CSP Policy:</span>
                                    <span id="insp-csp" class="text-on-surface font-semibold">--</span>
                                </div>
                                <div class="flex justify-between items-center py-1.5 text-body-sm">
                                    <span class="text-on-surface-variant">Posture Score:</span>
                                    <span id="insp-score" class="text-primary-container font-bold">-- / 100</span>
                                </div>
                            </div>
                        </div>

                        <button onclick="switchTab('recon')" class="w-full py-2 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-secondary font-label-md text-label-md uppercase font-bold transition-colors cursor-pointer" type="button">
                            Configure &amp; Re-Scan Target
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <!-- TAB 5: SCAN HISTORY (Session & LocalStorage Log) -->
        <div class="tab-pane hidden flex flex-col gap-space-md" id="tab-pane-history">
            <div class="bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20">
                <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                    <div>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Session Scan History</h3>
                        <p class="font-body-sm text-body-sm text-on-surface-variant">Locally cached assessment records from your browser session</p>
                    </div>
                    <button onclick="clearScanHistory()" class="px-3 py-1 rounded bg-error-container/40 text-error font-label-sm text-label-sm hover:bg-error-container/70 cursor-pointer">
                        Clear History
                    </button>
                </div>
                <div class="space-y-2 font-mono-stream text-mono-stream" id="scan-history-list">
                    <div class="p-space-md text-center text-on-surface-variant">No scan history recorded yet.</div>
                </div>
            </div>
        </div>

    </div>

    <!-- REPORTS QUICK EXPORT BAR (100% Working Client-Side PDF/Print, JSON, CSV) -->
    <section class="mt-space-lg bg-surface-container-low p-space-lg rounded-xl shadow-lg border border-surface-variant/20 flex flex-col md:flex-row items-center justify-between gap-space-md" id="reports-section">
        <div class="flex items-center gap-space-md">
            <div class="p-3 rounded-lg bg-surface-container text-secondary">
                <span class="material-symbols-outlined text-2xl">file_download</span>
            </div>
            <div>
                <h4 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Security Reports Quick Export</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Download validated findings locally or dispatch via Gmail without external paid APIs</p>
            </div>
        </div>
        <div class="flex flex-wrap items-center gap-space-sm w-full md:w-auto">
            <button onclick="exportScanReport('pdf')" class="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-space-md py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm uppercase font-semibold cursor-pointer" type="button">
                <span class="material-symbols-outlined text-base text-error">picture_as_pdf</span>
                <span>Print / PDF</span>
            </button>
            <button onclick="exportScanReport('json')" class="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-space-md py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm uppercase font-semibold cursor-pointer" type="button">
                <span class="material-symbols-outlined text-base text-secondary">data_object</span>
                <span>Export JSON</span>
            </button>
            <button onclick="exportScanReport('csv')" class="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-space-md py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm uppercase font-semibold cursor-pointer" type="button">
                <span class="material-symbols-outlined text-base text-primary-container">table_chart</span>
                <span>Export CSV</span>
            </button>
            <a href="/reports" class="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-space-md py-2 rounded bg-primary-container text-on-primary hover:bg-primary-fixed transition-colors font-label-sm text-label-sm uppercase font-bold">
                <span class="material-symbols-outlined text-base">mail</span>
                <span>Email Report</span>
            </a>
        </div>
    </section>

    <!-- TERMINAL-INSPIRED ACTIVITY CONSOLE (CLEAN ON STARTUP) -->
    <section class="mt-space-lg bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden border border-surface-variant/30">
        <div class="bg-surface-container-low px-space-md py-2.5 flex items-center justify-between border-b border-surface-variant/20">
            <div class="flex items-center gap-space-sm">
                <div class="flex items-center gap-1.5">
                    <span class="h-3 w-3 rounded-full bg-error inline-block"></span>
                    <span class="h-3 w-3 rounded-full bg-surface-bright inline-block"></span>
                    <span class="h-3 w-3 rounded-full bg-primary-container inline-block"></span>
                </div>
                <span class="font-label-sm text-label-sm text-on-surface-variant font-mono-stream ml-2">triscout-core@terminal-node-01: ~</span>
                <span id="term-stream-badge" class="px-2 py-0.2 rounded bg-surface-container font-label-sm text-label-sm text-primary-container">IDLE / READY</span>
            </div>
             <div class="flex items-center gap-2">
                <button class="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" id="copy-term-btn" title="Copy Log Buffer" type="button">
                    <span class="material-symbols-outlined text-base">content_copy</span>
                </button>
                <button class="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" id="clear-term-btn" title="Clear Buffer" type="button">
                    <span class="material-symbols-outlined text-base">delete</span>
                </button>
                <button class="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer" id="toggle-term-btn" title="Collapse/Expand" type="button">
                    <span class="material-symbols-outlined text-base">expand_less</span>
                </button>
            </div>
        </div>

        <div class="p-space-md font-mono-stream text-mono-stream space-y-1 overflow-y-auto max-h-60 bg-surface-container-lowest" id="terminal-body">
            <div><span class="text-on-surface-variant">[SYSTEM]</span> <span class="text-primary-container font-bold">[READY]</span> TriScout v2.4 On-Demand Engine initialized. Zero pre-generated reports loaded.</div>
            <div><span class="text-on-surface-variant">[SYSTEM]</span> <span class="text-secondary font-bold">[HELP]</span> Type <span class="text-on-surface font-semibold">scan &lt;domain.com&gt;</span>, <span class="text-on-surface font-semibold">help</span>, <span class="text-on-surface font-semibold">export json</span>, or <span class="text-on-surface font-semibold">clear</span> below.</div>
            <div id="terminal-append-point"></div>
        </div>

        <form class="bg-surface-container-low px-space-md py-2 flex items-center gap-2 border-t border-surface-variant/20" id="terminal-form">
            <span class="text-primary-container font-mono-stream text-mono-stream font-bold">&gt;</span>
            <input class="w-full bg-transparent font-mono-stream text-mono-stream text-on-surface placeholder:text-on-surface-variant focus:outline-none" id="terminal-input" placeholder="Type command ('scan example.com', 'help', 'status', 'export json', 'clear')..." type="text"/>
            <button class="px-space-md py-1 rounded bg-surface-container text-secondary font-label-sm text-label-sm uppercase font-semibold hover:bg-surface-container-high transition-colors cursor-pointer" type="submit">
                Run
            </button>
        </form>
    </section>

    <!-- ROE AUTHORIZATION TRIGGER MODAL (START ASSESSMENT) -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md hidden p-gutter" id="launch-modal">
        <div class="bg-surface-container-low p-space-xl rounded-xl shadow-2xl max-w-lg w-full relative border border-surface-variant/40">
            <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary-container text-2xl">gavel</span>
                    <h3 class="font-headline-md text-headline-md text-on-surface font-bold">ROE Authorization &amp; Target Launch</h3>
                </div>
                <button class="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer" id="close-modal-btn" type="button">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>
            <div class="space-y-space-md mb-space-lg font-body-md text-body-md text-on-surface-variant">
                <p>Enter the target domain you are authorized to evaluate:</p>
                <input id="modal-target-input" type="text" class="w-full p-space-sm bg-surface-container rounded font-mono-stream text-mono-stream text-secondary font-bold border border-surface-variant/40 focus:outline-none focus:border-primary-container" placeholder="https://example.com" />
                <div class="space-y-2 pt-2">
                    <div class="flex items-center gap-2 text-on-surface font-label-md text-label-md">
                        <span class="material-symbols-outlined text-primary-container text-base">check_circle</span>
                        <span>Passive Non-Intrusive Header &amp; Leak Evaluation</span>
                    </div>
                    <div class="flex items-center gap-2 text-on-surface font-label-md text-label-md">
                        <span class="material-symbols-outlined text-primary-container text-base">check_circle</span>
                        <span>Operator Identity: <span id="modal-operator-name" class="text-secondary">Authorized Operator</span></span>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end gap-space-sm">
                <button class="px-space-md py-2 rounded bg-surface-container text-on-surface font-label-md text-label-md uppercase font-semibold hover:bg-surface-container-high transition-colors cursor-pointer" id="cancel-modal-btn" type="button">
                    Cancel
                </button>
                <button class="flex items-center gap-2 px-space-lg py-2 rounded bg-primary-container text-on-primary font-label-md text-label-md tracking-wider uppercase font-bold hover:bg-primary-fixed transition-all shadow-[0_0_16px_rgba(57,255,136,0.4)] cursor-pointer" id="confirm-launch-btn" type="button">
                    <span class="material-symbols-outlined text-base">play_arrow</span>
                    <span>Engage Scan</span>
                </button>
            </div>
        </div>
    </div>

</div>

<script>
    // Global State (Zero pre-loaded dummy reports)
    let currentScanData = null;
    let currentZoom = 1;
    let sessionScanCount = 0;

    // 1. Tab & Sidebar Navigation Controller
    function switchTab(targetId) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab-target') === targetId) {
                btn.classList.add('active', 'bg-surface-container-high', 'text-primary-container', 'shadow-sm');
                btn.classList.remove('text-on-surface-variant');
            } else {
                btn.classList.remove('active', 'bg-surface-container-high', 'text-primary-container', 'shadow-sm');
                btn.classList.add('text-on-surface-variant');
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === 'tab-pane-' + targetId) {
                pane.classList.remove('hidden');
            } else {
                pane.classList.add('hidden');
            }
        });
    }

    function handleSidebarNav(e, navType) {
        if (window.location.pathname === '/dashboard') {
            if (e) e.preventDefault();
            // Highlight active sidebar item
            document.querySelectorAll('.sidebar-link').forEach(link => {
                link.classList.remove('bg-surface-container-high', 'text-on-surface', 'border-l-2', 'border-primary-container', 'shadow-[inset_0_0_12px_rgba(57,255,136,0.1)]');
                link.classList.add('text-on-surface-variant');
            });
            const clicked = document.querySelector('[data-nav="' + navType + '"]');
            if (clicked) {
                clicked.classList.add('bg-surface-container-high', 'text-on-surface', 'border-l-2', 'border-primary-container', 'shadow-[inset_0_0_12px_rgba(57,255,136,0.1)]');
                clicked.classList.remove('text-on-surface-variant');
            }

            // Route to proper tab or section
            if (navType === 'overview') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (navType === 'recon' || navType === 'discovery') {
                switchTab('recon');
                document.getElementById('tab-pane-recon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (navType === 'ledger') {
                switchTab('ledger');
                document.getElementById('tab-pane-ledger')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (navType === 'posture') {
                switchTab('posture');
                document.getElementById('tab-pane-posture')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (navType === 'topology') {
                switchTab('topology');
                document.getElementById('tab-pane-topology')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (navType === 'history') {
                switchTab('history');
                document.getElementById('tab-pane-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Close mobile drawer if open
            const sb = document.getElementById('mobileSidebar');
            const ov = document.getElementById('sidebarOverlay');
            if (sb && !sb.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
                sb.classList.add('-translate-x-full');
                ov?.classList.add('hidden');
            }
        }
    }

    // Bind Tab Buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab-target')));
    });

    // 2. Terminal Logger & Timeline Feed Helper
    function appendTerminalLog(type, message) {
        const terminalBody = document.getElementById('terminal-body');
        const appendPoint = document.getElementById('terminal-append-point');
        if (!terminalBody || !appendPoint) return;

        const time = new Date().toTimeString().split(' ')[0];
        const logDiv = document.createElement('div');
        let colorClass = 'text-primary-container';
        if (type === '[ALERT]' || type === '[VULN]' || type === '[ERROR]') colorClass = 'text-error';
        else if (type === '[RECON]' || type === '[DNS]') colorClass = 'text-secondary';

        const safeMsg = String(message).replace(/</g, "&lt;").replace(/>/g, "&gt;");
        logDiv.innerHTML = '<span class="text-on-surface-variant">[' + time + ']</span> <span class="' + colorClass + ' font-bold">' + type + '</span> ' + safeMsg;
        terminalBody.insertBefore(logDiv, appendPoint);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function pushActivityEvent(title, detail, badgeColor) {
        const feed = document.getElementById('activity-timeline-feed');
        if (!feed) return;
        if (feed.innerText.includes('No scan events recorded')) feed.innerHTML = '';

        const time = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.className = "flex items-start gap-space-sm p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors";
        div.innerHTML = \`
            <div class="mt-1.5 h-2 w-2 rounded-full \${badgeColor} shrink-0"></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <span class="text-on-surface font-semibold text-body-sm">\${title}</span>
                    <span class="text-on-surface-variant text-label-sm">\${time}</span>
                </div>
                <p class="text-body-sm text-on-surface-variant truncate">\${detail}</p>
            </div>
        \`;
        feed.prepend(div);
    }

    // 3. Free Public DNS-over-HTTPS Lookup (No API Key Needed)
    async function resolvePublicDNS(domain) {
        try {
            const cleanHost = domain.replace(/^https?:\\/\\//, '').split('/')[0].split(':')[0];
            const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(cleanHost) + '&type=A');
            const data = await res.json();
            if (data && data.Answer && data.Answer.length > 0) {
                const aRecord = data.Answer.find(a => a.type === 1) || data.Answer[0];
                return { ip: aRecord.data, ttl: aRecord.TTL, host: cleanHost };
            }
        } catch (e) {}
        return { ip: 'Resolved via Backend', ttl: 300, host: domain };
    }

    // 4. Core On-Demand Scan Executor
    async function executeTargetAssessment(rawTarget) {
        const target = (rawTarget || document.getElementById('target-domain-input')?.value || '').trim();
        if (!target) {
            alert('Please enter a valid target domain or URL first!');
            return;
        }

        const compliance = document.getElementById('compliance-check');
        if (compliance && !compliance.checked) {
            alert('You must verify ROE ethical authorization before scanning.');
            return;
        }

        const dispatchBtn = document.getElementById('dispatch-recon-btn');
        if (dispatchBtn) {
            dispatchBtn.disabled = true;
            dispatchBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span><span>Scanning Target Scope...</span>';
        }

        // Update Status Badges
        document.getElementById('mission-status-badge').innerText = 'STATE: ACTIVE PROBING';
        document.getElementById('briefing-scope-text').innerText = target;
        document.getElementById('sidebar-active-target').innerText = target;
        document.getElementById('scan-state-badge').innerText = 'SCANNING...';
        document.getElementById('term-stream-badge').innerText = 'PROBING ACTIVE';

        const startTime = performance.now();
        appendTerminalLog('[RECON]', 'Initiating on-demand passive assessment for target: ' + target);
        pushActivityEvent('Assessment Dispatched', 'Target scope locked: ' + target, 'bg-secondary');

        // Step A: Free DNS Resolution
        const dnsInfo = await resolvePublicDNS(target);
        appendTerminalLog('[DNS]', 'Resolved host ' + dnsInfo.host + ' -> ' + dnsInfo.ip + ' (TTL: ' + dnsInfo.ttl + 's)');

        // Step B: Call TriScout Backend Scanner API
        try {
            const response = await fetch('/api/scan-headers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ target: target })
            });

            const data = await response.json();
            const latency = Math.round(performance.now() - startTime);

            if (!data.success) {
                appendTerminalLog('[ERROR]', data.error || 'Target scan failed.');
                pushActivityEvent('Scan Failed', data.error || 'Unreachable target', 'bg-error');
                document.getElementById('scan-state-badge').innerText = 'FAILED';
                return;
            }

            sessionScanCount++;
            const score = typeof data.score === 'number' ? data.score : 50;
            const checks = Array.isArray(data.checks) ? data.checks : [];

            currentScanData = {
                target: target,
                host: dnsInfo.host,
                ip: dnsInfo.ip,
                score: score,
                checks: checks,
                report: data.report,
                latency: latency,
                timestamp: new Date().toLocaleString()
            };

            // Save for /reports page & history
            localStorage.setItem('triscout_target', target);
            localStorage.setItem('triscout_report', data.report);
            saveToScanHistory(currentScanData);

            // Stream lines to terminal
            data.report.split('\\n').forEach(line => {
                if (line.trim()) {
                    if (line.startsWith('[+]')) appendTerminalLog('[PASS]', line);
                    else if (line.startsWith('[!]')) appendTerminalLog('[VULN]', line);
                    else if (line.startsWith('[-]')) appendTerminalLog('[INFO]', line);
                }
            });

            appendTerminalLog('[READY]', 'Assessment complete in ' + latency + 'ms. Overall Score: ' + score + '/100.');
            pushActivityEvent('Assessment Complete (' + score + '/100)', 'Evaluated ' + checks.length + ' controls on ' + dnsInfo.host, 'bg-primary-container');

            // Populate all 4 Tabs & Top Cards dynamically
            renderAllDashboardViews(currentScanData);

        } catch (err) {
            appendTerminalLog('[ERROR]', 'Network error communicating with scanner engine.');
        } finally {
            if (dispatchBtn) {
                dispatchBtn.disabled = false;
                dispatchBtn.innerHTML = '<span class="material-symbols-outlined text-base">rocket_launch</span><span>Dispatch Active Recon Sweep</span>';
            }
            document.getElementById('term-stream-badge').innerText = 'STREAM IDLE';
        }
    }

    // 5. Render All Metrics, Tables, Posture Gauge, Ledger & Topology HUD
    function renderAllDashboardViews(scan) {
        const checks = scan.checks || [];
        const critList = checks.filter(c => c.status === 'CRITICAL');
        const highList = checks.filter(c => c.status === 'MISSING' || c.status === 'WARNING');
        const medList  = checks.filter(c => c.status === 'NOTICE');
        const lowList  = checks.filter(c => c.status === 'SECURE');
        const openIssues = critList.length + highList.length;

        // Top Metric Cards
        document.getElementById('metric-assets-count').innerText = checks.length + 1;
        document.getElementById('metric-assets-tag').innerText = scan.ip;
        document.getElementById('sub-count-headers').innerText = checks.length;
        document.getElementById('sub-count-dns').innerText = '1';
        document.getElementById('sub-count-leaks').innerText = '2';

        document.getElementById('metric-vuln-total').innerText = openIssues;
        document.getElementById('metric-vuln-tag').innerText = openIssues > 0 ? 'Action Req' : 'Clean';
        document.getElementById('pill-crit').innerText = critList.length;
        document.getElementById('pill-high').innerText = highList.length;
        document.getElementById('pill-med').innerText = medList.length;
        document.getElementById('pill-low').innerText = lowList.length;

        // Sidebar & Tab Badges
        document.getElementById('nav-badge-assets').innerText = checks.length;
        document.getElementById('nav-badge-vulns').innerText = openIssues;
        document.getElementById('tab-badge-ledger').innerText = checks.length;
        document.getElementById('sidebar-defcon-status').innerText = scan.score >= 80 ? 'DEFCON 5 (SECURE)' : (scan.score >= 50 ? 'DEFCON 3 (WARN)' : 'DEFCON 1 (CRITICAL)');

        // Card 3: Critical Findings
        document.getElementById('metric-crit-big').innerText = String(critList.length).padStart(2, '0');
        document.getElementById('crit-status-label').innerText = critList.length > 0 ? (critList.length + ' CRITICAL LEAKS') : '0 EXPOSED';

        // Card 4: Score
        document.getElementById('metric-score-big').innerText = scan.score + '%';
        document.getElementById('metric-score-bar').style.width = scan.score + '%';
        document.getElementById('scan-state-badge').innerText = 'VERIFIED';
        document.getElementById('scans-executed-count').innerText = sessionScanCount + ' scan(s) in session';
        document.getElementById('scan-latency-text').innerText = 'Latency: ' + scan.latency + ' ms';

        // TAB 1: Telemetry Table
        const tbody = document.getElementById('recon-telemetry-tbody');
        document.getElementById('telemetry-scope-badge').innerText = checks.length + ' Controls Evaluated on ' + scan.host;
        tbody.innerHTML = checks.map(c => {
            let badge = '<span class="px-2 py-0.5 rounded bg-surface-container text-primary-container font-label-sm text-label-sm font-semibold">SECURE</span>';
            if (c.status === 'CRITICAL') badge = '<span class="px-2 py-0.5 rounded bg-error-container text-on-error font-label-sm text-label-sm font-bold">CRITICAL</span>';
            else if (c.status === 'MISSING' || c.status === 'WARNING') badge = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-label-sm text-label-sm font-bold">' + c.status + '</span>';
            else if (c.status === 'NOTICE') badge = '<span class="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm">NOTICE</span>';

            return \`
                <tr class="hover:bg-surface-container-high transition-colors telemetry-row">
                    <td class="py-3 px-3 font-bold text-secondary">\${c.name}</td>
                    <td class="py-3 px-3 text-on-surface-variant">\${c.category}</td>
                    <td class="py-3 px-3 text-on-surface">\${c.detail}</td>
                    <td class="py-3 px-3 font-mono-stream text-on-surface-variant">\${c.impact}</td>
                    <td class="py-3 px-3 text-right">\${badge}</td>
                </tr>
            \`;
        }).join('');

        // TAB 2: Posture Gauge & Severity Bars
        const total = Math.max(checks.length, 1);
        const offset = 251.2 - (251.2 * (scan.score / 100));
        const gaugeCircle = document.getElementById('posture-gauge-circle');
        if (gaugeCircle) gaugeCircle.style.strokeDashoffset = offset;
        document.getElementById('posture-gauge-score').innerText = scan.score;
        document.getElementById('posture-gauge-grade').innerText = scan.score >= 85 ? 'GRADE A+' : (scan.score >= 60 ? 'GRADE B' : 'HIGH RISK');

        const setDist = (prefix, count) => {
            const pct = Math.round((count / total) * 100);
            document.getElementById('dist-' + prefix + '-count').innerText = count;
            document.getElementById('dist-' + prefix + '-pct').innerText = pct + '%';
            document.getElementById('dist-' + prefix + '-bar').style.width = pct + '%';
        };
        setDist('crit', critList.length);
        setDist('high', highList.length);
        setDist('med', medList.length);
        setDist('low', lowList.length);

        document.getElementById('posture-recommendation').innerText = openIssues > 0
            ? ('Harden ' + openIssues + ' missing/vulnerable control(s) in Tab 3 Ledger.')
            : 'All evaluated passive controls passed verification.';

        // TAB 3: Vulnerability Ledger Cards
        document.getElementById('lf-all').innerText = checks.length;
        document.getElementById('lf-crit').innerText = critList.length;
        document.getElementById('lf-high').innerText = highList.length;
        document.getElementById('lf-med').innerText = medList.length;
        document.getElementById('lf-low').innerText = lowList.length;
        renderLedgerCards(checks);

        // TAB 4: Topology HUD Update
        document.getElementById('hud-ping-badge').innerText = 'LATENCY: ' + scan.latency + 'ms';
        document.getElementById('svg-target-score').innerText = scan.score + '/100';
        document.getElementById('svg-target-host').innerText = scan.host;
        document.getElementById('svg-target-ip').innerText = 'IP: ' + scan.ip;
        document.getElementById('insp-node-title').innerText = 'ACTIVE TARGET PERIMETER';
        document.getElementById('insp-node-host').innerText = scan.host;
        document.getElementById('insp-ip').innerText = scan.ip;
        const hstsObj = checks.find(c => c.name.includes('HSTS'));
        const cspObj = checks.find(c => c.name.includes('CSP'));
        document.getElementById('insp-hsts').innerText = hstsObj ? hstsObj.status : 'N/A';
        document.getElementById('insp-csp').innerText = cspObj ? cspObj.status : 'N/A';
        document.getElementById('insp-score').innerText = scan.score + ' / 100';
        document.getElementById('hud-inspector-badge').innerText = 'SYNCED';
    }

    // 6. Ledger Card Renderer & Filter
    function getRemediationAdvice(name) {
        if (name.includes('HSTS')) return 'Add "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload" to your web server / proxy response headers.';
        if (name.includes('CSP')) return 'Define a strict "Content-Security-Policy" header restricting default-src and script-src to trusted origins.';
        if (name.includes('X-Frame')) return 'Set "X-Frame-Options: DENY" or "SAMEORIGIN" to defend against clickjacking attacks.';
        if (name.includes('MIME')) return 'Add "X-Content-Type-Options: nosniff" to prevent browser MIME-type sniffing.';
        if (name.includes('Tech Stack')) return 'Remove or obfuscate "X-Powered-By" (e.g. app.disable("x-powered-by") in Express) and hide version meta tags.';
        if (name.includes('Secrets')) return 'Immediately rotate exposed API keys and move all credentials into server-side environment variables (.env).';
        if (name.includes('Error')) return 'Disable verbose stack traces in production and return generic error messages to clients.';
        return 'Enforce rate limiting at the API gateway or reverse proxy layer (e.g., Cloudflare or express-rate-limit).';
    }

    function renderLedgerCards(checks) {
        const container = document.getElementById('ledger-items-container');
        if (!container) return;
        container.innerHTML = checks.map(c => {
            let pillClass = 'bg-primary-container text-on-primary';
            if (c.status === 'CRITICAL') pillClass = 'bg-error text-background';
            else if (c.status === 'MISSING' || c.status === 'WARNING') pillClass = 'bg-amber-400 text-black';
            else if (c.status === 'NOTICE') pillClass = 'bg-secondary text-on-secondary';

            return \`
                <div class="ledger-card p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-all border border-surface-variant/20" data-status="\${c.status}">
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-2 py-0.5 rounded \${pillClass} font-label-sm text-label-sm font-bold">\${c.status}</span>
                            <span class="font-label-md text-label-md text-secondary font-semibold">[\${c.category}]</span>
                            <span class="font-headline-sm text-headline-sm text-on-surface font-semibold">\${c.name}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-mono-stream">\${c.impact}</span>
                            <button class="p-1 rounded bg-surface-container-highest text-secondary hover:text-on-surface cursor-pointer" onclick="this.closest('.ledger-card').querySelector('.remediation-drawer').classList.toggle('hidden')" type="button">
                                <span class="material-symbols-outlined text-base">expand_more</span>
                            </button>
                        </div>
                    </div>
                    <p class="font-mono-stream text-mono-stream text-on-surface-variant mb-1">\${c.detail}</p>
                    <div class="remediation-drawer hidden pt-space-sm mt-space-sm bg-surface-container-lowest p-space-sm rounded border border-surface-variant/30">
                        <span class="font-label-sm text-label-sm text-primary-container uppercase font-bold block mb-1">Recommended Remediation:</span>
                        <p class="font-body-sm text-body-sm text-on-surface-variant">\${getRemediationAdvice(c.name)}</p>
                    </div>
                </div>
            \`;
        }).join('');
    }

    function filterLedgerByStatus(status, btnEl) {
        document.querySelectorAll('.ledger-filter-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-primary-container');
        });
        if (btnEl) btnEl.classList.add('ring-2', 'ring-primary-container');

        document.querySelectorAll('.ledger-card').forEach(card => {
            const st = card.getAttribute('data-status');
            if (status === 'ALL') card.classList.remove('hidden');
            else if (status === 'MISSING' && (st === 'MISSING' || st === 'WARNING')) card.classList.remove('hidden');
            else if (st === status) card.classList.remove('hidden');
            else card.classList.add('hidden');
        });
    }

    function filterFindingsGlobal(query) {
        const q = (query || '').toLowerCase();
        document.querySelectorAll('.telemetry-row, .ledger-card').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    }

    // 7. Topology HUD Zoom & Node Inspector
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
        if (!title || !host) return;
        if (nodeKey === 'probe') {
            title.innerText = 'ZONE 01 // TRISCOUT PASSIVE ENGINE';
            host.innerText = 'Vercel Serverless Recon Node';
        } else if (nodeKey === 'dns') {
            title.innerText = 'DNS-OVER-HTTPS RESOLVER';
            host.innerText = 'dns.google (Public Free DoH)';
        } else if (nodeKey === 'shield') {
            title.innerText = 'HTTP HEADER & LEAK AUDITOR';
            host.innerText = currentScanData ? (currentScanData.checks.length + ' Active Checks') : 'Standby Policy Inspector';
        } else {
            title.innerText = 'ZONE 02 // TARGET PERIMETER';
            host.innerText = currentScanData ? currentScanData.host : 'No Target Scanned';
        }
    }

    // 8. Scan History Manager (LocalStorage)
    function saveToScanHistory(scan) {
        try {
            const list = JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
            list.unshift({ target: scan.target, ip: scan.ip, score: scan.score, time: scan.timestamp });
            if (list.length > 15) list.pop();
            localStorage.setItem('triscout_scan_history', JSON.stringify(list));
            renderScanHistory();
        } catch (e) {}
    }

    function renderScanHistory() {
        const container = document.getElementById('scan-history-list');
        const badge = document.getElementById('nav-badge-history');
        if (!container) return;
        try {
            const list = JSON.parse(localStorage.getItem('triscout_scan_history') || '[]');
            if (badge) badge.innerText = list.length;
            if (!list.length) {
                container.innerHTML = '<div class="p-space-md text-center text-on-surface-variant">No scan history recorded yet.</div>';
                return;
            }
            container.innerHTML = list.map(item => \`
                <div class="flex items-center justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div>
                        <span class="text-secondary font-bold">\${item.target}</span>
                        <span class="text-on-surface-variant text-label-sm ml-2">(\${item.ip})</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-on-surface-variant text-label-sm">\${item.time}</span>
                        <span class="px-2 py-0.5 rounded bg-surface-container-highest text-primary-container font-bold">Score: \${item.score}/100</span>
                    </div>
                </div>
            \`).join('');
        } catch (e) {}
    }

    function clearScanHistory() {
        localStorage.removeItem('triscout_scan_history');
        renderScanHistory();
    }

    // 9. Client-Side Export Engine (PDF/Print, JSON, CSV - Zero External API)
    function exportScanReport(format) {
        if (!currentScanData) {
            alert('No scan data available! Please run a target scan first.');
            return;
        }
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(currentScanData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'triscout-report-' + currentScanData.host + '.json';
            a.click();
        } else if (format === 'csv') {
            const rows = [['Control', 'Category', 'Status', 'Impact', 'Detail']];
            currentScanData.checks.forEach(c => rows.push([c.name, c.category, c.status, c.impact, '"' + c.detail.replace(/"/g, '""') + '"']));
            const csvContent = rows.map(r => r.join(',')).join('\\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'triscout-findings-' + currentScanData.host + '.csv';
            a.click();
        } else if (format === 'pdf') {
            window.print();
        }
    }

    async function pasteTargetClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const input = document.getElementById('target-domain-input');
            if (input && text) input.value = text.trim();
        } catch (e) {}
    }

    // 10. Modal, Terminal Commands & Button Bindings
    document.addEventListener('DOMContentLoaded', () => {
        renderScanHistory();

        const launchModal = document.getElementById('launch-modal');
        document.getElementById('open-launch-modal')?.addEventListener('click', () => {
            const cur = document.getElementById('target-domain-input')?.value || '';
            const mInput = document.getElementById('modal-target-input');
            if (mInput) mInput.value = cur;
            launchModal?.classList.remove('hidden');
        });
        document.getElementById('close-modal-btn')?.addEventListener('click', () => launchModal?.classList.add('hidden'));
        document.getElementById('cancel-modal-btn')?.addEventListener('click', () => launchModal?.classList.add('hidden'));
        document.getElementById('confirm-launch-btn')?.addEventListener('click', () => {
            const mVal = document.getElementById('modal-target-input')?.value.trim();
            if (mVal) {
                const mainInput = document.getElementById('target-domain-input');
                if (mainInput) mainInput.value = mVal;
            }
            launchModal?.classList.add('hidden');
            switchTab('recon');
            executeTargetAssessment(mVal);
        });

        document.getElementById('dispatch-recon-btn')?.addEventListener('click', () => {
            executeTargetAssessment();
        });

        // Terminal Interactive Commands
        const termForm = document.getElementById('terminal-form');
        const termInput = document.getElementById('terminal-input');
        const termBody = document.getElementById('terminal-body');

        termForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const cmd = (termInput.value || '').trim();
            if (!cmd) return;
            appendTerminalLog('[USER]', '> ' + cmd);
            termInput.value = '';

            const lower = cmd.toLowerCase();
            if (lower === 'help') {
                appendTerminalLog('[INFO]', 'Available commands: scan <domain>, status, export json, export csv, clear');
            } else if (lower.startsWith('scan ')) {
                const t = cmd.slice(5).trim();
                const mainInput = document.getElementById('target-domain-input');
                if (mainInput) mainInput.value = t;
                executeTargetAssessment(t);
            } else if (lower === 'status') {
                appendTerminalLog('[INFO]', currentScanData ? ('Last target: ' + currentScanData.host + ' | Score: ' + currentScanData.score + '/100') : 'Engine idle. No target scanned yet.');
            } else if (lower === 'export json') {
                exportScanReport('json');
            } else if (lower === 'export csv') {
                exportScanReport('csv');
            } else if (lower === 'clear') {
                termBody.innerHTML = '<div id="terminal-append-point"></div>';
            } else {
                appendTerminalLog('[INFO]', 'Unknown command. Type "help" for options.');
            }
        });

        document.getElementById('clear-term-btn')?.addEventListener('click', () => {
            if (termBody) termBody.innerHTML = '<div id="terminal-append-point"></div>';
        });
        document.getElementById('copy-term-btn')?.addEventListener('click', () => {
            if (termBody) navigator.clipboard.writeText(termBody.innerText).then(() => appendTerminalLog('[INFO]', 'Terminal buffer copied.'));
        });
        document.getElementById('toggle-term-btn')?.addEventListener('click', () => {
            termBody?.classList.toggle('hidden');
            termForm?.classList.toggle('hidden');
        });
    });
</script>
`;
    return generateLayout('COMMAND CENTER', content);
        }
// ==========================================
// ফাইল: web_dashboard/views/ui.js (Part 5 of 5)
// Secondary Tactical Pages: Reports, CLI, About, Portfolio Projects & Profile
// ==========================================

// ২. REPORTS পেজ (Gmail Dispatch & Print/Export)

function getReportsPage() {
    const reportContent = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-surface-container-low p-space-xl rounded-xl shadow-xl border border-surface-variant/20">
                <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary-container text-2xl">send</span>
                        <h3 class="font-headline-md text-headline-md text-on-surface font-bold">Dispatch Security Assessment Report</h3>
                    </div>
                    <span class="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-1 rounded">SMTP // GMAIL RELAY</span>
                </div>

                <p class="font-body-md text-body-md text-on-surface-variant mb-space-md">
                    Review your last on-demand target assessment below and dispatch it directly to the authorized system owner or compliance team.
                </p>

                <div id="reportPreview" class="bg-surface-container-lowest text-on-surface p-space-md mb-space-lg font-mono-stream text-mono-stream border border-surface-variant/30 h-72 overflow-y-auto rounded-lg leading-relaxed">
                    Checking local session buffer for recent scan telemetry...
                </div>

                <div class="flex flex-col sm:flex-row gap-space-sm">
                    <input type="email" id="emailInput" class="flex-1 bg-surface-container border border-surface-variant/40 text-on-surface placeholder:text-on-surface-variant rounded-lg px-4 py-3 font-mono-stream text-mono-stream focus:outline-none focus:border-primary-container" placeholder="Enter recipient email address (e.g. security@domain.com)" aria-label="Enter client email address">
                    <button id="reportBtn" onclick="sendReport()" class="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-md text-label-md uppercase font-bold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(57,255,136,0.3)] cursor-pointer">
                        <span class="material-symbols-outlined text-base">mail</span>
                        <span>Dispatch via Gmail</span>
                    </button>
                </div>
            </div>
        </div>

        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const savedReport = localStorage.getItem('triscout_report');
                const savedTarget = localStorage.getItem('triscout_target');
                const preview = document.getElementById('reportPreview');

                if (savedReport && savedTarget) {
                    preview.innerHTML = "<span class='text-secondary font-bold'>TARGET SCOPE: " + savedTarget.replace(/</g, "&lt;") + "</span><br><br>" + savedReport.replace(/</g, "&lt;").replace(/\\n/g, '<br>');
                } else {
                    preview.innerHTML = "<span class='text-error font-bold'>[NO ACTIVE REPORT IN BUFFER]</span><br><span class='text-on-surface-variant'>No pre-generated reports exist. Please go to the Overview / Reconnaissance tab and run a target scan first.</span>";
                }
            });

            async function sendReport() {
                const email = document.getElementById('emailInput').value.trim();
                const target = localStorage.getItem('triscout_target');
                const reportData = localStorage.getItem('triscout_report');
                const btn = document.getElementById('reportBtn');

                if (!email) return alert('Please enter a valid recipient email address!');
                if (!reportData || !target) return alert('No scan report found! Please run a scan on the Dashboard first.');

                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span><span>Dispatching...</span>';

                try {
                    const response = await fetch('/api/send-report', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({ target: target, reportData: reportData, emailTo: email })
                    });
                    const result = await response.json();
                    if (result.success) {
                        alert('SUCCESS: Assessment report securely dispatched to ' + email + '!');
                    } else {
                        alert('DISPATCH FAILED: ' + (result.error || 'Unknown error'));
                    }
                } catch (err) {
                    alert('ERROR communicating with email service.');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-base">mail</span><span>Dispatch via Gmail</span>';
                }
            }
        </script>
    `;
    return generateLayout('SECURITY REPORTS', reportContent);
}

// ৩. CLI & INTEGRATIONS পেজ
function getCliPage() {
    const cliContent = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-surface-container-low p-space-xl rounded-xl shadow-xl border border-surface-variant/20">
                <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary-container text-2xl">terminal</span>
                        <h3 class="font-headline-md text-headline-md text-on-surface font-bold">TriScout CLI &amp; CI/CD Integrations</h3>
                    </div>
                    <span class="font-label-sm text-label-sm text-primary-container bg-surface-container px-2 py-1 rounded">NPM PACKAGE</span>
                </div>

                <p class="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                    Take the power of TriScout directly to your terminal or automated CI/CD pipelines. Perform rapid passive header audits and source leak evaluations from anywhere.
                </p>

                <div class="bg-surface-container-lowest p-space-lg rounded-lg border border-surface-variant/30 font-mono-stream text-mono-stream text-on-surface mb-space-lg leading-relaxed">
                    <span class="text-on-surface-variant"># Install globally via NPM</span><br>
                    <span class="text-primary-container font-bold">$</span> npm install -g @kiran-mondal/triscout<br><br>
                    <span class="text-on-surface-variant"># Execute an on-demand passive scan</span><br>
                    <span class="text-primary-container font-bold">$</span> triscout example.com
                </div>

                <button onclick="window.open('https://github.com/Kiran-mondal/triscout/packages', '_blank')" class="w-full py-3 rounded-lg bg-primary-container hover:bg-primary-fixed text-on-primary font-label-md text-label-md uppercase font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(57,255,136,0.3)] cursor-pointer" type="button">
                    <span class="material-symbols-outlined text-base">open_in_new</span>
                    <span>View Package on GitHub</span>
                </button>
            </div>
        </div>
    `;
    return generateLayout('CLI & INTEGRATIONS', cliContent);
}

// ৪. ABOUT TRISCOUT পেজ
function getAboutPage() {
    const aboutContent = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-surface-container-low p-space-xl rounded-xl shadow-xl border border-surface-variant/20">
                <div class="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-variant/20">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary text-2xl">shield_lock</span>
                        <h3 class="font-headline-md text-headline-md text-on-surface font-bold">TriScout System Architecture</h3>
                    </div>
                    <span class="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-1 rounded">v2.4 TAC-OPS</span>
                </div>

                <p class="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                    TriScout is an advanced defensive cybersecurity reconnaissance framework designed to help developers and security operators perform non-intrusive passive vulnerability assessments without executing destructive payloads.
                </p>

                <div class="overflow-x-auto">
                    <table class="w-full text-left font-mono-stream text-mono-stream">
                        <thead>
                            <tr class="bg-surface-container text-secondary font-label-sm text-label-sm uppercase">
                                <th class="py-3 px-4 rounded-l">System Module</th>
                                <th class="py-3 px-4 rounded-r">Technical Specification</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-surface-variant/20">
                            <tr>
                                <td class="py-3 px-4 text-on-surface-variant font-semibold">Framework Name</td>
                                <td class="py-3 px-4 text-primary-container font-bold">TRISCOUT RECON FRAMEWORK</td>
                            </tr>
                            <tr>
                                <td class="py-3 px-4 text-on-surface-variant font-semibold">Engine Build</td>
                                <td class="py-3 px-4 text-on-surface">v2.4.1 (On-Demand Zero-Preload Architecture)</td>
                            </tr>
                            <tr>
                                <td class="py-3 px-4 text-on-surface-variant font-semibold">Core Stack</td>
                                <td class="py-3 px-4 text-on-surface">Node.js / Express / Axios / Neon Serverless PostgreSQL</td>
                            </tr>
                            <tr>
                                <td class="py-3 px-4 text-on-surface-variant font-semibold">Defensive Capabilities</td>
                                <td class="py-3 px-4 text-on-surface leading-relaxed">
                                    • On-Demand HTTP Security Header Auditing (HSTS, CSP, XFO, MIME)<br>
                                    • Source Code Stack-Trace &amp; API Key Leak Detection<br>
                                    • Free Public DNS-over-HTTPS (DoH) Telemetry Resolution<br>
                                    • SSRF &amp; Internal Network Guardrail Protection<br>
                                    • Client-Side JSON, CSV, PDF &amp; SMTP Reporting
                                </td>
                            </tr>
                            <tr>
                                <td class="py-3 px-4 text-on-surface-variant font-semibold">Lead Developer</td>
                                <td class="py-3 px-4 text-secondary font-bold">Kiran Mondal</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    return generateLayout('ABOUT TRISCOUT', aboutContent);
}

// ৫. MY PROJECTS পেজ (All 5 Original Portfolio Cards & SVGs Preserved)
function getProjectPage() {
    const projectContent = `
        <div class="max-w-6xl mx-auto">
            <!-- Developer Profile Banner -->
            <div class="bg-surface-container-low rounded-xl p-space-xl mb-margin-lg flex flex-col items-center justify-center text-center relative overflow-hidden border border-surface-variant/20 shadow-xl">
                <div class="p-1.5 rounded-full bg-gradient-to-tr from-primary-container to-secondary mb-4 shadow-[0_0_24px_rgba(57,255,136,0.3)]">
                    <img src="https://github.com/Kiran-mondal.png" alt="Kiran Mondal" class="w-24 h-24 rounded-full border-4 border-surface-container-lowest object-cover">
                </div>
                <h2 class="font-headline-lg text-headline-lg text-on-surface font-bold uppercase tracking-wide mb-1">Kiran Mondal</h2>
                <p class="text-on-surface-variant font-mono-stream text-mono-stream mb-5 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-primary-container">code</span>
                    Full-Stack Developer &amp; Cyber Security Enthusiast
                </p>
                <a href="https://github.com/Kiran-mondal" target="_blank" class="bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-secondary px-6 py-2.5 rounded-lg border border-surface-variant/40 transition-all flex items-center gap-2 font-label-md text-label-md uppercase font-bold">
                    <span class="material-symbols-outlined text-base">open_in_new</span>
                    <span>View GitHub Profile</span>
                </a>
            </div>

            <!-- Projects Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
                
                <!-- 1. Password Guard -->
                <div class="bg-surface-container-low rounded-xl p-space-lg flex flex-col border border-surface-variant/20 hover:border-secondary/50 transition-all shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg width="34" height="34" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="512" height="512" rx="120" fill="#0D4FF0"/>
                            <path d="M256 80L120 140V240C120 330 176 407 256 432C336 407 392 330 392 240V140L256 80Z" fill="white"/>
                            <circle cx="256" cy="255" r="70" fill="#0D4FF0"/>
                            <rect x="235" y="240" width="42" height="75" rx="8" fill="white"/>
                        </svg>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Password Guard</h3>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-5">Advanced AI-powered password protection &amp; vault management tool with 3D Cyber UI.</p>
                    <div class="flex gap-2 mt-auto">
                        <a href="https://passwordguard.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary-container text-on-primary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold">Live App</a>
                        <a href="https://github.com/Kiran-mondal/Password-Guard" target="_blank" class="flex-1 bg-surface-container text-secondary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold border border-surface-variant/40">Code</a>
                    </div>
                </div>

                <!-- 2. ZenDrift -->
                <div class="bg-surface-container-low rounded-xl p-space-lg flex flex-col border border-surface-variant/20 hover:border-secondary/50 transition-all shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34">
                            <path d="M 120 390 C 120 270, 392 350, 392 210 C 392 130, 310 90, 256 90" fill="none" stroke="#58a6ff" stroke-width="45" stroke-linecap="round" />
                            <circle cx="256" cy="90" r="45" fill="#58a6ff" />
                        </svg>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">ZenDrift</h3>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-5">Dynamic performance tracking system built for an engaging and smooth web experience.</p>
                    <div class="flex gap-2 mt-auto">
                        <a href="https://zendrift.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary-container text-on-primary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 bg-surface-container text-secondary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold border border-surface-variant/40">Code</a>
                    </div>
                </div>

                <!-- 3. Omlang -->
                <div class="bg-surface-container-low rounded-xl p-space-lg flex flex-col border border-surface-variant/20 hover:border-secondary/50 transition-all shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="34" height="34">
                            <path d="M 280 250 C 420 250, 420 380, 350 400 C 450 420, 450 580, 280 580" stroke="#00f2fe" stroke-width="45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="450" cy="120" r="30" fill="#00f2fe" />
                        </svg>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Omlang</h3>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-5">A modern language and communication-focused platform with an intuitive user interface.</p>
                    <div class="flex gap-2 mt-auto">
                        <a href="https://omlang.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary-container text-on-primary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 bg-surface-container text-secondary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold border border-surface-variant/40">Code</a>
                    </div>
                </div>

                <!-- 4. Chaturanga -->
                <div class="bg-surface-container-low rounded-xl p-space-lg flex flex-col border border-surface-variant/20 hover:border-secondary/50 transition-all shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
                            <circle cx="50" cy="50" r="48" fill="#d97706" stroke="#ffffff" stroke-width="2"/>
                            <path d="M50 20 L75 55 L50 80 L25 55 Z" fill="#ffffff" />
                        </svg>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Chaturanga</h3>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-5">Interactive web-based application focused on deep logic, planning, and strategy.</p>
                     <div class="flex gap-2 mt-auto">
                        <a href="https://chaturanga.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary-container text-on-primary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 bg-surface-container text-secondary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold border border-surface-variant/40">Code</a>
                    </div>
                </div>

                <!-- 5. Pachisi -->
                <div class="bg-surface-container-low rounded-xl p-space-lg flex flex-col border border-surface-variant/20 hover:border-secondary/50 transition-all shadow-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34">
                            <circle cx="256" cy="256" r="168" fill="none" stroke="#dc2626" stroke-width="48" />
                            <circle cx="256" cy="256" r="56" fill="none" stroke="#dc2626" stroke-width="48" />
                        </svg>
                        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Pachisi</h3>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-5">Play the ancient Indian epic board game of strategy, heritage, and royal culture.</p>
                    <div class="flex gap-2 mt-auto">
                        <a href="https://pachisi.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary-container text-on-primary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 bg-surface-container text-secondary text-center py-2 rounded font-label-sm text-label-sm uppercase font-bold border border-surface-variant/40">Code</a>
                    </div>
                </div>

            </div>
        </div>
    `;
    return generateLayout('MY PROJECTS', projectContent);
}

function getProfilePage() {
    const profileContent = `
        <div class="max-w-3xl mx-auto">
            <div class="bg-surface-container-low rounded-xl p-space-xl border border-surface-variant/20 shadow-xl">
                <div class="flex flex-col sm:flex-row items-center gap-space-lg pb-space-lg mb-space-lg border-b border-surface-variant/20">
                    <div class="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center ring-2 ring-primary-container overflow-hidden shrink-0" id="profileAvatar">
                        <span class="material-symbols-outlined text-4xl text-primary-container">person</span>
                    </div>
                    <div class="text-center sm:text-left">
                        <h3 class="font-headline-lg text-headline-lg text-on-surface font-bold" id="profileName">Operator</h3>
                        <p class="font-mono-stream text-mono-stream text-secondary mt-0.5" id="profileRole">Verifying session credentials...</p>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container text-primary-container font-label-sm text-label-sm mt-2">
                            <span class="h-2 w-2 rounded-full bg-primary-container animate-pulse"></span> SESSION ACTIVE
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md" id="profileActions"></div>
            </div>
        </div>

        <script>
            async function deleteUserAccount() {
                if (!confirm("WARNING: Are you sure you want to permanently purge your account data from our Neon PostgreSQL database?")) return;
                try {
                    const response = await fetch('/api/account/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    const data = await response.json();
                    if (data.success) {
                        alert(data.message);
                        localStorage.removeItem('token');
                        window.location.href = '/';
                    } else {
                        alert("Error: " + data.error);
                    }
                } catch (e) {
                    alert("Failed to reach account deletion endpoint.");
                }
            }

            document.addEventListener("DOMContentLoaded", () => {
                const token = localStorage.getItem('token');
                if (!token) return window.location.href = '/';

                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    document.getElementById('profileName').innerText = payload.user || "Authorized Operator";
                    const avatarEl = document.getElementById('profileAvatar');
                    const actionsEl = document.getElementById('profileActions');

                    if (payload.provider === 'github') {
                        document.getElementById('profileRole').innerText = "GitHub OAuth Verified Operator";
                        if (payload.avatar && payload.avatar.startsWith('https://')) {
                            const img = document.createElement('img');
                            img.src = payload.avatar;
                            img.className = "w-full h-full object-cover";
                            avatarEl.innerHTML = '';
                            avatarEl.appendChild(img);
                        }
                        actionsEl.innerHTML = \`
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase font-bold flex items-center justify-center gap-2 cursor-pointer">
                                <span class="material-symbols-outlined text-base">logout</span> Sign Out Session
                            </button>
                            <button onclick="deleteUserAccount()" class="p-space-md rounded-lg bg-error-container/40 hover:bg-error-container text-error font-label-md text-label-md uppercase font-bold flex items-center justify-center gap-2 cursor-pointer border border-error/30">
                                <span class="material-symbols-outlined text-base">delete_forever</span> Delete My Account Data
                            </button>
                        \`;
                    } else {
                        document.getElementById('profileRole').innerText = "System Administrator (Local Env)";
                        actionsEl.innerHTML = \`
                            <div class="p-space-md rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-body-sm">
                                Local Admin credentials managed via Vercel Environment Variables.
                            </div>
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="p-space-md rounded-lg bg-error-container/40 hover:bg-error-container text-error font-label-md text-label-md uppercase font-bold flex items-center justify-center gap-2 cursor-pointer">
                                <span class="material-symbols-outlined text-base">logout</span> Sign Out Session
                            </button>
                        \`;
                    }
                } catch (e) {}
            });
        </script>
    `;
    return generateLayout('USER PROFILE', profileContent);
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
