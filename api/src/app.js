const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// 1. Request Logging (Top of stack to catch everything)
app.use(morgan("dev"));

// 2. Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// 3. Performance & Rate Limiting
app.use(compression());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // A SPA loads many resources per page — 100 is far too low
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", limiter);

// 4. Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/users"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/uploads", require("./routes/uploads"));
app.use("/api/guests", require("./routes/guests"));
app.use("/api/consultants", require("./routes/consultants"));

// Roadmap Routes
app.use("/api/roadmaps", require("./routes/roadmaps"));
app.use("/api/roadmap-shares", require("./routes/roadmap-shares"));
app.use("/api", require("./routes/milestones"));
app.use("/api", require("./routes/epics"));
app.use("/api", require("./routes/features"));
app.use("/api", require("./routes/tasks"));
app.use("/api", require("./routes/task-extras"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

module.exports = app;
