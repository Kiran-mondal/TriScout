const nodemailer = require('nodemailer');
const { getEnv } = require('../middleware/auth.js');

const TRANSIENT_SMTP_CODES = new Set(['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNRESET', 'EDNS']);

function normalizeSmtpConfig(envGetter = getEnv) {
    const user = (envGetter('SMTP_USER') || envGetter('GMAIL_USER') || '').trim();
    // Strip all whitespace from 16-char Google App Passwords ("abcd efgh ijkl mnop")
    const rawPass = envGetter('SMTP_PASS') || envGetter('GMAIL_PASS') || '';
    const pass = rawPass.replace(/\s+/g, '');
    const host = (envGetter('SMTP_HOST') || 'smtp.gmail.com').trim();
    const customPort = Number(envGetter('SMTP_PORT'));
    const from = (envGetter('SMTP_FROM') || user).trim();

    return {
        configured: Boolean(user && pass),
        host,
        user,
        pass,
        from,
        primaryPort: Number.isInteger(customPort) && customPort > 0 ? customPort : 465,
        fallbackPort: Number.isInteger(customPort) && customPort > 0 ? null : 587
    };
}

function classifySmtpError(err) {
    const code = String((err && err.code) || '').toUpperCase();
    const responseCode = Number((err && err.responseCode) || 0);
    const msg = String((err && err.message) || '');

    if (code === 'MISSING_CREDENTIALS' || code === 'ENOAUTH') {
        return {
            category: 'MISSING_CREDENTIALS',
            code: code || 'ENOAUTH',
            retryable: false,
            userMessage: 'Email service is not configured on the server (missing GMAIL_USER / GMAIL_PASS).'
        };
    }

    if (code === 'EAUTH' || responseCode === 535 || responseCode === 534 || /Username and Password not accepted|Invalid login/i.test(msg)) {
        return {
            category: 'AUTH_FAILED',
            code: 'EAUTH',
            retryable: false,
            userMessage: 'Gmail SMTP rejected credentials. Use a 16-character Google App Password (with 2-Step Verification enabled), not your regular Gmail password.'
        };
    }

    if (code === 'ETIMEDOUT' || code === 'ESOCKET' || code === 'ECONNECTION' || code === 'EDNS') {
        return {
            category: 'NETWORK_ERROR',
            code,
            retryable: true,
            userMessage: 'Could not reach SMTP server (connection timeout or blocked port). Please retry in a moment.'
        };
    }

    if (responseCode >= 550 && responseCode < 560) {
        return {
            category: 'RECIPIENT_REJECTED',
            code: String(responseCode),
            retryable: false,
            userMessage: 'Recipient email address was rejected by the mail server.'
        };
    }

    return {
        category: 'SMTP_ERROR',
        code: code || 'UNKNOWN',
        retryable: false,
        userMessage: 'Failed to send verification email. Check server SMTP logs.'
    };
}

function createSmtpTransport(cfg, port, factory = nodemailer.createTransport) {
    const isImplicitTls = port === 465;
    return factory({
        host: cfg.host,
        port,
        secure: isImplicitTls,
        requireTLS: !isImplicitTls,
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 10000,
        auth: {
            user: cfg.user,
            pass: cfg.pass
        }
    });
}

function isMailerConfigured(envGetter = getEnv) {
    return normalizeSmtpConfig(envGetter).configured;
}

async function sendTriScoutEmail({ to, subject, text, html }, deps = {}) {
    const envGetter = deps.envGetter || getEnv;
    const transportFactory = deps.transportFactory || nodemailer.createTransport;
    const logger = deps.logger || ((level, event, meta) => {
        console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...meta }));
    });

    const cfg = normalizeSmtpConfig(envGetter);
    if (!cfg.configured) {
        const info = classifySmtpError({ code: 'MISSING_CREDENTIALS' });
        const err = new Error(info.userMessage);
        Object.assign(err, info);
        logger('ERROR', 'SMTP_CONFIG_MISSING', { hasUser: Boolean(cfg.user), hasPass: Boolean(cfg.pass) });
        throw err;
    }

    if (!to || !subject || (!text && !html)) {
        const err = new Error('Email recipient, subject, and body are required.');
        err.category = 'INVALID_PAYLOAD';
        err.code = 'INVALID_PAYLOAD';
        err.retryable = false;
        err.userMessage = err.message;
        throw err;
    }

    const portsToTry = cfg.fallbackPort ? [cfg.primaryPort, cfg.fallbackPort] : [cfg.primaryPort];
    let lastError = null;

    for (let i = 0; i < portsToTry.length; i++) {
        const port = portsToTry[i];
        const transport = createSmtpTransport(cfg, port, transportFactory);
        try {
            const info = await transport.sendMail({
                from: `"TriScout TAC-OPS" <${cfg.from}>`,
                to,
                subject,
                text,
                ...(html ? { html } : {})
            });
            if (typeof transport.close === 'function') transport.close();
            return { ok: true, messageId: info && info.messageId ? info.messageId : null, portUsed: port };
        } catch (rawErr) {
            if (typeof transport.close === 'function') transport.close();
            const classified = classifySmtpError(rawErr);
            logger('ERROR', 'SMTP_SEND_ATTEMPT_FAILED', {
                host: cfg.host,
                port,
                code: classified.code,
                category: classified.category,
                responseCode: rawErr && rawErr.responseCode ? rawErr.responseCode : null,
                command: rawErr && rawErr.command ? rawErr.command : null
            });

            lastError = Object.assign(new Error(classified.userMessage), classified);

            const shouldRetryNextPort = i < portsToTry.length - 1 && TRANSIENT_SMTP_CODES.has(classified.code);
            if (!shouldRetryNextPort) break;
        }
    }

    throw lastError;
}

module.exports = {
    normalizeSmtpConfig,
    classifySmtpError,
    isMailerConfigured,
    sendTriScoutEmail
};
                            
