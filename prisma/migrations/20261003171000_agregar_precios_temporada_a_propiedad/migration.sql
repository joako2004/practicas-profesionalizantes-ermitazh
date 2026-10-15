-- Agregar columnas de precio por temporada a la tabla propiedades
ALTER TABLE "propiedades" ADD COLUMN IF NOT EXISTS "precioNocheAlta" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "propiedades" ADD COLUMN IF NOT EXISTS "promoSemanalAlta" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "propiedades" ADD COLUMN IF NOT EXISTS "precioNocheBaja" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "propiedades" ADD COLUMN IF NOT EXISTS "promoSemanalBaja" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Backfill existente: setear valor por defecto 0 para filas existentes
UPDATE "propiedades" SET "precioNocheAlta" = 0 WHERE "precioNocheAlta" IS NULL;
UPDATE "propiedades" SET "promoSemanalAlta" = 0 WHERE "promoSemanalAlta" IS NULL;
UPDATE "propiedades" SET "precioNocheBaja" = 0 WHERE "precioNocheBaja" IS NULL;
UPDATE "propiedades" SET "promoSemanalBaja" = 0 WHERE "promoSemanalBaja" IS NULL;