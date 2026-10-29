-- Deshace la migracion 20261029200000_noches_bloqueadas (tabla de noches bloqueadas).
-- Si la migracion ya se registro con `prisma migrate resolve --applied`,
-- hay que marcarla como revertida a mano (la base tiene drift: no usar migrate reset/dev).
BEGIN;

DROP TABLE IF EXISTS "noches_bloqueadas";

COMMIT;
