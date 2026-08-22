import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { Aviso, textoError } from '../componentes/Aviso'
import { IconoDesconectar } from '../iconos'

/**
 * Tema, cuenta y desconectar. Nada más.
 *
 * El boceto traía además unas filas de «Aplicaciones de la suite» —Compra,
 * Pendientes— que parecían navegación y no llevaban a ningún sitio. Se
 * quitaron. De ahí sale un flanco que no es de esta aplicación: **no queda
 * ninguna forma de saltar de una aplicación a otra desde dentro**, y eso
 * empuja hacia poner portada en `/SuiteFamilia/`, que hoy da 404. Está anotado
 * en `docs/estado-de-la-suite.md`.
 *
 * Tampoco está la «Demostración de estados» que tiene la compra en su Ajustes:
 * allí sirve para revisar el diseño del detalle de lista, que tiene tres
 * estados de carga que cuesta provocar. Aquí no hay nada equivalente.
 */
export const Ajustes = () => {
  const { sesion, salir, tema } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [saliendo, setSaliendo] = useState(false)

  /**
   * Desconectar ya llama a Supabase, y por tanto ya puede fallar de verdad:
   * sin cobertura, `signOut` no llega a salir. El `void salir()` de antes se
   * tragaba ese fallo y dejaba el botón mudo, que es lo peor que puede pasar
   * aquí —quien lo pulsa se cree fuera y sigue dentro—. Ahora el fallo se
   * enseña y la sesión se queda como estaba.
   */
  const desconectar = async () => {
    setSaliendo(true)
    setError(null)
    try {
      await salir()
    } catch (e) {
      setError(textoError(e))
    } finally {
      setSaliendo(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '18px 14px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Apariencia</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52 }}>
          <span style={{ flex: 1, fontSize: 16 }}>Tema</span>
          <div className="seg">
            <label className="seg-opt" style={{ minHeight: 44, paddingInline: 16 }}>
              <input
                type="radio"
                name="tema"
                checked={tema.tema === 'light'}
                onChange={() => tema.setTema('light')}
              />
              Claro
            </label>
            <label className="seg-opt" style={{ minHeight: 44, paddingInline: 16 }}>
              <input
                type="radio"
                name="tema"
                checked={tema.tema === 'dark'}
                onChange={() => tema.setTema('dark')}
              />
              Oscuro
            </label>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="kicker-neutral">Cuenta</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <span style={{ fontSize: 16 }}>Correo</span>
          <span
            className="cifra elipsis"
            style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}
          >
            {sesion?.email}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-neutral-600)' }}>
          Es la misma cuenta de la lista de la compra: toda la suite comparte una sola.
        </p>
        {error && <Aviso>{error}</Aviso>}
        <button
          className="btn btn-secondary"
          style={{ minHeight: 52, fontSize: 16, marginTop: 4 }}
          onClick={() => void desconectar()}
          disabled={saliendo}
        >
          <IconoDesconectar size={18} />
          {saliendo ? 'Desconectando…' : 'Desconectar'}
        </button>
      </section>

      <div
        className="cifra"
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-neutral-500)',
        }}
      >
        SuiteFamilia · Pendientes
      </div>
    </div>
  )
}
