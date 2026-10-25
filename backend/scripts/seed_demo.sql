-- SOLO PARA PRUEBAS LOCALES DE S05-S06 A1.
-- IDs conocidos; no usar en un ambiente real ni con datos de pacientes.
-- Ejecutar una sola vez (inserciones repetibles con ON CONFLICT DO NOTHING).
BEGIN;

INSERT INTO usuario (id, tipo_usuario, nombre, correo, hash_contrasena)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'cuidador', 'Cuidador de prueba', 'cuidador.demo@dafi.invalid', 'NO_ES_UN_HASH_VALIDO_SOLO_DEMO'),
  ('33333333-3333-4333-8333-333333333333', 'medico', 'Médica de prueba', 'medico.demo@dafi.invalid', 'NO_ES_UN_HASH_VALIDO_SOLO_DEMO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO familia (id, nombre)
VALUES ('22222222-2222-4222-8222-222222222222', 'Familia de prueba')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cuidador (id, familia_id, tipo, declara_mayor_de_edad, consiente_datos_propios, consiente_datos_menores)
VALUES ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'principal', true, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO medico (id, version_terminos)
VALUES ('33333333-3333-4333-8333-333333333333', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO miembro_circulo (familia_id, medico_id)
VALUES ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')
ON CONFLICT (familia_id, medico_id) DO NOTHING;

INSERT INTO etiqueta (codigo, nombre)
VALUES ('fiebre', 'Fiebre')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
