import express from "express";
import cors from "cors";
import pool from "./config/database.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "DAFI API funcionando",
  });
});

app.get("/api/v1/health/database", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, current_user AS username",
    );

    res.status(200).json({
      status: "ok",
      database: result.rows[0].database,
      username: result.rows[0].username,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      message: "Database connection unavailable",
    });
  }
});

export default app;