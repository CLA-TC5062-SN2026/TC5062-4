import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";

const PORT = Number(process.env.PORT || 4000);

try {
  await pool.query("SELECT 1");
  app.listen(PORT, () =>
    console.log(`DAFI API running on http://localhost:${PORT}`),
  );
} catch (error) {
  console.error("No se pudo conectar con PostgreSQL:", error.message);
  process.exit(1);
}