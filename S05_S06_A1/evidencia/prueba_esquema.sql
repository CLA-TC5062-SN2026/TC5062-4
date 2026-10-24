-- Prueba de humo de esquema_bd.sql (S05-S06-A1). Se ejecuta sobre una base recién importada.
-- Cada bloque es una transacción; los que deben fallar lo indican.
\set ON_ERROR_STOP 0
\echo '== 1. Registro: usuario + familia + cuidador principal en una transacción (debe pasar)'
BEGIN;
INSERT INTO usuario (id, tipo_usuario, nombre, correo, hash_contrasena)
  VALUES ('11111111-1111-4111-8111-111111111111','cuidador','Ana López','ana@example.com','$2b$12$hash');
INSERT INTO familia (id, nombre) VALUES ('22222222-2222-4222-8222-222222222222','Familia López');
INSERT INTO cuidador (id, familia_id, tipo, declara_mayor_de_edad, consiente_datos_propios, consiente_datos_menores)
  VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','principal',true,true,true);
COMMIT;
\echo '== 2. Familia sin cuidador principal (debe fallar al confirmar)'
BEGIN; INSERT INTO familia (nombre) VALUES ('Familia sin principal'); COMMIT;
\echo '== 3. Perfil, médica en el círculo, conversación con etiqueta y mensaje solo con foto (debe pasar)'
BEGIN;
INSERT INTO perfil_paciente (id, familia_id, tipo, nombre, fecha_nacimiento)
  VALUES ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','menor','Mateo','2021-03-12');
INSERT INTO usuario (id, tipo_usuario, nombre, correo, hash_contrasena)
  VALUES ('44444444-4444-4444-8444-444444444444','medico','Dra. A','dra.a@example.com','$2b$12$hash');
INSERT INTO medico (id, version_terminos) VALUES ('44444444-4444-4444-8444-444444444444',1);
INSERT INTO miembro_circulo (familia_id, medico_id) VALUES ('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444');
INSERT INTO etiqueta (id, codigo, nombre) VALUES ('55555555-5555-4555-8555-555555555555','fiebre','Fiebre');
INSERT INTO conversacion (id, perfil_id, medico_id, abierta_por_id, titulo)
  VALUES ('66666666-6666-4666-8666-666666666666','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','Fiebre desde anoche');
INSERT INTO conversacion_etiqueta (conversacion_id, etiqueta_id) VALUES ('66666666-6666-4666-8666-666666666666','55555555-5555-4555-8555-555555555555');
INSERT INTO foto (id, conversacion_id, clave_archivo, bytes, ancho_px, alto_px)
  VALUES ('77777777-7777-4777-8777-777777777777','66666666-6666-4666-8666-666666666666','fotos/abc.jpg',500000,1024,768);
INSERT INTO evento (id, conversacion_id, tipo, autor_id, responde_a_solicitud)
  VALUES ('88888888-8888-4888-8888-888888888888','66666666-6666-4666-8666-666666666666','mensaje','11111111-1111-4111-8111-111111111111',false);
INSERT INTO mensaje_foto (evento_id, foto_id) VALUES ('88888888-8888-4888-8888-888888888888','77777777-7777-4777-8777-777777777777');
COMMIT;
\echo '== 3b. Un médico sale del círculo: su permiso de «Compartir historial» se borra (consolidación con Daniel)'
BEGIN;
INSERT INTO usuario (id, tipo_usuario, nombre, correo, hash_contrasena)
  VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','medico','Dr. B','dr.b@example.com','$2b$12$hash');
INSERT INTO medico (id, version_terminos) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1);
INSERT INTO miembro_circulo (familia_id, medico_id) VALUES ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
INSERT INTO permiso_historial (perfil_id, medico_id, compartir_historial) VALUES ('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
DELETE FROM miembro_circulo WHERE medico_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SELECT count(*) AS permisos_restantes FROM permiso_historial WHERE medico_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
COMMIT;
\echo '== 4. Conversación dirigida a un médico fuera del círculo (debe fallar)'
BEGIN;
INSERT INTO usuario (id, tipo_usuario, nombre, correo, hash_contrasena)
  VALUES ('99999999-9999-4999-8999-999999999999','medico','Dr. Externo','dr.x@example.com','$2b$12$hash');
INSERT INTO medico (id, version_terminos) VALUES ('99999999-9999-4999-8999-999999999999',1);
INSERT INTO conversacion (perfil_id, medico_id, titulo) VALUES ('33333333-3333-4333-8333-333333333333','99999999-9999-4999-8999-999999999999','Otra');
COMMIT;
\echo '== 5. Correo duplicado sin distinguir mayúsculas (debe fallar)'
INSERT INTO usuario (tipo_usuario, nombre, correo, hash_contrasena) VALUES ('cuidador','Otra','ANA@example.com','x');
\echo '== 6. Borrar la familia borra en cascada perfiles, conversaciones, eventos y la cuenta del cuidador'
DELETE FROM familia WHERE id = '22222222-2222-4222-8222-222222222222';
SELECT (SELECT count(*) FROM usuario WHERE tipo_usuario='cuidador') AS cuidadores,
       (SELECT count(*) FROM perfil_paciente) AS perfiles,
       (SELECT count(*) FROM conversacion) AS conversaciones,
       (SELECT count(*) FROM evento) AS eventos,
       (SELECT count(*) FROM medico) AS medicos_conservados;
