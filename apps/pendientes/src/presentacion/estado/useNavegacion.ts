import { useCallback, useMemo, useState } from 'react'
import type { Ruta, Pestana } from './rutas'

/**
 * Navegación con pila, igual que en la compra: `ir` apila, `atras` desapila y
 * cambiar de pestaña vacía la pila.
 */
export const useNavegacion = () => {
  const [ruta, setRuta] = useState<Ruta>({ n: 'inicio' })
  const [pila, setPila] = useState<Ruta[]>([])

  const ir = useCallback(
    (destino: Ruta) => {
      setPila((p) => p.concat([ruta]))
      setRuta(destino)
    },
    [ruta],
  )

  const atras = useCallback(() => {
    setRuta(pila.length ? pila[pila.length - 1] : { n: 'inicio' })
    setPila((p) => p.slice(0, -1))
  }, [pila])

  const pestana = useCallback((p: Pestana) => {
    setRuta({ n: p })
    setPila([])
  }, [])

  return useMemo(() => ({ ruta, pila, ir, atras, pestana }), [ruta, pila, ir, atras, pestana])
}
