const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const dns = require('dns');
const http = require('http');
const https = require('https');

const { requireHTTPAuth, JWT_SECRET, getEnv } = require('./middleware/auth.js');
const { isMailerConfigured, sendTriScoutEmail } = require('./lib/mailer.js');

const app = express();
app.disable('x-powered-by');

const DATABASE_URL = getEnv('DATABASE_URL');
const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
const ADMIN_USER = getEnv('ADMIN_USERNAME');
const ADMIN_PASS = getEnv('ADMIN_PASSWORD');

const sql = DATABASE_URL
    ? neon(DATABASE_URL)
    : Object.assign(
        async () => { throw new Error('Database URL not configured'); },
        { transaction: async () => { throw new Error('Database URL not configured'); } }
    );

// Module-level compiled regexes
const secretRegex = /(?:AIza[0-9A-Za-z\-_]{35}|sk-(?:proj-)?[a-zA-Z0-9\-_]{32,}|gh[pousr]_[A-Za-z0-9_]{36,255}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z\-]{10,48}|sk_live_[0-9a-zA-Z]{24,}|-----BEGIN (?:RSA|OPENSSH|EC|PGP) PRIVATE KEY-----)/g;
const errorLeakRegex = /(?:ReferenceError|TypeError|SyntaxError|RangeError):\s+[^\n]+|at\s+[A-Za-z0-9_$.]+\s+\([^)]+:\d+:\d+\)|(?:SQL syntax.*MySQL|Warning.*mysql_|PostgreSQL.*ERROR|ORA-\d{5}|SQLite\/JDBCDriver|ROLLBACK\s+FAILED|Deadlock\s+found)/i;
const debugLogLeakRegex = /(?:console\.debug\(|DEBUG_LOG|\[TRACE\]|webpack:\/\/|sourceMappingURL=.*\.map)/i;
const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
const scriptRegex = /<script\b/gi;
const formRegex = /<form\b/gi;
const insecureFormRegex = /<form[^>]+action=["']http:\/\/[^"']+["']/i;
const unsafeInlineRegex = /\bon(?:error|load|mouseover|focus)\s*=\s*["'][^"']*javascript:/i;
const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

function logFlow(level, event, meta = {}) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...meta }));
}

function cleanInput(val, maxLen = 2048) {
    if (typeof val !== 'string') return '';
    return val.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
}

// ============================================================================
// 0. Global Security Headers, CSP & Locked Origin Guardrails
// ============================================================================
const ALLOWED_ORIGINS = new Set([
    'https://triscout.quarry.dpdns.org',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]);

const ALLOWED_OAUTH_HOSTS = new Set([
    'triscout.quarry.dpdns.org',
    'localhost:3000',
    '127.0.0.1:3000'
]);

const CSP_POLICY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://telegram.org https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https://github.com https://avatars.githubusercontent.com https://www.googletagmanager.com",
    "connect-src 'self' https://dns.google https://www.google-analytics.com https://www.googletagmanager.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
].join('; ');

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', CSP_POLICY);

    const origin = req.headers.origin;
    const hostOrigin = req.headers.host ? `https://${req.headers.host}` : '';

    if (origin) {
        if (ALLOWED_ORIGINS.has(origin) || origin === hostOrigin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        } else if (req.path.startsWith('/api/')) {
            logFlow('WARN', 'LOCKED_ORIGIN_BLOCKED', { origin, path: req.path });
            return res.status(403).json({ success: false, error: 'Locked Origin Policy: Cross-origin request denied.' });
        }
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// ============================================================================
// 1. GEO Content Negotiation (Accept: text/markdown + Vary: Accept) & Static Pages
// ============================================================================
const authHtmlPath = path.join(__dirname, '../public/index.html');
const AUTH_HTML_CONTENT = fs.readFileSync(authHtmlPath, 'utf8');

const dashboardHtmlPath = path.join(__dirname, 'views', 'index.html');
const DASHBOARD_HTML_CONTENT = fs.readFileSync(dashboardHtmlPath, 'utf8');

const llmsTxtPath = path.join(__dirname, '../public/llms.txt');
let LLMS_TXT_CONTENT = `# TriScout v2.4 TAC-OPS\n\n> On-demand ethical passive cybersecurity reconnaissance console and global NPM CLI toolkit.\n\n- Console: https://triscout.quarry.dpdns.org/\n- Dashboard: https://triscout.quarry.dpdns.org/dashboard\n- CLI: npx @kiran-mondal/triscout\n`;
try {
    LLMS_TXT_CONTENT = fs.readFileSync(llmsTxtPath, 'utf8');
} catch (e) {}

const ROUTE_MARKDOWN_MAP = {
    '/': `# TriScout v2.4 TAC-OPS — Ethical Passive Reconnaissance & Security Posture Console\n\nOn-demand passive cybersecurity reconnaissance dashboard and CLI tool for auditing HTTP security headers, DNS topology, and source leaks.\n\n- **Console URL:** https://triscout.quarry.dpdns.org/\n- **CLI Package:** \`npx @kiran-mondal/triscout\`\n- **Authentication:** Operator Sign-In with 2FA Email OTP or GitHub OAuth\n- **Security Controls:** Neon PostgreSQL Row-Level Security (RLS), Token Bucket rate limiting, and SSRF guardrails\n`,
    '/login': `# TriScout Operator Sign-In\n\nAuthenticate via operator credentials (with 2FA Email OTP) or GitHub OAuth at https://triscout.quarry.dpdns.org/.\n`,
    '/dashboard': `# TriScout Command Center & Passive Recon Scanner HUD\n\nInteractive synchronized target tree topology HUD and on-demand 12-point passive security scanner.\n\n- Evaluates HSTS, CSP, X-Frame-Options, MIME sniffing, cookie flags, CORS, and source/credential leaks.\n- Live Console: https://triscout.quarry.dpdns.org/dashboard\n`,
    '/reports': `# TriScout Security Reports & Export\n\nGenerate security posture grades (0-100) and export findings as PDF, JSON, CSV, or email via SMTP relay.\n\n- URL: https://triscout.quarry.dpdns.org/reports\n`,
    '/cli': `# TriScout CLI Edition\n\nRun passive security header and leak checks directly from your terminal or CI/CD pipeline:\n\n\`\`\`bash\nnpm install -g @kiran-mondal/triscout\ntriscout example.com\n\`\`\`\n`,
    '/about': `# TriScout System Architecture\n\n- **Engine Build:** TriScout v2.4 TAC-OPS (On-Demand Zero-Preload)\n- **Core Stack:** Node.js, Express, Axios, Neon Serverless PostgreSQL (RLS)\n- **Capabilities:** HTTP Header Audit, Source Leak Regex, Google DoH DNS, SSRF Guardrail\n- **Maintainer:** Kiran Mondal (https://github.com/Kiran-mondal)\n`,
    '/project': `# Kiran Mondal — Projects & Portfolio\n\n- **TriScout:** https://triscout.quarry.dpdns.org\n- **Password Guard:** https://passwordguard.quarry.dpdns.org\n- **ZenDrift:** https://zendrift.quarry.dpdns.org\n- **Omlang:** https://omlang.quarry.dpdns.org\n- **Chaturanga:** https://chaturanga.quarry.dpdns.org\n- **Pachisi:** https://pachisi.quarry.dpdns.org\n`,
    '/privacy': `# TriScout Privacy Policy\n\n- **Data Collected:** Operator username, email address, salted scrypt password hash, and authorized target scan logs.\n- **Isolation:** Multi-tenant Neon PostgreSQL Row-Level Security (RLS) isolates each operator's records.\n- **Third-Party Services:** Gmail SMTP relay (for OTP and user-requested reports), GitHub OAuth (optional sign-in), Google DoH DNS, and Google Tag Manager.\n- **Data Deletion:** Operators can permanently delete their account and all associated scan logs anytime via Account & System -> Delete Account Data (\`POST /api/account/delete\`).\n`,
    '/terms': `# TriScout Terms of Responsible Use\n\n- TriScout is provided strictly for legitimate defensive security research, auditing, and educational purposes.\n- You may only scan domains and systems that you own or have explicit written authorization to assess.\n- Scanning private, internal, or loopback infrastructure is prohibited.\n`
};

function wantsMarkdown(req) {
    const accept = String(req.headers['accept'] || '').toLowerCase();
    if (!accept.includes('text/markdown')) return false;
    const mdIdx = accept.indexOf('text/markdown');
    const htmlIdx = accept.indexOf('text/html');
    return htmlIdx === -1 || mdIdx < htmlIdx;
}

function renderLegalHtml(title, heading, items) {
    const listHtml = items.map(i => `<li class="mb-2"><strong class="text-[#39ff88]">${i.label}:</strong> ${i.text}</li>`).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TriScout</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0d2850] text-[#e6f3ff] font-mono min-h-screen flex items-center justify-center p-4">
  <main class="max-w-2xl w-full bg-[#113466] border border-[#bae0ff]/60 p-6 sm:p-8 rounded-sm shadow-2xl">
    <div class="flex items-center justify-between border-b border-[#bae0ff]/40 pb-3 mb-4">
      <h1 class="text-lg sm:text-xl font-bold text-white uppercase">${heading}</h1>
      <a href="/" class="text-xs text-[#39ff88] hover:underline">&larr; Back to TriScout</a>
    </div>
    <ul class="text-xs sm:text-sm leading-relaxed text-[#bae0ff] list-disc pl-5">${listHtml}</ul>
    <div class="mt-6 pt-3 border-t border-[#bae0ff]/30 flex justify-between text-[11px] text-[#bae0ff]/70">
      <span>TriScout v2.4 TAC-OPS</span>
      <span><a href="/privacy" class="hover:text-white">Privacy</a> | <a href="/terms" class="hover:text-white">Terms</a></span>
    </div>
  </main>
</body>
</html>`;
}

app.get('/llms.txt', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Vary', 'Accept');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.status(200).send(LLMS_TXT_CONTENT);
});

app.get(['/', '/login', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', 'Accept');

    if (wantsMarkdown(req)) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        return res.status(200).send(ROUTE_MARKDOWN_MAP['/']);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(AUTH_HTML_CONTENT);
});

app.get('/privacy', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Vary', 'Accept');
    if (wantsMarkdown(req)) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        return res.status(200).send(ROUTE_MARKDOWN_MAP['/privacy']);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderLegalHtml('Privacy Policy', 'TriScout Privacy Policy', [
        { label: 'Data Collected', text: 'Operator username, email address, salted scrypt password hash, and authorized scan logs.' },
        { label: 'Database Isolation', text: 'Multi-tenant Neon PostgreSQL Row-Level Security (RLS) isolates every user account.' },
        { label: 'Email & OAuth', text: 'Gmail SMTP delivers 2FA OTPs and requested scan reports; GitHub OAuth is optional.' },
        { label: 'Account Deletion', text: 'Permanently delete your account and scan logs anytime from Account & System -> Delete Account Data.' }
    ]));
});

app.get('/terms', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Vary', 'Accept');
    if (wantsMarkdown(req)) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        return res.status(200).send(ROUTE_MARKDOWN_MAP['/terms']);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderLegalHtml('Terms of Use', 'Terms of Responsible Use', [
        { label: 'Authorized Scope Only', text: 'Only assess domains and systems that you own or have explicit permission to test.' },
        { label: 'No Internal Scanning', text: 'Probing private, loopback, or internal network ranges is strictly prohibited.' },
        { label: 'Passive Assessment', text: 'TriScout performs non-intrusive HTTP header, DNS, and public source posture audits.' }
    ]));
});

app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

// ============================================================================
// Health Check Endpoint (DB + SMTP Readiness)
// ============================================================================
app.get(['/health', '/api/health'], async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const smtpStatus = isMailerConfigured() ? 'configured' : 'unconfigured';

    if (!DATABASE_URL) {
        return res.status(503).json({
            status: 'degraded',
            service: 'triscout-web-dashboard',
            version: '2.4.1',
            db: 'unconfigured',
            smtp: smtpStatus,
            timestamp: new Date().toISOString()
        });
    }
    try {
        await Promise.race([
            sql`SELECT 1 AS ok`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB health timeout')), 3000))
        ]);
        return res.status(200).json({
            status: 'ok',
            service: 'triscout-web-dashboard',
            version: '2.4.1',
            db: 'connected',
            smtp: smtpStatus,
            uptimeSec: Math.round(process.uptime()),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        logFlow('ERROR', 'HEALTH_CHECK_FAILED', { message: err.message });
        return res.status(503).json({
            status: 'degraded',
            service: 'triscout-web-dashboard',
            version: '2.4.1',
            db: 'unreachable',
            smtp: smtpStatus,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// 2. Token Bucket & OTP Rate Limiter
// ============================================================================
const tokenBuckets = new Map();
const CAPACITY = 5;
const REFILL_RATE_MS = 60000;

function checkTokenBucket(key) {
    const now = Date.now();
    const cleanKey = String(key || 'anon').toLowerCase();

    let bucket = tokenBuckets.get(cleanKey);
    if (!bucket) {
        bucket = { tokens: CAPACITY, lastRefill: now };
    } else {
        const elapsed = now - bucket.lastRefill;
        if (elapsed > REFILL_RATE_MS) {
            bucket.tokens = CAPACITY;
            bucket.lastRefill = now;
        }
    }

    if (bucket.tokens <= 0) {
        tokenBuckets.set(cleanKey, bucket);
        return { allowed: false, waitSec: Math.ceil((REFILL_RATE_MS - (now - bucket.lastRefill)) / 1000) };
    }

    bucket.tokens -= 1;
    tokenBuckets.set(cleanKey, bucket);
    return { allowed: true, remaining: bucket.tokens };
}

// ============================================================================
// 3. Database Tables & Atomic Neon HTTPS Row-Level Security (RLS)
// ============================================================================
let isDbInitialized = false;
async function ensureUsersTable() {
    if (isDbInitialized) return;

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            avatar_url TEXT,
            provider VARCHAR(50) DEFAULT 'local',
            is_verified BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE`;

    await sql`
        CREATE TABLE IF NOT EXISTS auth_otps (
            email VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255),
            password_hash TEXT,
            otp_code VARCHAR(10) NOT NULL,
            purpose VARCHAR(30) NOT NULL,
            expires_at TIMESTAMP NOT NULL
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS scan_logs (
            id SERIAL PRIMARY KEY,
            owner_username VARCHAR(255) NOT NULL,
            target_url TEXT NOT NULL,
            score INTEGER NOT NULL,
            report TEXT,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE auth_otps ENABLE ROW LEVEL SECURITY`;
    await sql`ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY`;

    await sql`DROP POLICY IF EXISTS users_rls_policy ON users`;
    await sql`
        CREATE POLICY users_rls_policy ON users
        USING (
            current_setting('app.current_user', true) = '__SYSTEM_AUTH__'
            OR LOWER(username) = LOWER(current_setting('app.current_user', true))
        )
        WITH CHECK (
            current_setting('app.current_user', true) = '__SYSTEM_AUTH__'
            OR LOWER(username) = LOWER(current_setting('app.current_user', true))
        )
    `;

    await sql`DROP POLICY IF EXISTS otps_rls_policy ON auth_otps`;
    await sql`
        CREATE POLICY otps_rls_policy ON auth_otps
        USING (current_setting('app.current_user', true) = '__SYSTEM_AUTH__')
        WITH CHECK (current_setting('app.current_user', true) = '__SYSTEM_AUTH__')
    `;

    await sql`DROP POLICY IF EXISTS scan_logs_rls_policy ON scan_logs`;
    await sql`
        CREATE POLICY scan_logs_rls_policy ON scan_logs
        USING (LOWER(owner_username) = LOWER(current_setting('app.current_user', true)))
        WITH CHECK (LOWER(owner_username) = LOWER(current_setting('app.current_user', true)))
    `;

    isDbInitialized = true;
}

// Atomic HTTPS Transaction Batch: binds set_config(..., true) to the exact same transaction
async function runRlsBatch(username, buildQueries) {
    const safeUser = String(username || '').replace(/[^a-zA-Z0-9_@.-]/g, '');
    const results = await sql.transaction([
        sql`SELECT set_config('app.current_user', ${safeUser}, true)`,
        ...buildQueries()
    ]);
    return results.slice(1);
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}

async function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, derivedBuffer) => {
            if (err) return reject(err);
            if (keyBuffer.length !== derivedBuffer.length) return resolve(false);
            resolve(crypto.timingSafeEqual(keyBuffer, derivedBuffer));
        });
    });
}

function generateOTP() {
    return String(crypto.randomInt(100000, 999999));
}

// ============================================================================
// 4. Registration & OTP Verification
// ============================================================================
app.post('/api/auth/register-request', async (req, res) => {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Passkey are required.' });
    }
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ success: false, error: 'Username must be 3-30 characters (letters, numbers, _ or -).' });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Passkey must be at least 6 characters long.' });
    }
    if (ADMIN_USER && username.toLowerCase() === ADMIN_USER.toLowerCase()) {
        return res.status(409).json({ success: false, error: 'This username is reserved. Please choose a different name.' });
    }

    if (!isMailerConfigured()) {
        logFlow('ERROR', 'REGISTER_OTP_SMTP_UNCONFIGURED', {});
        return res.status(503).json({
            success: false,
            error: 'Email service is not configured on the server (missing GMAIL_USER / GMAIL_PASS).'
        });
    }

    const bucketCheck = checkTokenBucket(email);
    if (!bucketCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s before requesting another OTP.`
        });
    }

    const otp = generateOTP();
    const passHash = hashPassword(password);

    // Phase 1: Isolated DB check & atomic RLS OTP write
    try {
        await ensureUsersTable();
        const [existingUser] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT username, email FROM users
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `
        ]);

        if (existingUser.length > 0) {
            const msg = existingUser[0].username && existingUser[0].username.toLowerCase() === username.toLowerCase()
                ? `Username "${username}" is already taken! Please choose another name.`
                : 'This email address is already registered.';
            return res.status(409).json({ success: false, error: msg });
        }

        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                INSERT INTO auth_otps (email, username, password_hash, otp_code, purpose, expires_at)
                VALUES (${email}, ${username}, ${passHash}, ${otp}, 'register', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    otp_code = EXCLUDED.otp_code,
                    purpose = 'register',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `
        ]);
    } catch (dbErr) {
        logFlow('ERROR', 'REGISTER_OTP_DB_FAILED', { code: dbErr.code || null, message: dbErr.message });
        return res.status(500).json({ success: false, error: 'Database error while preparing verification code.' });
    }

    // Phase 2: Isolated SMTP dispatch (with cleanup on failure)
    try {
        await sendTriScoutEmail({
            to: email,
            subject: `[TriScout] Sign-Up Verification Code: ${otp}`,
            text: `Hello Operator ${username},\n\nYour TriScout v2.4 TAC-OPS registration verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
        }, { logger: logFlow });

        return res.json({
            success: true,
            message: `Verification code sent to ${email} (Tokens remaining: ${bucketCheck.remaining}/5)`
        });
    } catch (mailErr) {
        try {
            await runRlsBatch('__SYSTEM_AUTH__', () => [
                sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email}) AND purpose = 'register'`
            ]);
        } catch (cleanupErr) {
            logFlow('WARN', 'OTP_CLEANUP_FAILED', { message: cleanupErr.message });
        }

        return res.status(502).json({
            success: false,
            error: mailErr.userMessage || 'Failed to send verification email. Check SMTP settings.'
        });
    }
});

app.post('/api/auth/register-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
    }

    try {
        await ensureUsersTable();
        const [records] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'register' AND expires_at > NOW()
                LIMIT 1
            `
        ]);

        if (records.length === 0 || records[0].otp_code !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired verification code.' });
        }

        const pending = records[0];
        const [nameTaken] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${pending.username}) LIMIT 1`
        ]);
        if (nameTaken.length > 0) {
            return res.status(409).json({ success: false, error: 'Username was just taken. Please register with a new username.' });
        }

        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                INSERT INTO users (username, email, password_hash, provider, is_verified, last_login)
                VALUES (${pending.username}, ${pending.email}, ${pending.password_hash}, 'registered', TRUE, NOW())
            `,
            sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`
        ]);

        const token = jwt.sign(
            { user: pending.username, email: pending.email, provider: 'registered' },
            JWT_SECRET,
            { expiresIn: '2h', algorithm: 'HS256' }
        );
        return res.json({ success: true, token });
    } catch (err) {
        logFlow('ERROR', 'REGISTER_VERIFY_FAILED', { code: err.code || null, message: err.message });
        return res.status(500).json({ success: false, error: 'Could not complete registration.' });
    }
});

// ============================================================================
// 5. Sign-In & 2FA OTP
// ============================================================================
app.post('/api/auth/login', async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const providedEmail = (req.body.email || '').trim().toLowerCase();

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and passkey are required.' });
    }

    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h', algorithm: 'HS256' });
        return res.json({ success: true, token });
    }

    let userRecord;
    let targetEmail;
    let otp;
    let bucketCheck;

    try {
        await ensureUsersTable();
        const [rows] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT username, email, password_hash, avatar_url, provider
                FROM users
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${username})
                LIMIT 1
            `
        ]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Account not found. Please create an account first.' });
        }

        userRecord = rows[0];
        if (userRecord.password_hash) {
            const isValid = await verifyPassword(password, userRecord.password_hash);
            if (!isValid) {
                return res.status(401).json({ success: false, error: 'ACCESS DENIED: Incorrect passkey.' });
            }
        } else {
            const newHash = hashPassword(password);
            await runRlsBatch('__SYSTEM_AUTH__', () => [
                sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${userRecord.username}`
            ]);
        }

        targetEmail = userRecord.email || providedEmail;
        if (!targetEmail) {
            return res.json({
                success: false,
                needsEmail: true,
                error: 'Your existing database account has no email linked. Please enter your email below to receive a sign-in OTP.'
            });
        }

        if (!isMailerConfigured()) {
            logFlow('ERROR', 'LOGIN_OTP_SMTP_UNCONFIGURED', {});
            return res.status(503).json({
                success: false,
                error: 'Email service is not configured on the server (missing GMAIL_USER / GMAIL_PASS).'
            });
        }

        bucketCheck = checkTokenBucket(targetEmail);
        if (!bucketCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s.`
            });
        }

        otp = generateOTP();
        await runRlsBatch('__SYSTEM_AUTH__', () => [
            ...(!userRecord.email && providedEmail
                ? [sql`UPDATE users SET email = ${providedEmail} WHERE username = ${userRecord.username}`]
                : []),
            sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${targetEmail}, ${userRecord.username}, ${otp}, 'login', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    otp_code = EXCLUDED.otp_code,
                    purpose = 'login',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `
        ]);
    } catch (dbErr) {
        logFlow('ERROR', 'LOGIN_AUTH_DB_FAILED', { code: dbErr.code || null, message: dbErr.message });
        return res.status(500).json({ success: false, error: 'Authentication service unavailable.' });
    }

    try {
        await sendTriScoutEmail({
            to: targetEmail,
            subject: `[TriScout] Sign-In Verification Code: ${otp}`,
            text: `Hello Operator ${userRecord.username},\n\nYour TriScout 2FA Sign-In OTP code is: ${otp}\n\nThis code expires in 10 minutes.`
        }, { logger: logFlow });

        return res.json({
            success: true,
            requireOtp: true,
            email: targetEmail,
            message: `Sign-In OTP sent to ${targetEmail} (Tokens remaining: ${bucketCheck.remaining}/5)`
        });
    } catch (mailErr) {
        try {
            await runRlsBatch('__SYSTEM_AUTH__', () => [
                sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${targetEmail}) AND purpose = 'login'`
            ]);
        } catch (cleanupErr) {
            logFlow('WARN', 'LOGIN_OTP_CLEANUP_FAILED', { message: cleanupErr.message });
        }

        return res.status(502).json({
            success: false,
            error: mailErr.userMessage || 'Failed to send sign-in OTP email.'
        });
    }
});

app.post('/api/auth/login-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
    }

    try {
        await ensureUsersTable();
        const [records] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'login' AND expires_at > NOW()
                LIMIT 1
            `
        ]);

        if (records.length === 0 || records[0].otp_code !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired Sign-In OTP code.' });
        }

        const [userRows] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT username, email, avatar_url, provider FROM users
                WHERE LOWER(username) = LOWER(${records[0].username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `
        ]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, error: 'User record not found.' });
        }

        const u = userRows[0];
        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`UPDATE users SET last_login = NOW(), is_verified = TRUE WHERE username = ${u.username}`,
            sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`
        ]);

        const token = jwt.sign(
            { user: u.username, email: u.email || email, avatar: u.avatar_url, provider: u.provider || 'registered' },
            JWT_SECRET,
            { expiresIn: '2h', algorithm: 'HS256' }
        );
        return res.json({ success: true, token });
    } catch (err) {
        logFlow('ERROR', 'LOGIN_VERIFY_FAILED', { code: err.code || null, message: err.message });
        return res.status(500).json({ success: false, error: 'Failed to verify sign-in OTP.' });
    }
});

// ============================================================================
// 6. Forgot & Reset Passkey
// ============================================================================
app.post('/api/auth/forgot-password', async (req, res) => {
    const identifier = (req.body.identifier || '').trim();
    if (!identifier) {
        return res.status(400).json({ success: false, error: 'Please enter your registered Email or Username.' });
    }

    if (!isMailerConfigured()) {
        logFlow('ERROR', 'RESET_OTP_SMTP_UNCONFIGURED', {});
        return res.status(503).json({
            success: false,
            error: 'Email service is not configured on the server (missing GMAIL_USER / GMAIL_PASS).'
        });
    }

    let user;
    let otp;
    let bucketCheck;

    try {
        await ensureUsersTable();
        const [rows] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT username, email, provider FROM users
                WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(username) = LOWER(${identifier})
                LIMIT 1
            `
        ]);

        if (rows.length === 0 || !rows[0].email) {
            return res.status(404).json({ success: false, error: 'No registered email found for that account.' });
        }

        user = rows[0];
        bucketCheck = checkTokenBucket(user.email);
        if (!bucketCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: `Token bucket empty! Rate limit exceeded. Please wait ${bucketCheck.waitSec}s.`
            });
        }

        otp = generateOTP();
        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${user.email}, ${user.username}, ${otp}, 'reset', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET otp_code = EXCLUDED.otp_code,
                    purpose = 'reset',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `
        ]);
    } catch (dbErr) {
        logFlow('ERROR', 'FORGOT_PASSWORD_DB_FAILED', { code: dbErr.code || null, message: dbErr.message });
        return res.status(500).json({ success: false, error: 'Database error while preparing reset code.' });
    }

    try {
        await sendTriScoutEmail({
            to: user.email,
            subject: `[TriScout] Password Reset Code: ${otp}`,
            text: `Hello Operator ${user.username},\n\nYour password reset verification code is: ${otp}\n\nThis code expires in 10 minutes.`
        }, { logger: logFlow });

        return res.json({
            success: true,
            email: user.email,
            message: `Password reset code sent (Tokens remaining: ${bucketCheck.remaining}/5).`
        });
    } catch (mailErr) {
        try {
            await runRlsBatch('__SYSTEM_AUTH__', () => [
                sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${user.email}) AND purpose = 'reset'`
            ]);
        } catch (cleanupErr) {
            logFlow('WARN', 'RESET_OTP_CLEANUP_FAILED', { message: cleanupErr.message });
        }

        return res.status(502).json({
            success: false,
            error: mailErr.userMessage || 'Failed to send reset email.'
        });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();
    const newPassword = req.body.newPassword || '';

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New passkey must be at least 6 characters.' });
    }

    try {
        await ensureUsersTable();
        const [records] = await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'reset' AND expires_at > NOW()
                LIMIT 1
            `
        ]);

        if (records.length === 0 || records[0].otp_code !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset code.' });
        }

        const newHash = hashPassword(newPassword);
        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`UPDATE users SET password_hash = ${newHash} WHERE LOWER(email) = LOWER(${email})`,
            sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`
        ]);

        return res.json({ success: true, message: 'Passkey updated successfully! You can now sign in.' });
    } catch (err) {
        logFlow('ERROR', 'RESET_PASSWORD_FAILED', { code: err.code || null, message: err.message });
        return res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h', algorithm: 'HS256' });
        return res.send(`<script>localStorage.setItem('token', ${JSON.stringify(token)}); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    }
    res.status(401).send(`<script>alert("ACCESS DENIED: Invalid credentials."); window.location.href="/";</script>`);
});

// Database Indexes & Expired OTP Cleanup
let areIndexesCreated = false;
async function ensureDatabaseIndexesAndCleanup() {
    await ensureUsersTable();
    if (!areIndexesCreated) {
        await sql`CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username))`;
        await sql`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email))`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scan_logs_owner_time ON scan_logs (LOWER(owner_username), scanned_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON auth_otps (expires_at)`;
        areIndexesCreated = true;
    }
    await runRlsBatch('__SYSTEM_AUTH__', () => [
        sql`DELETE FROM auth_otps WHERE expires_at <= NOW()`
    ]);
}

// ============================================================================
// 7. Dashboard & Public Views (HTML or Negotiated Markdown)
// ============================================================================
app.get(['/dashboard', '/reports', '/cli', '/about', '/project', '/profile'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', 'Accept');

    if (req.path !== '/profile' && wantsMarkdown(req)) {
        const md = ROUTE_MARKDOWN_MAP[req.path] || ROUTE_MARKDOWN_MAP['/dashboard'];
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        return res.status(200).send(md);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(DASHBOARD_HTML_CONTENT);
});

// ============================================================================
// 8. Passive Target Scanner Engine
// ============================================================================
const scanCache = new Map();
const CACHE_TTL = 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const scanBuckets = new Map();
const SCAN_CAPACITY = 10;
const SCAN_REFILL_MS = 60000;

function checkScanRateLimit(userKey) {
    const now = Date.now();
    const key = String(userKey || 'anon').toLowerCase();
    let bucket = scanBuckets.get(key);
    if (!bucket || (now - bucket.lastRefill) > SCAN_REFILL_MS) {
        bucket = { tokens: SCAN_CAPACITY, lastRefill: now };
    }
    if (bucket.tokens <= 0) {
        scanBuckets.set(key, bucket);
        const waitSec = Math.ceil((SCAN_REFILL_MS - (now - bucket.lastRefill)) / 1000);
        return { allowed: false, waitSec };
    }
    bucket.tokens -= 1;
    scanBuckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
}

const isPrivateIp = (ipStr) => {
    let cleanIp = ipStr.toLowerCase().replace(/^\[|\]$/g, '');
    if (cleanIp.startsWith('::ffff:')) {
        cleanIp = cleanIp.substring(7);
    }
    if (cleanIp === '::1' || cleanIp === '0.0.0.0' || cleanIp === '::' || cleanIp.startsWith('127.') || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || cleanIp.startsWith('169.254.')) return true;
    if (cleanIp.startsWith('172.')) {
        const secondOctet = parseInt(cleanIp.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return cleanIp.startsWith('fc') || cleanIp.startsWith('fd') || cleanIp.startsWith('fe8');
};

const safeLookup = (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err);

        const addresses = Array.isArray(address) ? address : [{ address, family }];

        for (const addrObj of addresses) {
            const ipStr = addrObj.address;
            if (ipStr && isPrivateIp(ipStr)) {
                return callback(new Error(`DNS Rebinding attack detected: ${hostname} resolved to private IP ${ipStr}`));
            }
        }

        callback(null, address, family);
    });
};

const safeHttpAgent = new http.Agent({ lookup: safeLookup });
const safeHttpsAgent = new https.Agent({ lookup: safeLookup });

function maskLeakedSecrets(rawHtml) {
    const matches = rawHtml.match(secretRegex);
    if (!matches || matches.length === 0) return { found: false, count: 0, maskedSamples: [] };
    const maskedSamples = matches.slice(0, 3).map(k => {
        if (k.length <= 10) return '***REDACTED_KEY***';
        return `${k.slice(0, 4)}...[REDACTED]...${k.slice(-3)}`;
    });
    return { found: true, count: matches.length, maskedSamples };
}

app.post('/api/scan-headers', requireHTTPAuth, async (req, res) => {
    const currentOperator = req.user && req.user.user ? req.user.user : 'anonymous';

    const rateStatus = checkScanRateLimit(currentOperator);
    if (!rateStatus.allowed) {
        return res.status(429).json({
            success: false,
            error: `Scanner rate limit exceeded! Wait ${rateStatus.waitSec}s before scanning again.`
        });
    }

    let target = cleanInput(req.body.target, 512);
    if (!target) return res.status(400).json({ success: false, error: 'Target URL is required' });
    if (!target.startsWith('http://') && !target.startsWith('https://')) target = 'https://' + target;

    if (scanCache.has(target)) {
        const cached = scanCache.get(target);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ success: true, report: cached.report, score: cached.score, checks: cached.checks, _bolt_cached: true });
        } else {
            scanCache.delete(target);
        }
    }

    try {
        const parsedUrl = new URL(target);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ success: false, error: 'Only HTTP and HTTPS protocols are permitted.' });
        }
        const hostname = parsedUrl.hostname;
        const lookupResult = await require('dns').promises.lookup(hostname);
        const ip = lookupResult.address;

        if (isPrivateIp(ip)) {
            return res.status(403).json({ success: false, error: 'Ethical Guardrail: Scanning internal or private network resources is strictly prohibited.' });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid URL format or host resolution failed' });
    }

    try {
        const response = await axios.get(target, {
            timeout: 10000,
            maxRedirects: 0,
            validateStatus: () => true,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            httpAgent: safeHttpAgent,
            httpsAgent: safeHttpsAgent,
            headers: {
                'User-Agent': 'TriScout-Ethical-Passive-Scanner/2.4 (+https://triscout.quarry.dpdns.org)',
                'Origin': 'https://unauthorized-origin-probe.example'
            }
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        const titleMatch = htmlBody.match(titleRegex);
        const pageTitle = titleMatch ? cleanInput(titleMatch[1], 80) : 'Untitled Document';
        const scriptCount = (htmlBody.match(scriptRegex) || []).length;
        const formCount = (htmlBody.match(formRegex) || []).length;
        const insecureForms = insecureFormRegex.test(htmlBody);

        let report = `--- ETHICAL PASSIVE WEB SCRAPER & SECURITY AUDIT FOR: ${target} ---\n`;
        report += `[i] Scraped Page Title: ${pageTitle}\n`;
        report += `[i] DOM Surface: ${scriptCount} Script(s), ${formCount} Form(s), HTTP Status ${response.status}\n\n`;

        let score = 100;
        const checks = [];

        // 1. Safe Error & Rollback Leak Check
        if (htmlBody.includes('Stack trace:') || errorLeakRegex.test(htmlBody)) {
            report += `[!] Safe Error & Rollback: CRITICAL (Raw Stack Trace or DB Rollback Error Exposed!)\n`;
            score -= 20;
            checks.push({ name: 'Safe Error & Rollback', status: 'CRITICAL', category: 'Error Leak', impact: '-20 pts', detail: 'Target website exposes raw stack traces, SQL errors, or failed transaction rollback logs.' });
        } else {
            report += `[+] Safe Error & Rollback: SECURE (No raw error or rollback leaks)\n`;
            checks.push({ name: 'Safe Error & Rollback', status: 'SECURE', category: 'Error Leak', impact: '0 pts', detail: 'Target safely handles errors without leaking stack traces or DB rollback states.' });
        }

        // 2. No Leaked Key Check
        const keyAudit = maskLeakedSecrets(htmlBody);
        if (keyAudit.found) {
            report += `[!] No Leaked Keys: CRITICAL (${keyAudit.count} Exposed API Key(s) detected: ${keyAudit.maskedSamples.join(', ')})\n`;
            score -= 25;
            checks.push({ name: 'No Leaked Keys', status: 'CRITICAL', category: 'Credentials', impact: '-25 pts', detail: `Found ${keyAudit.count} exposed API key/token(s) in target HTML (${keyAudit.maskedSamples.join(', ')}).` });
        } else {
            report += `[+] No Leaked Keys: SECURE (Zero exposed keys in source)\n`;
            checks.push({ name: 'No Leaked Keys', status: 'SECURE', category: 'Credentials', impact: '0 pts', detail: 'No exposed API keys or secret tokens found in target page source.' });
        }

        // 3. Locked Origin Check (CORS)
        const acao = headers['access-control-allow-origin'];
        if (acao === '*' || acao === 'https://unauthorized-origin-probe.example') {
            report += `[!] Locked Origin (CORS): WARNING (Wildcard or unlocked Origin: ${acao})\n`;
            score -= 10;
            checks.push({ name: 'Locked Origin (CORS)', status: 'WARNING', category: 'Origin Policy', impact: '-10 pts', detail: `Target allows unrestricted cross-origin access (Access-Control-Allow-Origin: ${acao}).` });
        } else {
            report += `[+] Locked Origin (CORS): SECURE (Origin policy locked)\n`;
            checks.push({ name: 'Locked Origin (CORS)', status: 'SECURE', category: 'Origin Policy', impact: '0 pts', detail: 'Target restricts cross-origin access to trusted domains only.' });
        }

        // 4. Data Isolation & Cross-Origin Isolation Check
        if (headers['cross-origin-opener-policy'] || headers['cross-origin-resource-policy'] || headers['x-frame-options']) {
            report += `[+] Data Isolation: SECURE (Cross-origin/Frame isolation enforced)\n`;
            checks.push({ name: 'Data Isolation', status: 'SECURE', category: 'Isolation', impact: '0 pts', detail: 'Target enforces browser context and frame data isolation.' });
        } else {
            report += `[!] Data Isolation: MISSING (No X-Frame-Options or COOP/CORP isolation headers)\n`;
            score -= 10;
            checks.push({ name: 'Data Isolation', status: 'MISSING', category: 'Isolation', impact: '-10 pts', detail: 'Missing X-Frame-Options and Cross-Origin isolation headers.' });
        }

        // 5. Clean Input & Form Transport Check
        const unsafeInlineEvents = unsafeInlineRegex.test(htmlBody);
        if (insecureForms || unsafeInlineEvents) {
            report += `[!] Clean Input & Forms: CRITICAL (Unencrypted HTTP form or unsafe inline input handler!)\n`;
            score -= 15;
            checks.push({ name: 'Clean Input & Forms', status: 'CRITICAL', category: 'Input Sanitization', impact: '-15 pts', detail: 'Target contains unencrypted HTTP <form> actions or unescaped inline JS handlers.' });
        } else {
            report += `[+] Clean Input & Forms: SECURE (${formCount} form(s) audited)\n`;
            checks.push({ name: 'Clean Input & Forms', status: 'SECURE', category: 'Input Sanitization', impact: '0 pts', detail: `Audited ${formCount} form(s); input transport and DOM handlers are clean.` });
        }

        // 6. Rate Limit Check
        if (headers['x-ratelimit-limit'] || headers['retry-after'] || headers['ratelimit-limit'] || headers['cf-ray']) {
            report += `[+] Rate Limiting: SECURE (Traffic rate limiting / WAF active)\n`;
            checks.push({ name: 'Rate Limiting', status: 'SECURE', category: 'Traffic Defense', impact: '0 pts', detail: 'Target enforces rate-limiting headers or edge WAF protection.' });
        } else {
            report += `[-] Rate Limiting: NOTICE (No public rate-limit header)\n`;
            score -= 5;
            checks.push({ name: 'Rate Limiting', status: 'NOTICE', category: 'Traffic Defense', impact: '-5 pts', detail: 'No explicit rate-limit headers exposed on public response.' });
        }

        // 7. Session / Link Expiry & Cookie Flags Check
        const rawCookies = headers['set-cookie'];
        if (Array.isArray(rawCookies) && rawCookies.length > 0) {
            const missingSecurity = rawCookies.some(c => !/httponly/i.test(c) || !/secure/i.test(c));
            const missingExpiry = rawCookies.some(c => !/(?:max-age|expires)=/i.test(c));
            if (missingSecurity || missingExpiry) {
                report += `[!] Link & Session Expiry: WARNING (Cookies missing HttpOnly/Secure or Expiration limit)\n`;
                score -= 10;
                checks.push({ name: 'Link & Session Expiry', status: 'WARNING', category: 'Session Lifecycle', impact: '-10 pts', detail: 'Target cookies lack HttpOnly, Secure, or explicit Max-Age/Expires attributes.' });
            } else {
                report += `[+] Link & Session Expiry: SECURE (HttpOnly, Secure & Expiry enforced)\n`;
                checks.push({ name: 'Link & Session Expiry', status: 'SECURE', category: 'Session Lifecycle', impact: '0 pts', detail: 'Target session cookies enforce strict expiration and security flags.' });
            }
        } else {
            report += `[+] Link & Session Expiry: SECURE (Stateless response / No persistent unexpiring cookies)\n`;
            checks.push({ name: 'Link & Session Expiry', status: 'SECURE', category: 'Session Lifecycle', impact: '0 pts', detail: 'Target is stateless on initial load with no insecure persistent cookies.' });
        }

        // 8. Log Flowing & Debug Exposure Check
        if (debugLogLeakRegex.test(htmlBody) || headers['x-debug-token'] || headers['x-debug-token-link']) {
            report += `[!] Log Flowing Hygiene: WARNING (Debug logs, profiler headers, or .map files exposed)\n`;
            score -= 5;
            checks.push({ name: 'Log Flowing Hygiene', status: 'WARNING', category: 'Telemetry', impact: '-5 pts', detail: 'Target exposes debug log statements, source maps, or debug profiler headers.' });
        } else {
            report += `[+] Log Flowing Hygiene: SECURE (Production logs isolated)\n`;
            checks.push({ name: 'Log Flowing Hygiene', status: 'SECURE', category: 'Telemetry', impact: '0 pts', detail: 'No debug console streams or source map leaks found in production HTML.' });
        }

        // 9. Server Index & Fingerprint Check
        if (headers['x-powered-by']) {
            report += `[!] Server Index & Fingerprint: WARNING (Tech Stack Exposed: ${cleanInput(String(headers['x-powered-by']), 50)})\n`;
            score -= 10;
            checks.push({ name: 'Server Index & Fingerprint', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: `Server leaks X-Powered-By (${cleanInput(String(headers['x-powered-by']), 50)}).` });
        } else {
            report += `[+] Server Index & Fingerprint: SECURE\n`;
            checks.push({ name: 'Server Index & Fingerprint', status: 'SECURE', category: 'Fingerprinting', impact: '0 pts', detail: 'Server technology headers and directory indexes are properly hidden.' });
        }

        report += `\n--- DEFENSIVE HTTP SECURITY HEADERS ---\n`;

        // 10. HSTS Policy
        if (headers['strict-transport-security']) {
            report += `[+] HSTS (Strict-Transport-Security): SECURE\n`;
            checks.push({ name: 'HSTS Policy', status: 'SECURE', category: 'SSL/TLS', impact: '0 pts', detail: 'Enforces encrypted HTTPS connections against downgrade attacks.' });
        } else {
            report += `[!] HSTS (Strict-Transport-Security): MISSING\n`;
            score -= 10;
            checks.push({ name: 'HSTS Policy', status: 'MISSING', category: 'SSL/TLS', impact: '-10 pts', detail: 'Missing Strict-Transport-Security header.' });
        }

        // 11. Content-Security-Policy (CSP)
        if (headers['content-security-policy']) {
            report += `[+] CSP (Content-Security-Policy): SECURE\n`;
            checks.push({ name: 'CSP Header', status: 'SECURE', category: 'XSS Defense', impact: '0 pts', detail: 'Content-Security-Policy is active to mitigate XSS injection.' });
        } else {
            report += `[!] CSP (Content-Security-Policy): MISSING\n`;
            score -= 10;
            checks.push({ name: 'CSP Header', status: 'MISSING', category: 'XSS Defense', impact: '-10 pts', detail: 'No Content-Security-Policy defined against script injection.' });
        }

        // 12. MIME Sniffing
        if (headers['x-content-type-options']) {
            report += `[+] X-Content-Type-Options: SECURE (nosniff)\n`;
            checks.push({ name: 'MIME Sniffing', status: 'SECURE', category: 'Headers', impact: '0 pts', detail: 'Prevents browser MIME-type sniffing (nosniff).' });
        } else {
            report += `[!] X-Content-Type-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'MIME Sniffing', status: 'MISSING', category: 'Headers', impact: '-10 pts', detail: 'Missing X-Content-Type-Options: nosniff header.' });
        }

        if (score < 0) score = 0;
        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        if (scanCache.size >= MAX_CACHE_SIZE) scanCache.clear();
        scanCache.set(target, { report, score, checks, timestamp: Date.now() });

        try {
            await ensureDatabaseIndexesAndCleanup();
            await runRlsBatch(currentOperator, () => [
                sql`
                    INSERT INTO scan_logs (owner_username, target_url, score, report)
                    VALUES (${currentOperator}, ${target}, ${score}, ${report})
                `
            ]);
            logFlow('INFO', 'SCAN_COMPLETED', { operator: currentOperator, target, score });
        } catch (dbErr) {
            logFlow('ERROR', 'RLS_SCAN_LOG_SAVE_FAILED', { operator: currentOperator, message: dbErr.message });
        }

        res.json({ success: true, report, score, checks });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Target unreachable.' });
    }
});

// ============================================================================
// 9. RLS-Protected Scan History
// ============================================================================
app.get('/api/scan-history', requireHTTPAuth, async (req, res) => {
    try {
        await ensureDatabaseIndexesAndCleanup();
        const username = cleanInput(req.user.user, 100);
        const [history] = await runRlsBatch(username, () => [
            sql`
                SELECT id, target_url AS target, score, scanned_at AS time
                FROM scan_logs
                WHERE LOWER(owner_username) = LOWER(${username})
                ORDER BY scanned_at DESC
                LIMIT 10
            `
        ]);
        res.json({ success: true, history });
    } catch (err) {
        logFlow('ERROR', 'SCAN_HISTORY_LOAD_FAILED', { message: err.message });
        res.status(500).json({ success: false, error: 'Failed to load protected scan history.' });
    }
});

// ============================================================================
// 10. Email Report Relay
// ============================================================================
app.post('/api/send-report', requireHTTPAuth, async (req, res) => {
    const target = cleanInput(req.body.target, 512);
    const reportData = cleanInput(req.body.reportData, 25000);
    const emailTo = cleanInput(req.body.emailTo, 254);
    if (!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: 'Missing information.' });
    if (!emailRegex.test(emailTo)) return res.status(400).json({ success: false, error: 'Invalid recipient email address.' });

    try {
        await sendTriScoutEmail({
            to: emailTo,
            subject: `[ALERT] TriScout Security Assessment: ${target}`,
            text: `TriScout Defensive Cyber Security System\n\nTarget Analyzed: ${target}\n\n${reportData}\n\n--------------------\nConfidential Report Generated by TriScout.`
        }, { logger: logFlow });
        return res.json({ success: true, message: 'Email sent successfully' });
    } catch (mailErr) {
        return res.status(502).json({
            success: false,
            error: mailErr.userMessage || 'Internal Email Service Error.'
        });
    }
});

// ============================================================================
// 11. GitHub OAuth (Bounded Timeouts + Safe Token Serialization)
// ============================================================================
function getSafeOAuthRedirectUri(req) {
    const rawHost = String(req.headers.host || '').toLowerCase();
    const isAllowed = ALLOWED_OAUTH_HOSTS.has(rawHost) || rawHost.endsWith('.vercel.app');
    const safeHost = isAllowed ? rawHost : 'triscout.quarry.dpdns.org';
    const proto = safeHost.startsWith('localhost') || safeHost.startsWith('127.0.0.1') ? 'http' : 'https';
    return `${proto}://${safeHost}/api/auth/github/callback`;
}

app.get('/api/auth/github', (req, res) => {
    const redirectUri = getSafeOAuthRedirectUri(req);
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`);
});

app.get('/api/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') return res.status(400).send('No code provided');
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
            signal: AbortSignal.timeout(8000)
        });
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.status(401).send('<h3 style="color:red; text-align:center;">[!] GITHUB TOKEN EXCHANGE FAILED. <a href="/">RETRY</a></h3>');
        }

        const userResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'TriScout-App' },
            signal: AbortSignal.timeout(8000)
        });
        const userData = await userResponse.json();
        if (!userData || !userData.login) {
            return res.status(401).send('<h3 style="color:red; text-align:center;">[!] GITHUB PROFILE FETCH FAILED. <a href="/">RETRY</a></h3>');
        }

        await ensureDatabaseIndexesAndCleanup();
        await runRlsBatch('__SYSTEM_AUTH__', () => [
            sql`
                INSERT INTO users (username, avatar_url, provider, is_verified, last_login)
                VALUES (${userData.login}, ${userData.avatar_url}, 'github', TRUE, NOW())
                ON CONFLICT (username) DO UPDATE
                SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
            `
        ]);

        const token = jwt.sign(
            { user: userData.login, avatar: userData.avatar_url, provider: 'github' },
            JWT_SECRET,
            { expiresIn: '2h', algorithm: 'HS256' }
        );
        res.send(`<script>localStorage.setItem('token', ${JSON.stringify(token)}); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    } catch (error) {
        logFlow('ERROR', 'GITHUB_OAUTH_CALLBACK_FAILED', { message: error.message });
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>');
    }
});

// ============================================================================
// 12. Account Deletion (Atomic RLS Transaction)
// ============================================================================
app.post('/api/account/delete', requireHTTPAuth, async (req, res) => {
    try {
        await ensureDatabaseIndexesAndCleanup();
        const username = cleanInput(req.user.user, 100);

        await runRlsBatch(username, () => [
            sql`DELETE FROM scan_logs WHERE LOWER(owner_username) = LOWER(${username})`,
            sql`DELETE FROM users WHERE LOWER(username) = LOWER(${username})`
        ]);

        res.json({
            success: true,
            message: 'RLS & Transaction Verified: Your account and all associated scan logs have been permanently deleted.'
        });
    } catch (err) {
        logFlow('ERROR', 'ACCOUNT_DELETE_FAILED', { message: err.message });
        res.status(500).json({ success: false, error: 'Failed to delete account data (Transaction rolled back safely).' });
    }
});

// ============================================================================
// 13. Friendly 404 & Global Error Middleware (Checks 39 & 40)
// ============================================================================
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API endpoint not found.' });
    }
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        renderLegalHtml('404 Not Found', '404 // Route Not Found', [
            { label: 'Status', text: 'The requested page does not exist on TriScout.' },
            { label: 'Navigation', text: 'Return to the main console at https://triscout.quarry.dpdns.org/.' }
        ])
    );
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    logFlow('ERROR', 'UNHANDLED_EXPRESS_ERROR', { path: req.path, method: req.method, message: err.message });
    if (res.headersSent) return next(err);
    if (req.path.startsWith('/api/')) {
        return res.status(err.status || 500).json({ success: false, error: 'Internal server error.' });
    }
    res.status(err.status || 500).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        renderLegalHtml('Server Error', '500 // Unexpected Error', [
            { label: 'Status', text: 'An unexpected error occurred while processing your request.' },
            { label: 'Recovery', text: 'Please return to the main console and try again.' }
        ])
    );
});

module.exports = app;
