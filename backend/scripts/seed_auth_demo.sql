-- Solo ambiente LOCAL. Crea un aviso falso para la prueba de registro con avisoVersion=1.
-- No usar este texto como aviso de privacidad en ambientes reales.
INSERT INTO aviso (codigo, version, texto, requiere_aceptacion)
VALUES ('privacidad', 1, 'AVISO FICTICIO DE PRUEBA. NO UTILIZAR EN PRODUCCIÓN.', true)
ON CONFLICT (codigo, version) DO NOTHING;
