-- SOLO PARA EMERGENCIAS: revierte la migracion 20261017230000_precios_usd_configuracion.
-- BORRA DATOS: cotizaciones, configuracion_precios y el snapshot de estimaciones en reservas.
-- No revierte nada por si sola: ejecutar manualmente y bajo supervision.
BEGIN;

DROP TABLE IF EXISTS public."cotizaciones";
DROP TABLE IF EXISTS public."configuracion_precios";

ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "total_estimado_usd";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "total_estimado_ars";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "precio_noche_usd_aplicado";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "tipo_dolar_usado";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "cotizacion_usada";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "temporada_aplicada";
ALTER TABLE public."reservas" DROP COLUMN IF EXISTS "tramo_aplicado";

ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precioNocheAltaUsd";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precioNocheBajaUsd";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precio2a6AltaUsd";
ALTER TABLE public."propiedades" DROP COLUMN IF EXISTS "precio2a6BajaUsd";

DROP TYPE IF EXISTS public."Temporada";

COMMIT;
