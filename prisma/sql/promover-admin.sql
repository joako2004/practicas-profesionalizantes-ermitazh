-- Promover usuario admin existente al rol ADMIN
-- Arquivo idempotente (safe para ejecutar múltiples veces)
INSERT INTO "perfiles" ("id", "email", "nombre", "apellido", "rol", "actualizadoEn")
SELECT id, email, 'Admin', NULL, 'ADMIN', NOW()
FROM auth.users
WHERE email = 'TU-EMAIL-ADMIN@ejemplo.com'
ON CONFLICT ("id") DO UPDATE SET "rol" = 'ADMIN', "actualizadoEn" = NOW();