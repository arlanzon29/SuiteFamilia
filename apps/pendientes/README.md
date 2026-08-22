# Pendientes

Lo que la casa tiene a medias, apuntado antes de que se olvide: la caldera sin
revisar, el filtro del extractor, la cita de la ITV.

Es una de las aplicaciones de [SuiteFamilia](../../README.md): comparte con las
demás el proyecto de Supabase, y por tanto las cuentas y la sesión.

Un pendiente tiene **cuatro campos y ni uno más** —título, comentario largo,
fecha de creación y fecha de realización—. Sin prioridades, sin etiquetas, sin
personas asignadas: lo que ordena la lista es la antigüedad.

---

## Arrancar

Desde la **raíz de la suite**, que es donde vive el `.env` compartido:

```bash
npm install --prefix apps/pendientes
```

```bash
npm run dev:pendientes
```

Abre <http://localhost:5174>. Está pensada para móvil: en el navegador de
escritorio, ponlo en vista de dispositivo a **375×812**.

**Hoy los datos son de mentira.** La aplicación corre contra repositorios en
memoria con una semilla de ejemplo: se entra con cualquier correo que lleve `@`
y cualquier contraseña, y lo que se escriba se pierde al recargar. Los
repositorios de Supabase son el paso siguiente.

---

## Cómo está hecha

Arquitectura limpia, cuatro capas, dependencias hacia dentro, todo en español.
Es la forma de [`apps/compra`](../compra/), que es el modelo de la suite; la
referencia larga está en [`../compra/docs/arquitectura.md`](../compra/docs/arquitectura.md).

Una diferencia con la compra: las interfaces del dominio van en
`src/dominio/contratos/`, no en `puertos/`. El porqué está en
[`../../docs/como-se-escriben-las-aplicaciones.md`](../../docs/como-se-escriben-las-aplicaciones.md).

Lo que hay hecho, lo que falta y lo que hay que comprobar antes de darlo por
bueno: [`docs/estado-del-proyecto.md`](docs/estado-del-proyecto.md).
