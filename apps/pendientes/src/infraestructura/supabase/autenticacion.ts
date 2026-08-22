import type { SupabaseClient } from '@supabase/supabase-js'
import type { Sesion, ServicioAutenticacion } from '../../dominio/contratos'

/**
 * Autenticación real contra Supabase Auth.
 *
 * Sustituye pieza por pieza a `memoria/autenticacion.ts`: mismo contrato, misma
 * firma. No hay registro —las cuentas se crean a mano en la consola de Supabase
 * y el alta pública queda desactivada—, y por eso aquí no existe `signUp`: si
 * apareciera, cualquiera con la clave anónima (que es pública) se crearía una
 * cuenta y el RLS le daría acceso a todo.
 *
 * Es la misma cuenta que la de la compra, y ahora sí de verdad: las dos
 * aplicaciones entran en el mismo proyecto, así que quien entra en una entra en
 * la otra. Compartido el origen, comparten también la sesión guardada, porque
 * la clave que usa `supabase-js` sale del identificador del proyecto.
 */

/** Supabase responde en inglés; la interfaz habla en castellano. */
const mensaje = (error: { message: string }): string => {
  const m = error.message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'La cuenta está sin confirmar.'
  if (m.includes('failed to fetch')) return 'Sin conexión con el servidor.'
  return error.message
}

export const autenticacionSupabase = (sb: SupabaseClient): ServicioAutenticacion => ({
  async sesionActual(): Promise<Sesion | null> {
    // Lee la sesión guardada y la renueva si hacía falta; no llama a la red
    // cuando el token sigue siendo válido.
    const { data, error } = await sb.auth.getSession()
    if (error) throw new Error(mensaje(error))
    const u = data.session?.user
    return u?.email ? { id: u.id, email: u.email } : null
  },

  async entrar(email: string, contrasena: string): Promise<Sesion> {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password: contrasena,
    })
    if (error) throw new Error(mensaje(error))
    const u = data.user
    if (!u?.email) throw new Error('La cuenta no tiene correo asociado.')
    return { id: u.id, email: u.email }
  },

  async salir(): Promise<void> {
    const { error } = await sb.auth.signOut()
    if (error) throw new Error(mensaje(error))
  },
})
