import type { SupabaseClient } from '@supabase/supabase-js'
import type { Sesion, ServicioAutenticacion } from '../../dominio/contratos'

/**
 * Autenticación real contra Supabase Auth. Copiada de la compra, con el
 * `id` que ya lleva Pendientes: es con lo que se compara `creadoPor` para
 * decir «lo apuntaste tú» y para el filtro «solo lo mío».
 */

const mensaje = (error: { message: string }): string => {
  const m = error.message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'La cuenta está sin confirmar.'
  if (m.includes('failed to fetch')) return 'Sin conexión con el servidor.'
  return error.message
}

const nombreDeMetadatos = (meta: Record<string, unknown> | undefined): string | null => {
  const v = meta?.full_name
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export const autenticacionSupabase = (sb: SupabaseClient): ServicioAutenticacion => ({
  async sesionActual(): Promise<Sesion | null> {
    const { data, error } = await sb.auth.getSession()
    if (error) throw new Error(mensaje(error))
    const u = data.session?.user
    return u?.email ? { id: u.id, email: u.email, nombre: nombreDeMetadatos(u.user_metadata) } : null
  },

  async entrar(email: string, contrasena: string): Promise<Sesion> {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: contrasena })
    if (error) throw new Error(mensaje(error))
    const u = data.user
    if (!u?.email) throw new Error('La cuenta no tiene correo asociado.')
    return { id: u.id, email: u.email, nombre: nombreDeMetadatos(u.user_metadata) }
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
    return { id: u.id, email: u.email, nombre: nombreDeMetadatos(u.user_metadata) }
  },
})
