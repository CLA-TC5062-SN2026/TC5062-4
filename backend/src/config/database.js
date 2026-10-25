import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "dafi",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (error) =>
  console.error("Error de conexión PostgreSQL:", error.message),
);
export default pool;