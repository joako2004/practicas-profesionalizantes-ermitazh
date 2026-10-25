// SOLO SERVIDOR. Nunca importar desde componentes "use client" ni desde código que llegue al navegador. Usa la clave de servicio, que se salta RLS.
import { createClient } from "@supabase/supabase-js";

/**
 * Crea un cliente de Supabase con la clave de servicio.
 *
 * Devuelve una instancia nueva por llamada: es simple y seguro en entornos
 * serverless, donde no conviene compartir estado global entre invocaciones.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
