import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";

const PORT = Number(process.env.PORT || 4000);
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  throw new Error(
    "JWT_SECRET debe configurarse con al menos 32 bytes aleatorios",
  );
}
if (!process.env.JWT_EXPIRATION) {
  throw new Error("Configura JWT_EXPIRATION (por ejemplo, 30m)");
}

try {
  await pool.query("SELECT 1");
  app.listen(PORT, () =>
    console.log(`DAFI API running on http://localhost:${PORT}`),
  );
} catch (error) {
  console.error("No se pudo conectar con PostgreSQL:", error.message);
  process.exit(1);
}