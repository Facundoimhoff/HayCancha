// Validaciones compartidas de formularios de registro/login y mensajes de error del servidor.

// Debe coincidir con la política de Supabase Auth (minúscula, mayúscula, dígito y símbolo, mínimo 8).
export const AYUDA_PASSWORD = '8+ caracteres con mayúscula, minúscula, número y símbolo';

const REGLAS_PASSWORD = [
  { ok: (p) => p.length >= 8, texto: 'al menos 8 caracteres' },
  { ok: (p) => /[a-z]/.test(p), texto: 'una minúscula' },
  { ok: (p) => /[A-Z]/.test(p), texto: 'una mayúscula' },
  { ok: (p) => /\d/.test(p), texto: 'un número' },
  { ok: (p) => /[^a-zA-Z0-9]/.test(p), texto: 'un símbolo (ej. ! @ # $)' },
];

/** Devuelve un mensaje de error o `null` si la contraseña es válida. */
export const validarPassword = (password) => {
  const faltantes = REGLAS_PASSWORD.filter((r) => !r.ok(password || '')).map((r) => r.texto);
  return faltantes.length ? `La contraseña necesita ${faltantes.join(', ')}.` : null;
};

export const validarTelefono = (telefono) => /^[0-9+()\s-]{6,20}$/.test((telefono || '').trim());

/**
 * Los filtros `.or()` de PostgREST se arman como texto: comas, paréntesis y comodines
 * en el input del usuario permitirían inyectar filtros extra.
 */
export const sanitizarBusqueda = (texto) =>
  (texto || '').replace(/[^\p{L}\p{N}\s.-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

const MENSAJES_SERVIDOR = {
  SESION_REQUERIDA: 'Iniciá sesión para continuar.',
  NOMBRE_INVALIDO: 'Ingresá un nombre válido.',
  TELEFONO_INVALIDO: 'Ingresá un teléfono válido (solo números, entre 6 y 20 dígitos).',
  HORA_INVALIDA: 'El horario elegido no es válido.',
  FECHA_INVALIDA: 'La fecha elegida no es válida.',
  CANCHA_NO_DISPONIBLE: 'La cancha no está disponible.',
  FUERA_DE_HORARIO: 'Ese horario está fuera del horario de la cancha.',
  TURNO_PASADO: 'Ese horario ya pasó. Elegí otro.',
  LIMITE_RESERVAS: 'Alcanzaste el máximo de reservas futuras. Cancelá alguna para reservar otra.',
  EXTRAS_INVALIDOS: 'Alguno de los productos elegidos ya no está disponible.',
  SLOT_OCUPADO: 'Alguien reservó ese horario recién. Elegí otro.',
  CLUB_EXISTENTE: 'Tu cuenta ya tiene un club registrado.',
  SUSCRIPCION_REQUERIDA: 'Necesitás una suscripción activa para registrar tu club.',
  UBICACION_INVALIDA: 'Completá provincia, ciudad y dirección.',
  IMAGEN_INVALIDA: 'La imagen del club no es válida.',
  REDES_INVALIDAS: 'Las redes sociales no son válidas.',
};

/** Traduce los códigos que lanzan las funciones SQL (`raise exception 'CODIGO'`) a texto para el usuario. */
export const mensajeDeServidor = (error, porDefecto = 'Ocurrió un error. Intentá de nuevo.') => {
  const codigo = Object.keys(MENSAJES_SERVIDOR).find((c) => error?.message?.includes(c));
  return codigo ? MENSAJES_SERVIDOR[codigo] : porDefecto;
};

/** Fecha local en formato YYYY-MM-DD (toISOString usa UTC y corre el día después de las 21 hs en Argentina). */
export const fechaLocalISO = (fecha = new Date()) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
