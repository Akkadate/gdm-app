require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Pool } = require("pg");

// เพิ่ม routes ใหม่
const patientsRoutes = require("./routes/patients.routes");
const glucoseRecordsRoutes = require("./routes/glucose-records.routes");
const medicationsRoutes = require("./routes/medications.routes");

// ตั้งค่า Express app
const app = express();
const PORT = process.env.PORT || 4700;

// เชื่อมต่อฐานข้อมูล
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Database connection error:", err.stack));

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make db pool available for all routes
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/patients", require("./routes/patients.routes"));
app.use("/api/glucose", require("./routes/glucose.routes"));
app.use("/api/meals", require("./routes/meals.routes"));
app.use("/api/activities", require("./routes/activities.routes"));
app.use("/api/weights", require("./routes/weights.routes"));
app.use("/api/appointments", require("./routes/appointments.routes"));
app.use("/api/treatments", require("./routes/treatments.routes"));
app.use("/api/reports", require("./routes/reports.routes"));

// ใช้งาน routes
app.use("/api/patients", patientsRoutes);
app.use("/api/glucose-records", glucoseRecordsRoutes);
app.use("/api/medications", medicationsRoutes);

// Basic route for testing
app.get("/api/health", (req, res) => {
  res.json({ message: "GDM API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
