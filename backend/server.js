const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const glucoseRoutes = require("./routes/glucoseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Initialize express app
const app = express();

// Set environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin:
      NODE_ENV === "production"
        ? ["https://gdm.devapp.cc"]
        : ["http://localhost:3004"],
    credentials: true,
  })
);
app.use(morgan(NODE_ENV === "development" ? "dev" : "combined")); // Logging

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    res.status(200).json({
      status: "success",
      message: "Server is healthy",
      databaseConnected: true,
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Server is running but database connection failed",
      databaseConnected: false,
      error:
        NODE_ENV === "development" ? error.message : "Internal Server Error",
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/glucose", glucoseRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`API Health check: http://localhost:${PORT}/api/health`);
});
