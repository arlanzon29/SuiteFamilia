import type { Pendiente } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

export type Instantanea = {
  pendientes: Pendiente[]
}

/**
 * Carga todo el estado compartido de una vez.
 *
 * Es una sola tabla y de una casa: lo apuntado en un año cabe de sobra en una
 * petición, y las cuatro pantallas la cruzan —Inicio quiere lo más antiguo sin
 * hacer, Pendientes lo que queda, Hechos lo resuelto—. Pedir trozos por
 * pantalla saldría más caro que traerlo entero.
 *
 * Se devuelve sin ordenar: el orden es una regla del dominio y cada pantalla
 * pide el suyo (`porHacer` de más antiguo a más nuevo, `hechos` al revés).
 */
export const cargarTodo =
  (d: Dependencias) =>
  async (): Promise<Instantanea> => ({
    pendientes: await d.pendientes.listar(),
  })
