-- Renombrar total_estadia → precio_total_estadia
ALTER TABLE "reservas" RENAME COLUMN "total_estadia" TO "precio_total_estadia";

-- Agregar columna dias_estadia (requerida, con default para filas existentes)
ALTER TABLE "reservas" ADD COLUMN "dias_estadia" INTEGER NOT NULL DEFAULT 1;

-- El default solo es para migración; el negocio lo setea explícitamente
ALTER TABLE "reservas" ALTER COLUMN "dias_estadia" DROP DEFAULT;
