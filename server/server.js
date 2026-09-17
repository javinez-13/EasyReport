require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const hearingRoutes = require("./routes/hearingRoutes");
const summonRoutes = require("./routes/summonRoutes");
const reportRoutes = require("./routes/reportRoutes");
const residentRoutes = require("./routes/residentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "Barangay EasyReport API Running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin/complaints", complaintRoutes);
app.use("/api/hearings", hearingRoutes);
app.use("/api/summons", summonRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/residents", residentRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
