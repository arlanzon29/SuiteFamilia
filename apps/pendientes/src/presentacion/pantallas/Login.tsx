import { useState, type FormEvent } from 'react'
import { useApp } from '../estado/AppProvider'
import { Aviso, textoError } from '../componentes/Aviso'
import { IconoHoja } from '../iconos'

/**
 * Entrada a la aplicación. **La misma cuenta que la compra**: la suite entera
 * tira de un solo proyecto de Supabase, así que quien entra en una entra en
 * todas. No hay registro; las cuentas se crean a mano, que es todo lo que
 * necesita una casa.
 */
export const Login = () => {
  const { entrar, errorSesion } = useApp()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await entrar(email, pass)
    } catch (e) {
      setError(textoError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void enviar(e)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 26px',
        gap: 26,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
        }}
      >
        <IconoHoja size={40} color="var(--color-accent)" />
        <div className="kicker">SuiteFamilia</div>
        <h1 style={{ fontSize: 34, margin: 0, fontWeight: 600, lineHeight: 1.15 }}>
          Una cuenta para toda la casa
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: 'var(--color-neutral-700)',
            maxWidth: 255,
          }}
        >
          La misma con la que entras en la lista de la compra.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label htmlFor="correo">Correo</label>
          <input
            id="correo"
            className="input"
            /* 16px es lo mínimo para que iOS no haga zoom al enfocar. */
            style={{ minHeight: 48, fontSize: 16 }}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            placeholder="tu@correo.es"
          />
        </div>
        <div className="field">
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            className="input"
            style={{ minHeight: 48, fontSize: 16 }}
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value)
              setError(null)
            }}
            placeholder="••••••••"
          />
        </div>

        {(error ?? errorSesion) && (
          <Aviso>
            {error ??
              `No se pudo recuperar la sesión guardada (esto no impide entrar): ${errorSesion}`}
          </Aviso>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-tinte"
          style={{ minHeight: 52, fontSize: 16 }}
          disabled={enviando}
        >
          Entrar
        </button>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            textAlign: 'center',
            color: 'var(--color-neutral-600)',
          }}
        >
          Las cuentas se crean a mano. No hay registro.
        </p>
      </div>
    </form>
  )
}
