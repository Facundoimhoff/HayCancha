// Formateo de montos y fechas del panel de administración.
// Las fechas viajan como texto ISO "YYYY-MM-DD" (igual que en la base) y se operan en hora local.

export const moneda = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

/** $1,2M · $85k · $900 — para ejes de gráficos y tarjetas chicas. */
export const monedaCompacta = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.', ',')}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
};

export const fechaISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const desdeISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const sumarDias = (iso, dias) => {
  const d = desdeISO(iso);
  d.setDate(d.getDate() + dias);
  return fechaISO(d);
};

/** Cantidad de días entre dos fechas ISO, ambas incluidas. */
export const diasEntre = (desde, hasta) =>
  Math.round((desdeISO(hasta) - desdeISO(desde)) / 86_400_000) + 1;

/** "2026-09-05" -> "05/09/2026" */
export const fechaCorta = (iso) => iso.split('-').reverse().join('/');

/** "2026-09-05" -> "05/09" */
export const diaMes = (iso) => iso.slice(5).split('-').reverse().join('/');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const nombreDia = (iso) => DIAS[desdeISO(iso).getDay()];

/** "hoy", "mañana" o "vie 26/09" para listados de próximos turnos. */
export const etiquetaDia = (iso, hoy = fechaISO()) => {
  if (iso === hoy) return 'Hoy';
  if (iso === sumarDias(hoy, 1)) return 'Mañana';
  if (iso === sumarDias(hoy, -1)) return 'Ayer';
  return `${nombreDia(iso).slice(0, 3)} ${diaMes(iso)}`;
};

export const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';

export const pluralizar = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;
