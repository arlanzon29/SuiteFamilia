import type { ResumenCompra, ResumenPendientes } from '../modelo'

/**
 * Contratos: lo que el dominio necesita del mundo exterior, expresado como
 * interfaces. La capa de aplicación depende solo de esto; quien lo implementa
 * —memoria o Supabase— vive en `infraestructura/`.
 *
 * `Sesion`, `ServicioAutenticacion` y `Reloj` son calco literal de
 * `apps/pendientes/src/dominio/contratos/index.ts`: la portada entra con la
 * misma cuenta que las demás apps, así que la autenticación no cambia una
 * coma. Lo propio de aquí son los dos repositorios de resumen: la portada no
 * lee entidades, solo las cuentas que ya enseña cada app en su Inicio.
 */

export type Sesion = {
  id: string
  email: string
  nombre: string | null
}

export interface ServicioAutenticacion {
  sesionActual(): Promise<Sesion | null>
  entrar(email: string, contrasena: string): Promise<Sesion>
  salir(): Promise<void>
  actualizarNombre(nombre: string): Promise<Sesion>
}

/** El «hoy» de la aplicación. Aquí no lo usa ninguna pantalla todavía, pero se deja por el mismo motivo que en las otras dos: es el contrato que las mantiene comprobables sin tocar el reloj de la máquina. */
export interface Reloj {
  /** ISO 'YYYY-MM-DD' */
  hoy(): string
}

/**
 * Las cifras del Inicio de la compra. `inicio()` es el mismo nombre que en
 * `apps/compra/src/dominio/puertos/index.ts` — `RepositorioResumen.inicio()`
 * — porque el adaptador de Supabase llama a la misma función `resumen_inicio()`.
 */
export interface RepositorioResumenCompra {
  inicio(): Promise<ResumenCompra>
}

/**
 * Las cifras del Inicio de Pendientes. No hace falta una función SQL propia:
 * lo por hacer de una casa no crece —son unas pocas filas siempre—, así que
 * se cuenta sobre la lista entera, igual que hace `Inicio.tsx` de Pendientes.
 */
export interface RepositorioResumenPendientes {
  inicio(): Promise<ResumenPendientes>
}
