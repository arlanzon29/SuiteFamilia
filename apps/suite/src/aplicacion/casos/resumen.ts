import type { ResumenCompra, ResumenPendientes } from '../../dominio/modelo'
import type { Dependencias } from '../dependencias'

/**
 * Carga solo lo que enseña la tarjeta de Compra en el Inicio: las mismas tres
 * cuentas que ya calcula `resumen_inicio()` en Supabase para la propia app de
 * la compra. Aquí no se descarga ni una lista ni un artículo.
 */
export const cargarResumenCompra =
  (d: Dependencias) =>
  async (): Promise<ResumenCompra> =>
    d.resumenCompra.inicio()

/**
 * Carga solo lo que enseña la tarjeta de Pendientes en el Inicio: cuántos
 * quedan por hacer y cuántos de esos son importantes.
 */
export const cargarResumenPendientes =
  (d: Dependencias) =>
  async (): Promise<ResumenPendientes> =>
    d.resumenPendientes.inicio()
