const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

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

app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', commentRoutes); // comments nested under tickets
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "UniTickets backend is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
