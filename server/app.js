// Core Modules
const path = require('path');
const http = require('http');

// External Modules
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Server } = require("socket.io");

// Custom Modules
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const { initializeSocketIO } = require("./sockets");
const morganMiddleware = require("./logger/morgan.logger");

// Route Handlers
const userRoutes = require('./routes/userRoutes');
const coinRoutes = require('./routes/coinRoutes');
const commentRoutes = require('./routes/commentRoutes');
const imageRoutes = require('./routes/imageUploadRoutes');
const transactionRoutes = require('./routes/transctionRoute');
const chartRoutes = require('./routes/chartRoutes');

// Initialize Express App
const app = express();
const httpServer = http.createServer(app);

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Middleware for Parsing and Logging
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://tege-jade.vercel.app'] 
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  max: 10000,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Custom Logger Middleware
app.use(morganMiddleware);

// Basic Route
app.get("/", (req, res) => {
  res.json("Pump Fun Server");
});

// API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/coins', coinRoutes);   
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/images', imageRoutes); 
app.use('/api/v1/trnx', transactionRoutes); 
app.use('/api/v1/chart', chartRoutes ); 

// Handle Undefined Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set("io", io); 

initializeSocketIO(io);

// Global Error Handler
app.use(globalErrorHandler);

// Export HTTP Server
module.exports = httpServer;





