// Helpers de las pantallas del jugador: reservar, "Mis reservas" y tarjetas de clubes.
// Las fechas viajan como "YYYY-MM-DD" y las horas como "HH:MM" (igual que en la base), siempre en hora local.
import { moneda, desdeISO, fechaISO } from '../pages/admin/lib/formato.js';

export { moneda };

const DIAS_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Momento de inicio de un turno como Date local. */
export const inicioDeTurno = (fecha, hora) => {
  const d = desdeISO(fecha);
  const [h, m] = String(hora).split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

export const yaEmpezo = (fecha, hora, ahora = new Date()) => inicioDeTurno(fecha, hora) <= ahora;

/** Lista de N días desde hoy: [{ fecha, corto: 'mié', numero: 30, mes: 'sep', etiqueta: 'Hoy' | 'Mañana' | null }] */
export const proximosDias = (cantidad = 14, desde = new Date()) => {
  const lista = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    lista.push({
      fecha: fechaISO(d),
      corto: DIAS_CORTO[d.getDay()],
      numero: d.getDate(),
      mes: MESES_CORTO[d.getMonth()],
      etiqueta: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : null,
    });
  }
  return lista;
};

/** "2026-09-30" -> "miércoles 30 de septiembre" (con "Hoy"/"Mañana" si corresponde). */
export const fechaLarga = (fecha, hoy = new Date()) => {
  const d = desdeISO(fecha);
  const base = `${DIAS_LARGO[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()]}`;
  const dif = Math.round((d - desdeISO(fechaISO(hoy))) / 86_400_000);
  if (dif === 0) return `Hoy, ${base}`;
  if (dif === 1) return `Mañana, ${base}`;
  return base.charAt(0).toUpperCase() + base.slice(1);
};

/** "2026-09-30" -> "mié 30 sep" (para barras angostas). */
export const fechaCorta = (fecha) => {
  const { semana, dia, mes } = partesDeFecha(fecha);
  return `${semana} ${dia} ${mes}`;
};

/** Partes para el "calendario" de una tarjeta: { dia: 30, mes: 'sep', semana: 'mié' }. */
export const partesDeFecha = (fecha) => {
  const d = desdeISO(fecha);
  return { dia: d.getDate(), mes: MESES_CORTO[d.getMonth()], semana: DIAS_CORTO[d.getDay()] };
};

/** "en 2 días", "mañana", "hoy a las 20:00", "hace 3 días" */
export const cuandoEs = (fecha, hora, ahora = new Date()) => {
  const dif = Math.round((desdeISO(fecha) - desdeISO(fechaISO(ahora))) / 86_400_000);
  if (dif === 0) return yaEmpezo(fecha, hora, ahora) ? 'Hoy' : `Hoy a las ${hora} hs`;
  if (dif === 1) return 'Mañana';
  if (dif > 1) return `En ${dif} días`;
  if (dif === -1) return 'Ayer';
  return `Hace ${-dif} días`;
};

/** Suma de los subtotales de los extras de un turno. */
export const totalExtras = (extras) =>
  (Array.isArray(extras) ? extras : []).reduce((suma, e) => suma + (Number(e?.subtotal) || 0), 0);

/** Total de un turno: precio congelado de la cancha + extras. */
export const totalDeTurno = (turno) => (Number(turno?.precio_final) || 0) + totalExtras(turno?.extras);

/** Total de extras según las cantidades elegidas: { [idProducto]: cantidad } */
export const totalSeleccion = (productos, cantidades) =>
  (productos || []).reduce((suma, p) => suma + (Number(p.precio) || 0) * (cantidades?.[p.id] || 0), 0);

/** Lista para el RPC: solo ids y cantidades (el servidor pone nombres y precios). */
export const extrasParaEnviar = (cantidades) =>
  Object.entries(cantidades || {}).map(([id, cantidad]) => ({ id: Number(id), cantidad: Number(cantidad) || 0 }));

/** Extras de un turno -> { [id]: cantidad } (para precargar el editor). */
export const cantidadesDesdeExtras = (extras) =>
  Object.fromEntries((Array.isArray(extras) ? extras : []).map((e) => [e.id, e.cantidad]));

/** Solo dígitos, para armar links de WhatsApp. */
export const soloDigitos = (telefono) => String(telefono || '').replace(/\D/g, '');

export const enlaceWhatsApp = (telefono, texto = '') => {
  const numero = soloDigitos(telefono);
  if (!numero) return null;
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
};

export const enlaceMapa = (club) => {
  const consulta = [club?.nombre, club?.direccion, club?.ciudad, club?.provincia].filter(Boolean).join(', ');
  return consulta ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}` : null;
};

const formatoGoogle = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

/** Link para agregar el turno (1 hora) a Google Calendar. */
export const enlaceCalendario = ({ fecha, hora, titulo, lugar }) => {
  const inicio = inicioDeTurno(fecha, hora);
  const fin = new Date(inicio.getTime() + 3_600_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${formatoGoogle(inicio)}/${formatoGoogle(fin)}`,
    ctz: 'America/Argentina/Cordoba',
    ...(lugar ? { location: lugar } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/** Precio "desde" de un club: el más barato de sus canchas activas (o el del club). 0 si no hay datos. */
export const precioDesde = (club) => {
  const precios = (club?.canchas || [])
    .filter((c) => c.activa !== false)
    .map((c) => Number(c.precio_hora) || 0)
    .filter((p) => p > 0);
  if (precios.length) return Math.min(...precios);
  return Number(club?.precio_hora) || 0;
};

/** Deportes distintos de un club (de sus canchas, o el del propio club). */
export const deportesDelClub = (club) => {
  const deDeCanchas = (club?.canchas || []).map((c) => c.deporte).filter(Boolean);
  const todos = deDeCanchas.length ? deDeCanchas : [club?.deporte].filter(Boolean);
  return [...new Set(todos)];
};

/** 4.666 -> "4,7" (promedio de estrellas). */
export const formatoPromedio = (n) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
