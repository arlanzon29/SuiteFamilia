import type { Pendiente } from '../modelo'
import { hechos } from '../modelo'

/**
 * Funciones puras de negocio. Nada de React, nada de formato: aquí se decide
 * **qué** grupos hay y en qué orden, no cómo se escribe el nombre de un mes.
 */

export type GrupoMes = {
  /** `2026-08`, en la zona de quien mira. Es la clave, no el rótulo. */
  mes: string
  pendientes: Pendiente[]
}

/**
 * El mes local de un instante ISO. No vale cortar por la `T`: eso da el mes en
 * UTC, y un «hecho» del 31 de agosto a las once de la noche caería en
 * septiembre.
 */
export const mesDe = (instante: string): string => {
  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Lo hecho, agrupado por el mes en que se resolvió y con los meses de más
 * reciente a más antiguo.
 *
 * Se agrupa por la fecha de realización y no por la de anotación porque la
 * pantalla de Hechos contesta a «¿qué hemos resuelto este mes?», no a «¿qué
 * apuntamos en julio?».
 */
export const porMeses = (ps: Pendiente[]): GrupoMes[] => {
  const grupos: GrupoMes[] = []
  // `hechos` ya viene de más reciente a más antiguo, así que los meses salen
  // en orden sin volver a ordenar nada.
  for (const p of hechos(ps)) {
    const mes = mesDe(p.finalizado ?? '')
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.mes === mes) ultimo.pendientes.push(p)
    else grupos.push({ mes, pendientes: [p] })
  }
  return grupos
}

/** Cuántos se resolvieron en ese mes. Es el pie de la pantalla de Hechos. */
export const resueltosEn = (ps: Pendiente[], mes: string): number =>
  ps.filter((p) => p.finalizado && mesDe(p.finalizado) === mes).length
