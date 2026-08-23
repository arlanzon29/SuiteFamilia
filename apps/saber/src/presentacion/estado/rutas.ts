export type Ruta =
  | { n: 'inicio' }
  | { n: 'conocimientos' }
  | { n: 'ficha'; id: string }
  | { n: 'ajustes' }

/** Pantallas raíz: son las tres pestañas de la barra inferior. */
export type Pestana = 'inicio' | 'conocimientos' | 'ajustes'

/** Con qué pestaña se ilumina cada ruta. */
export const pestanaDe = (r: Ruta): Pestana => {
  switch (r.n) {
    case 'ficha':
    case 'conocimientos':
      return 'conocimientos'
    case 'ajustes':
      return 'ajustes'
    default:
      return 'inicio'
  }
}

/** Rutas que se apilan y por tanto muestran el botón de atrás. */
export const tienePila = (r: Ruta): boolean => r.n === 'ficha'

export type Dialogo =
  | { tipo: 'nuevoConocimiento' }
  | { tipo: 'editConocimiento'; id: string }
  | { tipo: 'borrarConocimiento'; id: string }
  | { tipo: 'nuevoTema' }
  | { tipo: 'renTema'; id: string }
  | { tipo: 'borrarTema'; id: string }

/** Estados que la pantalla de ajustes puede forzar para revisar el diseño. */
export type Simulacion = null | 'loading' | 'error'
