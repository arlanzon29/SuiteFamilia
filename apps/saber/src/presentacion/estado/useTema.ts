import { useCallback, useEffect, useState } from 'react'

export type Tema = 'light' | 'dark'

const CLAVE = 'suitefamilia.tema'

const guardado = (): Tema => {
  try {
    const t = localStorage.getItem(CLAVE)
    return t === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * El tema se aplica en `<html data-theme>`, que es donde el sistema visual
 * redefine sus tokens. Se recuerda entre sesiones.
 *
 * La clave es compartida por todas las apps de la Suite: viven en el mismo
 * origen de GitHub Pages y el modo día/noche es una preferencia de la casa,
 * no de cada app por separado.
 */
export const useTema = () => {
  const [tema, setTema] = useState<Tema>(guardado)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      // sin almacenamiento el tema dura lo que la pestaña
    }
  }, [tema])

  const alterna = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return { tema, setTema, alterna }
}
