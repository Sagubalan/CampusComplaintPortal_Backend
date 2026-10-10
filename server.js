
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables from the backend folder,
// then fall back to the current working directory.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Allowed frontend origins
const allowedOrigins = [
  'https://campus-complaint-portal-5j8b.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header (e.g., server-to-server requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Register CORS before API routes so preflight requests are handled.
app.use(cors(corsOptions));

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for uploaded complaint evidence
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check API
app.use('/api/health', healthRoutes);

// Application API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus Complaint Management System API is running',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error-handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server when running directly.
// Export app for platforms that import the Express application.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
}

module.exports = app;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err);
});
