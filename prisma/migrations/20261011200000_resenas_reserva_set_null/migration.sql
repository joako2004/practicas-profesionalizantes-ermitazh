-- Resenas: al borrar una reserva, la resena sobrevive y pierde el vinculo (SET NULL).
-- Escrita a mano (la base tiene drift: no usar migrate dev/reset ni db push).
-- Idempotente y atomica: si algo falla, no queda nada aplicado.
BEGIN;

ALTER TABLE "resenas" DROP CONSTRAINT IF EXISTS "resenas_reserva_id_fkey";

ALTER TABLE "resenas" ADD CONSTRAINT "resenas_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;