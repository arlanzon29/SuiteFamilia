/**
 * Un pendiente: algo de la casa que está a medias y no se puede olvidar.
 *
 * Cuatro campos y ni uno más. No hay prioridades, ni etiquetas, ni persona
 * asignada: en una casa de dos, lo que ordena la lista es la antigüedad y lo
 * que aclara el reparto es hablarlo, no un campo.
 *
 * `hecho` es toda la máquina de estados que tiene esto: nulo mientras está por
 * hacer, y con fecha cuando se resolvió. Deshacer es volver a ponerlo a nulo,
 * y por eso no hace falta ningún booleano aparte que pudiera contradecirlo.
 */
export type Pendiente = {
  id: string
  /** Una línea. Es lo que se lee en la fila de la lista. */
  titulo: string
  /** Todo lo que haga falta recordar. Puede estar vacío. */
  comentario: string
  /**
   * Cuándo se anotó, en ISO completo con zona: `2026-08-17T08:37:00.123Z`.
   *
   * Es un **instante**, no un día. La diferencia importa: cortar el ISO por la
   * `T` da el día en UTC, que a partir de las diez de la noche en España ya es
   * el de mañana. El día se calcula en la pantalla, en la zona de quien mira.
   */
  creado: string
  /** Cuándo se dio por hecho, en el mismo formato. Nulo mientras esté por hacer. */
  hecho: string | null
}

export const estaHecho = (p: Pendiente): boolean => p.hecho !== null

/** Lo que queda por hacer, de lo más antiguo a lo más reciente. */
export const porHacer = (ps: Pendiente[]): Pendiente[] =>
  ps.filter((p) => !estaHecho(p)).sort((a, b) => a.creado.localeCompare(b.creado))

/**
 * Lo resuelto, de lo más reciente a lo más antiguo.
 *
 * Al revés que `porHacer` a propósito: de lo que está por hacer preocupa lo que
 * lleva más tiempo esperando; de lo hecho interesa lo último, que es lo que
 * hace falta consultar («¿cuándo cambiamos la bombona?»).
 */
export const hechos = (ps: Pendiente[]): Pendiente[] =>
  ps
    .filter(estaHecho)
    .sort((a, b) => (b.hecho ?? '').localeCompare(a.hecho ?? ''))
