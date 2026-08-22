import type { Pendiente } from '../../dominio/modelo'
import { cuando, primeraLinea } from '../formato'
import { IconoHecho } from '../iconos'

/**
 * Las dos filas de la aplicación. Comparten la caja —72 px de alto mínimo,
 * `padding: 16px 14px`, título en Cormorant 600 a 19 px y línea secundaria de
 * 12 px— porque es la tarjeta de fila del sistema visual, la misma que usa la
 * compra en sus listas.
 *
 * Lo que cambia entre ellas es lo justo: la resuelta lleva la marca de oro
 * delante y cuenta dos fechas en vez de una.
 *
 * En ninguna de las dos hay acciones. Se toca la fila entera y lleva a la
 * ficha: dar por hecho, editar y borrar viven allí dentro, para que no se
 * disparen de un roce mientras se lee la lista.
 */

const CAJA: React.CSSProperties = {
  width: '100%',
  minHeight: 72,
  textAlign: 'left',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-md)',
  padding: '16px 14px',
}

const TITULO: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 19,
  lineHeight: 1.2,
}

/**
 * La línea secundaria recorta a dos renglones con `-webkit-line-clamp`, que es
 * lo que hacía el boceto: un comentario de tres párrafos no puede estirar la
 * fila hasta ocupar la pantalla.
 */
const SECUNDARIA: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: 'var(--color-neutral-600)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

export const FilaPorHacer = ({
  p,
  hoy,
  abrir,
}: {
  p: Pendiente
  hoy: string
  abrir: () => void
}) => {
  const nota = primeraLinea(p.comentario)
  return (
    <button onClick={abrir} style={{ ...CAJA, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={TITULO}>{p.titulo}</span>
      <span className="cifra" style={SECUNDARIA}>
        Anotado {cuando(p.creado, hoy)}
        {nota && ` · ${nota}`}
      </span>
    </button>
  )
}

export const FilaHecha = ({
  p,
  hoy,
  abrir,
}: {
  p: Pendiente
  hoy: string
  abrir: () => void
}) => (
  <button onClick={abrir} style={{ ...CAJA, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <span style={{ flex: 'none', marginTop: 3, display: 'flex' }}>
      <IconoHecho size={18} color="var(--color-accent)" />
    </span>
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ ...TITULO, fontSize: 18 }}>{p.titulo}</span>
      <span className="cifra" style={{ ...SECUNDARIA, WebkitLineClamp: 1 }}>
        Hecho {p.hecho ? cuando(p.hecho, hoy) : ''} · anotado {cuando(p.creado, hoy)}
      </span>
    </span>
  </button>
)
