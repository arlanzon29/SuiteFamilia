import type {
  RepositorioResumenCompra,
  RepositorioResumenPendientes,
} from '../../dominio/contratos'

/**
 * Cifras de ejemplo, para revisar la interfaz sin credenciales.
 *
 * No hace falta un almacén con estado —a diferencia de Pendientes, aquí no se
 * escribe nada, la portada solo enseña cuentas—, así que estos dos números
 * fijos bastan: una casa con compra en curso y dos pendientes, uno de ellos
 * importante.
 */
export const repositorioResumenCompraMemoria = (): RepositorioResumenCompra => ({
  async inicio() {
    return { porComprar: 7, listasAbiertas: 1, sinPrecio: 3 }
  },
})

export const repositorioResumenPendientesMemoria = (): RepositorioResumenPendientes => ({
  async inicio() {
    return { total: 4, importantes: 2 }
  },
})
