import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * El cliente de Supabase, creado una sola vez. Copiado tal cual de la compra:
 * las dos variables viven en el `.env` compartido de la raíz, con el prefijo
 * `VITE_` que Vite incrusta al compilar. La clave anónima es PÚBLICA a
 * propósito — quien protege los datos es el RLS del esquema.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Permite arrancar sin `.env` y seguir usando los datos simulados. */
export const haySupabase = Boolean(url && clave)

let instancia: SupabaseClient | null = null

export const clienteSupabase = (): SupabaseClient => {
  if (!url || !clave) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.',
    )
  }
  instancia ??= createClient(url, clave, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return instancia
}
