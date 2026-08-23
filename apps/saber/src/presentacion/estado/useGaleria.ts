import { useCallback, useRef, useState } from 'react'
import type { CasosDeUso } from '../../aplicacion'
import type { Foto } from '../../dominio/contratos'
import { textoError } from '../componentes/Aviso'

const VACIO: Record<string, Foto[]> = {}

/**
 * Las fotos de la galería de cada conocimiento.
 *
 * Es el equivalente de `useFotos` en la compra, pero cada id puede tener
 * **varias** fotos en vez de una sola: `mapas[id]` es un array ordenado por
 * el orden en que se subieron. El fichero se reduce en el navegador antes de
 * subirse — mismo mecanismo que la compra.
 */
export const useGaleria = (casos: CasosDeUso) => {
  const [mapas, setMapas] = useState<Record<string, Foto[]>>(VACIO)
  /** El id de conocimiento que está subiendo o quitando una foto. */
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const objetivo = useRef<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      setMapas(await casos.cargarFotos())
      setError(null)
    } catch (e) {
      setError(textoError(e))
    }
  }, [casos])

  const olvidar = useCallback(() => setMapas(VACIO), [])

  const fotos = useCallback((id: string): Foto[] => mapas[id] ?? [], [mapas])

  /** `camara` abre directamente la cámara trasera del móvil. */
  const pideFoto = useCallback((id: string, camara: boolean) => {
    objetivo.current = id
    const el = inputRef.current
    if (!el) return
    if (camara) el.setAttribute('capture', 'environment')
    else el.removeAttribute('capture')
    el.value = ''
    el.click()
  }, [])

  const recibeFoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fichero = e.target.files?.[0]
      const id = objetivo.current
      objetivo.current = null
      if (!fichero || !id) return
      setOcupado(id)
      try {
        await casos.anadirFoto(id, fichero)
        setError(null)
        await recargar()
      } catch (err) {
        setError(textoError(err))
      } finally {
        setOcupado(null)
      }
    },
    [casos, recargar],
  )

  const quitaFoto = useCallback(
    async (id: string, fotoId: string) => {
      setOcupado(id)
      try {
        await casos.quitarFoto(id, fotoId)
        setError(null)
        await recargar()
      } catch (err) {
        setError(textoError(err))
      } finally {
        setOcupado(null)
      }
    },
    [casos, recargar],
  )

  return {
    fotos,
    inputRef,
    pideFoto,
    recibeFoto,
    quitaFoto,
    recargar,
    olvidar,
    ocupado,
    error,
    limpiaError: useCallback(() => setError(null), []),
  }
}
