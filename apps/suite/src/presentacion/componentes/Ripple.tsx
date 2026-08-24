import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Onda {
  id: number
  x: number
  y: number
  tamano: number
}

/**
 * Efecto ripple estilo Material Design: al recibir un `onPointerDown`, pinta
 * un círculo semitransparente que nace en el punto exacto del toque y crece
 * hasta cubrir el elemento entero.
 *
 * Uso: coloca `<Ripple />` como hijo de un contenedor con
 * `position: relative` y `overflow: hidden` (el propio contenedor debe
 * exponer `onPointerDown={ripple.onPointerDown}` mediante el hook
 * `useRipple`, ver más abajo), o usa directamente el hook si el contenedor
 * ya tiene otros hijos absolutos que posicionar con cuidado.
 */
export const useRipple = () => {
  const [ondas, setOndas] = useState<Onda[]>([])

  const onPointerDown = (evento: React.PointerEvent<HTMLElement>) => {
    const elemento = evento.currentTarget
    const rect = elemento.getBoundingClientRect()
    const x = evento.clientX - rect.left
    const y = evento.clientY - rect.top
    // El lado más largo del elemento asegura que el círculo, ya crecido,
    // cubra cualquier esquina por lejos que quede del punto de toque.
    const tamano = Math.max(rect.width, rect.height)
    const id = Date.now() + Math.random()
    setOndas((previas) => [...previas, { id, x, y, tamano }])
  }

  const quitarOnda = (id: number) => {
    setOndas((previas) => previas.filter((o) => o.id !== id))
  }

  const nodo = (
    <AnimatePresence>
      {ondas.map((onda) => (
        <motion.div
          key={onda.id}
          onAnimationComplete={() => quitarOnda(onda.id)}
          initial={{ scale: 0, opacity: 0.18 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: onda.x - onda.tamano / 2,
            top: onda.y - onda.tamano / 2,
            width: onda.tamano,
            height: onda.tamano,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  )

  return { onPointerDown, nodo }
}
