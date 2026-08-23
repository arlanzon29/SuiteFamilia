/** Formato español de todo lo que se ve en pantalla. */

/**
 * «Buenos días», «Buenas tardes» o «Buenas noches», según la hora del reloj
 * del dispositivo. Es el mismo criterio que compra y pendientes.
 */
export const saludo = (ahora: Date = new Date()): string => {
  const h = ahora.getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * El nombre de pila que se saluda, sacado del correo de la sesión.
 *
 * No hay tabla de perfiles y no la va a haber por esto: son dos cuentas de una
 * casa. `marta@arlanzon.es` → «Marta».
 */
export const nombreDe = (email: string): string => {
  const usuario = email.split('@')[0]?.split(/[._-]/)[0] ?? ''
  return usuario ? usuario.charAt(0).toUpperCase() + usuario.slice(1) : ''
}

export const plural = (n: number, singular: string, plural_: string): string =>
  `${n} ${n === 1 ? singular : plural_}`
