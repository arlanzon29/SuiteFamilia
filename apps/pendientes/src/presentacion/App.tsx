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
  const { hayNueva, actualizar } = useVersionNueva()

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
        {hayNueva && <AvisoVersion onActualizar={actualizar} />}
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
              />
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Pantalla ruta={nav.ruta} />
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
