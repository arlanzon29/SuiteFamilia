import type { Foto } from '../../dominio/contratos'
import type { Dependencias } from '../dependencias'

/**
 * Las fotos van por su cuenta, fuera de `cargarTodo` — mismo motivo que en la
 * compra: no cambian con el catálogo y solo hace falta refrescarlas cuando
 * alguien sube o quita una.
 */
export const cargarFotos =
  (d: Dependencias) =>
  async (): Promise<Record<string, Foto[]>> =>
    d.fotos.listar()

/** El límite es del navegador, no del servidor — igual que en la compra. */
const MAXIMO_BYTES = 25 * 1024 * 1024

export const anadirFoto =
  (d: Dependencias) =>
  async (conocimientoId: string, fichero: Blob): Promise<void> => {
    if (!fichero.type.startsWith('image/')) {
      throw new Error('Eso no es una imagen.')
    }
    if (fichero.size > MAXIMO_BYTES) {
      throw new Error('La imagen es demasiado grande.')
    }
    await d.fotos.anadir(conocimientoId, fichero)
  }

export const quitarFoto =
  (d: Dependencias) =>
  async (conocimientoId: string, fotoId: string): Promise<void> => {
    await d.fotos.quitar(conocimientoId, fotoId)
  }
