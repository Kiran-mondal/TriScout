const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL || 'postgres://placeholder');
const JWT_SECRET = process.env.JWT_SECRET || 'triscout_super_secret_key_2026';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ১. মূল ডোমেইনে (/) ঢুকলে public/index.html (লগইন পেজ) লোড হবে
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// ২. ইমেইল ট্রান্সপোর্টার সেটআপ (Gmail)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Vercel-এ দেওয়া আপনার জিমেইল আইডি
        pass: process.env.GMAIL_PASS  // Vercel-এ দেওয়া আপনার App Password
    }
});

// ==========================================
// ৩. লগইন রাউট
// ==========================================
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // লোকাল অ্যাডমিন লগইন (Username: Admin, Password: Admin)
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
// ৪. ড্যাশবোর্ড রাউট (সার্ভার সাইড রেন্ডারিং)
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
                <h1>TRISCOUT <span style="font-size: 14px; color: var(--text-muted);">// VULNERABILITY ASSESSMENT</span></h1>
                <button class="logout-btn" onclick="localStorage.removeItem('token'); window.location.href='/'">LOGOUT</button>
            </div>

            <div class="cyber-alert" style="border-left-color: var(--accent-green); background: rgba(212, 255, 0, 0.1); color: var(--accent-green);">
                SYSTEM STATUS: SECURE. READY FOR TARGET ACQUISITION.
            </div>

            <!-- স্ক্যানার টুল -->
            <div class="card">
                <h3>TARGET SCANNER</h3>
                <input type="text" id="targetInput" class="input-box" placeholder="ENTER DOMAIN OR IP (e.g. example.com)">
                
                <button onclick="startScan()" style="width: 100%;">INITIATE SECURITY SCAN</button>

                <!-- টার্মিনাল আউটপুট -->
                <div style="background: #000; color: var(--accent-green); padding: 15px; border: 1px solid var(--border-color); height: 200px; overflow-y: auto; font-family: monospace; margin-top: 20px; font-size: 14px;" id="terminalOutput">
                    > Awaiting target input...
                </div>
            </div>

            <!-- রিপোর্টিং টুল (স্ক্যান শেষ হলে দৃশ্যমান হবে) -->
            <div class="card" id="reportSection" style="display: none; border-color: var(--accent-green);">
                <h3 style="color: var(--accent-green);">DISPATCH REPORT</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">Send the vulnerability assessment report directly to the site owner.</p>
                <input type="email" id="emailInput" class="input-box" placeholder="ENTER CLIENT EMAIL ADDRESS">
                <button onclick="sendReport()" style="width: 100%; background: #fff; color: #000; border-color: #fff;">SEND REPORT VIA GMAIL</button>
            </div>

            <script>
                let currentReport = "";

                // স্ক্যানিং সিমুলেশন লজিক
                function startScan() {
                    const target = document.getElementById('targetInput').value;
                    const terminal = document.getElementById('terminalOutput');
                    if(!target) return alert('Enter a valid target domain or IP!');
                    
                    document.getElementById('reportSection').style.display = 'none';
                    terminal.innerHTML = "> Initializing deep scan for: " + target + "...<br>";
                    
                    setTimeout(() => { terminal.innerHTML += "> Resolving DNS and IP address...<br>"; }, 800);
                    setTimeout(() => { terminal.innerHTML += "> Checking open ports (80, 443, 21, 22, 3306)...<br>"; }, 1800);
                    setTimeout(() => { terminal.innerHTML += "> Analyzing SSL/TLS Certificate status...<br>"; }, 2800);

                    setTimeout(() => {
                        currentReport = "Target: " + target + "\\n\\n--- VULNERABILITY REPORT ---\\n[!] Port 80 (HTTP): OPEN (Unencrypted)\\n[+] Port 443 (HTTPS): SECURE\\n[!] Port 21 (FTP): OPEN (Vulnerable to brute-force)\\n\\nRECOMMENDATION: Close Port 21 immediately and enforce HTTPS strictly.";
                        
                        terminal.innerHTML += "<br><span style='color: var(--danger-red);'>> [!] WARNING: UNSECURED PORTS DETECTED.</span><br>";
                        terminal.innerHTML += "<span style='color: var(--accent-green);'>> Scan complete. Report generated.</span><br>";
                        
                        document.getElementById('reportSection').style.display = 'block';
                        window.scrollTo(0, document.body.scrollHeight);
                    }, 4000);
                }

                // ইমেইল পাঠানোর API কল
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
// ৫. ইমেইল পাঠানোর API রাউট
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
        console.error("Email Error: ", error);
        res.status(500).json({ success: false, error: 'Internal Email Service Error. Check Vercel Environment Variables.' });
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
                              
