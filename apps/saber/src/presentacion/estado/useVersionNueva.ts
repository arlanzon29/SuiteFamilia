import { useCallback, useEffect, useState } from 'react'

const MINUTOS = 5

/**
 * ¿Hay una versión publicada distinta de la que tiene cargada este móvil?
 *
 * `index.html` en GitHub Pages puede tardar hasta 10 minutos en refrescarse
 * (Cache-Control de Fastly), así que abrir la app no garantiza traer el
 * build nuevo, ni tampoco lo garantiza el arrastre del dedo: es un reload
 * normal, sujeto a la misma caché.
 *
 * La comprobación en sí sí es fiable: pide `version.json` con `no-store`
 * —esa petición nunca se sirve de caché— y lo compara con el sello
 * incrustado en este build (`__VERSION__`). Se mira al abrir la app, al
 * volver de segundo plano y cada 5 minutos mientras queda abierta.
 *
 * Solo corre en producción: en desarrollo no existe `version.json` y no
 * hace falta, Vite ya sirve los módulos al vuelo.
 *
 * No hay botón de «Actualizar»: forzar la recarga por script resultó frágil
 * (dos cachés distintas, historial roto, resultado que no siempre
 * convergía). El aviso solo informa; quien lo ve arrastra el dedo para
 * refrescar o cierra y vuelve a abrir la app, como ya haría de todos modos.
 */
export const useVersionNueva = () => {
  const [hayNueva, setHayNueva] = useState(false)

  const comprueba = useCallback(async () => {
    if (__ENTORNO__ !== 'compilada' || hayNueva) return
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
      if (!resp.ok) return
      const { version } = (await resp.json()) as { version: string }
      if (version && version !== __VERSION__) setHayNueva(true)
    } catch {
      // sin conexión: se comprueba en el siguiente intento, no hay nada que avisar
    }
  }, [hayNueva])

  useEffect(() => {
    comprueba()
    const intervalo = setInterval(comprueba, MINUTOS * 60_000)
    const alVolver = () => {
      if (document.visibilityState === 'visible') comprueba()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [comprueba])

  return { hayNueva }
}
