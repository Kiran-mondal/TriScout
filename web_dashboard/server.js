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
// ১. ইমেইল ট্রান্সপোর্টার সেটআপ (Gmail)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS  
    }
});

// ==========================================
// ২. লগইন রাউট
// ==========================================
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Admin' && password === 'Admin') {
        const token = jwt.sign({ user: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } else {
        res.send(`
            <body style="background:#050505; color:red; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
                <div style="text-align:center; border:1px solid red; padding:40px; background:#0a0a0a;">
                    <h2>[!] ACCESS DENIED</h2>
                    <a href="/" style="color:#d4ff00; text-decoration:none;">> RETRY LOGIN</a>
                </div>
            </body>
        `);
    }
});

// ==========================================
// ৩. ড্যাশবোর্ড রাউট (ফ্রন্টএন্ড ইন্টারফেস)
// ==========================================
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TRISCOUT // COMMAND CENTER</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="header-container">
                <!-- লোগো এবং টাইটেল একসাথে রাখার জন্য Flexbox -->
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="/logo.svg" alt="TriScout Logo" style="width: 45px; height: 45px; filter: drop-shadow(0 0 8px rgba(212, 255, 0, 0.4));">
                    <h1>TRISCOUT <span style="font-size: 14px; color: var(--text-muted);">// ADVANCED DEFENSIVE ASSESSMENT</span></h1>
                </div>
                <button class="logout-btn" onclick="localStorage.removeItem('token'); window.location.href='/'">LOGOUT</button>
            </div>

            <div class="cyber-alert" style="border-left-color: var(--accent-green); background: rgba(212, 255, 0, 0.1); color: var(--accent-green);">
                SYSTEM STATUS: SECURE. ADVANCED PASSIVE SCANNER ONLINE.
            </div>

            <!-- স্ক্যানার টুল -->
            <div class="card">
                <h3>TARGET SCANNER</h3>
                <input type="text" id="targetInput" class="input-box" placeholder="ENTER DOMAIN (e.g. example.com)">
                <button onclick="startScan()" style="width: 100%;">INITIATE ADVANCED SCAN</button>

                <!-- টার্মিনাল আউটপুট -->
                <div style="background: #000; color: var(--accent-green); padding: 15px; border: 1px solid var(--border-color); height: 250px; overflow-y: auto; font-family: monospace; margin-top: 20px; font-size: 14px;" id="terminalOutput">
                    > Awaiting target input...
                </div>
            </div>

            <!-- রিপোর্টিং টুল -->
            <div class="card" id="reportSection" style="display: none; border-color: var(--accent-green);">
                <h3 style="color: var(--accent-green);">DISPATCH REPORT</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">Send the security assessment report directly to the site owner.</p>
                <input type="email" id="emailInput" class="input-box" placeholder="ENTER CLIENT EMAIL ADDRESS">
                <button onclick="sendReport()" style="width: 100%; background: #fff; color: #000; border-color: #fff;">SEND REPORT VIA GMAIL</button>
            </div>

            <script>
                let currentReport = "";

                async function startScan() {
                    const target = document.getElementById('targetInput').value;
                    const terminal = document.getElementById('terminalOutput');
                    if(!target) return alert('Enter a valid target domain!');
                    
                    document.getElementById('reportSection').style.display = 'none';
                    terminal.innerHTML = "> Initializing advanced security analysis for: " + target + "...<br>> Fetching HTTP headers and source code...<br><br>";
                    
                    try {
                        const response = await fetch('/api/scan-headers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ target: target })
                        });
                        
                        const data = await response.json();

                        if (data.success) {
                            currentReport = data.report;
                            const formattedReport = currentReport.replace(/\\n/g, '<br>');
                            terminal.innerHTML += formattedReport + "<br><br>> Analysis complete. Report ready for dispatch.";
                            
                            document.getElementById('reportSection').style.display = 'block';
                            window.scrollTo(0, document.body.scrollHeight);
                        } else {
                            terminal.innerHTML += "<span style='color: var(--danger-red);'>[!] ERROR: " + data.error + "</span>";
                        }
                    } catch (error) {
                        terminal.innerHTML += "<span style='color: var(--danger-red);'>[!] CRITICAL ERROR: Could not reach the scanning API.</span>";
                    }
                }

                async function sendReport() {
                    const email = document.getElementById('emailInput').value;
                    const target = document.getElementById('targetInput').value;
                    if(!email) return alert('Enter client email address!');

                    alert('Dispatching report to ' + email + '...');

                    try {
                        const response = await fetch('/api/send-report', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ target: target, reportData: currentReport, emailTo: email })
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
        </body>
        </html>
    `);
});

// ==========================================
// ৪. উন্নত প্যাসিভ স্ক্যানার API (Advanced Logic)
// ==========================================
app.post('/api/scan-headers', async (req, res) => {
    let { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
    }

    try {
        const response = await axios.get(target, { 
            timeout: 10000, 
            validateStatus: () => true 
        });
        
        const headers = response.headers;
        // সোর্স কোডকে স্ট্রিং-এ কনভার্ট করা হচ্ছে
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        let report = `--- ADVANCED SECURITY ANALYSIS FOR: ${target} ---\n\n`;
        let score = 100;

        // ১. Error Handling & Information Leakage Check
        if (htmlBody.includes('Stack trace:') || htmlBody.includes('SyntaxError:') || htmlBody.includes('SQL syntax')) {
            report += `[!] Error Handling: CRITICAL (Stack trace or database errors exposed in source code!)\n`;
            score -= 20;
        } else {
            report += `[+] Error Handling: SECURE (No visible internal errors)\n`;
        }

        // ২. Secrets Exposure Check (API Keys)
        const secretRegex = /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|[A-Za-z0-9_]{40,})/; 
        if (secretRegex.test(htmlBody) || htmlBody.includes('api_key')) {
            report += `[!] Secrets Exposure: WARNING (Possible API Keys or Tokens found in front-end HTML/JS)\n`;
            score -= 25;
        } else {
            report += `[+] Secrets Exposure: SECURE (No hardcoded API keys detected in plain text)\n`;
        }

        // ৩. Rate Limiting Check
        if (headers['x-ratelimit-limit'] || headers['retry-after']) {
            report += `[+] Rate Limiting: SECURE (Rate limiting headers detected)\n`;
        } else {
            report += `[-] Rate Limiting: UNKNOWN (No standard rate limit headers found. Active testing required)\n`;
            score -= 5;
        }

        // ৪. Dependency Vulnerabilities & Tech Stack
        if (headers['x-powered-by']) {
            report += `[-] Dependencies: WARNING (Tech Stack Exposed: ${headers['x-powered-by']})\n`;
            score -= 10;
        } else if (htmlBody.includes('<meta name="generator" content="WordPress')) {
            report += `[-] Dependencies: WARNING (WordPress version exposed. Check plugins for vulnerabilities)\n`;
            score -= 10;
        } else {
            report += `[+] Dependencies: SECURE (Tech stack & versions hidden)\n`;
        }

        report += `\n--- BASIC HTTP HEADERS ---\n`;

        // ৫. Basic Security Headers
        if (headers['strict-transport-security']) {
            report += `[+] HSTS: SECURE\n`;
        } else {
            report += `[!] HSTS: MISSING (Vulnerable to downgrade attacks)\n`;
            score -= 10;
        }

        if (headers['content-security-policy']) {
            report += `[+] CSP: SECURE\n`;
        } else {
            report += `[!] CSP: MISSING (Vulnerable to XSS)\n`;
            score -= 10;
        }

        if (headers['x-frame-options']) {
            report += `[+] X-Frame-Options: SECURE\n`;
        } else {
            report += `[!] X-Frame-Options: MISSING (Vulnerable to Clickjacking)\n`;
            score -= 10;
        }

        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        res.json({ success: true, report: report });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Target unreachable. It might be blocking automated security scanners.' });
    }
});

// ==========================================
// ৫. ইমেইল পাঠানোর API
// ==========================================
app.post('/api/send-report', async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    
    if(!target || !reportData || !emailTo) {
        return res.status(400).json({ success: false, error: "Missing information." });
    }

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
        res.status(500).json({ success: false, error: 'Internal Email Service Error. Check Vercel Variables.' });
    }
});

// ==========================================
// ৬. গিটহাব লগইন লজিক
// ==========================================
app.get('/api/auth/github', (req, res) => {
    const redirectUri = `https://${req.headers.host}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`;
    res.redirect(githubAuthUrl);
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
        const accessToken = tokenData.access_token;
        if (!accessToken) throw new Error('Failed to get access token');

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'TriScout-App' }
        });
        const userData = await userResponse.json();
        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url }, JWT_SECRET, { expiresIn: '1h' });

        res.send(`<script>localStorage.setItem('token', '${token}'); window.location.href = '/dashboard';</script>`);
    } catch (error) {
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>');
    }
});

module.exports = app;
        
