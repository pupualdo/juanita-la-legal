# Prompt para Claude Code en desktop

Pega este texto en Claude Code (o copialo a un archivo y pídele a Claude que lo lea) cuando estés en tu PC. Es autocontenido — Claude no necesita más contexto.

---

## TEXTO DEL PROMPT (copia desde aquí)

Hola Claude. En una sesión anterior desde el celu trabajamos en la rama `claude/setup-agent-memory-mxPh8` haciendo varias mejoras de UX al proyecto Juanita La Legal. Hay un PR abierto: el #2 en `pupualdo/juanita-la-legal`. Antes de avanzar con cosas nuevas, necesito verificar 4 cosas:

### 1. Lee el resumen de la sesión anterior

```bash
cat SESION-2026-05-09.md
```

Ahí está el detalle de los 13 commits, las decisiones de UX y los pendientes. Léelo entero antes de hacer cualquier otra cosa.

### 2. Verifica que el avatar y el fondo de biblioteca NO se hayan roto

Estos dos elementos visuales son críticos y ya estaban funcionando en producción. Mi mayor miedo es que el merge a master los rompa.

**Avatar (Juanita en círculo blanco arriba del título):**
- Debería estar en `public/juanita-avatar.jpg`
- Tamaño actual: ~22 KB (lo optimizamos desde 2.3 MB)
- Si por algún motivo está faltando, dímelo — yo lo tengo guardado en local
- Verifica abriendo `http://localhost:3000` después de `npm run dev` que la cara de Juanita aparezca en el hero

**Fondo de biblioteca (oscuro, difuso, detrás del avatar):**
- Es una imagen de Unsplash: `photo-1481627834876-b7833e8f5570`
- Carga vía URL directa (no está en `/public`)
- Para que funcione, el CSP en `next.config.ts` tiene que permitir `https://images.unsplash.com` en `img-src`. Verifica que esa línea esté así:
  ```ts
  `img-src 'self' data: blob: ${MP_DOMAIN} https://*.mercadolibre.com https://images.unsplash.com`,
  ```
- Si no está, el fondo se ve gris plano y hay que arreglarlo

### 3. Corre el dev server y abre la home

```bash
npm install   # por si hay deps nuevas (@vercel/analytics)
npm run dev
```

Abre `http://localhost:3000`. Quiero confirmar visualmente que TODO esto se ve bien antes de mergear:

- [ ] Hero con fondo de biblioteca oscuro difuso (NO gris plano)
- [ ] Avatar de Juanita en círculo con borde blanco
- [ ] Título "Juanita La Legal" tipografía serif
- [ ] Subtítulo verde "Te orientamos en buen chileno"
- [ ] Botón dorado "Iniciar consulta"
- [ ] Label "👇 Toca un tema para ver qué incluye y ejemplos de consultas"
- [ ] 10 chips clickeables más grandes que antes, con flecha "›" a la derecha
- [ ] Link "¿Qué es Juanita? ↓" debajo de los chips
- [ ] Al hacer scroll abajo: sección "¿Qué es Juanita?" con fondo crema y 4 tarjetas blancas
- [ ] Al tocar un chip: modal con "qué incluye", "ejemplos típicos", "importante"
- [ ] En el chat (después de iniciar consulta): mensajes con texto más grande (17px) y burbujas que ocupan casi todo el ancho

Reporta en checklist qué se ve bien y qué no.

### 4. Si algo está roto, arréglalo antes de avanzar

Tengo lista de pendientes en `SESION-2026-05-09.md`. NO empezar con esos hasta confirmar que la base visual está OK.

### Después de validar

Cuéntame qué viste y decidimos si:
- (a) Mergeamos el PR #2 a master (deploy automático a producción) y seguimos
- (b) Hay algo que arreglar primero
- (c) Quieres iterar más sobre el diseño antes de mergear

---

## FIN DEL PROMPT

Eso es lo que pegas. Una vez que Claude verifique todo, puedes pedirle lo siguiente que quieras hacer.

## Tip extra

Si quieres tener el prompt siempre a mano sin copiar/pegar, este archivo (`PROMPT-RETOMAR.md`) ya queda en el repo. En tu PC, simplemente:

```
cat PROMPT-RETOMAR.md   # para verlo
# o
claude   # luego: "lee PROMPT-RETOMAR.md y ejecuta lo que dice"
```
