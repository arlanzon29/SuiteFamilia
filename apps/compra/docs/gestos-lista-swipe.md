# Gestos de la lista de la compra: swipe-to-delete + tacto Android

Cómo quedó montado el gesto de deslizar en el detalle de lista
([`../src/presentacion/pantallas/DetalleLista.tsx`](../src/presentacion/pantallas/DetalleLista.tsx))
y el resto de efectos de scroll que lo acompañan, para poder replicarlo en
otra lista (candidata clara: la de Pendientes) sin tener que releer el
archivo entero ni redescubrir los mismos tropiezos.

Todo usa **`framer-motion`** (dependencia añadida a `apps/compra/package.json`
para esto).

Se construyó primero como una pantalla clon (`listaPrueba`), sin tocar la
real, para poder probar en el móvil sin riesgo. Cuando quedó bien, se
promovió a `DetalleLista.tsx` y el clon se borró. Si se replica en otra app,
merece la pena repetir ese mismo paso: clonar la pantalla, cablear una ruta
de prueba temporal con un acceso desde Ajustes, probar en el móvil, y solo
entonces fundir el resultado en la pantalla real.

**Dónde está aplicado, además del detalle de lista:**

- **Catálogo** (`Catalogo.tsx`, esta misma app): swipe horizontal completo
  (§1) con lápiz en vez de papelera —edita en vez de borrar—, más los
  efectos de scroll vertical (§3-5). Sin la animación de colapso al borrar
  (§2): el catálogo no borra artículos desde la fila.
- **Pendientes** (`apps/pendientes`, app aparte): solo los efectos de scroll
  vertical (§3-5) en la lista de pendientes, **sin** swipe horizontal — ahí
  no hay ninguna acción de fila que revelar.
- **Saber** (`apps/saber`, app aparte): scroll vertical completo (§3-5) más
  la entrada escalonada (§2, sin la parte de borrado) en la lista de
  conocimientos, tampoco con swipe horizontal.

En Pendientes y Saber, el hook `useEstiramiento` se copió tal cual (es
genérico, no depende de nada de la app de origen); el resto —`overscroll-
behavior`, sombra de cabecera— se repitió a mano porque cada app tiene su
propio `App.tsx` y `Cabecera.tsx`.

---

## 1. Swipe-to-delete en cada fila

**Qué hace:** deslizar la fila hacia la izquierda revela un botón «Eliminar»
(papelera) que estaba oculto detrás; soltar antes de tiempo la devuelve a su
sitio con un muelle, soltar pasado el umbral (o con velocidad, aunque el
recorrido sea corto) la deja abierta.

### 1.1 — La fila arrastrable

```tsx
const x = useMotionValue(0)

const onDragEnd = (_e, info: PanInfo) => {
  const abrir = info.offset.x < -40 || info.velocity.x < -400
  animate(x, abrir ? -80 : 0, MUELLE)
  onAbrir(abrir ? it.artId : null)
}

<motion.div
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  dragElastic={0.06}
  dragMomentum={false}
  onDragEnd={onDragEnd}
  style={{ x, position: 'relative', touchAction: 'pan-y' }}
>
  {/* fila normal */}
</motion.div>
```

`80` es el ancho del botón de eliminar; `-40` es la mitad (umbral de
apertura), `-400` es la velocidad de fling en px/s por debajo de la cual se
considera «gesto rápido» aunque el recorrido no llegue a 40px. Ajustar estos
tres números al gusto sin tocar el resto.

### 1.2 — Por qué NO usar la prop `animate` atada a estado

El primer intento controlaba la posición con `animate={{ x: abierto ===
it.artId ? -80 : 0 }}` en vez de un `useMotionValue` propio. **Se rompía**:
si el gesto terminaba en el mismo lado en el que ya estaba (p. ej. sueltas
antes de cruzar el umbral y la fila ya estaba cerrada), el estado de React
no cambiaba, no había re-render, y `animate` nunca disparaba la animación de
vuelta — la fila se quedaba exactamente donde la soltaste, a medias.

La solución: un `useMotionValue` propio de cada fila, y una llamada
**explícita e incondicional** a `animate(x, …)` dentro de `onDragEnd`. Así el
muelle se dispara siempre, sueltes donde sueltes, sin depender de que el
estado cambie.

Como consecuencia, **cada fila necesita su propio componente** (no puede
vivir inline dentro de un `.map()`), porque `useMotionValue` es un hook y
las reglas de hooks no permiten llamarlo dentro de un callback de `.map()`.
Ver `FilaArticulo` en `DetalleLista.tsx`.

Cuando otra fila se abre (o esta se cierra desde fuera, p. ej. al borrar), lo
que cambia es la prop `abierta: boolean`; un `useEffect` la escucha y anima
de vuelta a 0 si ya no es la abierta:

```tsx
useEffect(() => {
  if (!abierta) animate(x, 0, MUELLE)
}, [abierta, x])
```

### 1.3 — El botón de abajo se veía siempre (bug de apilamiento)

El botón «Eliminar» es `position: absolute` (para quedar oculto detrás de la
fila, dentro de un contenedor `overflow: hidden`). **Sin más**, se pintaba
**por encima** de la fila normal, en vez de detrás, así que se veía todo el
rato en vez de solo al deslizar.

La causa: en CSS, dentro del mismo contexto de apilamiento, los elementos
`position: absolute`/`relative` con `z-index: auto` se pintan **después**
(por tanto encima) de los elementos sin posicionar, **sin importar el orden
en el HTML**. El botón, aunque va primero en el DOM, ganaba porque estaba
posicionado y la fila no.

La solución es poner `position: relative` (sin más, sin z-index) también en
la fila. Con los dos elementos posicionados, gana el orden del DOM, y la
fila —que va después— tapa al botón.

```tsx
<div style={{ position: 'relative', overflow: 'hidden' }}>  {/* contenedor */}
  <button style={{ position: 'absolute', right: 0, width: 80, ... }}>
    <IconoBorrar />
  </button>
  <motion.div style={{ position: 'relative', /* ... */ }}>
    {/* fila */}
  </motion.div>
</div>
```

### 1.4 — El botón «+» de añadir dejó de funcionar en la pantalla clon

No es un bug del swipe: `PanelAnadir.tsx` decidía si mostrarse mirando la
ruta actual (`nav.ruta.n === 'lista'`). La pantalla clon usaba otra ruta
(`listaPrueba`), así que el panel se auto-cerraba. Si se clona una pantalla
que dependa de una ruta concreta para algo, hay que localizar **todos** los
sitios que miran esa ruta (`Cabecera.tsx` también lo hace, para el menú de
«Dictar»/«Cerrar lista») y decidir si el clon la necesita también.

---

## 2. Animación al borrar (colapso de la fila)

Al quitar un artículo, la fila se encoge de alto en vez de desaparecer de
golpe, y las de abajo se deslizan para cerrar el hueco.

```tsx
<AnimatePresence>
  {items.map((it, indice) => (
    <FilaArticulo key={it.artId} indice={indice} ... />
  ))}
</AnimatePresence>

// dentro de FilaArticulo, el contenedor de fuera:
<motion.div
  layout
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto', transition: { delay: indice * 0.035, ...MUELLE } }}
  exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
  style={{ overflow: 'hidden' }}
>
```

Piezas necesarias, las tres a la vez:

- **`key` estable** (`it.artId`) en cada fila: `AnimatePresence` lo necesita
  para saber qué entró/salió entre renders.
- **`AnimatePresence`** envolviendo el `.map()`: sin él, React desmonta el
  elemento al instante y `exit` nunca llega a jugar.
- **`layout`** en cada fila: hace que las filas que se quedan reposicionen
  suavemente (técnica FLIP) cuando una vecina cambia de tamaño, en vez de
  saltar de golpe a su nueva posición.
- **`height: 'auto'`** en `animate`/`exit`: framer-motion sabe interpolar
  hacia/desde `'auto'` para alto (no funciona así con la mayoría de props),
  así que no hace falta medir el alto real de la fila a mano.

El mismo bloque `animate` trae también la **entrada escalonada**: al montar
la lista, cada fila empieza a `height: 0, opacity: 0` y crece con un retraso
de `indice * 0.035` segundos respecto a la anterior — el «item animator» de
un `RecyclerView` de Android.

---

## 3. Pull-to-refresh nativo interceptado

**El problema:** en el móvil, al llegar al principio del scroll y seguir
arrastrando hacia abajo, Chrome/la PWA interpreta el gesto como «refrescar la
página» — molesto cuando lo que se quería era simplemente seguir con el
swipe o el estiramiento propios.

**La solución**, una sola línea en el contenedor de scroll:

```tsx
<div style={{ overflowY: 'auto', overscrollBehaviorY: 'contain' }}>
```

`contain` corta el «scroll chaining»: cuando el `div` llega a su tope y se
sigue arrastrando, el gesto se queda contenido ahí y no se propaga al
documento, así que el navegador ya no lo interpreta como refrescar.

Importante: esto **no** desactiva el gesto, solo evita que se escape del
contenedor. El estiramiento del §4 sigue funcionando encima.

---

## 4. Estiramiento (overscroll) con resistencia

**Qué hace:** al arrastrar más allá del principio o el final de la lista, el
contenido se estira un poco con resistencia creciente, y vuelve con un
muelle al soltar — en vez de parar en seco o (peor) disparar el
pull-to-refresh del §3.

No hay una API web estándar para esto (el "stretch" de Android 12+ es del
sistema operativo, no del navegador), así que se hizo a mano con
`TouchEvent`s nativos + un `useMotionValue`, en un hook reutilizable
(`useEstiramiento`, en `App.tsx`):

```tsx
const useEstiramiento = (ref: RefObject<HTMLDivElement | null>, activo: boolean) => {
  const y = useMotionValue(0)
  useEffect(() => {
    const el = ref.current
    if (!el || !activo) return
    let inicioY = 0
    let arrastrando = false

    const alMover = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - inicioY
      const enTope = el.scrollTop <= 0
      const enFondo = el.scrollTop >= el.scrollHeight - el.clientHeight - 1
      if (!arrastrando) {
        if (delta > 0 && enTope) arrastrando = true
        else if (delta < 0 && enFondo) arrastrando = true
        else return
      }
      e.preventDefault()
      const resistido = Math.sign(delta) * Math.sqrt(Math.abs(delta)) * 3.5
      y.set(Math.max(-40, Math.min(40, resistido)))
    }
    // ... touchstart guarda inicioY, touchend/touchcancel animan y -> 0
  }, [ref, activo, y])
  return y
}

// en el contenedor de scroll, SIN envolver <Pantalla> entera (ver §8:
// el botón flotante que vive dentro de cada pantalla necesita quedar
// fuera de este `motion.div`):
<Pantalla ruta={ruta} estiramiento={estiramiento} />
```

Puntos a no perder al replicarlo:

- El `motion.div` con `style={{ y }}` **envuelve el contenido**, no el
  contenedor de scroll (ese sigue siendo un `div` normal con
  `overflowY: 'auto'`) — si no, se pierde el scroll nativo.
- La resistencia usa **raíz cuadrada** del desplazamiento, no una proporción
  fija: cuanto más se tira, más cuesta seguir estirando. Con proporción fija
  se siente como que "no frena".
- Solo se activa (`arrastrando = true`) si el gesto empieza **en el borde
  exacto** (`scrollTop <= 0` o al final) — el resto del scroll lo sigue
  llevando el navegador, este hook no interfiere.
- `e.preventDefault()` solo se llama **una vez decidido que se estira** —
  llamarlo siempre rompería el scroll normal.

---

## 5. Sombra bajo la cabecera al hacer scroll

Efecto más simple: la cabecera es fija y no tenía forma de saber si el
contenido estaba desplazado. Se añade un `onScroll` en el contenedor de
scroll que guarda un booleano, y se lo pasa a `Cabecera.tsx` como prop:

```tsx
const [scrolled, setScrolled] = useState(false)
// ...
<Cabecera {...tituloDe(nav.ruta, datos)} elevada={conGestos && scrolled} />
<div onScroll={(e) => { if (conGestos) setScrolled(e.currentTarget.scrollTop > 4) }} ...>
```

Y en `Cabecera.tsx`, un `boxShadow: elevada ? 'var(--shadow-sm)' : 'none'`
con una transición corta. El umbral de 4px (no 0) evita parpadeos por
rebotes mínimos del scroll.

---

## 6. Qué se quitó de paso

Los botones **+/−** de cantidad (columna de 46px a la derecha del nombre) se
quitaron de la fila: con «Eliminar» ya al alcance del swipe, dejaron de
usarse. La cantidad se sigue viendo (bajo el nombre), pero ya no es
editable ahí. Si en Pendientes (o donde sea que se replique esto) el control
de cantidad artículo a artículo todavía se usa, **no** quitarlo sin más — fue
una decisión específica de esta lista, no parte del patrón de swipe.

---

## 7. El botón flotante se movía con el estiramiento (bug, ya arreglado)

**El problema:** el `motion.div style={{ y: estiramiento }}` del §4 envolvía
`<Pantalla ruta={...} />` entera, en `App.tsx`. Pero cada pantalla (detalle
de lista, catálogo…) renderiza **dentro de sí misma** tanto la lista como el
botón flotante de «Añadir» (`position: absolute`, anclado a `.marco-app` —
ver el comentario junto a ese botón). El botón acabó **dentro** del
`motion.div`.

Cualquier elemento con `transform` distinto de `none` —aunque sea
`translateY(0px)`, en reposo— se convierte en el **containing block** de sus
descendientes `position: absolute`/`fixed`, sin importar cuánto se mueva ese
transform. `framer-motion` aplica `transform: translateY(...)` en cuanto se
liga un `motion value` al `style.y`, así que el botón dejó de anclarse a
`.marco-app` y pasó a anclarse a ese `motion.div` — que además vive **dentro**
del contenedor con scroll, así que el botón, que debía quedarse fijo al
hacer scroll, empezó a moverse con el contenido y con el propio estiramiento.

**La solución:** el `motion.div` del estiramiento no puede envolver nada que
contenga un `position: absolute` anclado más arriba. Se movió el `motion.div`
**dentro** de cada pantalla, envolviendo todo **menos** el botón flotante:

```tsx
// App.tsx: ya no envuelve <Pantalla>, solo le pasa el motion value
<Pantalla ruta={nav.ruta} estiramiento={estiramiento} />

// dentro de la propia pantalla (DetalleLista.tsx, Catalogo.tsx, ...):
return (
  <div>
    <motion.div style={{ y: estiramiento }}>
      {/* toda la lista, cabeceras de búsqueda, avisos... */}
    </motion.div>

    {/* el botón flotante, FUERA del motion.div */}
    <button style={{ position: 'absolute', ... }}>...</button>
  </div>
)
```

Como el `<div>` de fuera no tiene `position` ni `transform` propios, el
botón vuelve a encontrar `.marco-app` como su containing block, igual que
antes de que existiera el estiramiento.

Si la pantalla usaba el `<div>` de fuera para el `padding`/`flex` del
layout (caso de `Pendientes.tsx`), ese estilo se traslada al `motion.div`
de dentro — el `<div>` de fuera se queda sin estilo propio, solo de
contenedor.

---

## 8. Checklist para replicarlo en otra lista

1. Añadir `framer-motion` al `package.json` de esa app, si no está.
2. Si además lleva swipe horizontal (no todas lo necesitan): clonar la
   pantalla real, cablear una ruta y un acceso de prueba temporal (ruta
   separada + botón en Ajustes), probar en el móvil primero.
3. Extraer cada fila a su propio componente si hay swipe (necesario por el
   `useMotionValue` — no puede vivir inline en el `.map()`).
4. Swipe: `useMotionValue` + `drag="x"` + `dragConstraints` +
   `onDragEnd` con `animate()` explícito e incondicional (§1.2). No usar la
   prop `animate` atada a estado.
5. `position: relative` en la fila arrastrable si hay algo `position:
   absolute` detrás que deba quedar tapado (§1.3).
6. Revisar qué otros componentes miran la ruta de la pantalla clonada
   (§1.4) — paneles, cabecera, lo que sea que dependa de `nav.ruta.n`.
7. `AnimatePresence` + `layout` + `key` estable + `height: 'auto'` para la
   animación de borrado/entrada (§2) — vale también solo para la entrada,
   sin borrado (caso de Conocimientos en Saber).
8. `overscroll-behavior-y: contain` en el contenedor de scroll (§3).
9. El hook `useEstiramiento` es genérico — se copia tal cual a la nueva
   app y se le pasa el `ref` del contenedor de scroll de la pantalla nueva
   (§4). **No** envolver `<Pantalla>` entera con el `motion.div` del
   estiramiento — pasar el `motion value` como prop hasta la pantalla en
   cuestión, y que sea ELLA quien envuelva su contenido sin el botón
   flotante (§7). Es el paso que más fácil se olvida.
10. Sombra de cabecera: mismo patrón de `onScroll` + prop `elevada` (§5).
11. Cuando quede bien: fundir el clon en la pantalla real, borrar la ruta y
    el acceso de prueba, y quitar los condicionales de ruta que ya no hagan
    falta (dejarlos activos siempre, en vez de solo para la ruta de prueba).
