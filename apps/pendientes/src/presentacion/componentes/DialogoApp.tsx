import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { pendiente } from '../estado/consultas'
import type { Dialogo } from '../estado/rutas'
import { Aviso, textoError } from './Aviso'

/**
 * El diálogo único de la aplicación: apuntar uno nuevo, editar el que se está
 * mirando y confirmar el borrado. Cambia de forma según el tipo, pero siempre
 * es la misma caja —título, campos, acciones a la derecha—, igual que en la
 * compra.
 *
 * Va **pegado arriba** y no centrado. Los dos que llevan campo se abren con el
 * teclado, y el teclado se come la mitad de abajo de la pantalla: un diálogo
 * centrado queda centrado debajo del teclado, tapado justo cuando hay que
 * escribir en él. Está en `tokens.css`, en `.dialog-backdrop`.
 */
export const DialogoApp = () => {
  const { dlg } = useApp()
  if (!dlg) return null
  // La clave reinicia los campos cada vez que se abre un diálogo distinto.
  return <Contenido key={JSON.stringify(dlg)} dlg={dlg} />
}

const Contenido = ({ dlg }: { dlg: Dialogo }) => {
  const { datos, acciones, nav, setDlg } = useApp()

  const editado = dlg.tipo !== 'nuevo' ? pendiente(datos, dlg.id) : undefined

  const [titulo, setTitulo] = useState(dlg.tipo === 'editar' ? (editado?.titulo ?? '') : '')
  const [comentario, setComentario] = useState(
    dlg.tipo === 'editar' ? (editado?.comentario ?? '') : '',
  )
  const [error, setError] = useState<string | null>(null)

  const cerrar = () => setDlg(null)

  /**
   * Envuelve una acción del diálogo: si falla, el diálogo se queda abierto con
   * el motivo y lo escrito intacto, en vez de cerrarse como si hubiera ido
   * bien.
   */
  const intenta = async (accion: () => Promise<void>) => {
    setError(null)
    try {
      await accion()
    } catch (e) {
      setError(textoError(e))
    }
  }

  // ─── borrar: confirmación, sin campos ───
  if (dlg.tipo === 'borrar') {
    return (
      <Caja
        titulo={`¿Borrar «${editado?.titulo ?? 'el pendiente'}»?`}
        texto="Desaparece del todo, con su comentario. No es lo mismo que darlo por hecho: esto es para lo que se apuntó por error."
        cerrar={cerrar}
      >
        {error && <Aviso>{error}</Aviso>}
        <div className="dialog-actions">
          <button className="btn btn-secondary" style={{ minHeight: 46 }} onClick={cerrar}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-tinte"
            style={{ minHeight: 46 }}
            onClick={() =>
              void intenta(async () => {
                await acciones.borrarPendiente(dlg.id)
                setDlg(null)
                // La ficha que se estaba mirando ya no existe: hay que salir de
                // ella, o quedaría una pantalla en blanco con su cabecera.
                if (nav.ruta.n === 'ficha') nav.atras()
              })
            }
          >
            Borrar
          </button>
        </div>
      </Caja>
    )
  }

  // ─── nuevo y editar: los mismos dos campos ───
  const esNuevo = dlg.tipo === 'nuevo'

  const guardar = async () => {
    if (!titulo.trim()) return
    if (esNuevo) await acciones.crearPendiente(titulo, comentario)
    else await acciones.editarPendiente(dlg.id, titulo, comentario)
    setDlg(null)
  }

  return (
    <Caja titulo={esNuevo ? 'Pendiente nuevo' : 'Editar pendiente'} cerrar={cerrar}>
      <div className="field">
        <label htmlFor="titulo">Título</label>
        <input
          id="titulo"
          className="input"
          /* 16px es lo mínimo para que iOS no haga zoom al enfocar. */
          style={{ minHeight: 48, fontSize: 16 }}
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value)
            setError(null)
          }}
          placeholder="Una línea"
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="comentario">Comentario</label>
        <textarea
          id="comentario"
          className="input"
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            padding: '8px 10px',
            minHeight: esNuevo ? 110 : 150,
          }}
          value={comentario}
          onChange={(e) => {
            setComentario(e.target.value)
            setError(null)
          }}
          placeholder="Todo lo que haga falta recordar"
        />
      </div>
      {error && <Aviso>{error}</Aviso>}
      <div className="dialog-actions">
        <button className="btn btn-secondary" style={{ minHeight: 46 }} onClick={cerrar}>
          Cancelar
        </button>
        <button
          className="btn btn-primary btn-tinte"
          style={{ minHeight: 46 }}
          onClick={() => void intenta(guardar)}
          disabled={!titulo.trim()}
        >
          Guardar
        </button>
      </div>
    </Caja>
  )
}

const Caja = ({
  titulo,
  texto,
  cerrar,
  children,
}: {
  titulo: string
  texto?: string | null
  cerrar: () => void
  children: React.ReactNode
}) => (
  <div
    className="dialog-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) cerrar()
    }}
  >
    <div className="dialog" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="dialog-title">{titulo}</div>
      {texto && <div className="dialog-body">{texto}</div>}
      {children}
    </div>
  </div>
)
