/** Formato español de todo lo que se ve en pantalla. */

/**
 * «Buenos días», «Buenas tardes», «Buenas noches», según la hora del reloj
 * del dispositivo.
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
 * `marta@arlanzon.es` → «Marta».
 */
export const nombreDe = (email: string): string => {
  const usuario = email.split('@')[0]?.split(/[._-]/)[0] ?? ''
  return usuario ? usuario.charAt(0).toUpperCase() + usuario.slice(1) : ''
}

/** '2026-08-11T20:15:00.000Z' → '11/08/2026' */
export const fechaLarga = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES')
}

/**
 * Cuándo se creó algo, contado como lo contaría una persona: «hoy», «ayer»,
 * «hace 5 días» y, a partir de la semana, la fecha entera. Mismo cálculo que
 * en la compra y en Pendientes.
 */
export const cuandoSeCreo = (instante: string, hoy: string): string => {
  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return ''

  const aMediodia = (a: number, m: number, dia: number) => Date.UTC(a, m, dia, 12)
  const dia = aMediodia(d.getFullYear(), d.getMonth(), d.getDate())
  const [ah, mh, dh] = hoy.split('-').map(Number)
  const dias = Math.round((aMediodia(ah, mh - 1, dh) - dia) / 86400000)

  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return d.toLocaleDateString('es-ES')
}

export const plural = (n: number, singular: string, plural_: string): string =>
  `${n} ${n === 1 ? singular : plural_}`
