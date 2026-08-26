import { useEffect, useState } from 'react'
import { Aviso, textoError } from '../componentes/Aviso'
import { Miniatura } from '../componentes/Miniatura'
import { useApp } from '../estado/AppProvider'
import type { Conocimiento } from '../../dominio/modelo'
import { fechaLarga } from '../formato'
import { IconoAutor, IconoBorrar, IconoCamara, IconoEnlace, IconoFoto } from '../iconos'

/**
 * La ficha no lee de una instantánea: pide su propio conocimiento por id, y
 * vuelve a pedirlo si `versionConocimientos` sube —por ejemplo, tras
 * editarlo desde este mismo diálogo—.
 */
export const Ficha = ({ id }: { id: string }) => {
  const { casos, sesion, galeria, setDlg, setVisor, versionConocimientos, setTituloFicha } =
    useApp()

  const [c, setC] = useState<Conocimiento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    casos
      .obtenerConocimiento(id)
      .then((r) => {
        if (!vivo) return
        setC(r)
        setTituloFicha(r?.titulo ?? '')
      })
      .catch((e) => vivo && setError(textoError(e)))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
      setTituloFicha('')
    }
  }, [casos, id, versionConocimientos, setTituloFicha])

  if (cargando) return null
  if (error) {
    return (
      <div style={{ padding: 14 }}>
        <Aviso>{error}</Aviso>
      </div>
    )
  }
  if (!c) {
    return (
      <div style={{ padding: 14, fontSize: 14, color: 'var(--color-neutral-600)' }}>
        Este conocimiento ya no existe.
      </div>
    )
  }

  const fotos = galeria.fotos(id)
  const subiendo = galeria.ocupado === id
  const esMio = c.creadoPor === sesion?.id
  const autor =
    c.creadoPor === null ? 'alguien que ya no tiene cuenta' : esMio ? 'ti' : 'la otra persona'

  return (
    <div
      style={{ padding: '14px 14px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div>
        <span className="tag tag-accent">{c.tema}</span>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {c.titulo}
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--color-neutral-600)',
        }}
      >
        <IconoAutor size={14} />
        <span>
          Apuntado por {autor} el {fechaLarga(c.creado)}
        </span>
      </div>

      {c.descripcion && (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {c.descripcion}
        </p>
      )}

      {c.enlace && (
        <a
          href={c.enlace}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <IconoEnlace size={18} />
          <span className="elipsis" style={{ flex: 1 }}>
            {c.enlace}
          </span>
        </a>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Fotos</div>
        {galeria.error && <Aviso>{galeria.error}</Aviso>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {fotos.map((f) => (
            <div key={f.id} style={{ position: 'relative' }}>
              <button onClick={() => setVisor({ conocimientoId: id, fotoId: f.id, titulo: c.titulo })}>
                <Miniatura src={f.fila} nombre={c.titulo} tamano={76} />
              </button>
              <button
                onClick={() => void galeria.quitaFoto(id, f.id)}
                aria-label="Quitar foto"
                disabled={subiendo}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-divider)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}
              >
                <IconoBorrar size={12} />
              </button>
            </div>
          ))}
          {/*
            Dos cuadros, no uno: como en el catálogo de la compra, «hacer
            foto» y «elegir del carrete» son gestos distintos y el segundo no
            puede quedar escondido detrás del primero. `pideFoto` ya sabía
            abrir la cámara (el `capture` del input es el mismo mecanismo que
            usa la compra); solo faltaba un botón que lo pidiera.
          */}
          <button
            onClick={() => galeria.pideFoto(id, true)}
            disabled={subiendo}
            aria-label="Hacer foto"
            style={{
              width: 76,
              height: 76,
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--color-divider)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-neutral-600)',
            }}
          >
            {subiendo ? '…' : <IconoCamara size={22} />}
          </button>
          <button
            onClick={() => galeria.pideFoto(id, false)}
            disabled={subiendo}
            aria-label="Elegir del carrete"
            style={{
              width: 76,
              height: 76,
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--color-divider)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-neutral-600)',
            }}
          >
            {subiendo ? '…' : <IconoFoto size={22} />}
          </button>
        </div>
      </div>

      <button
        className="btn btn-secondary"
        style={{ minHeight: 48 }}
        onClick={() => setDlg({ tipo: 'editConocimiento', id })}
      >
        Editar
      </button>
    </div>
  )
}
