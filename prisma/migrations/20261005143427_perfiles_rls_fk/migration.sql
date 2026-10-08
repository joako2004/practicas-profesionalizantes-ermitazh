BEGIN;
-- Enable RLS on perfiles table
ALTER TABLE public."perfiles" ENABLE ROW LEVEL SECURITY;
-- Add FK perfiles.id -> auth.users(id) ON DELETE CASCADE (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfiles_id_fkey' AND conrelid = 'public.perfiles'::regclass) THEN
    ALTER TABLE public."perfiles" ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
  END IF;
END $$;
-- Revoke all public access; RLS will enforce server-only access via Prisma
REVOKE ALL ON TABLE public."perfiles" FROM anon, authenticated;
COMMIT;