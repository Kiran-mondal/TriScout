const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config();

// auth.js থেকেই সরাসরি JWT_SECRET এবং getEnv নিয়ে আসা হলো (ফলে Secret Mismatch হওয়ার সম্ভাবনা 0%)
const { requireHTTPAuth, JWT_SECRET, getEnv } = require('./middleware/auth.js');

const app = express();

const DATABASE_URL = getEnv('DATABASE_URL');
const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
const ADMIN_USER = getEnv('ADMIN_USERNAME');
const ADMIN_PASS = getEnv('ADMIN_PASSWORD');

// ডাটাবেজ কানেকশন সেফটি চেক
const sql = DATABASE_URL ? neon(DATABASE_URL) : async () => { throw new Error("Database URL not configured"); };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ⚡ Bolt: Add maxAge caching to static assets to prevent redundant network requests
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));

// ফেভিকন (Favicon) রিকোয়েস্ট হ্যান্ডেল করার জন্য সরাসরি রাউট
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

// ==========================================
// ১. ইমেইল ট্রান্সপোর্টার সেটআপ
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getEnv('GMAIL_USER'), pass: getEnv('GMAIL_PASS') }
}); 

// ==========================================
// ২. মাল্টি-পেজ লেআউট ফাংশন (Favicon, Dropdown, Mobile Menu & Active Tab Fixed)
// ==========================================
function generateLayout(pageTitle, content) {
    // CSS classes for Active and Normal states
    const activeLink = "flex items-center gap-3 px-3 py-2 rounded-lg text-primary font-bold border-r-2 border-primary bg-surface-variant/20 hover:bg-surface-variant/40";
    const normalLink = "flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant/50 transition-colors";
    
    const activeIcon = "material-symbols-outlined text-primary";
    const normalIcon = "material-symbols-outlined text-outline-variant";
    
    const activeIconStyle = "style=\"font-variation-settings: 'FILL' 1;\"";
    const normalIconStyle = "";

    return `
    <!DOCTYPE html>
    <html class="dark" lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
        <title>TriScout - ${pageTitle}</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        
        <!-- Primary Meta Tags -->
        <meta name="title" content="TriScout - Advanced Defensive Cybersecurity Tool" />
        <meta name="description" content="TriScout is an advanced defensive cybersecurity tool designed to help developers and system administrators perform passive vulnerability assessments without executing malicious payloads." />
        <meta name="keywords" content="cybersecurity, passive scanner, vulnerability assessment, TriScout, Kiran Mondal, web security, header check, nodejs" />
        <meta name="author" content="Kiran Mondal" />
        <meta name="theme-color" content="#10131a" />

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://triscout.quarry.dpdns.org/" />
        <meta property="og:title" content="TriScout - Advanced Defensive Cybersecurity Tool" />
        <meta property="og:description" content="TriScout is an advanced defensive cybersecurity tool designed to help developers and system administrators perform passive vulnerability assessments without executing malicious payloads." />
        <meta property="og:image" content="https://github.com/Kiran-mondal.png" />

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://triscout.quarry.dpdns.org/" />
        <meta property="twitter:title" content="TriScout - Advanced Defensive Cybersecurity Tool" />
        <meta property="twitter:description" content="TriScout is an advanced defensive cybersecurity tool designed to help developers and system administrators perform passive vulnerability assessments without executing malicious payloads." />
        <meta property="twitter:image" content="https://github.com/Kiran-mondal.png" />
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <script id="tailwind-config">
            tailwind.config = { darkMode: "class", theme: { extend: { colors: { "primary": "#adc6ff", "primary-container": "#4d8eff", "on-primary-container": "#00285d", "on-primary": "#002e6a", "surface-container-low": "#191b23", "surface-container-highest": "#32353c", "surface-container": "#1d2027", "surface-container-high": "#272a31", "surface": "#10131a", "surface-variant": "#32353c", "on-surface": "#e1e2ec", "on-surface-variant": "#c2c6d6", "background": "#10131a", "outline-variant": "#424754", "error": "#ffb4ab", "tertiary": "#bec6e0" }, fontFamily: { "data-mono": ["JetBrains Mono"], "body-md": ["Inter"] } } } }
        </script>
        <style>
            .glass-card { background-color: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            #mobileSidebar { transition: transform 0.3s ease-in-out; }
        </style>
    </head>
    <body class="bg-background text-on-surface font-body-md min-h-screen">
        
        <!-- SideNavBar (Mobile Friendly & Dynamic Active State) -->
        <nav id="mobileSidebar" class="bg-surface-container h-screen w-64 flex flex-col border-r border-outline-variant/10 shadow-sm fixed left-0 top-0 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
            <div class="p-6 pb-2 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings: 'FILL' 1;">security</span>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-primary">TriScout</div>
                    </div>
                </div>
                <button onclick="toggleMenu()" aria-label="Close menu" class="md:hidden text-on-surface-variant p-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 mt-4">
                <a href="/dashboard" class="${pageTitle === 'COMMAND CENTER' ? activeLink : normalLink}">
                    <span class="${pageTitle === 'COMMAND CENTER' ? activeIcon : normalIcon}" ${pageTitle === 'COMMAND CENTER' ? activeIconStyle : normalIconStyle}>policy</span><span>Scanner</span>
                </a>
                <a href="/reports" class="${pageTitle === 'REPORTS' ? activeLink : normalLink}">
                    <span class="${pageTitle === 'REPORTS' ? activeIcon : normalIcon}" ${pageTitle === 'REPORTS' ? activeIconStyle : normalIconStyle}>list_alt</span><span>Reports</span>
                </a>
                <a href="/cli" class="${pageTitle === 'CLI TOOL' ? activeLink : normalLink}">
                    <span class="${pageTitle === 'CLI TOOL' ? activeIcon : normalIcon}" ${pageTitle === 'CLI TOOL' ? activeIconStyle : normalIconStyle}>terminal</span><span>CLI</span>
                </a>
                <a href="/project" class="${pageTitle === 'MY PROJECTS' ? activeLink : normalLink}">
                    <span class="${pageTitle === 'MY PROJECTS' ? activeIcon : normalIcon}" ${pageTitle === 'MY PROJECTS' ? activeIconStyle : normalIconStyle}>work</span><span>My Projects</span>
                </a>
                
                <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="flex items-center gap-3 px-3 py-2 rounded-lg text-error font-medium hover:bg-error/10 transition-colors mt-auto mb-2 w-full text-left">
                    <span class="material-symbols-outlined text-error">logout</span><span>Logout</span>
                </button>
            </div>
        </nav>

        <!-- Overlay for Mobile Sidebar -->
        <div id="sidebarOverlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>

        <!-- TopNavBar -->
        <header class="bg-surface/90 backdrop-blur-xl h-16 w-full flex items-center justify-between px-4 md:px-6 z-40 border-b border-outline-variant/10 fixed top-0 right-0 left-0 md:left-64">
            <div class="flex items-center gap-2">
                <button onclick="toggleMenu()" aria-label="Open menu" class="md:hidden text-on-surface p-2 -ml-2 hover:bg-surface-variant/50 rounded-lg transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-2xl">menu</span>
                </button>
                <div class="text-lg font-bold text-on-surface uppercase tracking-wide truncate max-w-[150px] sm:max-w-xs">${pageTitle}</div>
            </div>
            
            <div class="relative flex-shrink-0"> 
                <button onclick="toggleDropdown()" aria-label="Toggle user menu" aria-haspopup="true" aria-expanded="false" class="flex items-center gap-2 hover:bg-surface-variant/50 py-1.5 px-2 rounded-lg transition-colors group focus:outline-none">
                    <div id="navProfileAvatar" class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold overflow-hidden shadow-sm">
                        <span class="material-symbols-outlined text-sm">person</span>
                    </div>
                    <span id="navProfileName" class="hidden sm:block text-on-surface font-medium capitalize group-hover:text-primary transition-colors">Loading...</span>
                    <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_drop_down</span>
                </button>
                
                <div id="profileDropdown" class="hidden absolute right-0 top-[calc(100%+8px)] w-56 bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div class="px-4 py-3 border-b border-outline-variant/10 bg-surface-variant/20">
                        <p class="text-xs text-on-surface-variant">Signed in as</p>
                        <p class="text-sm font-bold text-on-surface truncate" id="dropdownUserName">Authorized User</p>
                    </div>
                    <a href="/profile" class="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-variant/50 border-b border-outline-variant/10 transition-colors">
                        <span class="material-symbols-outlined text-[18px] text-primary">manage_accounts</span> Account Settings
                    </a>
                    <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors">
                        <span class="material-symbols-outlined text-[18px]">logout</span> Secure Logout
                    </button>
                </div>
            </div>
        </header>

        <!-- System Status Bar -->
        <div class="bg-surface-container-low/50 backdrop-blur-md border-b border-outline-variant/5 fixed top-16 right-0 left-0 md:left-64 h-8 flex items-center px-4 md:px-6 z-20 overflow-x-auto">
            <div class="flex items-center gap-2 text-xs">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-on-surface-variant uppercase tracking-wider">System Status: <span class="text-emerald-400 font-medium">ONLINE</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <main class="pt-[110px] md:ml-64 p-4 md:p-6 min-h-screen pb-20">
            ${content}
        </main>

        <script>
            function toggleMenu() {
                const sidebar = document.getElementById('mobileSidebar');
                const overlay = document.getElementById('sidebarOverlay');
                sidebar.classList.toggle('-translate-x-full');
                overlay.classList.toggle('hidden');
            }
            
            function toggleDropdown() {
                const dropdown = document.getElementById('profileDropdown');
                const btn = document.querySelector('button[onclick="toggleDropdown()"]');
                const isHidden = dropdown.classList.toggle('hidden');
                if (btn) btn.setAttribute('aria-expanded', !isHidden);
            }
            
            window.onclick = function(event) {
                if (!event.target.closest('button[onclick="toggleDropdown()"]')) {
                    const dropdown = document.getElementById('profileDropdown');
                    if (dropdown && !dropdown.classList.contains('hidden')) {
                        dropdown.classList.add('hidden');
                        const btn = document.querySelector('button[onclick="toggleDropdown()"]');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                }
            }
            
            document.addEventListener("DOMContentLoaded", () => {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                        const dropName = document.getElementById('dropdownUserName');
                        const navName = document.getElementById('navProfileName');
                        if(dropName && payload.user) dropName.innerText = payload.user;
                        if(navName && payload.user) navName.innerText = payload.user;
                    } catch(e) {}
                }
            });
        </script>
    </body>
    </html>
    `;
}

// ==========================================
// ৩. লগইন রাউট (404 Error Fix & Env Credential Validation)
// ==========================================
app.get('/login', (req, res) => {
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } else {
        res.send(`<script>alert("ACCESS DENIED"); window.location.href="/";</script>`);
    }
});

// ==========================================
// ৪. পেজ রাউট: SCANNER (Modern Cyber UI & Visual Breakdown)
// ==========================================
app.get('/dashboard', (req, res) => {
    const scannerContent = `
        <!-- Ethical Compliance Banner -->
        <div class="glass-card rounded-xl p-4 mb-6 border border-emerald-500/30 bg-emerald-950/10 flex items-start sm:items-center justify-between gap-4">
            <div class="flex items-start sm:items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <span class="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        PASSIVE RECONNAISSANCE & ETHICAL GUARDRAIL ACTIVE
                    </h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                        Non-intrusive header and source evaluation. Internal IPs and unauthorized active payloads are strictly blocked.
                    </p>
                </div>
            </div>
            <span class="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-data-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> v2.0 ENGINE
            </span>
        </div>

        <!-- Main Scanner Input Card -->
        <div class="glass-card rounded-2xl p-5 md:p-7 mb-6 border border-primary/20 shadow-2xl relative overflow-hidden">
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-5">
                <div>
                    <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-primary text-3xl">radar</span> 
                        Target Security Analyzer
                    </h2>
                    <p class="text-xs text-on-surface-variant mt-1">Inspect HTTP security headers, technology exposure, and source-level leaks in real time.</p>
                </div>
                <div class="flex items-center gap-2 text-xs font-data-mono text-on-surface-variant bg-surface-container-highest/60 px-3 py-1.5 rounded-lg border border-outline-variant/20 self-start md:self-auto">
                    <span class="material-symbols-outlined text-sm text-primary">language</span>
                    <span id="scanTargetLabel">Target: Standby</span>
                </div>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 mb-6">
                <div class="relative flex-1">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">link</span>
                    <input type="text" id="targetInput" class="w-full bg-surface-container-low/90 border border-outline-variant/40 text-on-surface placeholder:text-outline-variant rounded-xl pl-11 pr-4 py-3.5 text-sm font-data-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" placeholder="https://example.com or domain.com" aria-label="Enter target domain">
                </div>
                <button id="scanBtn" onclick="startScan()" class="bg-gradient-to-r from-primary to-primary-container hover:opacity-95 text-on-primary font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">bolt</span> INITIATE SCAN
                </button>
            </div>

            <!-- Score & Threat Summary Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                
                <!-- Dynamic Security Score Card -->
                <div class="bg-surface-container-low/80 border border-outline-variant/20 rounded-xl p-5 lg:col-span-4 flex flex-col justify-between relative overflow-hidden">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-primary">shield_lock</span> Security Posture
                        </span>
                        <span id="gradeBadge" class="px-2.5 py-0.5 rounded-md text-xs font-bold font-data-mono bg-surface-variant text-on-surface-variant border border-outline-variant/30">
                            GRADE: --
                        </span>
                    </div>

                    <div class="flex items-center gap-5 my-2">
                        <div class="w-24 h-24 rounded-full border-4 border-outline-variant/30 flex flex-col items-center justify-center shrink-0 transition-all duration-500 shadow-inner" id="scoreCircle">
                            <span class="text-3xl font-extrabold font-data-mono text-on-surface" id="scoreValue">--</span>
                            <span class="text-[10px] text-on-surface-variant uppercase tracking-widest">/ 100</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm font-bold text-on-surface mb-1" id="scoreStatusText">Awaiting Scan</div>
                            <p class="text-xs text-on-surface-variant leading-relaxed" id="scoreSubText">Enter a domain above to evaluate defensive headers and exposure risks.</p>
                        </div>
                    </div>

                    <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-3">
                        <div id="scoreProgressBar" class="bg-primary h-full transition-all duration-700" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Color-Coded Status Counters -->
                <div class="bg-surface-container-low/80 border border-outline-variant/20 rounded-xl p-5 lg:col-span-8 flex flex-col justify-between">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-primary">analytics</span> Vulnerability & Header Matrix
                        </span>
                        <span class="text-xs text-on-surface-variant font-data-mono" id="totalChecksLabel">0 Checks Executed</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
                        <!-- Critical (Red) -->
                        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-red-400 uppercase">Critical</span>
                                <span class="material-symbols-outlined text-red-400 text-lg">gpp_bad</span>
                            </div>
                            <div class="text-3xl font-extrabold font-data-mono text-red-400 mt-2" id="countCrit">0</div>
                            <div class="text-[11px] text-red-300/80 mt-1">Severe Leaks / Risks</div>
                        </div>

                        <!-- Missing / High (Amber/Orange) -->
                        <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-amber-400 uppercase">Missing</span>
                                <span class="material-symbols-outlined text-amber-400 text-lg">warning</span>
                            </div>
                            <div class="text-3xl font-extrabold font-data-mono text-amber-400 mt-2" id="countHigh">0</div>
                            <div class="text-[11px] text-amber-300/80 mt-1">Unprotected Headers</div>
                        </div>

                        <!-- Warnings / Info (Yellow/Blue) -->
                        <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-blue-400 uppercase">Notice</span>
                                <span class="material-symbols-outlined text-blue-400 text-lg">info</span>
                            </div>
                            <div class="text-3xl font-extrabold font-data-mono text-blue-400 mt-2" id="countMed">0</div>
                            <div class="text-[11px] text-blue-300/80 mt-1">Tech / Rate Limit</div>
                        </div>

                        <!-- Passed / Secure (Green) -->
                        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-emerald-400 uppercase">Secure</span>
                                <span class="material-symbols-outlined text-emerald-400 text-lg">verified</span>
                            </div>
                            <div class="text-3xl font-extrabold font-data-mono text-emerald-400 mt-2" id="countLow">0</div>
                            <div class="text-[11px] text-emerald-300/80 mt-1">Verified & Protected</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Visual Security Breakdown Cards (Dynamic Grid) -->
            <div id="visualBreakdownSection" class="hidden mb-6">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-lg">grid_view</span> 
                        Detailed Security Controls (Color-Coded Inspection)
                    </h3>
                    <div class="flex items-center gap-3 text-xs">
                        <span class="flex items-center gap-1 text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Secure</span>
                        <span class="flex items-center gap-1 text-amber-400"><span class="w-2 h-2 rounded-full bg-amber-400"></span> Missing/Warn</span>
                        <span class="flex items-center gap-1 text-red-400"><span class="w-2 h-2 rounded-full bg-red-400"></span> Critical</span>
                    </div>
                </div>
                <div id="checksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <!-- Dynamic Cards Injected Here -->
                </div>
            </div>

            <!-- Color-Coded Live Terminal Output -->
            <div>
                <div class="bg-surface-container-highest px-4 py-2 rounded-t-xl border border-b-0 border-outline-variant/30 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                        <span class="text-xs font-data-mono text-on-surface-variant ml-2">triscout-console ~ passive-analyzer</span>
                    </div>
                    <a href="/reports" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        Dispatch Report <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
                <div id="terminalOutput" class="bg-black/95 text-on-surface p-5 rounded-b-xl border border-outline-variant/30 h-64 overflow-y-auto font-data-mono text-xs sm:text-sm shadow-inner hide-scrollbar leading-relaxed">
                    <span class="text-emerald-400">> System ready.</span><br>
                    <span class="text-on-surface-variant">> Awaiting target input for advanced security analysis...</span>
                </div>
            </div>
        </div>

        <script>
            function formatColoredTerminal(rawReport) {
                const lines = rawReport.split('\\n');
                return lines.map(line => {
                    const safeLine = line.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    if (safeLine.startsWith('[+]')) {
                        return '<div class="text-emerald-400 font-medium py-0.5">' + safeLine + '</div>';
                    } else if (safeLine.startsWith('[!]') && safeLine.includes('CRITICAL')) {
                        return '<div class="text-red-400 font-bold bg-red-950/30 px-2 py-0.5 rounded border-l-2 border-red-500 my-0.5">' + safeLine + '</div>';
                    } else if (safeLine.startsWith('[!]')) {
                        return '<div class="text-amber-400 font-semibold py-0.5">' + safeLine + '</div>';
                    } else if (safeLine.startsWith('[-]')) {
                        return '<div class="text-blue-400 py-0.5">' + safeLine + '</div>';
                    } else if (safeLine.startsWith('---') || safeLine.includes('OVERALL SECURITY SCORE')) {
                        return '<div class="text-primary font-bold mt-2 mb-1">' + safeLine + '</div>';
                    }
                    return '<div class="text-on-surface-variant">' + safeLine + '</div>';
                }).join('');
            }

            function renderCheckCards(checks) {
                const section = document.getElementById('visualBreakdownSection');
                const grid = document.getElementById('checksGrid');
                if (!checks || !Array.isArray(checks) || checks.length === 0) return;

                section.classList.remove('hidden');
                grid.innerHTML = '';

                let crit = 0, missing = 0, notice = 0, secure = 0;

                checks.forEach(item => {
                    let cardStyle = '';
                    let badgeStyle = '';
                    let iconName = '';

                    if (item.status === 'SECURE') {
                        secure++;
                        cardStyle = 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400';
                        badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                        iconName = 'check_circle';
                    } else if (item.status === 'CRITICAL') {
                        crit++;
                        cardStyle = 'bg-red-950/25 border-red-500/50 hover:border-red-400';
                        badgeStyle = 'bg-red-500/20 text-red-300 border border-red-500/40';
                        iconName = 'error';
                    } else if (item.status === 'MISSING' || item.status === 'WARNING') {
                        missing++;
                        cardStyle = 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400';
                        badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                        iconName = 'warning';
                    } else {
                        notice++;
                        cardStyle = 'bg-blue-950/20 border-blue-500/30 hover:border-blue-400';
                        badgeStyle = 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
                        iconName = 'help';
                    }

                    const card = document.createElement('div');
                    card.className = 'border rounded-xl p-4 flex flex-col justify-between transition-all ' + cardStyle;
                    card.innerHTML = \`
                        <div>
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <span class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-base">\${iconName}</span>
                                    \${item.name}
                                </span>
                                <span class="text-[10px] font-data-mono font-bold px-2 py-0.5 rounded uppercase \${badgeStyle}">
                                    \${item.status}
                                </span>
                            </div>
                            <p class="text-xs text-on-surface-variant leading-relaxed">\${item.detail}</p>
                        </div>
                        <div class="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-data-mono text-on-surface-variant">
                            <span>Category: \${item.category}</span>
                            <span>\${item.impact}</span>
                        </div>
                    \`;
                    grid.appendChild(card);
                });

                document.getElementById('countCrit').innerText = crit;
                document.getElementById('countHigh').innerText = missing;
                document.getElementById('countMed').innerText = notice;
                document.getElementById('countLow').innerText = secure;
                document.getElementById('totalChecksLabel').innerText = checks.length + ' Checks Executed';
            }

            function updateScoreUI(score) {
                const circle = document.getElementById('scoreCircle');
                const valEl = document.getElementById('scoreValue');
                const gradeEl = document.getElementById('gradeBadge');
                const statusEl = document.getElementById('scoreStatusText');
                const subEl = document.getElementById('scoreSubText');
                const bar = document.getElementById('scoreProgressBar');

                valEl.innerText = score;
                bar.style.width = score + '%';

                circle.className = "w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 transition-all duration-500 shadow-lg ";

                if (score >= 85) {
                    circle.classList.add('border-emerald-400', 'bg-emerald-500/10', 'text-emerald-400');
                    bar.className = "bg-emerald-400 h-full transition-all duration-700";
                    gradeEl.className = "px-2.5 py-0.5 rounded-md text-xs font-bold font-data-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
                    gradeEl.innerText = "GRADE: A";
                    statusEl.innerText = "Strong Security Posture";
                    statusEl.className = "text-sm font-bold text-emerald-400 mb-1";
                    subEl.innerText = "Most essential defensive headers and protections are properly configured.";
                } else if (score >= 60) {
                    circle.classList.add('border-amber-400', 'bg-amber-500/10', 'text-amber-400');
                    bar.className = "bg-amber-400 h-full transition-all duration-700";
                    gradeEl.className = "px-2.5 py-0.5 rounded-md text-xs font-bold font-data-mono bg-amber-500/20 text-amber-300 border border-amber-500/40";
                    gradeEl.innerText = "GRADE: B / C";
                    statusEl.innerText = "Moderate Risk Detected";
                    statusEl.className = "text-sm font-bold text-amber-400 mb-1";
                    subEl.innerText = "Some security headers are missing. Review the amber cards below to harden the target.";
                } else {
                    circle.classList.add('border-red-500', 'bg-red-500/10', 'text-red-400');
                    bar.className = "bg-red-500 h-full transition-all duration-700";
                    gradeEl.className = "px-2.5 py-0.5 rounded-md text-xs font-bold font-data-mono bg-red-500/20 text-red-300 border border-red-500/40";
                    gradeEl.innerText = "GRADE: D / F";
                    statusEl.innerText = "High Vulnerability Exposure";
                    statusEl.className = "text-sm font-bold text-red-400 mb-1";
                    subEl.innerText = "Critical headers are missing or leaks were detected. Immediate remediation advised.";
                }
            }

            async function startScan() {
                const target = document.getElementById('targetInput').value.trim();
                const terminal = document.getElementById('terminalOutput');
                const btn = document.getElementById('scanBtn');

                if(!target) return alert('Enter a valid target domain!');
                
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-lg animate-spin">progress_activity</span> ANALYZING...';
                terminal.innerHTML = "<span class='text-primary'>> Initializing passive security analysis for: " + target.replace(/</g, "&lt;") + "...</span><br><span class='text-on-surface-variant'>> Inspecting HTTP response headers, policies, and source leaks...</span><br><br>";
                
                document.getElementById('scanTargetLabel').innerText = 'Target: ' + target;

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

                    if (data.success) {
                        terminal.innerHTML += formatColoredTerminal(data.report);
                        
                        localStorage.setItem('triscout_target', target);
                        localStorage.setItem('triscout_report', data.report);
                        
                        const score = typeof data.score === 'number' ? data.score : parseInt((data.report.match(/OVERALL SECURITY SCORE: (\\d+)/) || [0, 50])[1]);
                        updateScoreUI(score);

                        if (data.checks) {
                            renderCheckCards(data.checks);
                        }

                        terminal.innerHTML += "<br><div class='mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-on-surface'>> Analysis complete. <a href='/reports' class='text-primary underline font-bold ml-1'>GO TO REPORTS TO DISPATCH EMAIL &rarr;</a></div>";
                        terminal.scrollTop = terminal.scrollHeight;
                    } else {
                        terminal.innerHTML += "<div class='text-red-400 font-bold mt-2'>[!] ERROR: " + (data.error || 'Scan failed') + "</div>";
                    }
                } catch (error) {
                    terminal.innerHTML += "<div class='text-red-400 font-bold mt-2'>[!] CRITICAL ERROR: Could not reach the scanning API.</div>";
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-lg" style="font-variation-settings: \\'FILL\\' 1;">bolt</span> INITIATE SCAN';
                }
            }
        </script>
    `;
    res.send(generateLayout('COMMAND CENTER', scannerContent));
});

// ==========================================
// ৫. পেজ রাউট: REPORTS
// ==========================================
app.get('/reports', (req, res) => {
    const reportContent = `
        <div class="glass-card rounded-xl p-6 max-w-4xl mx-auto mt-8 border border-primary/20">
            <h3 class="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined">send</span> DISPATCH REPORT
            </h3>
            <p class="text-sm text-on-surface-variant mb-6">Send the last generated security assessment report directly to the site owner.</p>
            
            <div id="reportPreview" class="bg-black/80 text-on-surface p-4 mb-6 font-data-mono text-sm border border-outline-variant/30 h-64 overflow-y-auto rounded-lg shadow-inner hide-scrollbar leading-relaxed">
                Checking for saved reports...
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
                <input type="email" id="emailInput" class="flex-1 bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline-variant rounded-lg px-4 py-2 focus:outline-none focus:border-primary" placeholder="ENTER CLIENT EMAIL ADDRESS" aria-label="Enter client email address">
                <button id="reportBtn" onclick="sendReport()" class="bg-on-surface text-background font-bold px-6 py-2 rounded-lg transition-colors hover:bg-primary flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">mail</span> SEND VIA GMAIL
                </button>
            </div>
        </div>

        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const savedReport = localStorage.getItem('triscout_report');
                const savedTarget = localStorage.getItem('triscout_target');
                const preview = document.getElementById('reportPreview');

                if(savedReport && savedTarget) {
                    preview.innerHTML = "<span class='text-primary font-bold'>TARGET: " + savedTarget + "</span><br><br>" + savedReport.replace(/\\n/g, '<br>');
                } else {
                    preview.innerHTML = "<span class='text-error'>NO RECENT SCAN DATA FOUND. GO TO SCANNER FIRST.</span>";
                }
            });

            async function sendReport() {
                const email = document.getElementById('emailInput').value;
                const target = localStorage.getItem('triscout_target');
                const reportData = localStorage.getItem('triscout_report');
                const btn = document.getElementById('reportBtn');

                if(!email) return alert('Enter client email address!');
                if(!reportData || !target) return alert('No report found! Please run a scan first.');

                alert('Dispatching report to ' + email + '...');
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> SENDING...';

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
                    if(result.success) {
                        alert('SUCCESS: Assessment report securely sent to the client!');
                    } else {
                        alert('FAILED: ' + result.error);
                    }
                } catch(err) {
                    alert('ERROR sending email. Check server configuration.');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-sm">mail</span> SEND VIA GMAIL';
                }
            }
        </script>
    `;
    res.send(generateLayout('REPORTS', reportContent));
});

// ==========================================
// ৬. পেজ রাউট: CLI DOWNLOAD
// ==========================================
app.get('/cli', (req, res) => {
    const cliContent = `
        <div class="glass-card rounded-xl p-6 md:p-8 max-w-4xl mx-auto border border-primary/20 shadow-lg">
            <h3 class="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined">terminal</span> TRISCOUT CLI EDITION
            </h3>
            <p class="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Take the power of TriScout to your terminal. Integrate passive security scans directly into your CI/CD pipelines or run them locally using our Command Line Interface.
            </p>
            
            <div class="bg-black/90 p-5 rounded-lg border border-outline-variant/30 font-data-mono text-sm text-on-surface mb-6 leading-relaxed">
                <span class="text-on-surface-variant"># Install via NPM</span><br>
                <span class="text-emerald-400 font-bold">$</span> npm install -g @kiran-mondal/triscout<br><br>
                <span class="text-on-surface-variant"># Run a quick passive scan</span><br>
                <span class="text-emerald-400 font-bold">$</span> triscout example.com
            </div>
            
            <button class="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2" onclick="window.open('https://github.com/Kiran-mondal/triscout/packages', '_blank')">
                <span class="material-symbols-outlined text-sm">open_in_new</span> VIEW PACKAGE ON GITHUB
            </button>
        </div>
    `;
    res.send(generateLayout('CLI TOOL', cliContent));
});

// ==========================================
// ৭. পেজ রাউট: ABOUT 
// ==========================================
app.get('/about', (req, res) => {
    const aboutContent = `
        <div class="glass-card rounded-xl p-6 md:p-8 max-w-4xl mx-auto border border-primary/20 shadow-lg">
            <h3 class="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined">info</span> ABOUT TRISCOUT
            </h3>
            <p class="text-sm text-on-surface-variant mb-6 leading-relaxed">
                TriScout is an advanced defensive cybersecurity tool designed to help developers and system administrators perform passive vulnerability assessments without executing malicious payloads.
            </p>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse font-body-md text-sm">
                    <thead>
                        <tr class="border-b border-outline-variant/30 text-primary uppercase font-data-mono text-xs">
                            <th class="py-3 px-4">Module</th>
                            <th class="py-3 px-4">Specification</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/10">
                        <tr>
                            <td class="py-3 px-4 font-semibold text-on-surface-variant">Project Name</td>
                            <td class="py-3 px-4 text-emerald-400 font-bold font-data-mono">TRISCOUT</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 font-semibold text-on-surface-variant">Version</td>
                            <td class="py-3 px-4 font-data-mono">2.0.0-Secured</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 font-semibold text-on-surface-variant">Architecture</td>
                            <td class="py-3 px-4">Node.js / Express / Axios / Neon PostgreSQL</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 font-semibold text-on-surface-variant">Core Capabilities</td>
                            <td class="py-3 px-4 leading-relaxed">
                                • Passive Security Header Check<br>
                                • Source Code Leakage Detection<br>
                                • Secrets & API Key Exposure Alert<br>
                                • Automated Email Reporting<br>
                                • Ethical SSRF & Network Guardrails
                            </td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 font-semibold text-on-surface-variant">Developer</td>
                            <td class="py-3 px-4 font-bold text-on-surface">Kiran Mondal</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    res.send(generateLayout('ABOUT TRISCOUT', aboutContent));
});

// ==========================================
// ৮. পেজ রাউট: MY PROJECT (Original SVGs Restored)
// ==========================================
app.get('/project', (req, res) => {
    const projectContent = `
        <div class="max-w-6xl mx-auto">
            <!-- GitHub Profile Header -->
            <div class="glass-card rounded-2xl p-8 mb-10 flex flex-col items-center justify-center text-center relative overflow-hidden border border-primary/20 shadow-lg">
                <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <div class="p-1.5 rounded-full bg-gradient-to-tr from-primary to-emerald-400 mb-4 shadow-[0_0_20px_rgba(173,198,255,0.3)]">
                        <img src="https://github.com/Kiran-mondal.png" alt="Kiran Mondal" class="w-24 h-24 rounded-full border-4 border-background object-cover">
                    </div>
                    <h2 class="text-3xl font-bold text-on-surface tracking-wide uppercase mb-1">Kiran Mondal</h2>
                    <p class="text-on-surface-variant font-data-mono text-sm mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-emerald-400">code</span>
                        Full-Stack Developer & Cyber Security Enthusiast
                    </p>
                    <a href="https://github.com/Kiran-mondal" target="_blank" class="bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary px-6 py-2.5 rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 flex items-center gap-2 font-medium text-sm shadow-sm group">
                        <span class="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">open_in_new</span>
                        View GitHub Profile
                    </a>
                </div>
            </div>

            <!-- Projects Section Header -->
            <div class="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">public</span>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-on-surface">Live Web Projects</h3>
                    <p class="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Portfolio & Applications</p>
                </div>
            </div>
            
            <!-- Projects Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <!-- Project 1: Password Guard -->
                <div class="glass-card rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-ambient hover:border-primary/40 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="shrink-0 flex items-center justify-center w-10 h-10">
                            <svg width="34" height="34" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="512" height="512" rx="120" fill="#0D4FF0"/>
                                <path d="M256 80L120 140V240C120 330 176 407 256 432C336 407 392 330 392 240V140L256 80Z" fill="white"/>
                                <circle cx="256" cy="255" r="70" fill="#0D4FF0"/>
                                <rect x="235" y="240" width="42" height="75" rx="8" fill="white"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Password Guard</h3>
                    </div>
                    <p class="text-sm text-on-surface-variant flex-grow mb-6 leading-relaxed">Advanced AI-powered password protection & vault management tool with 3D Cyber UI.</p>
                    <div class="flex gap-3 mt-auto">
                        <a href="https://passwordguard.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary text-on-primary text-center py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors shadow-sm">Live App</a>
                        <a href="https://github.com/Kiran-mondal/Password-Guard" target="_blank" class="flex-1 border border-outline-variant text-on-surface text-center py-2 rounded-lg text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">Code</a>
                    </div>
                </div>
                
                <!-- Project 2: ZenDrift -->
                <div class="glass-card rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-ambient hover:border-primary/40 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="shrink-0 flex items-center justify-center w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34">
                                <path d="M 120 390 C 120 270, 392 350, 392 210 C 392 130, 310 90, 256 90" fill="none" stroke="#58a6ff" stroke-width="45" stroke-linecap="round" />
                                <circle cx="256" cy="90" r="45" fill="#58a6ff" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">ZenDrift</h3>
                    </div>
                    <p class="text-sm text-on-surface-variant flex-grow mb-6 leading-relaxed">Dynamic performance tracking system built for an engaging and smooth web experience.</p>
                    <div class="flex gap-3 mt-auto">
                        <a href="https://zendrift.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary text-on-primary text-center py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors shadow-sm">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 border border-outline-variant text-on-surface text-center py-2 rounded-lg text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">Code</a>
                    </div>
                </div>
                
                <!-- Project 3: Omlang -->
                <div class="glass-card rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-ambient hover:border-primary/40 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="shrink-0 flex items-center justify-center w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="34" height="34">
                                <path d="M 280 250 C 420 250, 420 380, 350 400 C 450 420, 450 580, 280 580" stroke="#00f2fe" stroke-width="45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="450" cy="120" r="30" fill="#00f2fe" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Omlang</h3>
                    </div>
                    <p class="text-sm text-on-surface-variant flex-grow mb-6 leading-relaxed">A modern language and communication-focused platform with an intuitive user interface.</p>
                    <div class="flex gap-3 mt-auto">
                        <a href="https://omlang.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary text-on-primary text-center py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors shadow-sm">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 border border-outline-variant text-on-surface text-center py-2 rounded-lg text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">Code</a>
                    </div>
                </div>
                
                <!-- Project 4: Chaturanga -->
                <div class="glass-card rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-ambient hover:border-primary/40 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="shrink-0 flex items-center justify-center w-10 h-10">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
                                <circle cx="50" cy="50" r="48" fill="#d97706" stroke="#ffffff" stroke-width="2"/>
                                <path d="M50 20 L75 55 L50 80 L25 55 Z" fill="#ffffff" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Chaturanga</h3>
                    </div>
                    <p class="text-sm text-on-surface-variant flex-grow mb-6 leading-relaxed">Interactive web-based application focused on deep logic, planning, and strategy.</p>
                    <div class="flex gap-3 mt-auto">
                        <a href="https://chaturanga.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary text-on-primary text-center py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors shadow-sm">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 border border-outline-variant text-on-surface text-center py-2 rounded-lg text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">Code</a>
                    </div>
                </div>

                <!-- Project 5: Pachisi -->
                <div class="glass-card rounded-xl p-6 flex flex-col group hover:-translate-y-1 hover:shadow-ambient hover:border-primary/40 transition-all duration-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="shrink-0 flex items-center justify-center w-10 h-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34">
                                <defs>
                                    <mask id="pasha-hole">
                                        <rect width="512" height="512" fill="white" />
                                        <circle cx="256" cy="256" r="32" fill="black" />
                                    </mask>
                                </defs>
                                <g mask="url(#pasha-hole)" fill="#dc2626">
                                    <rect x="232" y="16" width="48" height="480" rx="12" />
                                    <rect x="232" y="16" width="48" height="480" rx="12" transform="rotate(45 256 256)" />
                                    <rect x="232" y="16" width="48" height="480" rx="12" transform="rotate(90 256 256)" />
                                    <rect x="232" y="16" width="48" height="480" rx="12" transform="rotate(135 256 256)" />
                                    <circle cx="256" cy="256" r="168" fill="none" stroke="#dc2626" stroke-width="48" />
                                    <circle cx="256" cy="256" r="56" fill="none" stroke="#dc2626" stroke-width="48" />
                                </g>
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">Pachisi</h3>
                    </div>
                    <p class="text-sm text-on-surface-variant flex-grow mb-6 leading-relaxed">Play the ancient Indian epic board game of strategy, heritage, and royal culture.</p>
                    <div class="flex gap-3 mt-auto">
                        <a href="https://pachisi.quarry.dpdns.org" target="_blank" class="flex-1 bg-primary text-on-primary text-center py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors shadow-sm">Live App</a>
                        <a href="https://github.com/Kiran-mondal" target="_blank" class="flex-1 border border-outline-variant text-on-surface text-center py-2 rounded-lg text-sm font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">Code</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    res.send(generateLayout('MY PROJECTS', projectContent));
});

// ==========================================
// ৯. উন্নত প্যাসিভ স্ক্যানার API (Structured Checks + Score + Report)
// ==========================================
const scanCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute
const MAX_CACHE_SIZE = 1000;

const isPrivateIp = (ipStr) => {
    if (ipStr === '::1' || ipStr === '0.0.0.0' || ipStr === '::' || ipStr.startsWith('127.') || ipStr.startsWith('10.') || ipStr.startsWith('192.168.') || ipStr.startsWith('169.254.')) return true;
    if (ipStr.startsWith('172.')) {
        const secondOctet = parseInt(ipStr.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    const ipv6 = ipStr.toLowerCase();
    return ipv6.startsWith('fc') || ipv6.startsWith('fd') || ipv6.startsWith('fe8');
};
const secretRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|[A-Za-z0-9_]{40,})/;

app.post('/api/scan-headers', requireHTTPAuth, async (req, res) => {
    let { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;

    try {
        const parsedUrl = new URL(target);
        const hostname = parsedUrl.hostname;

        const lookupResult = await require('dns').promises.lookup(hostname);
        const ip = lookupResult.address;

        if (isPrivateIp(ip)) {
            return res.status(403).json({ success: false, error: 'Ethical Guardrail: Scanning internal or private network resources is strictly prohibited.' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format or host resolution failed' });
    }

    if (scanCache.has(target)) {
        const cached = scanCache.get(target);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ success: true, report: cached.report, score: cached.score, checks: cached.checks, _bolt_cached: true });
        } else {
            scanCache.delete(target);
        }
    }

    try {
        const response = await axios.get(target, {
            timeout: 10000,
            validateStatus: () => true,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            headers: {
                'User-Agent': 'TriScout-Ethical-Passive-Scanner/2.0 (+https://triscout.quarry.dpdns.org)'
            }
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        let report = `--- ETHICAL PASSIVE SECURITY ANALYSIS FOR: ${target} ---\n\n`;
        let score = 100;
        const checks = [];

        // 1. Error Handling Check
        if (htmlBody.includes('Stack trace:') || htmlBody.includes('SyntaxError:') || htmlBody.includes('SQL syntax')) {
            report += `[!] Error Handling: CRITICAL (Stack trace exposed!)\n`;
            score -= 20;
            checks.push({ name: 'Error Handling', status: 'CRITICAL', category: 'Source Leak', impact: '-20 pts', detail: 'Stack traces or SQL errors exposed in response body.' });
        } else {
            report += `[+] Error Handling: SECURE\n`;
            checks.push({ name: 'Error Handling', status: 'SECURE', category: 'Source Leak', impact: '0 pts', detail: 'No raw stack traces or database errors leaked.' });
        }

        // 2. Secrets Exposure Check
        if (htmlBody.includes('api_key') || secretRegex.test(htmlBody)) {
            report += `[!] Secrets Exposure: CRITICAL (Possible API Keys found)\n`;
            score -= 25;
            checks.push({ name: 'Secrets Exposure', status: 'CRITICAL', category: 'Credentials', impact: '-25 pts', detail: 'Potential API keys or secret tokens detected in HTML source.' });
        } else {
            report += `[+] Secrets Exposure: SECURE\n`;
            checks.push({ name: 'Secrets Exposure', status: 'SECURE', category: 'Credentials', impact: '0 pts', detail: 'No exposed API keys or secret tokens found in page source.' });
        }

        // 3. Rate Limiting Check
        if (headers['x-ratelimit-limit'] || headers['retry-after'] || headers['ratelimit-limit']) {
            report += `[+] Rate Limiting: SECURE\n`;
            checks.push({ name: 'Rate Limiting', status: 'SECURE', category: 'Traffic', impact: '0 pts', detail: 'Rate-limiting headers are actively enforced.' });
        } else {
            report += `[-] Rate Limiting: NOTICE (No public rate-limit header)\n`;
            score -= 5;
            checks.push({ name: 'Rate Limiting', status: 'NOTICE', category: 'Traffic', impact: '-5 pts', detail: 'No explicit rate-limit headers exposed (may be handled by WAF).' });
        }

        // 4. Tech Stack / Dependencies Exposure
        if (headers['x-powered-by']) {
            report += `[!] Dependencies: WARNING (Tech Stack Exposed: ${headers['x-powered-by']})\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: `Server exposes X-Powered-By (${headers['x-powered-by']}).` });
        } else if (htmlBody.includes('<meta name="generator" content="WordPress')) {
            report += `[!] Dependencies: WARNING (WordPress version exposed)\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: 'CMS generator version meta tag is publicly visible.' });
        } else {
            report += `[+] Dependencies: SECURE\n`;
            checks.push({ name: 'Tech Stack Hide', status: 'SECURE', category: 'Fingerprinting', impact: '0 pts', detail: 'X-Powered-By and generator tags are properly hidden.' });
        }

        report += `\n--- DEFENSIVE HTTP SECURITY HEADERS ---\n`;

        // 5. HSTS Header
        if (headers['strict-transport-security']) {
            report += `[+] HSTS (Strict-Transport-Security): SECURE\n`;
            checks.push({ name: 'HSTS Policy', status: 'SECURE', category: 'SSL/TLS', impact: '0 pts', detail: 'Enforces encrypted HTTPS connections against downgrade attacks.' });
        } else {
            report += `[!] HSTS (Strict-Transport-Security): MISSING\n`;
            score -= 10;
            checks.push({ name: 'HSTS Policy', status: 'MISSING', category: 'SSL/TLS', impact: '-10 pts', detail: 'Missing Strict-Transport-Security header.' });
        }

        // 6. CSP Header
        if (headers['content-security-policy']) {
            report += `[+] CSP (Content-Security-Policy): SECURE\n`;
            checks.push({ name: 'CSP Header', status: 'SECURE', category: 'XSS Defense', impact: '0 pts', detail: 'Content-Security-Policy is active to mitigate XSS injection.' });
        } else {
            report += `[!] CSP (Content-Security-Policy): MISSING\n`;
            score -= 10;
            checks.push({ name: 'CSP Header', status: 'MISSING', category: 'XSS Defense', impact: '-10 pts', detail: 'No Content-Security-Policy defined against script injection.' });
        }

        // 7. X-Frame-Options Header
        if (headers['x-frame-options']) {
            report += `[+] X-Frame-Options: SECURE\n`;
            checks.push({ name: 'X-Frame-Options', status: 'SECURE', category: 'Clickjacking', impact: '0 pts', detail: `Protected against iframe clickjacking (${headers['x-frame-options']}).` });
        } else {
            report += `[!] X-Frame-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'X-Frame-Options', status: 'MISSING', category: 'Clickjacking', impact: '-10 pts', detail: 'Site can be embedded in unauthorized external iframes.' });
        }

        // 8. X-Content-Type-Options Header
        if (headers['x-content-type-options']) {
            report += `[+] X-Content-Type-Options: SECURE\n`;
            checks.push({ name: 'MIME Sniffing', status: 'SECURE', category: 'Headers', impact: '0 pts', detail: 'Prevents browser MIME-type sniffing (nosniff).' });
        } else {
            report += `[!] X-Content-Type-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'MIME Sniffing', status: 'MISSING', category: 'Headers', impact: '-10 pts', detail: 'Missing X-Content-Type-Options: nosniff header.' });
        }

        if (score < 0) score = 0;
        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        if (scanCache.size >= MAX_CACHE_SIZE) {
            scanCache.clear();
        }
        scanCache.set(target, { report, score, checks, timestamp: Date.now() });

        res.json({ success: true, report, score, checks });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Target unreachable.' }); 
    }
});
                         
// ==========================================
// ১০. ইমেইল পাঠানোর API (Protected)
// ==========================================
app.post('/api/send-report', requireHTTPAuth, async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    if(!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: emailTo,
            subject: `[ALERT] TriScout Security Assessment: ${target}`,
            text: `TriScout Defensive Cyber Security System\n\nTarget Analyzed: ${target}\n\n${reportData}\n\n--------------------\nConfidential Report Generated by TriScout.`
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Internal Email Service Error.' }); 
    }
});

// ==========================================
// ১১. গিটহাব লগইন লজিক (PII Sanitized Logs)
// ==========================================
let isDbInitialized = false;

app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`);
});

app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code: code })
        });
        const tokenData = await tokenResponse.json();
        
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();

        // ----------------------------------------------------
        // NEON DATABASE SAVE LOGIC (Only for GitHub Users)
        // ----------------------------------------------------
        try {
            if (!isDbInitialized) {
                await sql`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(255) UNIQUE NOT NULL,
                        avatar_url TEXT,
                        provider VARCHAR(50),
                        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `;
                isDbInitialized = true;
            }
            await sql`
                INSERT INTO users (username, avatar_url, provider, last_login)
                VALUES (${userData.login}, ${userData.avatar_url}, 'github', NOW())
                ON CONFLICT (username) DO UPDATE 
                SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
            `;
            // SECURITY FIX: PII Cleaned Log (No real username printed in console)
            console.log(`[+] Saved GitHub user: [REDACTED] to Database`);
        } catch (dbError) {
            console.error("[-] Neon Database save failed.");
        }

        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } catch (error) { 
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); 
    }
});

// ==========================================
// ১২. পেজ রাউট: PROFILE SETTINGS (With Account Deletion UI & XSS Protection)
// ==========================================
app.get('/profile', (req, res) => {
    const profileContent = `
        <div class="max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined">manage_accounts</span> Account Profile
            </h2>

            <div class="glass-card rounded-xl p-6 md:p-8 mb-6 border border-primary/20 shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                    <div class="w-24 h-24 rounded-full bg-surface-variant flex items-center justify-center border-4 border-outline-variant/30 overflow-hidden shadow-xl" id="profileAvatar">
                        <span class="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                    </div>
                    
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="text-3xl font-bold text-on-surface mb-1" id="profileName">Loading...</h3>
                        <div class="flex items-center justify-center md:justify-start gap-2 text-sm text-on-surface-variant mb-4 font-data-mono uppercase">
                            <span class="material-symbols-outlined text-sm">shield_person</span>
                            <span id="profileRole">Checking access level...</span>
                        </div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/20 text-xs text-on-surface">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Account Status: Secured & Active
                        </div>
                    </div>
                </div>

                <hr class="border-outline-variant/20 my-6">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="profileActions">
                    <!-- Actions will be loaded dynamically via JS below -->
                </div>
            </div>
        </div>

        <script>
            async function deleteUserAccount() {
                if (!confirm("WARNING: Are you sure you want to permanently delete your account data from our database?")) return;
                
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
                    alert("Failed to communicate with the server.");
                }
            }

            document.addEventListener("DOMContentLoaded", () => {
                const token = localStorage.getItem('token');
                if (!token) return window.location.href = '/';

                try {
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    
                    document.getElementById('profileName').innerText = payload.user || "Unknown User";
                    document.getElementById('navProfileName').innerText = payload.user || "Admin";

                    const avatarEl = document.getElementById('profileAvatar');
                    const navAvatarEl = document.getElementById('navProfileAvatar');
                    const actionsEl = document.getElementById('profileActions');

                    if (payload.provider === 'github') {
                        document.getElementById('profileRole').innerText = "GitHub Authorized User";
                        if (payload.avatar && payload.avatar.startsWith('https://')) {
                            // SECURITY FIX: Safe DOM element creation instead of innerHTML to prevent XSS
                            const img1 = document.createElement('img');
                            img1.src = payload.avatar;
                            img1.alt = "Avatar";
                            img1.className = "w-full h-full object-cover";
                            avatarEl.innerHTML = '';
                            avatarEl.appendChild(img1);

                            const img2 = img1.cloneNode(true);
                            navAvatarEl.innerHTML = '';
                            navAvatarEl.appendChild(img2);
                        }
                        
                        actionsEl.innerHTML = \`
                            <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-on-surface text-sm">Database Sync</div>
                                    <div class="text-xs text-on-surface-variant mt-1">GitHub data synced to Neon DB.</div>
                                </div>
                                <span class="material-symbols-outlined text-emerald-400">cloud_done</span>
                            </div>
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="bg-surface-container hover:bg-surface-variant/50 border border-outline-variant/10 text-on-surface rounded-lg p-4 transition-colors flex items-center justify-center gap-2 text-sm font-bold w-full">
                                <span class="material-symbols-outlined text-sm">logout</span> SIGN OUT
                            </button>
                            <button onclick="deleteUserAccount()" class="md:col-span-2 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-lg p-4 transition-colors flex items-center justify-center gap-2 text-sm font-bold w-full">
                                <span class="material-symbols-outlined text-sm">delete_forever</span> DELETE MY ACCOUNT & DATA
                            </button>
                        \`;
                    } else {
                        document.getElementById('profileRole').innerText = "System Administrator (Local)";
                        const initial = (payload.user || "A").charAt(0).toUpperCase();
                        
                        const div1 = document.createElement('div');
                        div1.className = "w-full h-full flex items-center justify-center text-3xl font-bold bg-primary-container text-on-primary-container";
                        div1.innerText = initial;
                        avatarEl.innerHTML = '';
                        avatarEl.appendChild(div1);

                        const div2 = document.createElement('div');
                        div2.className = "w-full h-full flex items-center justify-center text-lg font-bold bg-primary-container text-on-primary-container";
                        div2.innerText = initial;
                        navAvatarEl.innerHTML = '';
                        navAvatarEl.appendChild(div2);
                        
                        actionsEl.innerHTML = \`
                            <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col justify-center">
                                <div class="font-medium text-on-surface text-sm flex items-center gap-2 mb-1">
                                    <span class="material-symbols-outlined text-sm">key</span> Local Account
                                </div>
                                <div class="text-xs text-on-surface-variant">Update password via Vercel Environment Variables.</div>
                            </div>
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="bg-surface-container hover:bg-error/10 border border-outline-variant/10 hover:border-error/30 text-error rounded-lg p-4 transition-colors flex items-center justify-center gap-2 text-sm font-bold w-full">
                                <span class="material-symbols-outlined text-sm">logout</span> SIGN OUT
                            </button>
                        \`;
                    }
                } catch(e) {
                    console.error("Profile rendering error");
                }
            });
        </script>
    `;
    res.send(generateLayout('USER PROFILE', profileContent));
});

// ==========================================
// ১৩. একাউন্ট ডিলিট ফ্লো (Data Privacy & Deletion API)
// ==========================================
app.post('/api/account/delete', requireHTTPAuth, async (req, res) => {
    try {
        const username = req.user.user;
        await sql`DELETE FROM users WHERE username = ${username}`;
        res.json({ success: true, message: "Your account and personal data have been permanently deleted from our database." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete account data." });
    }
});

// ==========================================
// ১৪. Google SEO Sitemap (sitemap.xml)
// ==========================================
app.get('/sitemap.xml', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org'; 
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${domain}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${domain}/about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${domain}/cli</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${domain}/project</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${domain}/dashboard</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${domain}/reports</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

// ==========================================
// ১৫. SEO Robots.txt
// ==========================================
app.get('/robots.txt', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org';
    const robots = `User-agent: *
Allow: /
Disallow: /profile
Disallow: /api/

Sitemap: ${domain}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

module.exports = app;
            
