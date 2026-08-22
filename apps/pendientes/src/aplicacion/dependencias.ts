import type {
  Reloj,
  RepositorioPendientes,
  ServicioAutenticacion,
} from '../dominio/contratos'

/**
 * Lo que necesitan los casos de uso. Se inyecta una sola vez en el contenedor
 * (`infraestructura/contenedor.ts`); ningún caso de uso importa una
 * implementación concreta.
 */
export type Dependencias = {
  pendientes: RepositorioPendientes
  auth: ServicioAutenticacion
  reloj: Reloj
}
