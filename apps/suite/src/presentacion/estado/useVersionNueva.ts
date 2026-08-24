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

  /**
   * Actualizar de verdad, no solo esta pestaña.
   *
   * `location.href = '...?v=...'` parecía la manera obvia de saltarse la
   * caché, pero era el propio fallo: esa URL con query es una entrada de
   * caché *distinta* de la que abre el icono de inicio (`/suite/`, sin
   * query), así que quedaba al día la pestaña de ese momento y ninguna otra
   * futura — la siguiente vez que se abriera la app, sería otra vez la vieja.
   * De paso, navegar (en vez de recargar) mete una entrada nueva en el
   * historial, y con dos entradas Chrome deja de dejar cerrar la ventana por
   * script: por eso el botón de cerrar dejaba de funcionar justo después de
   * actualizar.
   *
   * La manera correcta: refrescar la caché de la URL *real* —la que usa el
   * icono— con una petición que se salta la caché (`cache: 'reload'`, que sí
   * pide de red y sí deja lo pedido guardado, al revés que `no-store`), y
   * luego recargar esa misma entrada con `location.reload()`, que no añade
   * nada al historial.
   */
  const actualizar = async () => {
    try {
      await fetch(window.location.pathname, { cache: 'reload' })
    } catch {
      // sin conexión: el reload de abajo se sirve de lo que ya hubiera en caché
    }
    window.location.reload()
  }

  return { hayNueva, actualizar }
}
