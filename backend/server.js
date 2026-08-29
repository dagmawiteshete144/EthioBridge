const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ============================
// MongoDB Connection
// ============================
connectDB();

// ============================
// Middleware
// ============================
app.use(cors());
app.use(express.json());

// ============================
// Routes
// ============================
app.use("/api/auth", authRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    message: "EthioBridge backend is running",
  });
});

// ============================
// Server
// ============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});