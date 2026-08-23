import type {
  Reloj,
  RepositorioResumenCompra,
  RepositorioResumenPendientes,
  ServicioAutenticacion,
} from '../dominio/contratos'

/**
 * Lo que necesitan los casos de uso. Se inyecta una sola vez en el contenedor
 * (`infraestructura/contenedor.ts`); ningún caso de uso importa una
 * implementación concreta.
 */
export type Dependencias = {
  resumenCompra: RepositorioResumenCompra
  resumenPendientes: RepositorioResumenPendientes
  auth: ServicioAutenticacion
  reloj: Reloj
}
