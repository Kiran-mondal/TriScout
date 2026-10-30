const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios'); 
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const { requireHTTPAuth, JWT_SECRET, getEnv } = require('./middleware/auth.js');

const app = express();

const DATABASE_URL = getEnv('DATABASE_URL');
const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
const ADMIN_USER = getEnv('ADMIN_USERNAME');
const ADMIN_PASS = getEnv('ADMIN_PASSWORD');

const sql = DATABASE_URL ? neon(DATABASE_URL) : async () => { throw new Error("Database URL not configured"); };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ১. লগইন ও সাইন-আপ পেজ (public/index.html) সার্ভ করা - ক্যাশমুক্ত
const authHtmlPath = path.join(__dirname, '../public/index.html');

app.get(['/', '/login', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = fs.readFileSync(authHtmlPath, 'utf8');
    res.status(200).send(html);
});

app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logo.svg'));
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getEnv('GMAIL_USER'), pass: getEnv('GMAIL_PASS') }
}); 

// ২. ওটিপি রেট লিমিটার (প্রতি মিনিটে সর্বোচ্চ ৫টি ওটিপি)
const otpRateLimiter = new Map();
const OTP_LIMIT_PER_MIN = 5;
const OTP_WINDOW_MS = 60 * 1000;

function checkOtpRateLimit(key) {
    const now = Date.now();
    const cleanKey = String(key || 'anon').toLowerCase();
    const timestamps = otpRateLimiter.get(cleanKey) || [];
    const recent = timestamps.filter(ts => now - ts < OTP_WINDOW_MS);

    if (recent.length >= OTP_LIMIT_PER_MIN) {
        const waitSec = Math.ceil((OTP_WINDOW_MS - (now - recent[0])) / 1000);
        return { allowed: false, waitSec };
    }
    recent.push(now);
    otpRateLimiter.set(cleanKey, recent);
    return { allowed: true, remaining: OTP_LIMIT_PER_MIN - recent.length };
}

// ৩. ডাটাবেস টেবিল ও Row-Level Security (RLS) কনফিগারেশন
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

    // সব টেবিলে RLS (Row-Level Security) সক্রিয় করা
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

// RLS Context Helper: নির্দিষ্ট ইউজারের নামে ডাটাবেস কুয়েরি চালানোর ফাংশন
async function runWithRlsUser(username, queryFn) {
    const safeUser = String(username || '').replace(/[^a-zA-Z0-9_@.-]/g, '');
    await sql`SELECT set_config('app.current_user', ${safeUser}, false)`;
    try {
        return await queryFn();
    } finally {
        await sql`SELECT set_config('app.current_user', '', false)`;
    }
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

function generateOTP() {
    return String(crypto.randomInt(100000, 999999));
}

// ৪A. সাইন-আপ ধাপ ১: ইউনিক নাম চেক ও ইমেইলে ৬-ডিজিটের OTP পাঠানো
app.post('/api/auth/register-request', async (req, res) => {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, Email, and Passkey are required.' });
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Username must be 3-30 characters (letters, numbers, _ or -).' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Passkey must be at least 6 characters long.' });
    }
    if (ADMIN_USER && username.toLowerCase() === ADMIN_USER.toLowerCase()) {
        return res.status(409).json({ success: false, error: 'This username is reserved. Please choose a different name.' });
    }

    const rateCheck = checkOtpRateLimit(email);
    if (!rateCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: `Rate limit exceeded! Maximum 5 OTPs per minute. Try again in ${rateCheck.waitSec}s.`
        });
    }

    try {
        await ensureUsersTable();
        const otp = generateOTP();
        const passHash = hashPassword(password);

        const existingError = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const existingUser = await sql`
                SELECT username, email FROM users 
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `;
            if (existingUser.length > 0) {
                if (existingUser[0].username && existingUser[0].username.toLowerCase() === username.toLowerCase()) {
                    return 'Username "' + username + '" is already taken! Please choose another name.';
                }
                return 'This email address is already registered.';
            }

            await sql`
                INSERT INTO auth_otps (email, username, password_hash, otp_code, purpose, expires_at)
                VALUES (${email}, ${username}, ${passHash}, ${otp}, 'register', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    otp_code = EXCLUDED.otp_code,
                    purpose = 'register',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `;
            return null;
        });

        if (existingError) {
            return res.status(409).json({ success: false, error: existingError });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: email,
            subject: `[TriScout] Sign-Up Verification Code: ${otp}`,
            text: `Hello Operator ${username},\n\nYour TriScout v2.4 TAC-OPS registration verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
        });

        res.json({ success: true, message: `Verification code sent to ${email} (${rateCheck.remaining}/5 left this min)` });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send verification email. Check SMTP settings.' });
    }
});

// ৪B. সাইন-আপ ধাপ ২: ইমেইল OTP মিলিয়ে দেখা এবং অ্যাকাউন্ট তৈরি করা
app.post('/api/auth/register-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
    }

    try {
        await ensureUsersTable();
        const result = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps 
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'register' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired verification code.', status: 400 };
            }

            const pending = records[0];
            const nameTaken = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${pending.username}) LIMIT 1`;
            if (nameTaken.length > 0) {
                return { error: 'Username was just taken. Please register with a new username.', status: 409 };
            }

            await sql`
                INSERT INTO users (username, email, password_hash, provider, is_verified, last_login)
                VALUES (${pending.username}, ${pending.email}, ${pending.password_hash}, 'registered', TRUE, NOW())
            `;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { user: pending.username, email: pending.email };
        });

        if (result.error) {
            return res.status(result.status).json({ success: false, error: result.error });
        }

        const token = jwt.sign({ user: result.user, email: result.email, provider: 'registered' }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Could not complete registration.' });
    }
});

// ৫A. সাইন-ইন ধাপ ১: পাসওয়ার্ড চেক ও ইমেইলে 2FA ওটিপি পাঠানো
app.post('/api/auth/login', async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const providedEmail = (req.body.email || '').trim().toLowerCase();

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and passkey are required.' });
    }

    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ success: true, token });
    }

    try {
        await ensureUsersTable();
        const authCheck = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const rows = await sql`
                SELECT username, email, password_hash, avatar_url, provider
                FROM users
                WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${username})
                LIMIT 1
            `;
            if (rows.length === 0) {
                return { status: 401, error: 'Account not found. Please create an account first.' };
            }

            const userRecord = rows[0];
            if (userRecord.password_hash) {
                if (!verifyPassword(password, userRecord.password_hash)) {
                    return { status: 401, error: 'ACCESS DENIED: Incorrect passkey.' };
                }
            } else {
                const newHash = hashPassword(password);
                await sql`UPDATE users SET password_hash = ${newHash} WHERE username = ${userRecord.username}`;
            }

            const targetEmail = userRecord.email || providedEmail;
            if (!targetEmail) {
                return {
                    needsEmail: true,
                    error: 'Your existing database account has no email linked. Please enter your email below to receive a sign-in OTP.'
                };
            }

            const rateCheck = checkOtpRateLimit(targetEmail);
            if (!rateCheck.allowed) {
                return {
                    status: 429,
                    error: `Rate limit exceeded! Maximum 5 OTPs per minute. Please wait ${rateCheck.waitSec}s.`
                };
            }

            if (!userRecord.email && providedEmail) {
                await sql`UPDATE users SET email = ${providedEmail} WHERE username = ${userRecord.username}`;
            }

            const otp = generateOTP();
            await sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${targetEmail}, ${userRecord.username}, ${otp}, 'login', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    otp_code = EXCLUDED.otp_code,
                    purpose = 'login',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `;

            return { ok: true, username: userRecord.username, targetEmail, otp, remaining: rateCheck.remaining };
        });

        if (authCheck.needsEmail) {
            return res.json({ success: false, needsEmail: true, error: authCheck.error });
        }
        if (authCheck.error) {
            return res.status(authCheck.status || 400).json({ success: false, error: authCheck.error });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: authCheck.targetEmail,
            subject: `[TriScout] Sign-In Verification Code: ${authCheck.otp}`,
            text: `Hello Operator ${authCheck.username},\n\nYour TriScout 2FA Sign-In OTP code is: ${authCheck.otp}\n\nThis code expires in 10 minutes.`
        });

        return res.json({
            success: true,
            requireOtp: true,
            email: authCheck.targetEmail,
            message: `Sign-In OTP sent to ${authCheck.targetEmail} (${authCheck.remaining}/5 left this min)`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Authentication service unavailable.' });
    }
});

// ৫B. সাইন-ইন ধাপ ২: সাইন-ইন ওটিপি মিলিয়ে ড্যাশবোর্ডে প্রবেশ করানো
app.post('/api/auth/login-verify', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
    }

    try {
        await ensureUsersTable();
        const verifiedUser = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'login' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired Sign-In OTP code.', status: 400 };
            }

            const userRows = await sql`
                SELECT username, email, avatar_url, provider FROM users
                WHERE LOWER(username) = LOWER(${records[0].username}) OR LOWER(email) = LOWER(${email})
                LIMIT 1
            `;
            if (userRows.length === 0) {
                return { error: 'User record not found.', status: 404 };
            }

            const userRecord = userRows[0];
            await sql`UPDATE users SET last_login = NOW(), is_verified = TRUE WHERE username = ${userRecord.username}`;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { userRecord };
        });

        if (verifiedUser.error) {
            return res.status(verifiedUser.status).json({ success: false, error: verifiedUser.error });
        }

        const u = verifiedUser.userRecord;
        const token = jwt.sign(
            { user: u.username, email: u.email || email, avatar: u.avatar_url, provider: u.provider || 'registered' },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to verify sign-in OTP.' });
    }
});

// ৬A. ফরগট পাসওয়ার্ড ধাপ ১: ইমেইলে রিসেট কোড পাঠানো
app.post('/api/auth/forgot-password', async (req, res) => {
    const identifier = (req.body.identifier || '').trim();
    if (!identifier) {
        return res.status(400).json({ success: false, error: 'Please enter your registered Email or Username.' });
    }

    try {
        await ensureUsersTable();
        const resetReq = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const rows = await sql`
                SELECT username, email, provider FROM users
                WHERE LOWER(email) = LOWER(${identifier}) OR LOWER(username) = LOWER(${identifier})
                LIMIT 1
            `;
            if (rows.length === 0 || !rows[0].email) {
                return { status: 404, error: 'No registered email found for that account.' };
            }

            const user = rows[0];
            const rateCheck = checkOtpRateLimit(user.email);
            if (!rateCheck.allowed) {
                return {
                    status: 429,
                    error: `Rate limit exceeded! Maximum 5 OTPs per minute. Try again in ${rateCheck.waitSec}s.`
                };
            }

            const otp = generateOTP();
            await sql`
                INSERT INTO auth_otps (email, username, otp_code, purpose, expires_at)
                VALUES (${user.email}, ${user.username}, ${otp}, 'reset', NOW() + INTERVAL '10 minutes')
                ON CONFLICT (email) DO UPDATE
                SET otp_code = EXCLUDED.otp_code,
                    purpose = 'reset',
                    expires_at = NOW() + INTERVAL '10 minutes'
            `;
            return { user, otp, remaining: rateCheck.remaining };
        });

        if (resetReq.error) {
            return res.status(resetReq.status).json({ success: false, error: resetReq.error });
        }

        await transporter.sendMail({
            from: getEnv('GMAIL_USER'),
            to: resetReq.user.email,
            subject: `[TriScout] Password Reset Code: ${resetReq.otp}`,
            text: `Hello Operator ${resetReq.user.username},\n\nYour password reset verification code is: ${resetReq.otp}\n\nThis code expires in 10 minutes.`
        });

        res.json({ success: true, email: resetReq.user.email, message: `Password reset code sent (${resetReq.remaining}/5 left this min).` });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send reset email.' });
    }
});

// ৬B. ফরগট পাসওয়ার্ড ধাপ ২: কোড ভেরিফাই করে নতুন পাসওয়ার্ড সেভ করা
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
        const resetResult = await runWithRlsUser('__SYSTEM_AUTH__', async () => {
            const records = await sql`
                SELECT * FROM auth_otps
                WHERE LOWER(email) = LOWER(${email}) AND purpose = 'reset' AND expires_at > NOW()
                LIMIT 1
            `;
            if (records.length === 0 || records[0].otp_code !== otp) {
                return { error: 'Invalid or expired reset code.' };
            }

            const newHash = hashPassword(newPassword);
            await sql`UPDATE users SET password_hash = ${newHash} WHERE LOWER(email) = LOWER(${email})`;
            await sql`DELETE FROM auth_otps WHERE LOWER(email) = LOWER(${email})`;
            return { ok: true };
        });

        if (resetResult.error) {
            return res.status(400).json({ success: false, error: resetResult.error });
        }

        res.json({ success: true, message: 'Passkey updated successfully! You can now sign in.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER, provider: 'local' }, JWT_SECRET, { expiresIn: '2h' });
        return res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    }
    res.send(`<script>alert("ACCESS DENIED: Invalid credentials."); window.location.href="/";</script>`);
});

// ৭. ড্যাশবোর্ড HTML সার্ভ করা
const dashboardHtmlPath = path.join(__dirname, 'views', 'index.html');

app.get(['/dashboard', '/reports', '/cli', '/about', '/project', '/profile'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const html = fs.readFileSync(dashboardHtmlPath, 'utf8');
    res.status(200).send(html);
});

// ৮. প্যাসিভ ইথিক্যাল ওয়েব স্ক্র্যাপার এবং সিকিউরিটি স্ক্যানার ইঞ্জিন (১২টি পূর্ণাঙ্গ নিরাপত্তা চেক)
const scanCache = new Map();
const CACHE_TTL = 60 * 1000;
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

const secretRegex = /(?:AIza[0-9A-Za-z\-_]{35}|sk-(?:proj-)?[a-zA-Z0-9\-_]{32,}|gh[pousr]_[A-Za-z0-9_]{36,255}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z\-]{10,48}|sk_live_[0-9a-zA-Z]{24,}|-----BEGIN (?:RSA|OPENSSH|EC|PGP) PRIVATE KEY-----)/;
const errorLeakRegex = /(?:ReferenceError|TypeError|SyntaxError|RangeError):\s+[^\n]+|at\s+[A-Za-z0-9_$.]+\s+\([^)]+:\d+:\d+\)|(?:SQL syntax.*MySQL|Warning.*mysql_|PostgreSQL.*ERROR|ORA-\d{5}|SQLite\/JDBCDriver)/i;

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
                'User-Agent': 'TriScout-Ethical-Passive-Scanner/2.4 (+https://triscout.quarry.dpdns.org)'
            }
        });
        const headers = response.headers;
        const htmlBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        // ইথিক্যাল ওয়েব স্ক্র্যাপিং মেটাডেটা সংগ্রহ (টাইটেল, ফর্ম, স্ক্রিপ্ট ও লিংক সংখ্যা)
        const titleMatch = htmlBody.match(/<title[^>]*>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim().slice(0, 80) : 'Untitled Document';
        const scriptCount = (htmlBody.match(/<script\b/gi) || []).length;
        const formCount = (htmlBody.match(/<form\b/gi) || []).length;
        const insecureForms = /<form[^>]+action=["']http:\/\/[^"']+["']/i.test(htmlBody);
        
        let report = `--- ETHICAL PASSIVE WEB SCRAPER & SECURITY AUDIT FOR: ${target} ---\n`;
        report += `[i] Scraped Page Title: ${pageTitle}\n`;
        report += `[i] DOM Surface: ${scriptCount} Script(s), ${formCount} Form(s), HTTP Status ${response.status}\n\n`;

        let score = 100;
        const checks = [];

        // ১. Error & Stack Trace Leak Check
        if (htmlBody.includes('Stack trace:') || errorLeakRegex.test(htmlBody)) {
            report += `[!] Error Handling: CRITICAL (Stack trace or DB error exposed!)\n`;
            score -= 20;
            checks.push({ name: 'Error Handling', status: 'CRITICAL', category: 'Source Leak', impact: '-20 pts', detail: 'Stack traces or SQL errors exposed in scraped HTML body.' });
        } else {
            report += `[+] Error Handling: SECURE\n`;
            checks.push({ name: 'Error Handling', status: 'SECURE', category: 'Source Leak', impact: '0 pts', detail: 'No raw stack traces or database errors leaked.' });
        }

        // ২. API Key & Credential Leak Check
        if (secretRegex.test(htmlBody)) {
            report += `[!] Secrets Exposure: CRITICAL (Exposed API Keys / Tokens detected)\n`;
            score -= 25;
            checks.push({ name: 'Secrets Exposure', status: 'CRITICAL', category: 'Credentials', impact: '-25 pts', detail: 'Active API keys or secret tokens detected in scraped HTML source.' });
        } else {
            report += `[+] Secrets Exposure: SECURE\n`;
            checks.push({ name: 'Secrets Exposure', status: 'SECURE', category: 'Credentials', impact: '0 pts', detail: 'No exposed API keys or secret tokens found in page source.' });
        }

        // ৩. Scraped Form Transport Security Check
        if (insecureForms) {
            report += `[!] Form Transport: CRITICAL (Form submits over unencrypted HTTP!)\n`;
            score -= 15;
            checks.push({ name: 'Form Action Security', status: 'CRITICAL', category: 'Web Scraper', impact: '-15 pts', detail: 'Scraped HTML contains <form> tags submitting data over plain HTTP.' });
        } else {
            report += `[+] Form Transport: SECURE (${formCount} form(s) verified)\n`;
            checks.push({ name: 'Form Action Security', status: 'SECURE', category: 'Web Scraper', impact: '0 pts', detail: `Evaluated ${formCount} HTML form(s); no insecure HTTP form actions found.` });
        }

        // ৪. Rate Limiting Header Check
        if (headers['x-ratelimit-limit'] || headers['retry-after'] || headers['ratelimit-limit']) {
            report += `[+] Rate Limiting: SECURE\n`;
            checks.push({ name: 'Rate Limiting', status: 'SECURE', category: 'Traffic', impact: '0 pts', detail: 'Rate-limiting headers are actively enforced.' });
        } else {
            report += `[-] Rate Limiting: NOTICE (No public rate-limit header)\n`;
            score -= 5;
            checks.push({ name: 'Rate Limiting', status: 'NOTICE', category: 'Traffic', impact: '-5 pts', detail: 'No explicit rate-limit headers exposed (may be handled by WAF).' });
        }

        // ৫. Server & Tech Stack Fingerprinting Check
        if (headers['x-powered-by']) {
            report += `[!] Dependencies: WARNING (Tech Stack Exposed: ${headers['x-powered-by']})\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: `Server exposes X-Powered-By (${headers['x-powered-by']}).` });
        } else if (/<meta[^>]+name=["']generator["']/i.test(htmlBody)) {
            report += `[!] Dependencies: WARNING (CMS Generator version exposed in meta tag)\n`;
            score -= 10;
            checks.push({ name: 'Tech Stack Hide', status: 'WARNING', category: 'Fingerprinting', impact: '-10 pts', detail: 'Scraped DOM exposes CMS generator version meta tag.' });
        } else {
            report += `[+] Dependencies: SECURE\n`;
            checks.push({ name: 'Tech Stack Hide', status: 'SECURE', category: 'Fingerprinting', impact: '0 pts', detail: 'X-Powered-By and generator tags are properly hidden.' });
        }

        report += `\n--- DEFENSIVE HTTP SECURITY HEADERS ---\n`;

        // ৬. HSTS Policy
        if (headers['strict-transport-security']) {
            report += `[+] HSTS (Strict-Transport-Security): SECURE\n`;
            checks.push({ name: 'HSTS Policy', status: 'SECURE', category: 'SSL/TLS', impact: '0 pts', detail: 'Enforces encrypted HTTPS connections against downgrade attacks.' });
        } else {
            report += `[!] HSTS (Strict-Transport-Security): MISSING\n`;
            score -= 10;
            checks.push({ name: 'HSTS Policy', status: 'MISSING', category: 'SSL/TLS', impact: '-10 pts', detail: 'Missing Strict-Transport-Security header.' });
        }

        // ৭. Content-Security-Policy (CSP)
        if (headers['content-security-policy']) {
            report += `[+] CSP (Content-Security-Policy): SECURE\n`;
            checks.push({ name: 'CSP Header', status: 'SECURE', category: 'XSS Defense', impact: '0 pts', detail: 'Content-Security-Policy is active to mitigate XSS injection.' });
        } else {
            report += `[!] CSP (Content-Security-Policy): MISSING\n`;
            score -= 10;
            checks.push({ name: 'CSP Header', status: 'MISSING', category: 'XSS Defense', impact: '-10 pts', detail: 'No Content-Security-Policy defined against script injection.' });
        }

        // ৮. X-Frame-Options (Clickjacking Defense)
        if (headers['x-frame-options']) {
            report += `[+] X-Frame-Options: SECURE\n`;
            checks.push({ name: 'X-Frame-Options', status: 'SECURE', category: 'Clickjacking', impact: '0 pts', detail: `Protected against iframe clickjacking (${headers['x-frame-options']}).` });
        } else {
            report += `[!] X-Frame-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'X-Frame-Options', status: 'MISSING', category: 'Clickjacking', impact: '-10 pts', detail: 'Site can be embedded in unauthorized external iframes.' });
        }

        // ৯. X-Content-Type-Options (MIME Sniffing)
        if (headers['x-content-type-options']) {
            report += `[+] X-Content-Type-Options: SECURE\n`;
            checks.push({ name: 'MIME Sniffing', status: 'SECURE', category: 'Headers', impact: '0 pts', detail: 'Prevents browser MIME-type sniffing (nosniff).' });
        } else {
            report += `[!] X-Content-Type-Options: MISSING\n`;
            score -= 10;
            checks.push({ name: 'MIME Sniffing', status: 'MISSING', category: 'Headers', impact: '-10 pts', detail: 'Missing X-Content-Type-Options: nosniff header.' });
        }

        // ১০. Referrer-Policy Check
        if (headers['referrer-policy']) {
            report += `[+] Referrer-Policy: SECURE (${headers['referrer-policy']})\n`;
            checks.push({ name: 'Referrer-Policy', status: 'SECURE', category: 'Privacy', impact: '0 pts', detail: `Referrer-Policy header is set (${headers['referrer-policy']}).` });
        } else {
            report += `[-] Referrer-Policy: NOTICE (Not configured)\n`;
            score -= 5;
            checks.push({ name: 'Referrer-Policy', status: 'NOTICE', category: 'Privacy', impact: '-5 pts', detail: 'Missing Referrer-Policy header to protect sensitive URL parameters.' });
        }

        // ১১. Permissions-Policy Check
        if (headers['permissions-policy'] || headers['feature-policy']) {
            report += `[+] Permissions-Policy: SECURE\n`;
            checks.push({ name: 'Permissions-Policy', status: 'SECURE', category: 'Browser API', impact: '0 pts', detail: 'Browser hardware/sensor APIs are restricted via Permissions-Policy.' });
        } else {
            report += `[-] Permissions-Policy: NOTICE (Not configured)\n`;
            score -= 5;
            checks.push({ name: 'Permissions-Policy', status: 'NOTICE', category: 'Browser API', impact: '-5 pts', detail: 'Missing Permissions-Policy header to restrict camera/mic/geolocation APIs.' });
        }

        // ১২. Cookie Security Flags (HttpOnly & Secure)
        const rawCookies = headers['set-cookie'];
        if (Array.isArray(rawCookies) && rawCookies.length > 0) {
            const insecureCookie = rawCookies.some(c => !/httponly/i.test(c) || !/secure/i.test(c));
            if (insecureCookie) {
                report += `[!] Session Cookies: WARNING (Missing HttpOnly or Secure flag)\n`;
                score -= 10;
                checks.push({ name: 'Cookie Security Flags', status: 'WARNING', category: 'Cookies', impact: '-10 pts', detail: 'One or more Set-Cookie headers lack HttpOnly or Secure attributes.' });
            } else {
                report += `[+] Session Cookies: SECURE (HttpOnly & Secure enforced)\n`;
                checks.push({ name: 'Cookie Security Flags', status: 'SECURE', category: 'Cookies', impact: '0 pts', detail: 'All cookies enforce HttpOnly and Secure flags.' });
            }
        } else {
            report += `[+] Session Cookies: SECURE (Stateless / No tracking cookies set)\n`;
            checks.push({ name: 'Cookie Security Flags', status: 'SECURE', category: 'Cookies', impact: '0 pts', detail: 'No insecure session cookies exposed on initial response.' });
        }

        if (score < 0) score = 0;
        report += `\nOVERALL SECURITY SCORE: ${score}/100`;

        if (scanCache.size >= MAX_CACHE_SIZE) scanCache.clear();
        scanCache.set(target, { report, score, checks, timestamp: Date.now() });

        // RLS-এর মাধ্যমে শুধুমাত্র বর্তমান লগইন করা ইউজারের নামে স্ক্যান রিপোর্টটি ডাটাবেসে সুরক্ষিতভাবে সেভ করা
        try {
            await ensureUsersTable();
            const currentOperator = req.user && req.user.user ? req.user.user : 'anonymous';
            await runWithRlsUser(currentOperator, async () => {
                await sql`
                    INSERT INTO scan_logs (owner_username, target_url, score, report)
                    VALUES (${currentOperator}, ${target}, ${score}, ${report})
                `;
            });
        } catch (dbErr) {
            console.error('[-] RLS Scan log save warning:', dbErr.message);
        }

        res.json({ success: true, report, score, checks });
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Target unreachable.' }); 
    }
});
app.get('/api/scan-history', requireHTTPAuth, async (req, res) => {
    try {
        await ensureUsersTable();
        const username = req.user.user;
        const history = await runWithRlsUser(username, async () => {
            return await sql`
                SELECT id, target_url AS target, score, scanned_at AS time
                FROM scan_logs
                WHERE LOWER(owner_username) = LOWER(${username})
                ORDER BY scanned_at DESC
                LIMIT 10
            `;
        });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load protected scan history.' });
    }
});

// ১০. ইমেইলে স্ক্যান রিপোর্ট পাঠানোর API
app.post('/api/send-report', requireHTTPAuth, async (req, res) => {
    const { target, reportData, emailTo } = req.body;
    if(!target || !reportData || !emailTo) return res.status(400).json({ success: false, error: "Missing information." });

    try {
        const mailOptions = {
            from: getEnv('GMAIL_USER'),
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

// ১১. GitHub OAuth লগইন
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

        try {
            await ensureUsersTable();
            await runWithRlsUser('__SYSTEM_AUTH__', async () => {
                await sql`
                    INSERT INTO users (username, avatar_url, provider, is_verified, last_login)
                    VALUES (${userData.login}, ${userData.avatar_url}, 'github', TRUE, NOW())
                    ON CONFLICT (username) DO UPDATE 
                    SET avatar_url = EXCLUDED.avatar_url, last_login = NOW()
                `;
            });
        } catch (dbError) {
            console.error("[-] Neon Database save failed.");
        }

        const token = jwt.sign({ user: userData.login, avatar: userData.avatar_url, provider: 'github' }, JWT_SECRET, { expiresIn: '2h' });
        res.send(`<script>localStorage.setItem('token', '${token}'); sessionStorage.setItem('active_session', '1'); window.location.href = '/dashboard';</script>`);
    } catch (error) { 
        res.status(500).send('<h3 style="color:red; text-align:center;">[!] OAUTH FAILURE. <a href="/">RETRY</a></h3>'); 
    }
});

// ১২. অ্যাকাউন্ট ও স্ক্যান ডেটা ডিলিট করার API (RLS Protected)
app.post('/api/account/delete', requireHTTPAuth, async (req, res) => {
    try {
        await ensureUsersTable();
        const username = req.user.user;

        await runWithRlsUser(username, async () => {
            await sql`DELETE FROM scan_logs WHERE LOWER(owner_username) = LOWER(${username})`;
            await sql`DELETE FROM users WHERE LOWER(username) = LOWER(${username})`;
        });

        res.json({
            success: true,
            message: "RLS Verified: Your account and all associated scan logs have been permanently deleted."
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete account data." });
    }
});

app.get('/sitemap.xml', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org'; 
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
    <url><loc>${domain}/about</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
    <url><loc>${domain}/cli</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
    <url><loc>${domain}/project</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
    <url><loc>${domain}/dashboard</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
    <url><loc>${domain}/reports</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

app.get('/robots.txt', (req, res) => {
    const domain = 'https://triscout.quarry.dpdns.org';
    const robots = `User-agent: *\nAllow: /\nDisallow: /profile\nDisallow: /api/\n\nSitemap: ${domain}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

module.exports = app;
