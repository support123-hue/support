import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-before-live';
const allowedOrigin = process.env.ADMIN_ALLOWED_ORIGIN || 'http://localhost:8080';

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"]
    }
  }
}));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Demo in-memory storage. Replace with PostgreSQL/Prisma for live use.
const db = {
  supporters: [],
  contributions: [],
  volunteers: [],
  messages: [],
  audit: [],
  admins: [
    // password: ChangeMeNow123!  -- replace immediately and seed securely in production.
    { id: 'admin-1', phone: '254729447922', role: 'super_admin', passwordHash: bcrypt.hashSync('ChangeMeNow123!', 12) }
  ]
};

function audit(action, actor, meta = {}) {
  db.audit.push({ id: crypto.randomUUID(), action, actor, meta, at: new Date().toISOString() });
}
function requireAuth(req, res, next) {
  const token = req.signedCookies?.session;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid session' }); }
}
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
}
function normalisePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('254')) return digits;
  return digits;
}

app.post('/api/admin/login',
  body('phone').trim().isLength({ min: 9, max: 15 }),
  body('password').isLength({ min: 10 }),
  validate,
  async (req, res) => {
    const phone = normalisePhone(req.body.phone);
    const admin = db.admins.find(a => a.phone === phone);
    if (!admin || !(await bcrypt.compare(req.body.password, admin.passwordHash))) {
      audit('admin_login_failed', phone);
      return res.status(401).json({ error: 'Wrong phone or password' });
    }
    const token = jwt.sign({ sub: admin.id, phone: admin.phone, role: admin.role }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', signed: true, maxAge: 2 * 60 * 60 * 1000 });
    audit('admin_login_success', admin.id);
    res.json({ ok: true, role: admin.role });
  }
);

app.post('/api/contributions',
  body('name').trim().isLength({ min: 2, max: 80 }).escape(),
  body('phone').customSanitizer(normalisePhone).matches(/^2547\d{8}$/).withMessage('Use a valid Kenyan mobile number'),
  body('amount').isInt({ min: 1, max: 100000 }),
  body('constituency').trim().isLength({ min: 2, max: 60 }).escape(),
  body('ward').optional({ nullable: true }).trim().isLength({ max: 80 }).escape(),
  body('consent').equals('true').withMessage('Consent is required'),
  validate,
  (req, res) => {
    const record = { id: crypto.randomUUID(), ...req.body, status: 'pending_mpesa', createdAt: new Date().toISOString() };
    db.contributions.push(record);
    audit('contribution_created', 'public', { contributionId: record.id, amount: record.amount });
    // Live step: call Safaricom Daraja STK Push here, save CheckoutRequestID, then wait for callback.
    res.status(201).json({ ok: true, contributionId: record.id, message: 'Contribution created. STK Push will be triggered in live mode.' });
  }
);

app.post('/api/supporters',
  body('name').trim().isLength({ min: 2, max: 80 }).escape(),
  body('phone').customSanitizer(normalisePhone).matches(/^2547\d{8}$/),
  body('constituency').trim().isLength({ min: 2, max: 60 }).escape(),
  body('ward').optional({ nullable: true }).trim().isLength({ max: 80 }).escape(),
  body('consent').equals('true'),
  validate,
  (req, res) => {
    const record = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() };
    db.supporters.push(record);
    audit('supporter_registered', 'public', { supporterId: record.id });
    res.status(201).json({ ok: true, supporterId: record.id });
  }
);

app.post('/api/volunteers',
  body('name').trim().isLength({ min: 2, max: 80 }).escape(),
  body('phone').customSanitizer(normalisePhone).matches(/^2547\d{8}$/),
  body('role').trim().isLength({ min: 3, max: 80 }).escape(),
  body('ward').trim().isLength({ min: 2, max: 80 }).escape(),
  validate,
  (req, res) => {
    const record = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() };
    db.volunteers.push(record);
    audit('volunteer_registered', 'public', { volunteerId: record.id });
    res.status(201).json({ ok: true, volunteerId: record.id });
  }
);

app.post('/api/messages',
  body('name').optional({ nullable: true }).trim().isLength({ max: 80 }).escape(),
  body('phone').optional({ nullable: true }).customSanitizer(normalisePhone),
  body('message').trim().isLength({ min: 2, max: 1000 }).escape(),
  validate,
  (req, res) => {
    const record = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() };
    db.messages.push(record);
    audit('message_received', 'public', { messageId: record.id });
    res.status(201).json({ ok: true, messageId: record.id });
  }
);

app.post('/api/mpesa/callback', (req, res) => {
  // Live step: verify callback source at infrastructure level, validate CheckoutRequestID, prevent duplicate receipt numbers,
  // update contribution status, and never trust amount/phone unless it matches the pending request.
  audit('mpesa_callback_received', 'mpesa', { bodyHash: crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex') });
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  res.json({
    totals: {
      contributions: db.contributions.length,
      supporters: db.supporters.length,
      volunteers: db.volunteers.length,
      messages: db.messages.length,
      raised: db.contributions.filter(c => c.status === 'paid').reduce((s,c) => s + Number(c.amount || 0), 0)
    },
    recent: {
      contributions: db.contributions.slice(-20),
      supporters: db.supporters.slice(-20),
      volunteers: db.volunteers.slice(-20),
      messages: db.messages.slice(-20)
    }
  });
});

app.listen(PORT, () => console.log(`Jane Tool secure backend skeleton running on port ${PORT}`));
