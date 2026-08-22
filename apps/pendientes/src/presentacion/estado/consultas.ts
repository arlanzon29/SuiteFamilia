import type { Instantanea } from '../../aplicacion'
import type { Pendiente } from '../../dominio/modelo'
import { porHacer, paraMasAdelante } from '../../dominio/modelo'
import { porMeses, type GrupoMes } from '../../dominio/servicios/agrupacion'

/**
 * Lecturas sobre lo cargado. Son atajos de presentación: la regla —qué orden
 * lleva cada lista, qué se ve ya y qué no, cómo se agrupa lo hecho— vive en el
 * dominio, aquí solo se le pasa lo que la pantalla ya tiene.
 */

/**
 * Uno cualquiera de los cargados, por identificador.
 *
 * Busca en las dos listas porque la ficha se abre desde las dos, y también
 * entre lo que aún no toca: un pendiente apuntado para noviembre sigue siendo
 * accesible desde el aviso de «apuntados para más adelante».
 */
export const pendiente = (d: Instantanea, id: string): Pendiente | undefined =>
  d.porHacer.find((p) => p.id === id) ?? d.ultimosHechos.find((p) => p.id === id)

/** Lo que queda por hacer **y ya toca**, de lo más antiguo a lo más reciente. */
export const listaPorHacer = (d: Instantanea, hoy: string): Pendiente[] =>
  porHacer(d.porHacer, hoy)

/** Lo apuntado para más adelante, que todavía no se enseña en la lista. */
export const listaMasAdelante = (d: Instantanea, hoy: string): Pendiente[] =>
  paraMasAdelante(d.porHacer, hoy)

/** Lo resuelto que se ha traído, de lo más reciente a lo más antiguo. */
export const listaHechos = (d: Instantanea): Pendiente[] => d.ultimosHechos

/** Lo traído de Hechos, agrupado por el mes en que se resolvió. */
export const hechosPorMeses = (d: Instantanea): GrupoMes[] => porMeses(d.ultimosHechos)
