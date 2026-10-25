#!/bin/sh
# Pruebas manuales desde terminal (S05-S06-A2). Requiere la API en marcha con los datos
# ficticios de backend/scripts (seed_demo.sql, seed_auth_demo.sql, seed_medico_demo.mjs)
# y la contraseña de la cuidadora demo fijada para pruebas locales.
# Uso: sh pruebas_terminal.sh [URL_BASE]   (JWT_SECRET en el entorno para el token vencido)
B=${1:-http://localhost:4000/api/v1}
FAM=22222222-2222-4222-8222-222222222222
CRED_CP='{"correo":"cuidador.demo@dafi.invalid","contrasena":"CuidadorDemo123!"}'
CRED_MED='{"correo":"medico.demo@dafi.invalid","contrasena":"MedicoDemo123!"}'
PERFIL='{"tipo":"menor","nombre":"Sofía","fechaNacimiento":"2022-05-01"}'
r() { printf '%-58s -> %s\n' "$1" "$2"; }
tok() { curl -s -X POST "$B/auth/login" -H 'Content-Type: application/json' -d "$1" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p'; }
CP=$(tok "$CRED_CP"); MED=$(tok "$CRED_MED")
MALO=$(echo "$CP" | sed 's/.$/X/'); [ "$MALO" = "$CP" ] && MALO=$(echo "$CP" | sed 's/.$/Y/')
VENCIDO=$(node -e "const j=require('jsonwebtoken');process.stdout.write(j.sign({rol:'cuidador_principal',familiaId:'$FAM'},process.env.JWT_SECRET,{algorithm:'HS256',issuer:'dafi-api',audience:'dafi-client',subject:'11111111-1111-4111-8111-111111111111',jwtid:require('crypto').randomUUID(),expiresIn:-60}))")
r "GET /auth/me sin token" "$(curl -s -o /dev/null -w '%{http_code}' "$B/auth/me")"
r "GET /auth/me con token modificado (1 carácter)" "$(curl -s -o /dev/null -w '%{http_code}' "$B/auth/me" -H "Authorization: Bearer $MALO")"
r "GET /auth/me con token vencido" "$(curl -s -o /dev/null -w '%{http_code}' "$B/auth/me" -H "Authorization: Bearer $VENCIDO")"
r "POST /auth/login con contraseña incorrecta" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/auth/login" -H 'Content-Type: application/json' -d '{"correo":"cuidador.demo@dafi.invalid","contrasena":"incorrecta"}')"
r "POST perfil sin token" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/familias/$FAM/perfiles" -H 'Content-Type: application/json' -d "$PERFIL")"
r "POST perfil con token de médico (rol incorrecto)" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/familias/$FAM/perfiles" -H "Authorization: Bearer $MED" -H 'Content-Type: application/json' -d "$PERFIL")"
r "POST perfil con token de cuidadora principal" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/familias/$FAM/perfiles" -H "Authorization: Bearer $CP" -H 'Content-Type: application/json' -d "$PERFIL")"
r "GET /auth/me con token válido" "$(curl -s -o /dev/null -w '%{http_code}' "$B/auth/me" -H "Authorization: Bearer $CP")"
