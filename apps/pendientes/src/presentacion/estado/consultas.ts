import type { Instantanea } from '../../aplicacion'
import type { Pendiente } from '../../dominio/modelo'
import { hechos, porHacer } from '../../dominio/modelo'
import { porMeses, resueltosEn, type GrupoMes } from '../../dominio/servicios/agrupacion'

/**
 * Lecturas sobre la instantánea cargada. Son atajos de presentación: la regla
 * —qué orden lleva cada lista, cómo se agrupa lo hecho— vive en el dominio,
 * aquí solo se le pasa lo que la pantalla ya tiene.
 */

export const pendiente = (d: Instantanea, id: string): Pendiente | undefined =>
  d.pendientes.find((p) => p.id === id)

/** Lo que queda por hacer, de lo más antiguo a lo más reciente. */
export const listaPorHacer = (d: Instantanea): Pendiente[] => porHacer(d.pendientes)

/** Lo resuelto, de lo más reciente a lo más antiguo. */
export const listaHechos = (d: Instantanea): Pendiente[] => hechos(d.pendientes)

/** Lo resuelto, agrupado por el mes en que se hizo. */
export const hechosPorMeses = (d: Instantanea): GrupoMes[] => porMeses(d.pendientes)

export const cuantosResueltosEn = (d: Instantanea, mes: string): number =>
  resueltosEn(d.pendientes, mes)
