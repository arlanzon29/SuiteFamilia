import { useState } from 'react'
import { useApp } from '../estado/AppProvider'
import { Aviso, textoError } from '../componentes/Aviso'
import { IconoDesconectar } from '../iconos'

/**
 * Tema, cuenta y desconectar. Calco de `apps/pendientes/.../Ajustes.tsx`,
 * con una diferencia: al ser la puerta de entrada, la cuenta no se explica
 * como «la misma que la de la compra» — aquí la cuenta ES la de toda la
 * suite, y desconectar aquí cierra la sesión para compra y pendientes
 * también, porque las tres viven del mismo origen y la misma clave de
 * Supabase Auth.
 */
export const Ajustes = () => {
  const { sesion, salir, actualizarNombre, tema } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [saliendo, setSaliendo] = useState(false)

  const [nombre, setNombre] = useState(sesion?.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)

  const guardarNombre = async () => {
    setGuardandoNombre(true)
    setErrorNombre(null)
    try {
      await actualizarNombre(nombre)
    } catch (e) {
      setErrorNombre(textoError(e))
    } finally {
      setGuardandoNombre(false)
    }
  }

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
            alignItems: 'center',
            gap: 10,
            padding: '12px 0',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>Nombre</span>
          <input
            className="input"
            style={{ flex: 1, minHeight: 44, fontSize: 16 }}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cómo quieres que te llamemos"
            maxLength={40}
          />
          <button
            className="btn btn-secondary"
            style={{ minHeight: 44, flexShrink: 0 }}
            onClick={() => void guardarNombre()}
            disabled={guardandoNombre || nombre.trim() === (sesion?.nombre ?? '')}
          >
            {guardandoNombre ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {errorNombre && <Aviso>{errorNombre}</Aviso>}
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
          Es la cuenta de toda la casa: la misma para la compra y para pendientes.
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
        SuiteFamilia
      </div>
    </div>
  )
}
