import type { Instantanea } from '../../aplicacion'
import type { Tema } from '../../dominio/modelo'

/** Lecturas sobre los temas cargados. Los conocimientos no viven aquí: cada pantalla los pide por su cuenta. */

export const tema = (d: Instantanea, id: string): Tema | undefined =>
  d.temas.find((t) => t.id === id)
