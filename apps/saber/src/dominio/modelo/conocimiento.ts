/**
 * Un conocimiento de la casa: una receta, un truco, un enlace que merece la
 * pena recordar. Siempre tiene un tema, y puede llevar un enlace y fotos.
 */
export type Conocimiento = {
  id: string
  titulo: string
  /** Todo lo que haga falta explicar. Puede estar vacía. */
  descripcion: string
  /** El nombre del tema al que pertenece. */
  tema: string
  /** Un enlace, por ejemplo a un vídeo. Nulo si no lleva. */
  enlace: string | null
  /**
   * Cuándo se apuntó, en ISO completo con zona. Lo pone el servidor, nunca
   * quien llama — el mismo motivo que en Pendientes: el reloj de un móvil no
   * debe ordenar la lista de la otra persona.
   */
  creado: string
  /**
   * Quién lo apuntó, por su identificador de cuenta. Nulo si esa cuenta ya no
   * existe. Es el identificador y no el correo por lo mismo que en
   * Pendientes: `auth.users` no lo expone a una consulta normal, y lo único
   * que hace falta contar es «tú» o «la otra persona».
   */
  creadoPor: string | null
}

/** Ordena por título con las reglas del español (acentos, ñ). */
export const porTitulo = (a: Conocimiento, b: Conocimiento): number =>
  a.titulo.localeCompare(b.titulo, 'es')

/** Lo más reciente primero, para Inicio y para el orden por defecto de la lista. */
export const porRecencia = (a: Conocimiento, b: Conocimiento): number =>
  b.creado.localeCompare(a.creado)
