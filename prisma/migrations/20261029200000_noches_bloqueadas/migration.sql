-- Noches bloqueadas manualmente por el admin para cada cabana (D1a).
-- Una fila = una noche no disponible: la noche N empieza el dia N y termina el dia N+1.
-- Escrita a mano (la base tiene drift: no usar migrate dev/reset ni db push).
-- Idempotente y atomica: si algo falla, no queda nada aplicado.
BEGIN;

CREATE TABLE IF NOT EXISTS "noches_bloqueadas" (
    "propiedad_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,

    CONSTRAINT "noches_bloqueadas_pkey" PRIMARY KEY ("propiedad_id", "fecha")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'noches_bloqueadas_propiedad_id_fkey' AND conrelid = 'public.noches_bloqueadas'::regclass) THEN
    ALTER TABLE "noches_bloqueadas" ADD CONSTRAINT "noches_bloqueadas_propiedad_id_fkey" FOREIGN KEY ("propiedad_id") REFERENCES "propiedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Consultas por rango de fechas sobre todas las cabanas.
CREATE INDEX IF NOT EXISTS "noches_bloqueadas_fecha_idx" ON "noches_bloqueadas"("fecha");

-- Mismo criterio que proteger_tablas_publicas: RLS sin politicas + revocar anon/authenticated.
ALTER TABLE public."noches_bloqueadas" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."noches_bloqueadas" FROM anon, authenticated;

COMMIT;
