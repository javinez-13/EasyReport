import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
const complaintRoutes = require("../routes/complaintRoutes");
const clientRoutes = require("../routes/clientRoutes");
const hearingRoutes = require("../routes/hearingRoutes");
const summonRoutes = require("../routes/summonRoutes");
const reportRoutes = require("../routes/reportRoutes");
const residentRoutes = require("../routes/residentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "12mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Barangay EasyReport API Running (TypeScript)" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin/complaints", complaintRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/hearings", hearingRoutes);
app.use("/api/summons", summonRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/residents", residentRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
