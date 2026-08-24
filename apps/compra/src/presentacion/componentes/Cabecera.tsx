import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { tienePila } from '../estado/rutas'
import { lista } from '../estado/consultas'
import { IconoAtras, IconoCerrar, IconoClaro, IconoMenu, IconoOscuro } from '../iconos'

/**
 * Si la app corre instalada como PWA (`display: standalone`), tiene su
 * propia ventana y `window.close()` la cierra de verdad. En una pestaña
 * normal del navegador no hay ventana que cerrar, así que el botón ni se
 * muestra.
 *
 * iOS queda fuera aunque «añadir a inicio» también cuente como instalada:
 * ahí Safari ignora `window.close()` en silencio, así que el botón se vería
 * pero no haría nada.
 */
const appInstalada = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(display-mode: standalone)').matches &&
  !/iPad|iPhone|iPod/.test(window.navigator.userAgent)

type ItemMenu = { texto: string; onClick: () => void }

/** Cabecera con kicker + título, flecha atrás cuando hay pila y conmutador de tema. */
export const Cabecera = ({ kicker, titulo }: { kicker: string; titulo: string }) => {
  const { nav, tema, datos, setDlg } = useApp()
  const hayAtras = tienePila(nav.ruta)
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Acciones que son «de una sola vez» en la pantalla —se hacen al principio
  // o al final, no artículo a artículo— y por eso no merecen un FAB propio
  // como el «+» de añadir (ver el comentario junto a ese botón, en
  // `DetalleLista.tsx` y en `Catalogo.tsx`). Viven aquí, en un menú siempre a
  // mano, en vez de al pie de una lista que puede ser larga.
  const listaActual = nav.ruta.n === 'lista' ? lista(datos, nav.ruta.id) : undefined
  const items: ItemMenu[] =
    listaActual && !listaActual.cerrada
      ? [
          {
            texto: 'Dictar o pegar varios a la vez',
            onClick: () => nav.ir({ n: 'dictar', id: listaActual.id }),
          },
          {
            texto: 'Cerrar lista',
            onClick: () => setDlg({ tipo: 'cerrarLista', id: listaActual.id }),
          },
        ]
      : nav.ruta.n === 'articulos'
        ? [
            {
              texto: 'Apuntar precios del catálogo',
              onClick: () =>
                setDlg({
                  tipo: 'tiendaRonda',
                  ids: datos.articulos.map((a) => a.id),
                  origen: 'el catálogo',
                }),
            },
          ]
        : []

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 14px 12px',
        borderBottom: '1px solid var(--color-divider)',
        flex: 'none',
      }}
    >
      {hayAtras && (
        <button
          className="btn btn-secondary"
          style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
          onClick={nav.atras}
          aria-label="Atrás"
        >
          <IconoAtras size={22} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kicker">{kicker}</div>
        <h2 className="elipsis" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          {titulo}
        </h2>
      </div>
      {items.length > 0 && (
        <>
          {menuAbierto && (
            // Overlay invisible, fuera del contenedor del botón: así se
            // ancla al `.marco-app` (como el del diálogo) y cubre la
            // pantalla entera para cerrar el menú al tocar fuera, en vez de
            // quedarse encogido al tamaño del botón.
            <div
              className="menu-overlay"
              role="presentation"
              onClick={() => setMenuAbierto(false)}
            />
          )}
          <div style={{ position: 'relative', flex: 'none' }}>
            <button
              className="btn btn-secondary"
              style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
              onClick={() => setMenuAbierto((a) => !a)}
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              aria-label="Más acciones"
            >
              <IconoMenu size={19} />
            </button>
            {menuAbierto && (
              <div className="menu-panel" role="menu">
                {items.map((it) => (
                  <button
                    key={it.texto}
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuAbierto(false)
                      it.onClick()
                    }}
                  >
                    {it.texto}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <button
        className="btn btn-secondary"
        style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
        onClick={tema.alterna}
        aria-label="Cambiar tema"
      >
        {tema.tema === 'dark' ? <IconoOscuro size={19} /> : <IconoClaro size={19} />}
      </button>
      {appInstalada() && (
        <button
          className="btn btn-secondary"
          style={{ width: 44, height: 44, padding: 0, flex: 'none' }}
          onClick={() => window.close()}
          aria-label="Cerrar la app"
        >
          <IconoCerrar size={19} />
        </button>
      )}
    </div>
  )
}
