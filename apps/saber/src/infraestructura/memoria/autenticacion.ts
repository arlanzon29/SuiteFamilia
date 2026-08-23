import type { Sesion, ServicioAutenticacion } from '../../dominio/contratos'

const CLAVE = 'saber.sesion'

/**
 * Quién eres en modo memoria. No hay cuentas de verdad, pero la sesión
 * necesita un identificador estable: es con lo que se compara `creadoPor`
 * para decir «lo apuntaste tú». La semilla firma la mitad de las filas con
 * este mismo valor. Mismo patrón que fijó Pendientes.
 */
export const ID_LOCAL = 'yo'

/** Autenticación simulada: el correo lleva «@» y la contraseña no está vacía. */
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
    const sesion: Sesion = { id: ID_LOCAL, email, nombre: null }
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
  async actualizarNombre(nombre: string): Promise<Sesion> {
    const crudo = localStorage.getItem(CLAVE)
    const actual = crudo
      ? (JSON.parse(crudo) as Sesion)
      : { id: ID_LOCAL, email: '', nombre: null }
    const sesion: Sesion = { ...actual, nombre: nombre.trim() || null }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion))
    } catch {
      // sin almacenamiento el cambio dura lo que la pestaña; no es un error
    }
    return sesion
  },
})
