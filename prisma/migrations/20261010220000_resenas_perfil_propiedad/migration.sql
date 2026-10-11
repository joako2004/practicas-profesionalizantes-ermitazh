-- Resenas de huespedes: vinculo con perfil y propiedad, y reserva opcional.
-- Escrita a mano (la base tiene drift: no usar migrate dev/reset ni db push).
-- Idempotente y atomica: si algo falla, no queda nada aplicado.
BEGIN;

ALTER TABLE "resenas" ADD COLUMN IF NOT EXISTS "propiedad_id" TEXT;
ALTER TABLE "resenas" ADD COLUMN IF NOT EXISTS "perfil_id" UUID;

-- Backfill: la propiedad de las resenas existentes sale de su reserva.
UPDATE "resenas"
SET "propiedad_id" = "reservas"."propiedad_id"
FROM "reservas"
WHERE "resenas"."reserva_id" = "reservas"."id"
  AND "resenas"."propiedad_id" IS NULL;

-- Si quedara alguna fila sin propiedad, el SET NOT NULL falla y todo se revierte.
ALTER TABLE "resenas" ALTER COLUMN "propiedad_id" SET NOT NULL;

-- La reserva pasa a ser opcional (el huesped puede resenar sin reserva).
ALTER TABLE "resenas" ALTER COLUMN "reserva_id" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resenas_propiedad_id_fkey' AND conrelid = 'public.resenas'::regclass) THEN
    ALTER TABLE "resenas" ADD CONSTRAINT "resenas_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resenas_perfil_id_fkey' AND conrelid = 'public.resenas'::regclass) THEN
    ALTER TABLE "resenas" ADD CONSTRAINT "resenas_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Una resena por huesped y por cabana (los NULL no chocan entre si).
CREATE UNIQUE INDEX IF NOT EXISTS "resenas_perfil_id_propiedad_id_key" ON "resenas"("perfil_id", "propiedad_id");

COMMIT;