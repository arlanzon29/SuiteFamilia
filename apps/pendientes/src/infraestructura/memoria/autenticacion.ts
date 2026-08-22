import type { Sesion, ServicioAutenticacion } from '../../dominio/contratos'

const CLAVE = 'pendientes.sesion'

/**
 * Quién eres en modo memoria.
 *
 * No hay cuentas de verdad, pero la sesión necesita un identificador estable:
 * es con lo que se compara `creadoPor` para decir «lo apuntaste tú». La
 * semilla firma la mitad de las filas con este mismo valor.
 */
export const ID_LOCAL = 'yo'

/**
 * Autenticación simulada: valida lo mismo que la compra —el correo lleva «@» y
 * la contraseña no está vacía— y recuerda la sesión en el navegador.
 *
 * Ya no es la única: `supabase/autenticacion.ts` es la de verdad, y el
 * contenedor elige entre las dos según haya `.env`. Esta se queda —no se
 * borra— porque es la que permite arrancar el proyecto recién clonado y
 * revisar la interfaz sin credenciales, que es justo para lo que sirve la
 * entrada `pendientes-memoria`.
 */
export const autenticacionMemoria = (): ServicioAutenticacion => ({
  async sesionActual(): Promise<Sesion | null> {
    try {
      const crudo = localStorage.getItem(CLAVE)
      return crudo ? (JSON.parse(crudo) as Sesion) : null
    } catch {
      return null
    }
  },
  async entrar(email: string, contrasena: string): Promise<Sesion> {
    if (!email.includes('@') || !contrasena) {
      throw new Error('Correo o contraseña incorrectos.')
    }
    const sesion: Sesion = { id: ID_LOCAL, email }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion))
    } catch {
      // sin almacenamiento la sesión dura lo que la pestaña; no es un error
    }
    return sesion
  },
  async salir(): Promise<void> {
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      // nada que limpiar
    }
  },
})
