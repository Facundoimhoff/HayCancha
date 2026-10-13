// Pasos del embudo que se miden (Google Analytics y píxel de Meta). Funciones puras, con pruebas.
// Regla: nunca se manda un dato personal (nombre, mail, teléfono), solo qué pasó y, si aplica, cuánto vale.

export const EVENTOS = {
  VER_PLANES: 'ver_planes',
  INICIAR_PAGO: 'iniciar_pago',
  CLUB_CREADO: 'club_creado',
  PLAN_PAGADO: 'plan_pagado',
  REGISTRO_JUGADOR: 'registro_jugador',
  RESERVA_CONFIRMADA: 'reserva_confirmada',
};

// Meta optimiza los anuncios con sus eventos estándar: cada paso se traduce al más parecido.
const EVENTO_META = {
  [EVENTOS.VER_PLANES]: 'ViewContent',
  [EVENTOS.INICIAR_PAGO]: 'InitiateCheckout',
  [EVENTOS.CLUB_CREADO]: 'Lead',
  [EVENTOS.PLAN_PAGADO]: 'Subscribe',
  [EVENTOS.REGISTRO_JUGADOR]: 'CompleteRegistration',
  [EVENTOS.RESERVA_CONFIRMADA]: 'Schedule',
};

const CAMPOS_PERMITIDOS = ['plan', 'modo', 'valor', 'deporte'];

/** Deja pasar solo los campos conocidos y con valores simples (texto corto o número). */
export const datosSeguros = (datos = {}) => {
  const limpio = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    const valor = datos?.[campo];
    if (typeof valor === 'number' && Number.isFinite(valor)) limpio[campo] = valor;
    else if (typeof valor === 'string' && valor.trim()) limpio[campo] = valor.trim().slice(0, 40);
  }
  return limpio;
};

/** Evento para Google Analytics: { nombre, parametros }. `valor` viaja como value + currency. */
export const eventoGoogle = (nombre, datos) => {
  const { valor, ...resto } = datosSeguros(datos);
  return { nombre, parametros: valor === undefined ? resto : { ...resto, value: valor, currency: 'ARS' } };
};

/** Evento para el píxel de Meta: { nombre, parametros, estandar }. Los que no tienen equivalente van como personalizados. */
export const eventoMeta = (nombre, datos) => {
  const { valor, ...resto } = datosSeguros(datos);
  const estandar = Object.hasOwn(EVENTO_META, nombre);
  return {
    nombre: estandar ? EVENTO_META[nombre] : nombre,
    parametros: valor === undefined ? resto : { ...resto, value: valor, currency: 'ARS' },
    estandar,
  };
};

/** Un identificador de Google Analytics 4 ("G-XXXXXXX") o de píxel de Meta (solo dígitos) bien formado. */
export const idGoogleValido = (id) => /^G-[A-Z0-9]{6,14}$/.test(id || '');
export const idMetaValido = (id) => /^\d{10,20}$/.test(id || '');
