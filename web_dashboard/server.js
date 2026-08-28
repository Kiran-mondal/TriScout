const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost/placeholder');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ⚡ Bolt: Add maxAge caching to static assets to prevent redundant network requests
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));

// ==========================================
// ১. ইমেইল ট্রান্সপোর্টার সেটআপ
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
}); 

// ==========================================
// ২. মাল্টি-পেজ লেআউট ফাংশন (Dropdown & Mobile Menu Fixed)
// ==========================================
function generateLayout(pageTitle, content) {
    return `
    <!DOCTYPE html>
    <html class="dark" lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
        <title>TriScout - ${pageTitle}</title>
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
            /* Mobile menu transition */
            #mobileSidebar { transition: transform 0.3s ease-in-out; }
        </style>
    </head>
    <body class="bg-background text-on-surface font-body-md min-h-screen overflow-x-hidden">
        
        <!-- SideNavBar (Mobile Friendly) -->
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
                <!-- Close Button for Mobile -->
                <button onclick="toggleMenu()" class="md:hidden text-on-surface-variant p-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 mt-4">
                <a href="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg text-primary font-bold border-r-2 border-primary bg-surface-variant/20 hover:bg-surface-variant/40">
                    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">policy</span><span>Scanner</span>
                </a>
                <a href="/reports" class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant/50 transition-colors">
                    <span class="material-symbols-outlined text-outline-variant">list_alt</span><span>Reports</span>
                </a>
                <a href="/cli" class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant/50 transition-colors">
                    <span class="material-symbols-outlined text-outline-variant">terminal</span><span>CLI</span>
                </a>
                <a href="/project" class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-variant/50 transition-colors">
                    <span class="material-symbols-outlined text-outline-variant">work</span><span>My Projects</span>
                </a>
                <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="flex items-center gap-3 px-3 py-2 rounded-lg text-error font-medium hover:bg-error/10 transition-colors mt-auto mb-2 w-full text-left">
                    <span class="material-symbols-outlined text-error">logout</span><span>Logout</span>
                </button>
            </div>
        </nav>

        <!-- Overlay for Mobile Sidebar -->
        <div id="sidebarOverlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>

        <!-- Profile Dropdown Toggle -->
<button onclick="toggleDropdown()" class="flex items-center gap-2 hover:bg-surface-variant/50 py-1 px-2 rounded-lg transition-colors group focus:outline-none">
    <div id="navProfileAvatar" class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold overflow-hidden">
        <span class="material-symbols-outlined">person</span>
    </div>
    <span id="navProfileName" class="hidden sm:block text-on-surface font-medium capitalize group-hover:text-primary">Loading...</span>
    <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">arrow_drop_down</span>
</button>

<!-- Dropdown Menu Popup -->
<div id="profileDropdown" class="hidden absolute top-full right-0 mt-2 w-48 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-xl overflow-hidden z-50">
    <a href="/profile" class="flex items-center gap-2 px-4 py-3 text-sm text-on-surface hover:bg-surface-variant/50 border-b border-outline-variant/10 transition-colors">
        <span class="material-symbols-outlined text-sm">manage_accounts</span> Profile & Settings
    </a>
    <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors">
        <span class="material-symbols-outlined text-sm">logout</span> Logout Session
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
            // Mobile Menu Toggle Script
            function toggleMenu() {
                const sidebar = document.getElementById('mobileSidebar');
                const overlay = document.getElementById('sidebarOverlay');
                sidebar.classList.toggle('-translate-x-full');
                overlay.classList.toggle('hidden');
            }
            
            // Profile Dropdown Script
            function toggleDropdown() {
                const dropdown = document.getElementById('profileDropdown');
                dropdown.classList.toggle('hidden');
            }
            
            // Close dropdown if clicked outside
            window.onclick = function(event) {
                if (!event.target.closest('button[onclick="toggleDropdown()"]')) {
                    const dropdown = document.getElementById('profileDropdown');
                    if (dropdown && !dropdown.classList.contains('hidden')) {
                        dropdown.classList.add('hidden');
                    }
                }
            }
        </script>
    </body>
    </html>
    `;
}

// ==========================================
// ৩. লগইন রাউট (404 Error Fix)
// ==========================================
app.get('/login', (req, res) => {
    res.redirect('/');
});

const DEFAULT_ADMIN_USER = process.env.ADMIN_USERNAME || crypto.randomBytes(16).toString('hex');
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === DEFAULT_ADMIN_USER && password === DEFAULT_ADMIN_PASS) {
        // 'provider: local' যুক্ত করা হলো ডাটাবেজ ফিল্টারিংয়ের জন্য
        const token = jwt.sign({ user: DEFAULT_ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } else {
        res.send(`<script>alert("ACCESS DENIED"); window.location.href="/";</script>`);
    }
});

// ==========================================
// ৪. পেজ রাউট: SCANNER (Dummy Data Removed)
// ==========================================
app.get('/dashboard', (req, res) => {
    const scannerContent = `
        <!-- Main Scanner Card -->
        <div class="glass-card rounded-xl p-4 md:p-6 mb-6 border border-primary/20 shadow-lg">
            <h2 class="text-xl font-bold text-primary flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-2xl">radar</span> TARGET SCANNER
            </h2>
            
            <div class="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" id="targetInput" class="flex-1 bg-surface-container-highest border border-outline-variant/30 text-on-surface placeholder:text-outline-variant rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Enter target domain (e.g. example.com)" aria-label="Enter target domain">
                <button id="scanBtn" onclick="startScan()" class="bg-primary hover:bg-primary-container text-on-primary font-bold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span> INITIATE SCAN
                </button>
            </div>

            <!-- Terminal Output -->
            <div id="terminalOutput" class="bg-black/90 text-emerald-400 p-5 rounded-lg border border-outline-variant/30 h-80 overflow-y-auto font-data-mono text-sm shadow-inner hide-scrollbar leading-relaxed">
                > System ready.<br>> Awaiting target input for advanced security analysis...
            </div>
        </div>

        <!-- Dynamic Security Score & Empty Data Placeholders -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div class="glass-card rounded-xl p-5 md:col-span-8 flex flex-col relative overflow-hidden">
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
                    <h2 class="text-lg font-semibold text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">bug_report</span> Active Threats
                    </h2>
                    <span class="text-xs text-on-surface-variant" id="scanTargetLabel">No Target Scanned</span>
                </div>
                
                <!-- Zeroed Data (No confusing dummy numbers) -->
                <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 content-center">
                    <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <span class="text-error font-data-mono text-3xl font-light mb-1" id="countCrit">0</span>
                        <div class="flex items-center gap-1 text-xs text-on-surface-variant uppercase"><span class="w-2 h-2 rounded-full bg-error"></span> Critical</div>
                    </div>
                    <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <span class="text-orange-400 font-data-mono text-3xl font-light mb-1" id="countHigh">0</span>
                        <div class="flex items-center gap-1 text-xs text-on-surface-variant uppercase"><span class="w-2 h-2 rounded-full bg-orange-500"></span> High</div>
                    </div>
                    <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <span class="text-amber-400 font-data-mono text-3xl font-light mb-1" id="countMed">0</span>
                        <div class="flex items-center gap-1 text-xs text-on-surface-variant uppercase"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Medium</div>
                    </div>
                    <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                        <span class="text-emerald-400 font-data-mono text-3xl font-light mb-1" id="countLow">0</span>
                        <div class="flex items-center gap-1 text-xs text-on-surface-variant uppercase"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Low</div>
                    </div>
                </div>
            </div>

            <div class="glass-card rounded-xl p-5 md:col-span-4 flex flex-col justify-center items-center text-center">
                <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">shield_lock</span>
                <h3 class="text-lg font-bold text-on-surface mb-1">Asset Security Score</h3>
                <p class="text-sm text-on-surface-variant mb-4">Run a scan to calculate score.</p>
                <!-- Dynamic Score Circle -->
                <div class="w-24 h-24 rounded-full border-4 border-outline-variant/30 flex items-center justify-center text-2xl font-bold font-data-mono" id="scoreCircle">
                    --
                </div>
            </div>
        </div>

        <script>
            async function startScan() {
                const target = document.getElementById('targetInput').value;
                const terminal = document.getElementById('terminalOutput');
                const btn = document.getElementById('scanBtn');

                if(!target) return alert('Enter a valid target domain!');
                
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> SCANNING...';
                terminal.innerHTML = "> Initializing advanced security analysis for: " + target + "...<br>> Fetching HTTP headers and source code...<br><br>";
                
                // Reset visual data
                document.getElementById('scanTargetLabel').innerText = 'Scanning: ' + target;
                document.getElementById('scoreCircle').innerText = '--';
                document.getElementById('scoreCircle').className = "w-24 h-24 rounded-full border-4 border-outline-variant/30 flex items-center justify-center text-2xl font-bold font-data-mono text-on-surface-variant";

                try {
                    const response = await fetch('/api/scan-headers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target: target })
                    });
                    
                    const data = await response.json();

                    if (data.success) {
                        const formattedReport = data.report.replace(/\\n/g, '<br>');
                        terminal.innerHTML += formattedReport;
                        
                        localStorage.setItem('triscout_target', target);
                        localStorage.setItem('triscout_report', data.report);
                        
                        // Parse score from your backend response[span_0](start_span)[span_0](end_span)
                        const scoreMatch = data.report.match(/OVERALL SECURITY SCORE: (\\d+)/);
                        if(scoreMatch && scoreMatch[1]) {
                            const score = parseInt(scoreMatch[1]);
                            const circle = document.getElementById('scoreCircle');
                            circle.innerText = score;
                            if(score >= 80) circle.classList.replace('border-outline-variant/30', 'border-emerald-500');
                            else if(score >= 50) circle.classList.replace('border-outline-variant/30', 'border-amber-500');
                            else circle.classList.replace('border-outline-variant/30', 'border-error');
                        }

                        // Add small visual indication of found issues based on report text
                        if(data.report.includes('CRITICAL')) document.getElementById('countCrit').innerText = '1';
                        if(data.report.includes('WARNING')) document.getElementById('countHigh').innerText = '2';
                        if(data.report.includes('MISSING')) document.getElementById('countMed').innerText = '3';

                        terminal.innerHTML += "<br><br><span style='color: #fff;'>> Analysis complete. <a href='/reports' class='text-primary underline font-bold'>GO TO REPORTS TO DISPATCH</a></span>";
                        terminal.scrollTop = terminal.scrollHeight;
                    } else {
                        terminal.innerHTML += "<span class='text-error'>[!] ERROR: " + data.error + "</span>";
                    }
                } catch (error) {
                    terminal.innerHTML += "<span class='text-error'>[!] CRITICAL ERROR: Could not reach the scanning API.</span>";
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="material-symbols-outlined text-sm" style="font-variation-settings: \\'FILL\\' 1;">play_arrow</span> INITIATE SCAN';
                }
            }
        </script>
    `;
    res.send(generateLayout('COMMAND CENTER', scannerContent));
});

// ==========================================
// ৫. পেজ রাউট: REPORTS (Updated with New UI)
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
            // Your exact original JavaScript logic for Reports
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
                        headers: { 'Content-Type': 'application/json' },
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
        <div class="card">
            <h3 style="color: var(--accent-green);">TRISCOUT CLI EDITION</h3>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Take the power of TriScout to your terminal. Integrate passive security scans directly into your CI/CD pipelines or run them locally using our Command Line Interface.</p>
            
            <div style="background: #050505; padding: 20px; border: 1px dashed var(--border-color); font-family: monospace; color: var(--text-main); margin-bottom: 25px;">
                <span style="color: var(--text-muted);"># Install via NPM</span><br>
                <span style="color: var(--accent-green);">$</span> npm install -g @kiran-mondal/triscout<br><br>
                <span style="color: var(--text-muted);"># Run a quick scan</span><br>
                <span style="color: var(--accent-green);">$</span> triscout example.com
            </div>
            
            <button style="width: 100%;" onclick="window.open('https://github.com/Kiran-mondal/triscout/packages', '_blank')">VIEW PACKAGE ON GITHUB</button>
        </div>
    `;
    res.send(generateLayout('CLI TOOL', cliContent));
});

// ==========================================
// ৭. পেজ রাউট: ABOUT 
// ==========================================
app.get('/about', (req, res) => {
    const aboutContent = `
        <div class="card">
            <h3 style="color: var(--accent-green);">ABOUT TRISCOUT</h3>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">TriScout is an advanced defensive cybersecurity tool designed to help developers and system administrators perform passive vulnerability assessments without executing malicious payloads.</p>
            
            <table class="cyber-table">
                <tr>
                    <th>MODULE</th>
                    <th>SPECIFICATION</th>
                </tr>
                <tr>
                    <td>Project Name</td>
                    <td style="color: var(--accent-green); font-weight: bold;">TRISCOUT</td>
                </tr>
                <tr>
                    <td>Version</td>
                    <td>1.0.0-Beta</td>
                </tr>
                <tr>
                    <td>Architecture</td>
                    <td>Node.js / Express / Axios</td>
                </tr>
                <tr>
                    <td>Core Capabilities</td>
                    <td>
                        - Passive Security Header Check<br>
                        - Source Code Leakage Detection<br>
                        - Secrets & API Key Exposure Alert<br>
                        - Automated Email Reporting
                    </td>
                </tr>
                <tr>
                    <td>Developer</td>
                    <td>Kiran Mondal</td>
                </tr>
            </table>
        </div>
    `;
    res.send(generateLayout('ABOUT TRISCOUT', aboutContent));
});

// ==========================================
// ৮. পেজ রাউট: MY PROJECT
// ==========================================
app.get('/project', (req, res) => {
    const projectContent = `
        <style>
            .github-profile { text-align: center; margin-bottom: 35px; }
            .github-profile img { width: 110px; border-radius: 50%; border: 3px solid var(--accent-green); box-shadow: 0 0 15px rgba(212, 255, 0, 0.4); margin-bottom: 10px; }
            .github-profile h2 { margin: 0; color: var(--accent-green); letter-spacing: 2px; }
            .github-profile p { color: var(--text-muted); font-size: 14px; margin-bottom: 15px; }
            
            .btn-github-main { background: transparent; color: var(--text-main); border: 1px solid var(--border-color); padding: 10px 20px; text-decoration: none; font-size: 14px; display: inline-block; transition: 0.3s; font-weight: bold; }
            .btn-github-main:hover { border-color: var(--accent-green); color: var(--accent-green); box-shadow: inset 0 0 8px rgba(212, 255, 0, 0.2); }

            .section-header { border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin-bottom: 25px; }
            .section-header h3 { color: #fff; margin: 0; border: none; padding: 0; font-size: 1.2em; }
            .section-header h3::before { content: '> '; color: var(--accent-green); }
            
            .repo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
            .repo-card { background: #0a0a0a; border: 1px solid var(--border-color); padding: 25px; display: flex; flex-direction: column; transition: 0.3s; position: relative; }
            .repo-card:hover { border-color: var(--accent-green); transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.4); }
            
            .card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
            .card-header h3 { margin: 0; font-size: 1.1em; color: var(--text-main); border: none; padding: 0; }
            .card-header h3::before { content: ''; } 
            
            .repo-card p { color: var(--text-muted); font-size: 13px; line-height: 1.6; flex-grow: 1; margin-bottom: 20px; text-transform: none; }
            
            .card-buttons { display: flex; gap: 10px; }
            .card-buttons a { flex: 1; text-align: center; padding: 12px; text-decoration: none; font-size: 12px; font-weight: bold; transition: 0.3s; text-transform: uppercase; }
            .live-btn { background: var(--accent-green); color: #000; border: 1px solid var(--accent-green); }
            .live-btn:hover { background: #000; color: var(--accent-green); }
            .code-btn { background: transparent; color: var(--text-main); border: 1px solid var(--border-color); }
            .code-btn:hover { border-color: var(--text-main); background: var(--text-main); color: #000; }
        </style>

        <div class="github-profile">
            <img src="https://github.com/Kiran-mondal.png" alt="Kiran Mondal">
            <h2>KIRAN MONDAL</h2>
            <p>Full-Stack Developer & Cyber Security Enthusiast</p>
            <a href="https://github.com/Kiran-mondal" target="_blank" class="btn-github-main">
                View Full GitHub Profile
            </a>
        </div>

        <div class="section-header">
            <h3>My Live Web Projects</h3>
        </div>
        
        <div class="repo-grid">
            <!-- Project 1: Password Guard -->
            <div class="repo-card">
                <div class="card-header">
                    <svg width="34" height="34" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="512" height="512" rx="120" fill="#0D4FF0"/>
                        <path d="M256 80L120 140V240C120 330 176 407 256 432C336 407 392 330 392 240V140L256 80Z" fill="white"/>
                        <circle cx="256" cy="255" r="70" fill="#0D4FF0"/>
                        <rect x="235" y="240" width="42" height="75" rx="8" fill="white"/>
                    </svg>
                    <h3>Password Guard</h3>
                </div>
                <p>Advanced AI-powered password protection & vault management tool with 3D Cyber UI.</p>
                <div class="card-buttons">
                    <a href="https://passwordguard.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal/Password-Guard" target="_blank" class="code-btn">Source Code</a>
                </div>
            </div>
            
            <!-- Project 2: ZenDrift -->
            <div class="repo-card">
                <div class="card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34">
                        <path d="M 120 390 C 120 270, 392 350, 392 210 C 392 130, 310 90, 256 90" fill="none" stroke="#58a6ff" stroke-width="45" stroke-linecap="round" />
                        <circle cx="256" cy="90" r="45" fill="#58a6ff" />
                    </svg>
                    <h3>ZenDrift</h3>
                </div>
                <p>Dynamic performance tracking system built for an engaging and smooth web experience.</p>
                <div class="card-buttons">
                    <a href="https://zendrift.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal" target="_blank" class="code-btn">Source Code</a>
                </div>
            </div>
            
            <!-- Project 3: Omlang -->
            <div class="repo-card">
                <div class="card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="34" height="34">
                        <path d="M 280 250 C 420 250, 420 380, 350 400 C 450 420, 450 580, 280 580" stroke="#00f2fe" stroke-width="45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="450" cy="120" r="30" fill="#00f2fe" />
                    </svg>
                    <h3>Omlang</h3>
                </div>
                <p>A modern language and communication-focused platform with an intuitive user interface.</p>
                <div class="card-buttons">
                    <a href="https://omlang.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal" target="_blank" class="code-btn">Source Code</a>
                </div>
            </div>
            
            <!-- Project 4: Chaturanga -->
            <div class="repo-card">
                <div class="card-header">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
                        <circle cx="50" cy="50" r="48" fill="#d97706" stroke="#ffffff" stroke-width="2"/>
                        <path d="M50 20 L75 55 L50 80 L25 55 Z" fill="#ffffff" />
                    </svg>
                    <h3>Chaturanga</h3>
                </div>
                <p>Interactive web-based application focused on deep logic, planning, and strategy.</p>
                <div class="card-buttons">
                    <a href="https://chaturanga.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal" target="_blank" class="code-btn">Source Code</a>
                </div>
             </div>

            <!-- Project 5: Pachisi -->
            <div class="repo-card">
                <div class="card-header">
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
                    <h3>Pachisi</h3>
                </div>
                <p>Play the ancient Indian epic board game of strategy, heritage, and royal culture.</p>
                <div class="card-buttons">
                    <a href="https://pachisi.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal" target="_blank" class="code-btn">Source Code</a>
                </div>
            </div>

            <!-- Project 6: TriScout -->
            <div class="repo-card">
                <div class="card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="34" height="34">
                        <g fill="none" stroke="#66ED1E" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="50,2 91.6,26 91.6,74 50,98 8.4,74 8.4,26" stroke-width="1.5" />
                            <polygon points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30" stroke-width="3" />
                            <g stroke-width="2.5">
                                <line x1="15.4" y1="30" x2="84.6" y2="70" />
                                <line x1="32.7" y1="20" x2="84.6" y2="50" />
                                <line x1="15.4" y1="50" x2="67.3" y2="80" />
                                <line x1="15.4" y1="50" x2="67.3" y2="20" />
                                <line x1="32.7" y1="80" x2="84.6" y2="50" />
                            </g>
                        </g>
                    </svg>
                    <h3>TriScout</h3>
                </div>
                <p>An advanced defensive cybersecurity tool designed for passive vulnerability assessments.</p>
                <div class="card-buttons">
                    <a href="https://triscout.quarry.dpdns.org" target="_blank" class="live-btn">Live App</a>
                    <a href="https://github.com/Kiran-mondal/tri-scout" target="_blank" class="code-btn">Source Code</a>
                </div>
            </div>

        </div>
    `;
    res.send(generateLayout('MY PROJECTS', projectContent));
});

// ==========================================
// ৯. উন্নত প্যাসিভ স্ক্যানার API
// ==========================================
const scanCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute
const MAX_CACHE_SIZE = 1000;

app.post('/api/scan-headers', async (req, res) => {
    let { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;

    try {
        const parsedUrl = new URL(target);
        const hostname = parsedUrl.hostname;

        // Advanced SSRF protection: resolve hostname to IP to prevent DNS rebinding/nip.io bypasses
        const lookupResult = await require('dns').promises.lookup(hostname);
        const ip = lookupResult.address;

        const isPrivateIp = (ipStr) => {
            if (ipStr === '::1' || ipStr === '0.0.0.0' || ipStr === '::' || ipStr.startsWith('127.') || ipStr.startsWith('10.') || ipStr.startsWith('192.168.') || ipStr.startsWith('169.254.')) return true;
            if (ipStr.startsWith('172.')) {
                const secondOctet = parseInt(ipStr.split('.')[1], 10);
                if (secondOctet >= 16 && secondOctet <= 31) return true;
            }
            const ipv6 = ipStr.toLowerCase();
            return ipv6.startsWith('fc') || ipv6.startsWith('fd') || ipv6.startsWith('fe8');
        };

        if (isPrivateIp(ip)) {
            return res.status(403).json({ success: false, error: 'Access to internal network resources is prohibited' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format or host resolution failed' });
    }

    // ⚡ Bolt: Check in-memory cache to avoid redundant external network requests and expensive regex parsing
    if (scanCache.has(target)) {
        const cached = scanCache.get(target);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ success: true, report: cached.report, _bolt_cached: true });
        } else {
            scanCache.delete(target);
        }
    }

    try {
        // ⚡ Bolt: Added payload limits (5MB) to avoid memory exhaustion and speed up requests by aborting early on huge files. Added compression support.
        const response = await axios.get(target, {
            timeout: 10000,
            validateStatus: () => true,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        // Error Fix: Removed backslash escape from template literals
        let report = `--- ADVANCED SECURITY ANALYSIS FOR: ${target} ---\n\n`;
        let score = 100;

        if (htmlBody.includes('Stack trace:') || htmlBody.includes('SyntaxError:') || htmlBody.includes('SQL syntax')) {
            report += `[!] Error Handling: CRITICAL (Stack trace exposed!)\n`; score -= 20;
        } else { report += `[+] Error Handling: SECURE\n`; }

        const secretRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|[A-Za-z0-9_]{40,})/; 
        if (secretRegex.test(htmlBody) || htmlBody.includes('api_key')) {
            report += `[!] Secrets Exposure: WARNING (Possible API Keys found)\n`; score -= 25;
        } else { report += `[+] Secrets Exposure: SECURE\n`; }

        if (headers['x-ratelimit-limit'] || headers['retry-after']) {
            report += `[+] Rate Limiting: SECURE\n`;
        } else {
            report += `[-] Rate Limiting: UNKNOWN (Active testing required)\n`; score -= 5;
        }

        if (headers['x-powered-by']) {
            report += `[-] Dependencies: WARNING (Tech Stack Exposed: ${headers['x-powered-by']})\n`; score -= 10;
        } else if (htmlBody.includes('<meta name="generator" content="WordPress')) {
            report += `[-] Dependencies: WARNING (WordPress version exposed)\n`; score -= 10;
        } else { report += `[+] Dependencies: SECURE\n`; }

        report += `\n--- BASIC HTTP HEADERS ---\n`;

        if (headers['strict-transport-security']) { report += `[+] HSTS: SECURE\n`; } 
        else { report += `[!] HSTS: MISSING\n`; score -= 10; }

        if (headers['content-security-policy']) { report += `[+] CSP: SECURE\n`; } 
        else { report += `[!] CSP: MISSING\n`; score -= 10; }

        if (headers['x-frame-options']) { report += `[+] X-Frame-Options: SECURE\n`; } 
        else { report += `[!] X-Frame-Options: MISSING\n`; score -= 10; }

        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        // ⚡ Bolt: Cache the final report, evicting if too large
        if (scanCache.size >= MAX_CACHE_SIZE) {
            scanCache.clear();
        }
        scanCache.set(target, { report, timestamp: Date.now() });

        res.json({ success: true, report: report });
    } catch (error) { res.status(500).json({ success: false, error: 'Target unreachable.' }); }
});
// ==========================================
// ১০. ইমেইল পাঠানোর API
// ==========================================
app.post('/api/send-report', async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    if(!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: emailTo,
            // Error Fix: Removed backslash escape from template literals
            subject: `[ALERT] TriScout Security Assessment: ${target}`,
            text: `TriScout Defensive Cyber Security System\n\nTarget Analyzed: ${target}\n\n${reportData}\n\n--------------------\nConfidential Report Generated by TriScout.`
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) { res.status(500).json({ success: false, error: 'Internal Email Service Error.' }); }
});

// ==========================================
// ১১. গিটহাব লগইন লজিক
// ==========================================
app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    // Error Fix: Removed backslash escape from template literals
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
            // ১. টেবিল না থাকলে অটোমেটিক তৈরি করে নেবে
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    avatar_url TEXT,
                    provider VARCHAR(50),
                    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            // ২. ইউজারের ডাটা সেভ বা আপডেট করবে
            await sql`
                INSERT INTO users (username, avatar_url, provider, last_login)
                VALUES (${userData.login}, ${userData.avatar_url}, 'github', NOW())
                ON CONFLICT (username) DO UPDATE 
                SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
            `;
            console.log(`[+] Saved GitHub user: ${userData.login} to Database`);
        } catch (dbError) {
            console.error("[-] Neon Database save failed:", dbError);
            // ডাটাবেজ ফেল করলেও যেন লগইন আটকে না যায়
        }

        // টোকেনে provider: 'github' যুক্ত করা হলো
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } catch (error) { 
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); 
    }
});


// ==========================================
// ১২. পেজ রাউট: PROFILE SETTINGS
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
            document.addEventListener("DOMContentLoaded", () => {
                const token = localStorage.getItem('token');
                if (!token) return window.location.href = '/';

                try {
                    // JWT Token Decode করা হচ্ছে
                    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                    
                    document.getElementById('profileName').innerText = payload.user || "Unknown User";
                    document.getElementById('navProfileName').innerText = payload.user || "Admin";

                    const avatarEl = document.getElementById('profileAvatar');
                    const navAvatarEl = document.getElementById('navProfileAvatar');
                    const actionsEl = document.getElementById('profileActions');

                    if (payload.provider === 'github') {
                        document.getElementById('profileRole').innerText = "GitHub Authorized User";
                        if (payload.avatar) {
                            const imgHtml = '<img src="' + payload.avatar + '" alt="Avatar" class="w-full h-full object-cover">';
                            avatarEl.innerHTML = imgHtml;
                            navAvatarEl.innerHTML = imgHtml;
                        }
                        
                        actionsEl.innerHTML = \`
                            <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-on-surface text-sm">Database Sync</div>
                                    <div class="text-xs text-on-surface-variant mt-1">GitHub data synced to Neon DB.</div>
                                </div>
                                <span class="material-symbols-outlined text-emerald-400">cloud_done</span>
                            </div>
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="bg-surface-container hover:bg-error/10 border border-outline-variant/10 hover:border-error/30 text-error rounded-lg p-4 transition-colors flex items-center justify-center gap-2 text-sm font-bold w-full">
                                <span class="material-symbols-outlined text-sm">logout</span> SIGN OUT
                            </button>
                        \`;
                    } else {
                        // Local Admin Logic
                        document.getElementById('profileRole').innerText = "System Administrator (Local)";
                        const initial = payload.user.charAt(0).toUpperCase();
                        const initialHtml = '<div class="w-full h-full flex items-center justify-center text-3xl font-bold bg-primary-container text-on-primary-container">' + initial + '</div>';
                        avatarEl.innerHTML = initialHtml;
                        navAvatarEl.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg font-bold bg-primary-container text-on-primary-container">' + initial + '</div>';
                        
                        actionsEl.innerHTML = \`
                            <div class="bg-surface-container/50 border border-outline-variant/10 rounded-lg p-4 flex flex-col justify-center">
                                <div class="font-medium text-on-surface text-sm flex items-center gap-2 mb-1">
                                    <span class="material-symbols-outlined text-sm">key</span> Local Account
                                </div>
                                <div class="text-xs text-on-surface-variant">Update password via .env file. Data not saved to cloud DB.</div>
                            </div>
                            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="bg-surface-container hover:bg-error/10 border border-outline-variant/10 hover:border-error/30 text-error rounded-lg p-4 transition-colors flex items-center justify-center gap-2 text-sm font-bold w-full">
                                <span class="material-symbols-outlined text-sm">logout</span> SIGN OUT
                            </button>
                        \`;
                    }
                } catch(e) {
                    console.error("Profile rendering error", e);
                }
            });
        </script>
    `;
    res.send(generateLayout('USER PROFILE', profileContent));
});

module.exports = app;
