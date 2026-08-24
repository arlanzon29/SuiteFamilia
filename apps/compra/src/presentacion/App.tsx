import { useEffect, useRef, useState, type RefObject } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { useApp } from './estado/AppProvider'
import { lista, articulo, supermercado } from './estado/consultas'
import type { Ruta } from './estado/rutas'
import { useVersionNueva } from './estado/useVersionNueva'
import { Cabecera } from './componentes/Cabecera'
import { BarraPestanas } from './componentes/BarraPestanas'
import { AvisoVersion } from './componentes/AvisoVersion'
import { DialogoApp } from './componentes/DialogoApp'
import { HojaDePrecio } from './componentes/HojaDePrecio'
import { VisorFoto } from './componentes/VisorFoto'
import { PanelAnadir } from './componentes/PanelAnadir'
import { Login } from './pantallas/Login'
import { Inicio } from './pantallas/Inicio'
import { Listas } from './pantallas/Listas'
import { DetalleLista } from './pantallas/DetalleLista'
import { Dictar } from './pantallas/Dictar'
import { Catalogo } from './pantallas/Catalogo'
import { Ficha } from './pantallas/Ficha'
import { Ronda } from './pantallas/Ronda'
import { Ajustes } from './pantallas/Ajustes'
import type { Instantanea } from '../aplicacion'

/**
 * Marco de la aplicación: el móvil de 440px centrado, con cabecera fija,
 * contenido con scroll propio y la barra de pestañas abajo. Las capas que
 * flotan (hoja de precio, diálogo, panel de añadir) se posicionan contra este
 * marco, no contra la ventana.
 */
export const App = () => {
  const { sesion, comprobandoSesion, nav, datos, imagenes, panelAnadir } = useApp()
  const { hayNueva } = useVersionNueva()

  // Sombra bajo la cabecera en cuanto el contenido se ha desplazado, como la
  // elevación del AppBarLayout de Android. Solo en el detalle de lista, que
  // es donde se pensó (ver docs/gestos-lista-swipe.md); las demás pantallas
  // no lo llevan todavía.
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const conGestos = nav.ruta.n === 'lista'
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
        {/* Un único input de fichero para fotos de producto y logos de tienda. */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={imagenes.inputRef}
          onChange={(e) => void imagenes.recibeImagen(e)}
        />

        {comprobandoSesion ? null : !sesion ? (
          <Login />
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Cabecera {...tituloDe(nav.ruta, datos)} elevada={conGestos && scrolled} />
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
                    «refrescar». Solo en el detalle de lista, igual que el
                    resto de los efectos de esta pantalla.
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
            {panelAnadir && <PanelAnadir />}
            <HojaDePrecio />
            <DialogoApp />
            <VisorFoto />
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
 * Detalle completo en `docs/gestos-lista-swipe.md`.
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
    case 'listas':
      return <Listas />
    case 'lista':
      return <DetalleLista listaId={ruta.id} />
    case 'dictar':
      return <Dictar listaId={ruta.id} />
    case 'articulos':
      return <Catalogo />
    case 'ficha':
      return <Ficha artId={ruta.id} />
    case 'ronda':
      return <Ronda superId={ruta.superId} ids={ruta.ids} origen={ruta.origen} />
    case 'ajustes':
      return <Ajustes />
  }
}

const tituloDe = (ruta: Ruta, datos: Instantanea): { kicker: string; titulo: string } => {
  switch (ruta.n) {
    case 'inicio':
      return { kicker: 'Casa', titulo: 'Compra' }
    case 'listas':
      return { kicker: 'Compra', titulo: 'Listas' }
    case 'articulos':
      return { kicker: 'Catálogo', titulo: 'Artículos' }
    case 'ajustes':
      return { kicker: 'Casa', titulo: 'Ajustes' }
    case 'lista':
      return { kicker: 'Lista', titulo: lista(datos, ruta.id)?.nombre ?? '' }
    case 'ficha':
      return { kicker: 'Artículo', titulo: articulo(datos, ruta.id)?.nombre ?? '' }
    case 'dictar':
      return { kicker: 'De golpe', titulo: 'Dictar o pegar' }
    case 'ronda':
      return {
        kicker: 'Apuntando precios en',
        titulo: supermercado(datos, ruta.superId)?.nombre ?? '',
      }
  }
}
