// Publica en Instagram lo que el calendario tiene para hoy (o para FECHA) en la FRANJA indicada.
// Lo corre el workflow .github/workflows/publicar-instagram.yml dos veces por día.
//
//   node marketing/instagram/publicar.mjs --verificar   revisa el calendario y los archivos, sin publicar
//
// Variables de entorno:
//   IG_USER_ID, IG_ACCESS_TOKEN   cuenta y token de la API de Instagram (secretos de GitHub)
//   FRANJA                        mediodia | noche
//   FECHA                         AAAA-MM-DD (vacío = hoy en Argentina)
//   PRUEBA                        "true" = muestra lo que haría, sin publicar
//   SOLO                          id de una publicación (para volver a intentar una sola)
//   BASE_MEDIOS                   URL pública de la raíz del repo (por defecto, GitHub raw del commit actual)
import { readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://graph.facebook.com/v23.0';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const calendario = JSON.parse(readFileSync(path.join(RAIZ, 'marketing/instagram/calendario.json'), 'utf8'));
const log = (...a) => console.log('[instagram]', ...a);

// ---------- verificación (no necesita credenciales) ----------
function medidasPng(archivo) {
  const fd = openSync(archivo, 'r');
  const buf = Buffer.alloc(24);
  readSync(fd, buf, 0, 24, 0);
  closeSync(fd);
  return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
}

function verificar() {
  const errores = [];
  const vistos = new Set();
  for (const p of calendario.publicaciones) {
    const donde = `${p.id} (${p.fecha})`;
    if (vistos.has(p.id)) errores.push(`${donde}: id repetido`);
    vistos.add(p.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) errores.push(`${donde}: fecha inválida`);
    if (!calendario.franjas[p.franja]) errores.push(`${donde}: franja desconocida "${p.franja}"`);
    if (!['imagen', 'carrusel', 'reel', 'historia', 'historias'].includes(p.tipo)) errores.push(`${donde}: tipo desconocido`);
    if (p.tipo === 'carrusel' && (p.archivos.length < 2 || p.archivos.length > 10)) errores.push(`${donde}: un carrusel lleva de 2 a 10 imágenes`);
    if (p.descripcion) {
      if (p.descripcion.length > 2200) errores.push(`${donde}: la descripción supera 2200 caracteres`);
      const etiquetas = p.descripcion.match(/#[\p{L}\p{N}_]+/gu) ?? [];
      if (etiquetas.length > 5) errores.push(`${donde}: ${etiquetas.length} hashtags (Instagram permite 5)`);
    } else if (['imagen', 'carrusel', 'reel'].includes(p.tipo)) {
      errores.push(`${donde}: falta la descripción`);
    }
    for (const a of p.archivos) {
      const ruta = path.join(RAIZ, a);
      if (!existsSync(ruta)) { errores.push(`${donde}: no existe ${a}`); continue; }
      if (a.endsWith('.png')) {
        const { ancho, alto } = medidasPng(ruta);
        const historia = p.tipo.startsWith('historia');
        const ok = historia ? ancho === 1080 && alto === 1920 : ancho === 1080 && alto <= 1350 && alto >= 566;
        if (!ok) errores.push(`${donde}: ${a} mide ${ancho}×${alto}`);
      }
    }
  }
  const auto = calendario.publicaciones.filter((p) => p.modo === 'auto').length;
  log(`${calendario.publicaciones.length} publicaciones (${auto} automáticas, ${calendario.publicaciones.length - auto} manuales)`);
  if (errores.length) { errores.forEach((e) => console.error('  ✗', e)); process.exit(1); }
  log('calendario OK');
}

if (process.argv.includes('--verificar')) { verificar(); process.exit(0); }

// ---------- publicación ----------
const { IG_USER_ID, IG_ACCESS_TOKEN, FRANJA = 'noche', SOLO, GITHUB_REPOSITORY, GITHUB_SHA } = process.env;
const PRUEBA = process.env.PRUEBA === 'true';
const hoyArgentina = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const FECHA = process.env.FECHA || hoyArgentina;
const BASE_MEDIOS = process.env.BASE_MEDIOS
  || (GITHUB_REPOSITORY && GITHUB_SHA ? `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_SHA}` : null);

const pendientes = calendario.publicaciones.filter((p) =>
  p.modo === 'auto' && (SOLO ? p.id === SOLO : p.fecha === FECHA && p.franja === FRANJA));

if (!pendientes.length) { log(`nada para publicar el ${FECHA} (${FRANJA})`); process.exit(0); }
if (!PRUEBA && (!IG_USER_ID || !IG_ACCESS_TOKEN)) {
  log('faltan IG_USER_ID / IG_ACCESS_TOKEN en los secretos del repositorio: no se publica nada.');
  process.exit(0);
}
if (!BASE_MEDIOS) { console.error('falta BASE_MEDIOS (URL pública de los archivos)'); process.exit(1); }

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(metodo, ruta, params = {}) {
  const url = new URL(API + ruta);
  const cuerpo = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const respuesta = metodo === 'GET'
    ? await fetch(`${url}?${cuerpo}`)
    : await fetch(url, { method: 'POST', body: cuerpo });
  const datos = await respuesta.json();
  if (!respuesta.ok || datos.error) throw new Error(`${metodo} ${ruta}: ${datos.error?.message ?? respuesta.status}`);
  return datos;
}

/** Espera a que Instagram termine de procesar el contenedor (los videos tardan). */
async function listo(id) {
  for (let i = 0; i < 60; i++) {
    const { status_code: estado } = await api('GET', `/${id}`, { fields: 'status_code' });
    if (estado === 'FINISHED') return;
    if (estado === 'ERROR' || estado === 'EXPIRED') throw new Error(`el contenedor ${id} quedó en ${estado}`);
    await espera(5000);
  }
  throw new Error(`el contenedor ${id} no terminó de procesarse`);
}

const url = (archivo) => `${BASE_MEDIOS}/${archivo.split('/').map(encodeURIComponent).join('/')}`;
const esVideo = (archivo) => archivo.endsWith('.mp4');
const medio = (archivo) => (esVideo(archivo) ? { video_url: url(archivo) } : { image_url: url(archivo) });

async function publicarContenedor(params) {
  const { id } = await api('POST', `/${IG_USER_ID}/media`, params);
  await listo(id);
  const publicado = await api('POST', `/${IG_USER_ID}/media_publish`, { creation_id: id });
  return publicado.id;
}

/** Evita duplicar un posteo si el workflow se vuelve a correr el mismo día. */
async function yaPublicado(p) {
  if (!p.descripcion) return false;
  const { data = [] } = await api('GET', `/${IG_USER_ID}/media`, { fields: 'caption,timestamp', limit: '15' });
  const inicio = p.descripcion.slice(0, 80);
  const haceTresDias = Date.now() - 3 * 24 * 3600 * 1000;
  return data.some((m) => m.caption?.startsWith(inicio) && Date.parse(m.timestamp) > haceTresDias);
}

async function publicar(p) {
  if (await yaPublicado(p)) { log(`${p.id}: ya estaba publicado, se saltea`); return; }
  if (p.tipo === 'imagen') {
    return log(`${p.id}: publicado ${await publicarContenedor({ ...medio(p.archivos[0]), caption: p.descripcion })}`);
  }
  if (p.tipo === 'reel') {
    return log(`${p.id}: publicado ${await publicarContenedor({ media_type: 'REELS', video_url: url(p.archivos[0]), caption: p.descripcion, share_to_feed: 'true' })}`);
  }
  if (p.tipo === 'carrusel') {
    const hijos = [];
    for (const a of p.archivos) {
      const { id } = await api('POST', `/${IG_USER_ID}/media`, { ...medio(a), is_carousel_item: 'true', ...(esVideo(a) ? { media_type: 'VIDEO' } : {}) });
      hijos.push(id);
    }
    for (const id of hijos) await listo(id);
    return log(`${p.id}: publicado ${await publicarContenedor({ media_type: 'CAROUSEL', children: hijos.join(','), caption: p.descripcion })}`);
  }
  // historia / historias: una por archivo, en orden.
  for (const a of p.archivos) {
    log(`${p.id}: historia ${await publicarContenedor({ media_type: 'STORIES', ...medio(a) })}`);
  }
}

let fallas = 0;
for (const p of pendientes) {
  log(`${PRUEBA ? '[prueba] ' : ''}${p.id}: ${p.titulo} (${p.tipo}, ${p.archivos.length} archivo/s)`);
  if (PRUEBA) { p.archivos.forEach((a) => log('   ', url(a))); continue; }
  try { await publicar(p); } catch (e) { fallas++; console.error(`[instagram] ${p.id}: ${e.message}`); }
}
if (fallas) process.exit(1);
