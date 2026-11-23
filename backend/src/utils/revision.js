// RF-16-AC-2: solo la médica asignada, al abrir una conversación ENVIADA, la pasa a EN_REVISION.
// Pura (sin BD) para probarla en unitarias; el UPDATE condicional repite la regla contra carreras.
export const debeIniciarRevision = ({ rol, usuarioId, estado, medicoId }) =>
  rol === "medico" && estado === "ENVIADA" && Boolean(usuarioId) && usuarioId === medicoId;
