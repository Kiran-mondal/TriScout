const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');
const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// ১. ইমেইল ট্রান্সপোর্টার সেটআপ
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

// ==========================================
// ২. মাল্টি-পেজ লেআউট ফাংশন
// ==========================================
function generateLayout(pageTitle, content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>TRISCOUT // ${pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <nav class="cyber-navbar">
            <div class="nav-brand">
                <img src="/logo.svg" alt="TriScout Logo" class="brand-logo">
                <h1 class="brand-title">TRISCOUT</h1>
            </div>
            
            <div class="menu-toggle" onclick="toggleMenu()">☰</div>
            
            <div class="nav-links" id="navMenu">
                <a href="/dashboard" class="nav-link">> SCANNER</a>
                <a href="/reports" class="nav-link">> REPORTS</a>
                <a href="/cli" class="nav-link">> CLI</a>
                <a href="/about" class="nav-link">> ABOUT</a>
                <a href="/project" class="nav-link">> MY PROJECT</a>
                <button class="logout-btn" onclick="localStorage.removeItem('token'); window.location.href='/'">LOGOUT</button>
            </div>
        </nav>

        <div class="content-wrapper">
            ${content}
        </div>

        <script>
            function toggleMenu() {
                document.getElementById('navMenu').classList.toggle('active');
            }
        </script>
    </body>
    </html>
    `;
}

// ==========================================
// ৩. লগইন রাউট (404 Error Fix)
// ==========================================
// কেউ সরাসরি /login-এ গেলে তাকে হোমপেজে রিডাইরেক্ট করবে
app.get('/login', (req, res) => {
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Admin' && password === 'Admin') {
        const token = jwt.sign({ user: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } else {
        res.send(`<script>alert("ACCESS DENIED"); window.location.href="/";</script>`);
    }
});

// ==========================================
// ৪. পেজ রাউট: SCANNER
// ==========================================
app.get('/dashboard', (req, res) => {
    const scannerContent = `
        <div class="cyber-alert" style="border-left-color: var(--accent-green); background: rgba(212, 255, 0, 0.1); color: var(--accent-green);">
            SYSTEM STATUS: SECURE. ADVANCED PASSIVE SCANNER ONLINE.
        </div>

        <div class="card">
            <h3>TARGET SCANNER</h3>
            <input type="text" id="targetInput" class="input-box" placeholder="ENTER DOMAIN (e.g. example.com)">
            <button onclick="startScan()" style="width: 100%;">INITIATE ADVANCED SCAN</button>

            <div style="background: #000; color: var(--accent-green); padding: 15px; border: 1px solid var(--border-color); height: 250px; overflow-y: auto; font-family: monospace; margin-top: 20px; font-size: 14px;" id="terminalOutput">
                > Awaiting target input...
            </div>
        </div>

        <script>
            async function startScan() {
                const target = document.getElementById('targetInput').value;
                const terminal = document.getElementById('terminalOutput');
                if(!target) return alert('Enter a valid target domain!');
                
                terminal.innerHTML = "> Initializing advanced security analysis for: " + target + "...<br>> Fetching HTTP headers and source code...<br><br>";
                
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
                        
                        terminal.innerHTML += "<br><br><span style='color: #fff;'>> Analysis complete. <a href='/reports' style='color: var(--danger-red); font-weight: bold;'>GO TO REPORTS TO DISPATCH</a></span>";
                        window.scrollTo(0, document.body.scrollHeight);
                    } else {
                        terminal.innerHTML += "<span style='color: var(--danger-red);'>[!] ERROR: " + data.error + "</span>";
                    }
                } catch (error) {
                    terminal.innerHTML += "<span style='color: var(--danger-red);'>[!] CRITICAL ERROR: Could not reach the scanning API.</span>";
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
        <div class="card" style="border-color: var(--accent-green);">
            <h3 style="color: var(--accent-green);">DISPATCH REPORT</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">Send the last generated security assessment report directly to the site owner.</p>
            
            <div id="reportPreview" style="background: #000; color: #888; padding: 15px; margin-bottom: 20px; font-family: monospace; font-size: 13px; border: 1px dashed #333; height: 150px; overflow-y: auto;">
                Checking for saved reports...
            </div>

            <input type="email" id="emailInput" class="input-box" placeholder="ENTER CLIENT EMAIL ADDRESS">
            <button onclick="sendReport()" style="width: 100%; background: #fff; color: #000; border-color: #fff;">SEND REPORT VIA GMAIL</button>
        </div>

        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const savedReport = localStorage.getItem('triscout_report');
                const savedTarget = localStorage.getItem('triscout_target');
                const preview = document.getElementById('reportPreview');

                if(savedReport && savedTarget) {
                    preview.innerHTML = "<span style='color: var(--accent-green);'>TARGET: " + savedTarget + "</span><br><br>" + savedReport.replace(/\\n/g, '<br>');
                } else {
                    preview.innerHTML = "<span style='color: var(--danger-red);'>NO RECENT SCAN DATA FOUND. GO TO SCANNER FIRST.</span>";
                }
            });

            async function sendReport() {
                const email = document.getElementById('emailInput').value;
                const target = localStorage.getItem('triscout_target');
                const reportData = localStorage.getItem('triscout_report');

                if(!email) return alert('Enter client email address!');
                if(!reportData || !target) return alert('No report found! Please run a scan first.');

                alert('Dispatching report to ' + email + '...');

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
        const response = await axios.get(target, { timeout: 10000, validateStatus: () => true });
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
            // Error Fix: Removed backslash escape from template literals
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url }, JWT_SECRET, { expiresIn: '1h' });
        // Error Fix: Removed backslash escape from template literals
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } catch (error) { res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); }
});

module.exports = app;
