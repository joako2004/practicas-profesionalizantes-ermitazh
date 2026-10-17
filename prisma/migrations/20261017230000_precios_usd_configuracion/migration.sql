-- Precios en USD (P2a): enum Temporada, columnas USD en propiedades,
-- configuracion global (configuracion_precios), cotizaciones del dolar
-- y snapshot de la estimacion en reservas.
-- Migracion ADITIVA e idempotente. Escrita a mano (la base tiene drift:
-- no usar migrate dev/reset ni db push).
BEGIN;

-- 1. Enum de temporada activa (ALTA/BAJA). Reutiliza la convencion de "TramoNoches".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'Temporada' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public."Temporada" AS ENUM ('ALTA', 'BAJA');
  END IF;
END $$;

-- 2. Precios en USD por noche en propiedades (las columnas ARS actuales se mantienen).
ALTER TABLE public."propiedades" ADD COLUMN IF NOT EXISTS "precioNocheAltaUsd" DECIMAL(10,2);
ALTER TABLE public."propiedades" ADD COLUMN IF NOT EXISTS "precioNocheBajaUsd" DECIMAL(10,2);
ALTER TABLE public."propiedades" ADD COLUMN IF NOT EXISTS "precio2a6AltaUsd" DECIMAL(10,2);
ALTER TABLE public."propiedades" ADD COLUMN IF NOT EXISTS "precio2a6BajaUsd" DECIMAL(10,2);

-- 3. Configuracion global de precios: singleton de una sola fila (id = 1).
CREATE TABLE IF NOT EXISTS public."configuracion_precios" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tipoDolar" TEXT NOT NULL DEFAULT 'blue',
    "temporadaActiva" "Temporada" NOT NULL DEFAULT 'ALTA',
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracion_precios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "configuracion_precios_id_check" CHECK ("id" = 1)
);

INSERT INTO public."configuracion_precios" ("id", "tipoDolar", "temporadaActiva", "actualizadoEn")
VALUES (1, 'blue', 'ALTA', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 4. Cotizacion del dolar: una fila por tipo (la app hara upsert).
CREATE TABLE IF NOT EXISTS public."cotizaciones" (
    "tipo" TEXT NOT NULL,
    "compra" DECIMAL(12,2),
    "venta" DECIMAL(12,2) NOT NULL,
    "fechaApi" TIMESTAMP(3),
    "obtenidaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("tipo")
);

-- 5. Snapshot de la estimacion al pre-reservar (nullable: las reservas viejas no lo tienen).
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "total_estimado_usd" DECIMAL(10,2);
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "total_estimado_ars" DECIMAL(12,2);
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "precio_noche_usd_aplicado" DECIMAL(10,2);
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "tipo_dolar_usado" TEXT;
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "cotizacion_usada" DECIMAL(12,2);
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "temporada_aplicada" "Temporada";
ALTER TABLE public."reservas" ADD COLUMN IF NOT EXISTS "tramo_aplicado" "TramoNoches";

-- 6. RLS sin politicas + revocacion de acceso publico (server-only via Prisma).
ALTER TABLE public."configuracion_precios" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."configuracion_precios" FROM anon, authenticated;
ALTER TABLE public."cotizaciones" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."cotizaciones" FROM anon, authenticated;

COMMIT;
