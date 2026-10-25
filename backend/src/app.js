import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import pool from "./config/database.js";
import familias from "./routes/familias.js";
import perfiles from "./routes/perfiles.js";
import conversaciones from "./routes/conversaciones.js";
import catalogos from "./routes/catalogos.js";
import auth from "./routes/auth.js";
import { authenticate } from "./middleware/authenticate.js";
import { authorize } from "./middleware/authorize.js";
import { ApiError } from "./utils/http.js";

const app = express();
app.use(cors());
app.use((req, res, next) => {
  req.correlationId = randomUUID();
  res.set("X-Correlation-Id", req.correlationId);
  next();
});
app.use(
  express.json({
    limit: "1mb",
    type: ["application/json", "application/merge-patch+json"],
  }),
);

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", message: "DAFI API funcionando" });
});

// Catálogos públicos y autenticación: no requieren token.
app.use("/api/v1", catalogos, auth);
// Los CRUD requieren JWT y autorización por rol + pertenencia al recurso.
app.use("/api/v1", authenticate, authorize, familias, perfiles, conversaciones);
app.use((req, res, next) =>
  next(new ApiError(404, "NO_ENCONTRADO", "Ruta no encontrada")),
);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    error = new ApiError(400, "SOLICITUD_MALFORMADA", "JSON inválido");
  }
  const pgCode = error.code;
  if (["23502", "23503", "23505", "23514", "22P02", "22001"].includes(pgCode)) {
    error = new ApiError(
      422,
      "DATOS_INVALIDOS",
      "Datos incompatibles con las restricciones de la base de datos",
    );
  }
  const status = error.status ?? 500;
  if (status >= 500) console.error("Error de API:", error);
  res.status(status).json({
    codigo: error.codigo ?? "ERROR_INTERNO",
    mensaje: status >= 500 ? "Error interno del servidor" : error.message,
    correlacionId: req.correlationId,
  });
});

export default app;