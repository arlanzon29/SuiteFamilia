import type {
  Reloj,
  RepositorioConocimientos,
  RepositorioFotos,
  RepositorioTemas,
  ServicioAutenticacion,
} from '../dominio/contratos'

/**
 * Lo que necesitan los casos de uso. Se inyecta una sola vez en el contenedor
 * (`infraestructura/contenedor.ts`); ningún caso de uso importa una
 * implementación concreta.
 */
export type Dependencias = {
  temas: RepositorioTemas
  conocimientos: RepositorioConocimientos
  /** Fotos de la galería. No viajan con el catálogo. */
  fotos: RepositorioFotos
  auth: ServicioAutenticacion
  reloj: Reloj
}
