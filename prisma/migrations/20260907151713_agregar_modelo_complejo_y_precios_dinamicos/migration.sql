-- CreateEnum
CREATE TYPE "TramoNoches" AS ENUM ('UNA_NOCHE', 'DE_DOS_A_SEIS', 'SIETE_O_MAS');

-- Agregar columnas como nullable para poder backfillear las 56 filas existentes
ALTER TABLE "precios" ADD COLUMN "cantidad_personas" INTEGER,
ADD COLUMN "tramo_noches" "TramoNoches",
ADD COLUMN "estancia_temporada" TEXT;

-- Backfill de filas existentes: cantidadPersonas=1 (precio único aplicable a cualquier
-- ocupacion via regla "minimo >=") y tramoNoches='DE_DOS_A_SEIS' (valor neutro de tramo).
UPDATE "precios" SET "cantidad_personas" = 1 WHERE "cantidad_personas" IS NULL;
UPDATE "precios" SET "tramo_noches" = 'DE_DOS_A_SEIS' WHERE "tramo_noches" IS NULL;

-- Ahora setear NOT NULL
ALTER TABLE "precios" ALTER COLUMN "cantidad_personas" SET NOT NULL;
ALTER TABLE "precios" ALTER COLUMN "tramo_noches" SET NOT NULL;

-- CreateTable
CREATE TABLE "complejos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slogan" TEXT,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "fotos" TEXT[],
    "servicios" TEXT[],
    "serviciosCompartidos" TEXT[],
    "politicas" TEXT[],
    "precio_base" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "complejos_pkey" PRIMARY KEY ("id")
);
