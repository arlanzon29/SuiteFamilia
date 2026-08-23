/**
 * Lo que la portada enseña de cada aplicación, y nada más: dos lecturas
 * agregadas, una por app. No son entidades — la portada no tiene listas ni
 * pendientes propios, solo cuenta lo que hay en las otras dos.
 */

/** Las mismas tres cifras que ya enseña el Inicio de la compra. */
export type ResumenCompra = {
  /** Artículos de las listas abiertas que faltan por coger. */
  porComprar: number
  /** Cuántas listas siguen abiertas. */
  listasAbiertas: number
  /** Artículos del catálogo sin precio en ninguna tienda. */
  sinPrecio: number
}

/** Las mismas dos cifras que ya enseña el Inicio de Pendientes. */
export type ResumenPendientes = {
  /** Todo lo que queda por hacer, incluido lo apuntado para más adelante. */
  total: number
  /** De esos, los marcados como importantes. */
  importantes: number
}
