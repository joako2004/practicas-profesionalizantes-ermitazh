-- Elimina las columnas legacy de precios de propiedades (P12-3b).
-- Precios en pesos (precioNocheAlta, precioNocheBaja), precioBase y promoSemanal
-- ya no se leen ni se escriben desde el codigo: los precios viven en USD
-- (precioNocheAltaUsd, precioNocheBajaUsd, precio2a6AltaUsd, precio2a6BajaUsd)
-- y la promo de 7+ noches en promoSemanalAlta / promoSemanalBaja (se quedan).
-- Migracion destructiva, idempotente (IF EXISTS), escrita a mano (la base tiene drift:
-- no usar migrate dev/reset ni db push). Backup previo: ~/backups/pre-p12-3b-*.dump.
-- Sin rollback SQL: los valores eliminados eran obsoletos y el backup cubre emergencias.
BEGIN;

ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precioBase";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "promoSemanal";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precioNocheAlta";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precioNocheBaja";

COMMIT;
