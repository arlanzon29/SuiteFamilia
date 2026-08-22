import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CasosDeUso, Instantanea } from '../../aplicacion'
import type { Sesion } from '../../dominio/contratos'
import { useNavegacion } from './useNavegacion'
import { useTema } from './useTema'
import type { Dialogo } from './rutas'

const VACIO: Instantanea = { pendientes: [] }

/**
 * Único punto de contacto de la interfaz con la aplicación.
 *
 * Las pantallas leen `datos` —una instantánea de todo lo cargado— y llaman a
 * `acciones`; **nunca a un repositorio**. Cada acción ejecuta su caso de uso y
 * vuelve a cargar, para que no haya dos verdades.
 *
 * Aquí no hay la carga perezosa de la compra ni su segunda petición de
 * resumen, y no es un descuido: allí Inicio se apaña con tres cuentas hechas
 * en el servidor y la instantánea completa arrastra el histórico entero de
 * precios. Esto es una tabla de una casa, y las cuatro pantallas —Inicio la
 * primera— leen de ella. Partirla en dos peticiones sería complicar el código
 * para ahorrar una consulta que no pesa.
 */
type Contexto = {
  casos: CasosDeUso
  sesion: Sesion | null
  comprobandoSesion: boolean
  entrar: (email: string, contrasena: string) => Promise<void>
  salir: () => Promise<void>

  datos: Instantanea
  cargando: boolean
  error: string | null
  recargar: () => Promise<void>
  acciones: Acciones

  nav: ReturnType<typeof useNavegacion>
  tema: ReturnType<typeof useTema>

  dlg: Dialogo | null
  setDlg: (d: Dialogo | null) => void
}

/** Los casos de uso que modifican datos, ya envueltos para recargar al terminar. */
type Acciones = Pick<
  CasosDeUso,
  'crearPendiente' | 'editarPendiente' | 'darPorHecho' | 'deshacerHecho' | 'borrarPendiente'
>

const Ctx = createContext<Contexto | null>(null)

export const AppProvider = ({
  casos,
  children,
}: {
  casos: CasosDeUso
  children: ReactNode
}) => {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [comprobandoSesion, setComprobandoSesion] = useState(true)

  const [datos, setDatos] = useState<Instantanea>(VACIO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dlg, setDlg] = useState<Dialogo | null>(null)

  const nav = useNavegacion()
  const tema = useTema()

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      setDatos(await casos.cargarTodo())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se han podido cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [casos])

  useEffect(() => {
    let vivo = true
    casos
      .sesionActual()
      .then((s) => {
        if (vivo) setSesion(s)
      })
      .finally(() => {
        if (vivo) setComprobandoSesion(false)
      })
    return () => {
      vivo = false
    }
  }, [casos])

  useEffect(() => {
    if (sesion) void recargar()
    else setDatos(VACIO)
  }, [sesion, recargar])

  const entrar = useCallback(
    async (email: string, contrasena: string) => {
      setSesion(await casos.iniciarSesion(email, contrasena))
    },
    [casos],
  )

  const salir = useCallback(async () => {
    await casos.cerrarSesion()
    setSesion(null)
    nav.pestana('inicio')
  }, [casos, nav])

  const acciones = useMemo<Acciones>(() => {
    /** Envuelve un caso de uso para que lo cargado quede al día al acabar. */
    const tras =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const r = await fn(...args)
        await recargar()
        return r
      }

    return {
      crearPendiente: tras(casos.crearPendiente),
      editarPendiente: tras(casos.editarPendiente),
      darPorHecho: tras(casos.darPorHecho),
      deshacerHecho: tras(casos.deshacerHecho),
      borrarPendiente: tras(casos.borrarPendiente),
    }
  }, [casos, recargar])

  const valor = useMemo<Contexto>(
    () => ({
      casos,
      sesion,
      comprobandoSesion,
      entrar,
      salir,
      datos,
      cargando,
      error,
      recargar,
      acciones,
      nav,
      tema,
      dlg,
      setDlg,
    }),
    [
      casos,
      sesion,
      comprobandoSesion,
      entrar,
      salir,
      datos,
      cargando,
      error,
      recargar,
      acciones,
      nav,
      tema,
      dlg,
    ],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export const useApp = (): Contexto => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera de <AppProvider>')
  return c
}
