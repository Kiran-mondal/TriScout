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
// ২. মাল্টি-পেজ লেআউট ফাংশন (Navbar Updated)
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
        <!-- ট্রান্সপারেন্ট হাইড মেনুবার -->
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
// ৩. লগইন রাউট
// ==========================================
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
// ৪. পেজ রাউট: SCANNER (প্রথম পেজ)
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
// ৫. পেজ রাউট: REPORTS (দ্বিতীয় পেজ)
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
// ৬. পেজ রাউট: CLI DOWNLOAD (নতুন পেজ)
// ==========================================
app.get('/cli', (req, res) => {
    const cliContent = `
        <div class="card">
            <h3 style="color: var(--accent-green);">TRISCOUT CLI EDITION</h3>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Take the power of TriScout to your terminal. Integrate passive security scans directly into your CI/CD pipelines or run them locally using our Command Line Interface.</p>
            
            <div style="background: #050505; padding: 20px; border: 1px dashed var(--border-color); font-family: monospace; color: var(--text-main); margin-bottom: 25px;">
                <span style="color: var(--text-muted);"># Install via NPM</span><br>
                <span style="color: var(--accent-green);">$</span> npm install -g triscout-cli<br><br>
                <span style="color: var(--text-muted);"># Run a quick scan</span><br>
                <span style="color: var(--accent-green);">$</span> triscout scan example.com
            </div>
            
            <button style="width: 100%;" onclick="alert('CLI Package download will be available in the next release!')">DOWNLOAD CLI BINARY (v1.0.0)</button>
        </div>
    `;
    res.send(generateLayout('CLI TOOL', cliContent));
});

// ==========================================
// ৭. পেজ রাউট: MY PROJECT (নতুন পেজ)
// ==========================================
app.get('/project', (req, res) => {
    const projectContent = `
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
                    <td>TriScout Admin</td>
                </tr>
            </table>
        </div>
    `;
    res.send(generateLayout('PROJECT DETAILS', projectContent));
});

// ==========================================
// ৮. উন্নত প্যাসিভ স্ক্যানার API
// ==========================================
app.post('/api/scan-headers', async (req, res) => {
    let { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;

    try {
        const response = await axios.get(target, { timeout: 10000, validateStatus: () => true });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        let report = \`--- ADVANCED SECURITY ANALYSIS FOR: \${target} ---\\n\\n\`;
        let score = 100;

        if (htmlBody.includes('Stack trace:') || htmlBody.includes('SyntaxError:') || htmlBody.includes('SQL syntax')) {
            report += \`[!] Error Handling: CRITICAL (Stack trace exposed!)\\n\`; score -= 20;
        } else { report += \`[+] Error Handling: SECURE\\n\`; }

        const secretRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|[A-Za-z0-9_]{40,})/; 
        if (secretRegex.test(htmlBody) || htmlBody.includes('api_key')) {
            report += \`[!] Secrets Exposure: WARNING (Possible API Keys found)\\n\`; score -= 25;
        } else { report += \`[+] Secrets Exposure: SECURE\\n\`; }

        if (headers['x-ratelimit-limit'] || headers['retry-after']) {
            report += \`[+] Rate Limiting: SECURE\\n\`;
        } else {
            report += \`[-] Rate Limiting: UNKNOWN (Active testing required)\\n\`; score -= 5;
        }

        if (headers['x-powered-by']) {
            report += \`[-] Dependencies: WARNING (Tech Stack Exposed: \${headers['x-powered-by']})\\n\`; score -= 10;
        } else if (htmlBody.includes('<meta name="generator" content="WordPress')) {
            report += \`[-] Dependencies: WARNING (WordPress version exposed)\\n\`; score -= 10;
        } else { report += \`[+] Dependencies: SECURE\\n\`; }

        report += \`\\n--- BASIC HTTP HEADERS ---\\n\`;

        if (headers['strict-transport-security']) { report += \`[+] HSTS: SECURE\\n\`; } 
        else { report += \`[!] HSTS: MISSING\\n\`; score -= 10; }

        if (headers['content-security-policy']) { report += \`[+] CSP: SECURE\\n\`; } 
        else { report += \`[!] CSP: MISSING\\n\`; score -= 10; }

        if (headers['x-frame-options']) { report += \`[+] X-Frame-Options: SECURE\\n\`; } 
        else { report += \`[!] X-Frame-Options: MISSING\\n\`; score -= 10; }

        report += \`\\nOVERALL SECURITY SCORE: \${score}/100\`;
        res.json({ success: true, report: report });
    } catch (error) { res.status(500).json({ success: false, error: 'Target unreachable.' }); }
});

// ==========================================
// ৯. ইমেইল পাঠানোর API
// ==========================================
app.post('/api/send-report', async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    if(!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: emailTo,
            subject: \`[ALERT] TriScout Security Assessment: \${target}\`,
            text: \`TriScout Defensive Cyber Security System\\n\\nTarget Analyzed: \${target}\\n\\n\${reportData}\\n\\n--------------------\\nConfidential Report Generated by TriScout.\`
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) { res.status(500).json({ success: false, error: 'Internal Email Service Error.' }); }
});

// ==========================================
// ১০. গিটহাব লগইন লজিক
// ==========================================
app.get('/api/auth/github', (req, res) => {
    const redirectUri = \`https://\${req.headers.host}/api/auth/github/callback\`;
    res.redirect(\`https://github.com/login/oauth/authorize?client_id=\${GITHUB_CLIENT_ID}&redirect_uri=\${redirectUri}&scope=read:user\`);
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
            headers: { 'Authorization': \`Bearer \${tokenData.access_token}\`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url }, JWT_SECRET, { expiresIn: '1h' });
        res.send(\`<script>localStorage.setItem('token', '\${token}'); window.location.href = '/dashboard';</script>\`);
    } catch (error) { res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); }
});

module.exports = app;
