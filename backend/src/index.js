const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dns = require('dns');

// Force IPv4 resolution to prevent ENETUNREACH on Render
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [
  'https://unitickets-six.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '1mb' }));

const apiReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Relaxed for normal reads and dashboard loads
  message: { message: 'Too many requests. Please try again later.' }
});

const apiWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 write actions per minute per IP
  message: { message: 'Too many requests. Please try again later.' }
});

// Apply distinct limiters based on HTTP method
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    return apiReadLimiter(req, res, next);
  } else {
    return apiWriteLimiter(req, res, next);
  }
});

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const commentRoutes = require('./routes/comments');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const taskRoutes = require('./routes/tasks');
const meetingRoutes = require('./routes/meetings');
const auditLogsRoutes = require('./routes/auditLogs');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', commentRoutes); // comments nested under tickets
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "UniTickets backend is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Safe startup configuration logs
  console.log('--- Environment Check ---');
  console.log(`EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
  if (process.env.EMAIL_USER) {
    const domain = process.env.EMAIL_USER.split('@')[1] || 'unknown';
    console.log(`Sender domain: @${domain}`);
  }
  
  const frontendUrl = process.env.FRONTEND_URL || '';
  console.log(`FRONTEND_URL configured: ${!!process.env.FRONTEND_URL}`);
  
  const hasLocalhost = frontendUrl.includes('localhost');
  console.log(`FRONTEND_URL contains localhost: ${hasLocalhost}`);
  
  console.log(`SMTP host mode: gmail-smtp-ipv4`);
  console.log(`SMTP port: ${process.env.EMAIL_PORT || 587}`);

  if (process.env.NODE_ENV === 'production' && hasLocalhost) {
    console.warn('WARNING: Running in production but FRONTEND_URL contains localhost! Verification links will be broken for real users.');
  }
  console.log('-------------------------');
});
