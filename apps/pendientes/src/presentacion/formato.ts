/** Formato español de todo lo que se ve en pantalla. */

/**
 * El día local de un instante ISO, a mediodía y en UTC.
 *
 * Todo lo que cuenta días pasa por aquí. Mediodía para que el cambio de hora no
 * mueva una resta de un día entero, y en UTC para que restar dos de estos dé
 * días exactos.
 */
const diaLocal = (instante: string): number | null => {
  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return null
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)
}

const diaDeHoy = (hoy: string): number => {
  const [a, m, d] = hoy.split('-').map(Number)
  return Date.UTC(a, m - 1, d, 12)
}

/**
 * Cuántos días han pasado desde `instante` hasta `hoy`. Negativo no ocurre:
 * las dos fechas del modelo son del pasado.
 *
 * `hoy` se pasa desde fuera y no se mira aquí el reloj del sistema porque el
 * «hoy» de la aplicación es un contrato (`Reloj`), y así esto se puede
 * comprobar sin tocar la hora de la máquina.
 */
export const diasDesde = (instante: string, hoy: string): number => {
  const dia = diaLocal(instante)
  if (dia === null) return 0
  return Math.max(0, Math.round((diaDeHoy(hoy) - dia) / 86400000))
}

/** '2026-08-17T08:30:00.000Z' → '17/08/2026', en la zona de quien mira. */
export const fechaLarga = (instante: string): string => {
  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Cuándo pasó algo, contado como lo contaría una persona: «hoy», «ayer»,
 * «hace 5 días» y, a partir de la semana, la fecha entera.
 *
 * Es el mismo criterio que usa la compra en sus listas, y por lo mismo: dentro
 * de la semana lo que se recuerda es el día relativo; más allá, el número de
 * días deja de decir nada y lo que ubica es la fecha.
 */
export const cuando = (instante: string, hoy: string): string => {
  const dias = diasDesde(instante, hoy)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return `el ${fechaLarga(instante)}`
}

/**
 * Lo mismo, pero sin rendirse nunca a la fecha: «hace 18 días».
 *
 * Se usa en Inicio, donde lo que se está enseñando es justamente **cuánto
 * lleva esperando** lo más antiguo. Ahí «el 04/08/2026» obliga a echar la
 * cuenta a mano, que es lo que la pantalla venía a evitar.
 */
export const hace = (instante: string, hoy: string): string => {
  const dias = diasDesde(instante, hoy)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

/** '2026-08' → 'Agosto de 2026'. El rótulo de cada grupo de Hechos. */
export const nombreMes = (mes: string): string => {
  const [a, m] = mes.split('-').map(Number)
  if (!a || !m) return ''
  const texto = new Date(a, m - 1, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })
  // `toLocaleDateString` da «agosto de 2026»; el rótulo va con mayúscula.
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** '2026-08-22' → 'Sábado, 22/08/2026'. La segunda línea del saludo de Inicio. */
export const diaCompleto = (hoy: string): string => {
  const [a, m, d] = hoy.split('-').map(Number)
  if (!a || !m || !d) return ''
  const fecha = new Date(a, m - 1, d)
  const dia = fecha.toLocaleDateString('es-ES', { weekday: 'long' })
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${fechaLarga(fecha.toISOString())}`
}

/**
 * «Buenos días», «Buenas tardes» o «Buenas noches», según la hora del reloj
 * del dispositivo.
 *
 * Aquí sí se mira la hora directamente y no el contrato `Reloj`: el saludo
 * depende del momento del día, no del «hoy» de la aplicación, y `Reloj` da un
 * día sin hora a propósito.
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

/**
 * El comentario reducido a una línea, para la fila de la lista.
 *
 * Se corta por el primer salto de línea antes de recortar: un comentario de
 * tres párrafos pegado en una línea con espacios no se lee, y lo que dice el
 * primer renglón suele bastar para reconocer de qué va.
 */
export const primeraLinea = (comentario: string): string =>
  comentario.split('\n').find((l) => l.trim())?.trim() ?? ''

export const plural = (n: number, singular: string, plural_: string): string =>
  `${n} ${n === 1 ? singular : plural_}`
