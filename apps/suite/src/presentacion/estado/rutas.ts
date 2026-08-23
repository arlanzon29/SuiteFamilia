export type Ruta = { n: 'inicio' } | { n: 'ajustes' }

/** Las dos pestañas de la barra inferior: aquí no hay pantallas con pila. */
export type Pestana = 'inicio' | 'ajustes'

/** Con qué pestaña se ilumina cada ruta. Sin ficha ni pila, es la propia ruta. */
export const pestanaDe = (ruta: Ruta, _pila: Ruta[]): Pestana => ruta.n

/** Ninguna ruta de la portada apila: no hay detalle al que volver. */
export const tienePila = (_r: Ruta): boolean => false
