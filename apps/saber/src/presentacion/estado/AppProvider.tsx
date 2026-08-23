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
import type { Conocimiento } from '../../dominio/modelo'
import type { Sesion } from '../../dominio/contratos'
import { useNavegacion } from './useNavegacion'
import { useTema } from './useTema'
import { useGaleria } from './useGaleria'
import type { Dialogo, Simulacion } from './rutas'

const VACIO: Instantanea = { temas: [] }

/**
 * Único punto de contacto de la interfaz con la aplicación.
 *
 * `datos` es solo los temas: la lista cerrada de categorías, pequeña por
 * diseño, que las tres pantallas necesitan entera. Los conocimientos **no**
 * viven en un array cargado una vez — se piden siempre filtrados, contra la
 * consulta, así que cada pantalla que los necesita los pide por su cuenta:
 *
 * - `resumen` son los últimos apuntados y el total, para Inicio.
 * - El catálogo (`Conocimientos.tsx`) pide su propio listado filtrado.
 * - La ficha (`Ficha.tsx`) pide un conocimiento suelto.
 *
 * `versionConocimientos` sube cada vez que una acción crea, edita o borra un
 * conocimiento —o borra un tema, que se los lleva por delante—: es la señal
 * que usan esas pantallas para volver a pedir lo que tenían pedido.
 */
type Contexto = {
  casos: CasosDeUso
  sesion: Sesion | null
  comprobandoSesion: boolean
  entrar: (email: string, contrasena: string) => Promise<void>
  salir: () => Promise<void>
  actualizarNombre: (nombre: string) => Promise<void>

  datos: Instantanea
  cargando: boolean
  error: string | null
  acciones: Acciones

  resumen: { ultimos: Conocimiento[]; total: number } | null
  cargandoResumen: boolean
  errorResumen: string | null

  /** Sube en cada alta, edición o borrado de un conocimiento (o de un tema). */
  versionConocimientos: number

  /** El título de la ficha abierta, para la cabecera. Lo rellena `Ficha.tsx` al cargar. */
  tituloFicha: string
  setTituloFicha: (v: string) => void

  nav: ReturnType<typeof useNavegacion>
  tema: ReturnType<typeof useTema>
  galeria: ReturnType<typeof useGaleria>

  q: string
  setQ: (v: string) => void
  temaFiltro: string | null
  setTemaFiltro: (v: string | null) => void
  soloMio: boolean
  setSoloMio: (v: boolean) => void

  dlg: Dialogo | null
  setDlg: (d: Dialogo | null) => void
  visor: Visor | null
  setVisor: (v: Visor | null) => void
  sim: Simulacion
  setSim: (s: Simulacion) => void
}

/** Lleva el título consigo: la ficha ya lo tiene cargado, así el visor no necesita ir a buscarlo. */
export type Visor = { conocimientoId: string; fotoId: string; titulo: string }

type Acciones = Pick<
  CasosDeUso,
  'crearConocimiento' | 'editarConocimiento' | 'borrarConocimiento' | 'crearTema' | 'borrarTema'
> & {
  renombrarTema: CasosDeUso['renombrarTema']
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

  const [datos, setDatos] = useState<Instantanea>(VACIO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [resumen, setResumen] = useState<{ ultimos: Conocimiento[]; total: number } | null>(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [errorResumen, setErrorResumen] = useState<string | null>(null)

  const [versionConocimientos, setVersionConocimientos] = useState(0)
  const [tituloFicha, setTituloFicha] = useState('')

  const [q, setQ] = useState('')
  const [temaFiltro, setTemaFiltro] = useState<string | null>(null)
  const [soloMio, setSoloMio] = useState(false)
  const [dlg, setDlg] = useState<Dialogo | null>(null)
  const [visor, setVisor] = useState<Visor | null>(null)
  const [sim, setSim] = useState<Simulacion>(null)

  const nav = useNavegacion()
  const tema = useTema()
  const galeria = useGaleria(casos)
  const { recargar: recargarGaleria, olvidar: olvidarGaleria } = galeria

  const recargarTemas = useCallback(async () => {
    setCargando(true)
    try {
      setDatos(await casos.cargarTemas())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se han podido cargar los temas.')
    } finally {
      setCargando(false)
    }
  }, [casos])

  const recargarResumen = useCallback(async () => {
    setCargandoResumen(true)
    try {
      const [ultimos, total] = await Promise.all([
        casos.cargarUltimosConocimientos(3),
        casos.contarConocimientos(),
      ])
      setResumen({ ultimos, total })
      setErrorResumen(null)
    } catch (e) {
      setErrorResumen(e instanceof Error ? e.message : 'No se ha podido cargar el resumen.')
    } finally {
      setCargandoResumen(false)
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
    if (sesion) {
      void recargarTemas()
      void recargarResumen()
      void recargarGaleria()
    } else {
      setDatos(VACIO)
      setResumen(null)
      olvidarGaleria()
    }
  }, [sesion, recargarTemas, recargarResumen, recargarGaleria, olvidarGaleria])

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

  const acciones = useMemo<Acciones>(() => {
    /** Envuelve un caso de uso de temas para que la lista quede al día. */
    const trasTema =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const r = await fn(...args)
        await recargarTemas()
        return r
      }

    /**
     * Envuelve un caso de uso de conocimientos: no hay un array que
     * recargar —lo pide cada pantalla—, así que solo sube la versión, para
     * que el catálogo y la ficha vuelvan a preguntar, y se refresca Inicio.
     */
    const trasConocimiento =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A): Promise<R> => {
        const r = await fn(...args)
        setVersionConocimientos((v) => v + 1)
        await recargarResumen()
        return r
      }

    return {
      crearConocimiento: trasConocimiento(casos.crearConocimiento),
      editarConocimiento: trasConocimiento(casos.editarConocimiento),
      borrarConocimiento: trasConocimiento(casos.borrarConocimiento),
      crearTema: trasTema(casos.crearTema),
      renombrarTema: trasTema(casos.renombrarTema),
      // Borrar un tema se lleva sus conocimientos por delante (cascade): las
      // dos cosas quedan obsoletas a la vez.
      borrarTema: async (id: string) => {
        await casos.borrarTema(id)
        await recargarTemas()
        setVersionConocimientos((v) => v + 1)
        await recargarResumen()
      },
    }
  }, [casos, recargarTemas, recargarResumen])

  const valor = useMemo<Contexto>(
    () => ({
      casos,
      sesion,
      comprobandoSesion,
      entrar,
      salir,
      actualizarNombre,
      datos,
      cargando,
      error,
      acciones,
      resumen,
      cargandoResumen,
      errorResumen,
      versionConocimientos,
      tituloFicha,
      setTituloFicha,
      nav,
      tema,
      galeria,
      q,
      setQ,
      temaFiltro,
      setTemaFiltro,
      soloMio,
      setSoloMio,
      dlg,
      setDlg,
      visor,
      setVisor,
      sim,
      setSim,
    }),
    [
      casos,
      sesion,
      comprobandoSesion,
      entrar,
      salir,
      actualizarNombre,
      datos,
      cargando,
      error,
      acciones,
      resumen,
      cargandoResumen,
      errorResumen,
      versionConocimientos,
      tituloFicha,
      nav,
      tema,
      galeria,
      q,
      temaFiltro,
      soloMio,
      dlg,
      visor,
      sim,
    ],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export const useApp = (): Contexto => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera de <AppProvider>')
  return c
}
