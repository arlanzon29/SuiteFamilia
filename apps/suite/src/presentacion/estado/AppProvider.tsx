import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CasosDeUso } from '../../aplicacion'
import type { ResumenCompra, ResumenPendientes } from '../../dominio/modelo'
import type { Sesion } from '../../dominio/contratos'
import { useNavegacion } from './useNavegacion'
import { useTema } from './useTema'

/**
 * Único punto de contacto de la interfaz con la aplicación.
 *
 * Aquí no hay una `Instantanea` como en las otras dos apps: la portada no
 * tiene una entidad propia, tiene dos lecturas independientes —el resumen de
 * compra y el de pendientes— que se cargan en paralelo y cada una lleva su
 * propio estado de carga y error, para que un fallo en una tarjeta no tumbe
 * la otra.
 */
type Contexto = {
  casos: CasosDeUso
  sesion: Sesion | null
  comprobandoSesion: boolean
  errorSesion: string | null
  entrar: (email: string, contrasena: string) => Promise<void>
  salir: () => Promise<void>
  actualizarNombre: (nombre: string) => Promise<void>

  resumenCompra: ResumenCompra | null
  cargandoCompra: boolean
  errorCompra: string | null
  resumenPendientes: ResumenPendientes | null
  cargandoPendientes: boolean
  errorPendientes: string | null
  recargar: () => void

  nav: ReturnType<typeof useNavegacion>
  tema: ReturnType<typeof useTema>
}

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
  const [errorSesion, setErrorSesion] = useState<string | null>(null)

  const [resumenCompra, setResumenCompra] = useState<ResumenCompra | null>(null)
  const [cargandoCompra, setCargandoCompra] = useState(false)
  const [errorCompra, setErrorCompra] = useState<string | null>(null)

  const [resumenPendientes, setResumenPendientes] = useState<ResumenPendientes | null>(null)
  const [cargandoPendientes, setCargandoPendientes] = useState(false)
  const [errorPendientes, setErrorPendientes] = useState<string | null>(null)

  const [tick, setTick] = useState(0)

  const nav = useNavegacion()
  const tema = useTema()

  /** Vuelve a pedir las dos tarjetas. No espera a la que tarde más. */
  const recargar = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let vivo = true
    casos
      .sesionActual()
      .then((s) => {
        if (vivo) setSesion(s)
      })
      .catch((e) => {
        if (vivo) setErrorSesion(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (vivo) setComprobandoSesion(false)
      })
    return () => {
      vivo = false
    }
  }, [casos])

  useEffect(() => {
    if (!sesion) {
      setResumenCompra(null)
      setResumenPendientes(null)
      return
    }
    let vivo = true
    setCargandoCompra(true)
    setErrorCompra(null)
    casos
      .cargarResumenCompra()
      .then((r) => vivo && setResumenCompra(r))
      .catch((e) => vivo && setErrorCompra(e instanceof Error ? e.message : String(e)))
      .finally(() => vivo && setCargandoCompra(false))
    return () => {
      vivo = false
    }
  }, [casos, sesion, tick])

  useEffect(() => {
    if (!sesion) return
    let vivo = true
    setCargandoPendientes(true)
    setErrorPendientes(null)
    casos
      .cargarResumenPendientes()
      .then((r) => vivo && setResumenPendientes(r))
      .catch((e) => vivo && setErrorPendientes(e instanceof Error ? e.message : String(e)))
      .finally(() => vivo && setCargandoPendientes(false))
    return () => {
      vivo = false
    }
  }, [casos, sesion, tick])

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

  const actualizarNombre = useCallback(
    async (nombre: string) => {
      setSesion(await casos.actualizarNombre(nombre))
    },
    [casos],
  )

  const valor = useMemo<Contexto>(
    () => ({
      casos,
      sesion,
      comprobandoSesion,
      errorSesion,
      entrar,
      salir,
      actualizarNombre,
      resumenCompra,
      cargandoCompra,
      errorCompra,
      resumenPendientes,
      cargandoPendientes,
      errorPendientes,
      recargar,
      nav,
      tema,
    }),
    [
      casos,
      sesion,
      comprobandoSesion,
      errorSesion,
      entrar,
      salir,
      actualizarNombre,
      resumenCompra,
      cargandoCompra,
      errorCompra,
      resumenPendientes,
      cargandoPendientes,
      errorPendientes,
      recargar,
      nav,
      tema,
    ],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export const useApp = (): Contexto => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera de <AppProvider>')
  return c
}
