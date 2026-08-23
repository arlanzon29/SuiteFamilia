import { useApp } from './estado/AppProvider'
import type { Ruta } from './estado/rutas'
import { Cabecera } from './componentes/Cabecera'
import { BarraPestanas } from './componentes/BarraPestanas'
import { DialogoApp } from './componentes/DialogoApp'
import { VisorFoto } from './componentes/VisorFoto'
import { Login } from './pantallas/Login'
import { Inicio } from './pantallas/Inicio'
import { Conocimientos } from './pantallas/Conocimientos'
import { Ficha } from './pantallas/Ficha'
import { Ajustes } from './pantallas/Ajustes'

/**
 * Marco de la aplicación: el móvil de 440px centrado, con cabecera fija,
 * contenido con scroll propio y la barra de pestañas abajo. Mismo marco que
 * la compra.
 */
export const App = () => {
  const { sesion, comprobandoSesion, nav, tituloFicha, galeria } = useApp()

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
        {/* Un único input de fichero para toda la galería. */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={galeria.inputRef}
          onChange={(e) => void galeria.recibeFoto(e)}
        />

        {comprobandoSesion ? null : !sesion ? (
          <Login />
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Cabecera {...tituloDe(nav.ruta, tituloFicha)} />
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <Pantalla ruta={nav.ruta} />
              </div>
              <BarraPestanas />
            </div>
            <DialogoApp />
            <VisorFoto />
          </>
        )}
      </div>
    </div>
  )
}

const Pantalla = ({ ruta }: { ruta: Ruta }) => {
  switch (ruta.n) {
    case 'inicio':
      return <Inicio />
    case 'conocimientos':
      return <Conocimientos />
    case 'ficha':
      return <Ficha id={ruta.id} />
    case 'ajustes':
      return <Ajustes />
  }
}

const tituloDe = (ruta: Ruta, tituloFicha: string): { kicker: string; titulo: string } => {
  switch (ruta.n) {
    case 'inicio':
      return { kicker: 'Casa', titulo: 'Saber' }
    case 'conocimientos':
      return { kicker: 'Casa', titulo: 'Saber' }
    case 'ficha':
      return { kicker: 'Conocimiento', titulo: tituloFicha }
    case 'ajustes':
      return { kicker: 'Casa', titulo: 'Ajustes' }
  }
}
