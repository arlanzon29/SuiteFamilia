import type { SupabaseClient } from '@supabase/supabase-js'
import type { Sesion, ServicioAutenticacion } from '../../dominio/puertos'

/**
 * Autenticación real contra Supabase Auth.
 *
 * Sustituye pieza por pieza a `memoria/autenticacion.ts`: mismo puerto, misma
 * firma. No hay registro — las dos cuentas se crean a mano en la consola de
 * Supabase y el alta pública queda desactivada. Por eso aquí no existe
 * `signUp`: si algún día apareciera, cualquiera con la clave anónima (que es
 * pública) se crearía una cuenta y el RLS le daría acceso a todo.
 */

/** Supabase responde en inglés; la interfaz habla en castellano. */
const mensaje = (error: { message: string }): string => {
  const m = error.message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'La cuenta está sin confirmar.'
  if (m.includes('failed to fetch')) return 'Sin conexión con el servidor.'
  return error.message
}

/** El nombre vive en `user_metadata.full_name`; ahí es donde lo lee también el Dashboard. */
const nombreDeMetadatos = (meta: Record<string, unknown> | undefined): string | null => {
  const v = meta?.full_name
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export const autenticacionSupabase = (sb: SupabaseClient): ServicioAutenticacion => ({
  async sesionActual(): Promise<Sesion | null> {
    // Lee la sesión guardada y la renueva si hacía falta; no llama a la red
    // cuando el token sigue siendo válido.
    const { data, error } = await sb.auth.getSession()
    if (error) throw new Error(mensaje(error))
    const u = data.session?.user
    return u?.email ? { email: u.email, nombre: nombreDeMetadatos(u.user_metadata) } : null
  },

  async entrar(email: string, contrasena: string): Promise<Sesion> {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password: contrasena,
    })
    if (error) throw new Error(mensaje(error))
    const u = data.user
    if (!u?.email) throw new Error('La cuenta no tiene correo asociado.')
    return { email: u.email, nombre: nombreDeMetadatos(u.user_metadata) }
  },

  async salir(): Promise<void> {
    const { error } = await sb.auth.signOut()
    if (error) throw new Error(mensaje(error))
  },

  async actualizarNombre(nombre: string): Promise<Sesion> {
    const { data, error } = await sb.auth.updateUser({ data: { full_name: nombre } })
    if (error) throw new Error(mensaje(error))
    const u = data.user
    if (!u?.email) throw new Error('La cuenta no tiene correo asociado.')
    return { email: u.email, nombre: nombreDeMetadatos(u.user_metadata) }
  },
})
