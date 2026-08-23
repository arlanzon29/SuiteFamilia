import { useEffect, useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { tema as temaDe } from '../estado/consultas'
import type { Dialogo } from '../estado/rutas'
import { Aviso, textoError } from './Aviso'

/**
 * El diálogo único de la aplicación. Cambia de forma según el tipo, pero
 * siempre es la misma caja: título, texto o campos, y acciones a la derecha
 * con «Borrar» empujado a la izquierda cuando existe. Mismo patrón que la
 * compra.
 */
export const DialogoApp = () => {
  const { dlg } = useApp()
  if (!dlg) return null
  // La clave reinicia los campos cada vez que se abre un diálogo distinto.
  return <Contenido key={JSON.stringify(dlg)} dlg={dlg} />
}

const Contenido = ({ dlg }: { dlg: Dialogo }) => {
  const { casos, datos, acciones, nav, setDlg } = useApp()

  const temaEditado =
    dlg.tipo === 'renTema' || dlg.tipo === 'borrarTema' ? temaDe(datos, dlg.id) : undefined

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [temaElegido, setTemaElegido] = useState(datos.temas[0]?.nombre ?? '')
  const [enlace, setEnlace] = useState('')
  const [nombreTema, setNombreTema] = useState(temaEditado?.nombre ?? '')
  const [error, setError] = useState<string | null>(null)
  // Cargando el conocimiento a editar: no vive en `datos`, se pide aparte.
  const [cargandoConocimiento, setCargandoConocimiento] = useState(
    dlg.tipo === 'editConocimiento',
  )

  useEffect(() => {
    if (dlg.tipo !== 'editConocimiento') return
    let vivo = true
    setCargandoConocimiento(true)
    casos
      .obtenerConocimiento(dlg.id)
      .then((c) => {
        if (!vivo || !c) return
        setTitulo(c.titulo)
        setDescripcion(c.descripcion)
        setTemaElegido(c.tema)
        setEnlace(c.enlace ?? '')
      })
      .catch((e) => vivo && setError(textoError(e)))
      .finally(() => vivo && setCargandoConocimiento(false))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cerrar = () => setDlg(null)

  /**
   * Envuelve una acción del diálogo: si el servidor la rechaza, el diálogo se
   * queda abierto con el motivo y lo escrito intacto, en vez de cerrarse como
   * si hubiera ido bien.
   */
  const intenta = async (accion: () => Promise<void>) => {
    setError(null)
    try {
      await accion()
    } catch (e) {
      setError(textoError(e))
    }
  }

  // ─── Conocimiento: crear o editar ───
  if (dlg.tipo === 'nuevoConocimiento' || dlg.tipo === 'editConocimiento') {
    const esNuevo = dlg.tipo === 'nuevoConocimiento'
    const sinTemas = datos.temas.length === 0

    const confirmar = async () => {
      if (sinTemas) return
      const entrada = { titulo, descripcion, tema: temaElegido, enlace }
      if (esNuevo) {
        const c = await acciones.crearConocimiento(entrada)
        setDlg(null)
        if (c) nav.ir({ n: 'ficha', id: c.id })
      } else {
        await acciones.editarConocimiento(dlg.id, entrada)
        setDlg(null)
      }
    }

    const borrar = async () => {
      if (dlg.tipo !== 'editConocimiento') return
      await acciones.borrarConocimiento(dlg.id)
      setDlg(null)
      if (nav.ruta.n === 'ficha') nav.pestana('conocimientos')
    }

    if (cargandoConocimiento) {
      return (
        <Caja titulo="Editar conocimiento" cerrar={cerrar}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-neutral-600)' }}>
            Cargando…
          </p>
        </Caja>
      )
    }

    return (
      <Caja titulo={esNuevo ? 'Conocimiento nuevo' : 'Editar conocimiento'} cerrar={cerrar}>
        {sinTemas && (
          <Aviso>Crea antes un tema en Ajustes: hace falta al menos uno.</Aviso>
        )}
        <div className="field">
          <label>Título</label>
          <input
            className="input"
            style={{ minHeight: 48, fontSize: 16 }}
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
              setError(null)
            }}
            placeholder="p. ej. Lentejas estofadas de la abuela"
            autoFocus
          />
        </div>
        <div className="field">
          <label>Tema</label>
          <select
            className="input"
            style={{ minHeight: 48, fontSize: 16 }}
            value={temaElegido}
            onChange={(e) => setTemaElegido(e.target.value)}
          >
            {datos.temas.map((t) => (
              <option key={t.id} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Descripción</label>
          <textarea
            className="input"
            style={{ minHeight: 96, fontSize: 15, resize: 'vertical' }}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Todo lo que haga falta recordar"
          />
        </div>
        <div className="field">
          <label>Enlace (opcional)</label>
          <input
            className="input"
            style={{ minHeight: 48, fontSize: 16 }}
            type="url"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://…"
          />
        </div>
        {error && <Aviso>{error}</Aviso>}
        <div className="dialog-actions">
          {!esNuevo && (
            <button
              className="btn btn-secondary"
              style={{ minHeight: 46, marginRight: 'auto', color: 'var(--color-accent-700)' }}
              onClick={() => void intenta(borrar)}
            >
              Borrar
            </button>
          )}
          <button className="btn btn-secondary" style={{ minHeight: 46 }} onClick={cerrar}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-tinte"
            style={{ minHeight: 46 }}
            disabled={sinTemas}
            onClick={() => void intenta(confirmar)}
          >
            Guardar
          </button>
        </div>
      </Caja>
    )
  }

  // ─── Tema: crear, renombrar o borrar ───
  const tituloTema =
    dlg.tipo === 'nuevoTema'
      ? 'Tema nuevo'
      : dlg.tipo === 'renTema'
        ? 'Renombrar tema'
        : `¿Borrar «${temaEditado?.nombre ?? ''}»?`

  if (dlg.tipo === 'borrarTema') {
    const confirmar = async () => {
      await acciones.borrarTema(dlg.id)
      setDlg(null)
    }
    return (
      <Caja
        titulo={tituloTema}
        texto="Se borrarán también los conocimientos apuntados en este tema."
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
            onClick={() => void intenta(confirmar)}
          >
            Borrar
          </button>
        </div>
      </Caja>
    )
  }

  const confirmarTema = async () => {
    const v = nombreTema.trim()
    if (!v) return
    if (dlg.tipo === 'nuevoTema') await acciones.crearTema(v)
    else await acciones.renombrarTema(dlg.id, v)
    setDlg(null)
  }

  return (
    <Caja titulo={tituloTema} cerrar={cerrar}>
      <div className="field">
        <label>Nombre</label>
        <input
          className="input"
          style={{ minHeight: 48, fontSize: 16 }}
          value={nombreTema}
          onChange={(e) => {
            setNombreTema(e.target.value)
            setError(null)
          }}
          placeholder="p. ej. Recetas"
          autoFocus
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
          onClick={() => void intenta(confirmarTema)}
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
