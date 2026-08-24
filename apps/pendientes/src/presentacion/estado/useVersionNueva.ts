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
   * Dos problemas distintos, y hace falta resolver los dos:
   *
   * 1. `location.href = '...?v=...'` es *navegar*, no recargar: mete una
   *    entrada nueva en el historial, y con dos entradas Chrome deja de
   *    permitir cerrar la ventana por script —por eso el botón de cerrar
   *    fallaba justo después de actualizar—. `location.replace()` en su
   *    lugar sustituye la entrada actual en vez de añadir una, así que el
   *    historial se queda en una sola.
   *
   * 2. La URL con query y la que abre el icono de inicio (`/suite/`, sin
   *    query) son dos entradas de caché *distintas*: refrescar una no
   *    refresca la otra. Antes de ir a la versionada —que sí trae lo nuevo
   *    seguro, por eso «funciona» al pulsar Actualizar—, se intenta refrescar
   *    también la caché de la URL real con `cache: 'reload'` (pide de red y
   *    además guarda lo recibido, a diferencia de `no-store`), para que la
   *    próxima vez que se abra desde el icono no dependa de que hayan pasado
   *    los ~10 minutos de `Cache-Control` de GitHub Pages.
   *
   *    No es infalible —si esta petición no llega a un servidor del CDN ya
   *    al día, la próxima apertura seguirá viendo la versión vieja y volverá
   *    a salir el aviso—, pero entonces vuelve a funcionar con solo pulsar
   *    Actualizar otra vez: el aviso no se pierde ni deja el aparato a
   *    ciegas, solo tarda algún ciclo más en converger.
   */
  const actualizar = async () => {
    try {
      await fetch(window.location.pathname, { cache: 'reload' })
    } catch {
      // sin conexión: sigue a lo de abajo, que sí trae la versión pedida
    }
    window.location.replace(`${window.location.pathname}?v=${Date.now()}`)
  }

  return { hayNueva, actualizar }
}
