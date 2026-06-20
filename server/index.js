require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const writeupsRouter = require('./routes/writeups');

const app  = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const hits = new Map();

setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, r] of hits) if (r.start < cutoff) hits.delete(key);
}, 10 * 60_000).unref();

function rateLimit(max, windowMs = 60_000) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const r   = hits.get(key) || { count: 0, start: now };
    if (now - r.start > windowMs) { r.count = 0; r.start = now; }
    r.count++;
    hits.set(key, r);
    if (r.count > max) return res.status(429).json({ error: 'slow down' });
    next();
  };
}

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '64kb' }));
app.use(rateLimit(120));

app.use(express.static(path.join(__dirname, '..')));
app.use('/api/writeups', rateLimit(20), writeupsRouter);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
