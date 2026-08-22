export type Ruta =
  | { n: 'inicio' }
  | { n: 'pendientes' }
  | { n: 'hechos' }
  | { n: 'ajustes' }
  | { n: 'ficha'; id: string }

/** Pantallas raíz: son las cuatro pestañas de la barra inferior. */
export type Pestana = 'inicio' | 'pendientes' | 'hechos' | 'ajustes'

/**
 * Con qué pestaña se ilumina cada ruta.
 *
 * La ficha se queda con la pestaña desde la que se abrió y no con una fija:
 * un pendiente resuelto se abre desde Hechos, y encender ahí «Pendientes»
 * diría que estás en un sitio en el que no estás. Por eso `pestanaDe` recibe
 * la pila: el fondo de la pila es la pantalla de la que se vino.
 */
export const pestanaDe = (ruta: Ruta, pila: Ruta[]): Pestana => {
  if (ruta.n === 'ficha') {
    const base = pila[0]
    return base && base.n !== 'ficha' ? base.n : 'pendientes'
  }
  return ruta.n
}

/** Rutas que se apilan y por tanto muestran el botón de atrás. */
export const tienePila = (r: Ruta): boolean => r.n === 'ficha'

export type Dialogo =
  | { tipo: 'nuevo' }
  | { tipo: 'editar'; id: string }
  /** La confirmación de borrar, que solo se abre desde la ficha. */
  | { tipo: 'borrar'; id: string }
