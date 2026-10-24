const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

function getEnv(key) {
    if (process.env[key]) return process.env[key].trim();
    const foundKey = Object.keys(process.env).find(k => k.trim() === key);
    return foundKey ? process.env[foundKey].trim() : undefined;
}

// যদি কোনো কারণে Vercel থেকে JWT_SECRET না পায়, তবে DATABASE_URL থেকে একটি স্থায়ী (Static) হ্যাশ তৈরি করে নেবে। 
// ফলে সার্ভার রিস্টার্ট বা দুই ফাইলের মধ্যে কখনোই Secret অমিল হবে না!
const fallbackSecret = crypto.createHash('sha256').update(getEnv('DATABASE_URL') || 'triscout_prod_fallback_key').digest('hex');
const JWT_SECRET = getEnv('JWT_SECRET') || fallbackSecret;

function requireHTTPAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: Missing secure pipeline token.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or token invalid.' });
        }
        req.user = user;
        next();
    });
}

function verifyWSToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// এখানে JWT_SECRET এক্সপোর্ট করা হলো যাতে server.js হুবহু একই সিক্রেট ব্যবহার করে
module.exports = { requireHTTPAuth, verifyWSToken, JWT_SECRET, getEnv };
