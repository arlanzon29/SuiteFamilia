import type { Tema } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

/**
 * Solo los temas: es la lista cerrada de categorías, pequeña por diseño, y las
 * tres pantallas la necesitan entera para pintar los filtros y el selector.
 *
 * Los conocimientos NO van aquí — se piden siempre filtrados, con
 * `buscarConocimientos`. Ver el porqué en `dominio/contratos`.
 */
export type Instantanea = {
  temas: Tema[]
}

export const cargarTemas =
  (d: Dependencias) =>
  async (): Promise<Instantanea> => ({
    temas: await d.temas.listar(),
  })
