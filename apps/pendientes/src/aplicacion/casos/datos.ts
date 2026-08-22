import type { Pendiente } from '../../dominio/modelo'
import { mesDe } from '../../dominio/servicios/agrupacion'
import type { Dependencias } from '../dependencias'

/** Cuántos resueltos trae la pantalla de Hechos. */
export const ULTIMOS_HECHOS = 5

export type Instantanea = {
  /** Todo lo que queda por hacer, incluido lo apuntado para más adelante. */
  porHacer: Pendiente[]
  /** Solo los últimos resueltos. Lo hecho no se trae entero nunca. */
  ultimosHechos: Pendiente[]
  /** La cuenta del mes en curso, que no sale de `ultimosHechos`. */
  resueltosEsteMes: number
}

/**
 * Carga lo que las pantallas necesitan, y **solo** eso.
 *
 * Hubo antes un `cargarTodo` que se traía la tabla entera y filtraba en el
 * móvil. Servía mientras eran cuatro filas de ejemplo, y deja de servir en
 * cuanto los datos son de verdad: lo que está por hacer no crece —una casa
 * tiene unas pocas cosas a medias y se van resolviendo—, pero **lo hecho crece
 * indefinidamente**, y traerse dos años de histórico en cada arranque para
 * pintar dos grupos de mes es justo el error que en la compra hubo que
 * deshacer después, con el puerto de listas ya escrito.
 *
 * Las tres peticiones van en paralelo: son independientes y ninguna necesita
 * el resultado de la otra, así que la carga tarda lo que la más lenta y no lo
 * que las tres sumadas.
 *
 * Se devuelve sin ordenar por pantalla: el orden es una regla del dominio y
 * cada una pide el suyo.
 */
export const cargarTodo =
  (d: Dependencias) =>
  async (): Promise<Instantanea> => {
    const mes = mesDe(new Date().toISOString())
    const [porHacer, ultimosHechos, resueltosEsteMes] = await Promise.all([
      d.pendientes.listarPorHacer(),
      d.pendientes.listarUltimosHechos(ULTIMOS_HECHOS),
      d.pendientes.contarResueltosEn(mes),
    ])
    return { porHacer, ultimosHechos, resueltosEsteMes }
  }
