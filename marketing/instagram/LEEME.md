# Publicación automática en Instagram

El workflow `.github/workflows/publicar-instagram.yml` corre todos los días a las **12:00 y a las 19:00** (hora argentina) y publica en @gridplay.app lo que `calendario.json` marca con `"modo": "auto"` para esa fecha y franja. Lo que está en `"modo": "manual"` lo publicás vos: los reels, para sumarles música, y las historias con stickers (encuestas, preguntas o enlace), porque la API no permite ninguna de esas dos cosas.

Mientras no cargues los secretos, el workflow corre igual pero no publica nada.

## Puesta en marcha (una sola vez, unos 20 minutos)

1. **Instagram profesional.** En la app: Configuración → Tipo de cuenta y herramientas → *Cambiar a cuenta profesional* → **Empresa**.
2. **Página de Facebook.** Creá la página "GridPlay" y vinculala a la cuenta de Instagram (Configuración de la página → Cuentas vinculadas → Instagram).
3. **App de Meta.** En <https://developers.facebook.com/apps> → *Crear app* → tipo **Empresa**. Le podés poner "GridPlay publicador". No hace falta publicarla: alcanza con que vos seas administrador.
4. **Token corto.** Abrí el [Explorador de la API Graph](https://developers.facebook.com/tools/explorer/), elegí tu app y agregá estos permisos: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` y `business_management`. Tocá **Generate Access Token** y aceptá.
5. **Credenciales definitivas.** En la app de Meta, *Configuración → Básica*, copiá el **identificador de la app** y la **clave secreta**. Después, en una terminal, desde la carpeta del proyecto:
   ```powershell
   $env:META_APP_ID="..."; $env:META_APP_SECRET="..."; $env:TOKEN_CORTO="..."; node marketing/instagram/obtener-credenciales.mjs
   ```
   El script te muestra `IG_USER_ID` e `IG_ACCESS_TOKEN`. Ese token de página no vence.
6. **Secretos de GitHub.** En el repositorio: *Settings → Secrets and variables → Actions → New repository secret*. Creá `IG_USER_ID` e `IG_ACCESS_TOKEN` con esos valores.
7. **Prueba.** *Actions → Publicar en Instagram → Run workflow* con "Solo mostrar" marcado: muestra qué publicaría sin publicar nada.

## Cambiar el calendario

- Editá `calendario.json`: `fecha`, `franja` (`mediodia` o `noche`), `descripcion` (máximo 5 hashtags) y `archivos` (rutas desde la raíz del repo).
- Antes de subir los cambios, corré `node marketing/instagram/publicar.mjs --verificar`.
- Para volver a intentar una sola publicación: *Run workflow* → `solo` = el `id`, con "Solo mostrar" desmarcado. Si la publicación ya está en Instagram, el script la saltea para no duplicarla.

## Límites que conviene saber

- GitHub puede demorar las ejecuciones programadas entre 5 y 30 minutos.
- GitHub apaga los workflows programados después de 60 días sin commits en el repo.
- Las imágenes se toman de GitHub (el repositorio es público), así que cualquiera puede verlas, igual que en Instagram.
