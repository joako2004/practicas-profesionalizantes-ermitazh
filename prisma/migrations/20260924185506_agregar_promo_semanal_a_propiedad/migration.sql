-- Agregar columna promoSemanal a la tabla propiedades
ALTER TABLE "propiedades" ADD COLUMN "promoSemanal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill existente: setear valor por defecto 0 para filas existentes
UPDATE "propiedades" SET "promoSemanal" = 0 WHERE "promoSemanal" IS NULL;

-- Ahora setear NOT NULL (aunque ya tiene default, esto es un buen práctica)
COMMENT ON COLUMN "propiedades"."promoSemanal" ES 'Porcentaje de descuento semanal aplicable para reservas de 7 noches o más. 0 significa sin descuento.';