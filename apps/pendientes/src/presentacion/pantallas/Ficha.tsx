import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { pendiente } from '../estado/consultas'
import { Aviso, textoError } from '../componentes/Aviso'
import { fechaLarga, hace } from '../formato'
import { IconoBorrar, IconoDeshacer, IconoHecho } from '../iconos'

/**
 * Un pendiente entero: el título grande, las dos fechas enfrentadas y el
 * comentario largo.
 *
 * Es donde vive **todo lo que se le puede hacer**: darlo por hecho, deshacerlo,
 * editarlo —desde el botón de la cabecera— y borrarlo. Ninguna de esas acciones
 * está en la fila de la lista, y es una decisión: en una lista que se recorre
 * con el pulgar, un botón de borrar al lado del texto se dispara solo.
 *
 * El comentario va alineado a la izquierda. El boceto lo justificaba con
 * `hyphens: auto`, que en una columna de 347 px abre ríos de blanco; se
 * entiende la intención editorial, pero se lee peor.
 */
export const Ficha = ({ id }: { id: string }) => {
  const { casos, datos, acciones, setDlg } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const hoy = casos.hoy()

  const p = pendiente(datos, id)
  // Puede no estar: lo ha borrado la otra persona mientras se miraba.
  if (!p) return null

  const cambiarEstado = async () => {
    setError(null)
    setOcupado(true)
    try {
      if (p.hecho) await acciones.deshacerHecho(p.id)
      else await acciones.darPorHecho(p.id)
    } catch (e) {
      setError(textoError(e))
    } finally {
      setOcupado(false)
    }
  }

  const parrafos = p.comentario.split('\n').filter((l) => l.trim())

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '26px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h1
        style={{
          margin: '0 0 18px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 30,
          lineHeight: 1.12,
        }}
      >
        {p.titulo}
      </h1>

      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--color-divider)',
          borderBottom: '1px solid var(--color-divider)',
          marginBottom: 18,
        }}
      >
        <Fecha rotulo="Se anotó" valor={fechaLarga(p.creado)} pie={hace(p.creado, hoy)} />
        <div style={{ width: 1, background: 'var(--color-divider)' }} />
        <Fecha
          rotulo="Se hizo"
          valor={p.hecho ? fechaLarga(p.hecho) : '—'}
          pie={p.hecho ? hace(p.hecho, hoy) : 'todavía por hacer'}
          apagado={!p.hecho}
          sangrado
        />
      </div>

      {parrafos.length > 0 ? (
        <div style={{ fontSize: 15, lineHeight: 1.55, textWrap: 'pretty' }}>
          {parrafos.map((t, i) => (
            <p key={i} style={{ margin: i === parrafos.length - 1 ? 0 : '0 0 14px' }}>
              {t}
            </p>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 15, color: 'var(--color-neutral-600)' }}>
          Sin comentario. El título lo dice todo.
        </p>
      )}

      {error && (
        <div style={{ marginTop: 18 }}>
          <Aviso>{error}</Aviso>
        </div>
      )}

      {/* `margin-top: auto` empuja las acciones abajo del todo, como el boceto:
          el comentario es lo que se lee, y los botones esperan al final. */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          className={p.hecho ? 'btn btn-secondary' : 'btn btn-primary btn-tinte'}
          style={{ width: '100%', minHeight: 52, fontSize: 16 }}
          onClick={() => void cambiarEstado()}
          disabled={ocupado}
        >
          {p.hecho ? <IconoDeshacer size={18} /> : <IconoHecho size={18} />}
          {p.hecho ? 'Volver a dejarlo pendiente' : 'Darlo por hecho'}
        </button>

        {/*
          Borrar es secundario y va aquí, debajo: en voz baja, sin borde de
          acento y con una confirmación detrás. Es la única acción de la
          aplicación que no se puede deshacer.
        */}
        <button
          onClick={() => setDlg({ tipo: 'borrar', id: p.id })}
          style={{
            minHeight: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-accent-700)',
          }}
        >
          <IconoBorrar size={16} />
          Borrar este pendiente
        </button>
      </div>
    </div>
  )
}

const Fecha = ({
  rotulo,
  valor,
  pie,
  apagado = false,
  sangrado = false,
}: {
  rotulo: string
  valor: string
  pie: string
  apagado?: boolean
  sangrado?: boolean
}) => (
  <div
    style={{
      flex: 1,
      padding: sangrado ? '14px 0 14px 18px' : '14px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}
  >
    <span className="kicker-neutral">{rotulo}</span>
    <span
      className="cifra"
      style={{ fontSize: 15, color: apagado ? 'var(--color-neutral-500)' : undefined }}
    >
      {valor}
    </span>
    <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{pie}</span>
  </div>
)
