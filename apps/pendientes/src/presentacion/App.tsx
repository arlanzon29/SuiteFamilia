import { useEffect, useRef, useState, type RefObject } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { useApp } from './estado/AppProvider'
import { pendiente } from './estado/consultas'
import type { Ruta } from './estado/rutas'
import { useVersionNueva } from './estado/useVersionNueva'
import { Cabecera } from './componentes/Cabecera'
import { BarraPestanas } from './componentes/BarraPestanas'
import { AvisoVersion } from './componentes/AvisoVersion'
import { DialogoApp } from './componentes/DialogoApp'
import { Login } from './pantallas/Login'
import { Inicio } from './pantallas/Inicio'
import { Pendientes } from './pantallas/Pendientes'
import { Hechos } from './pantallas/Hechos'
import { Ficha } from './pantallas/Ficha'
import { Ajustes } from './pantallas/Ajustes'
import type { Instantanea } from '../aplicacion'

/**
 * Marco de la aplicación: el móvil de 440 px centrado, con cabecera fija,
 * contenido con scroll propio y la barra de pestañas abajo. El diálogo se
 * posiciona contra este marco, no contra la ventana.
 *
 * Es el mismo marco que el de la compra, y conviene que lo sea: las dos se
 * instalan en el mismo teléfono y se abren desde el mismo origen.
 */
export const App = () => {
  const { sesion, comprobandoSesion, nav, datos, setDlg } = useApp()
  const { hayNueva } = useVersionNueva()

  // Sombra bajo la cabecera en cuanto el contenido se ha desplazado, como la
  // elevación del AppBarLayout de Android. Solo en la lista de pendientes,
  // que es donde se pidió; mismo patrón que en la app de compra —ver
  // `../../compra/docs/gestos-lista-swipe.md`.
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const conGestos = nav.ruta.n === 'pendientes'
  const estiramiento = useEstiramiento(scrollRef, conGestos)

  return (
    <div
      className="marco-fondo"
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--color-neutral-300)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        className="marco-app"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderInline: '1px solid var(--color-divider)',
        }}
      >
        {hayNueva && <AvisoVersion />}
        {comprobandoSesion ? null : !sesion ? (
          <Login />
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Cabecera
                {...tituloDe(nav.ruta, datos)}
                /* El botón de editar solo tiene sentido donde hay algo que
                   editar, que es la ficha. */
                onEditar={
                  nav.ruta.n === 'ficha'
                    ? () => setDlg({ tipo: 'editar', id: (nav.ruta as { id: string }).id })
                    : undefined
                }
                elevada={conGestos && scrolled}
              />
              <div
                ref={scrollRef}
                onScroll={(e) => {
                  if (conGestos) setScrolled(e.currentTarget.scrollTop > 4)
                }}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  /*
                    En el móvil, seguir arrastrando hacia abajo con el scroll
                    ya en el tope hace que el navegador/PWA dispare su gesto
                    nativo de pull-to-refresh. `contain` para el scroll
                    chaining aquí mismo, así el gesto no se propaga al
                    documento y el navegador no lo interpreta como
                    «refrescar».
                  */
                  ...(conGestos ? { overscrollBehaviorY: 'contain' as const } : null),
                }}
              >
                <motion.div style={{ y: estiramiento }}>
                  <Pantalla ruta={nav.ruta} />
                </motion.div>
              </div>
              <BarraPestanas />
            </div>
            <DialogoApp />
          </>
        )}
      </div>
    </div>
  )
}

const MUELLE_ESTIRAMIENTO = { type: 'spring', stiffness: 400, damping: 32 } as const

/**
 * Estira el contenido con resistencia al arrastrar más allá del principio o
 * el final de la lista, como el overscroll de Android 12+, en vez de parar
 * en seco. Solo entra en juego en el borde exacto del scroll —el resto del
 * gesto lo sigue llevando el scroll nativo del navegador— y solo cuando
 * `activo` es true.
 *
 * La resistencia usa raíz cuadrada del desplazamiento: cuanto más se tira,
 * más cuesta seguir estirando, en vez de una regla de proporción fija.
 * Copiado tal cual del mismo hook en la app de compra —ver
 * `../../compra/docs/gestos-lista-swipe.md` §4—, porque es genérico: no
 * depende de nada propio de esta lista, solo del contenedor de scroll.
 */
const useEstiramiento = (ref: RefObject<HTMLDivElement | null>, activo: boolean) => {
  const y = useMotionValue(0)

  useEffect(() => {
    const el = ref.current
    if (!el || !activo) return

    let inicioY = 0
    let arrastrando = false

    const alEmpezar = (e: TouchEvent) => {
      inicioY = e.touches[0].clientY
      arrastrando = false
    }

    const alMover = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - inicioY
      const enTope = el.scrollTop <= 0
      const enFondo = el.scrollTop >= el.scrollHeight - el.clientHeight - 1

      if (!arrastrando) {
        if (delta > 0 && enTope) arrastrando = true
        else if (delta < 0 && enFondo) arrastrando = true
        else return
      }

      e.preventDefault()
      const signo = Math.sign(delta)
      const resistido = signo * Math.sqrt(Math.abs(delta)) * 3.5
      y.set(Math.max(-40, Math.min(40, resistido)))
    }

    const alSoltar = () => {
      if (arrastrando) animate(y, 0, MUELLE_ESTIRAMIENTO)
      arrastrando = false
    }

    el.addEventListener('touchstart', alEmpezar, { passive: true })
    el.addEventListener('touchmove', alMover, { passive: false })
    el.addEventListener('touchend', alSoltar)
    el.addEventListener('touchcancel', alSoltar)
    return () => {
      el.removeEventListener('touchstart', alEmpezar)
      el.removeEventListener('touchmove', alMover)
      el.removeEventListener('touchend', alSoltar)
      el.removeEventListener('touchcancel', alSoltar)
    }
  }, [ref, activo, y])

  return y
}

const Pantalla = ({ ruta }: { ruta: Ruta }) => {
  switch (ruta.n) {
    case 'inicio':
      return <Inicio />
    case 'pendientes':
      return <Pendientes />
    case 'hechos':
      return <Hechos />
    case 'ficha':
      return <Ficha id={ruta.id} />
    case 'ajustes':
      return <Ajustes />
  }
}

/**
 * El kicker y el título de cada pantalla.
 *
 * El kicker se escribe **SuiteFamilia**, con las dos mayúsculas: el boceto lo
 * puso en minúsculas y solo se leía bien por el `text-transform: uppercase`.
 */
const tituloDe = (ruta: Ruta, datos: Instantanea): { kicker: string; titulo: string } => {
  switch (ruta.n) {
    case 'inicio':
      return { kicker: 'SuiteFamilia', titulo: 'Pendientes' }
    case 'pendientes':
      return { kicker: 'SuiteFamilia', titulo: 'Pendientes' }
    case 'hechos':
      return { kicker: 'Lo resuelto', titulo: 'Hechos' }
    case 'ajustes':
      return { kicker: 'SuiteFamilia', titulo: 'Ajustes' }
    case 'ficha':
      return {
        kicker: pendiente(datos, ruta.id)?.finalizado ? 'Hecho' : 'Pendiente',
        titulo: 'Ficha',
      }
  }
}
