import { useEffect } from 'react'
import { useApp } from '../estado/AppProvider'
import { IconoCerrar } from '../iconos'

/**
 * Una foto de la galería, a pantalla completa sobre el marco del móvil.
 *
 * Igual que en la compra: se cierra tocando en cualquier sitio, con la `×`
 * arriba para quien la busque con la vista, y enseña siempre el tamaño de
 * 720 px.
 */
export const VisorFoto = () => {
  const { visor, setVisor, galeria } = useApp()

  useEffect(() => {
    if (!visor) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisor(null)
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [visor, setVisor])

  if (!visor) return null

  const foto = galeria.fotos(visor.conocimientoId).find((f) => f.id === visor.fotoId)
  // Si la foto se ha ido —la ha quitado el otro entre medias—, no se abre un
  // recuadro vacío.
  if (!foto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${visor.titulo}`}
      onClick={() => setVisor(null)}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        background: 'color-mix(in srgb, var(--color-neutral-900) 88%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'rise .18s ease-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-neutral-100)',
          }}
        >
          <IconoCerrar size={22} />
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
        }}
      >
        <img
          src={foto.ficha}
          alt={visor.titulo}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>

      <div
        style={{
          padding: '14px 16px 22px',
          textAlign: 'center',
          color: 'var(--color-neutral-100)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 19 }}>{visor.titulo}</div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Toca para cerrar</div>
      </div>
    </div>
  )
}
