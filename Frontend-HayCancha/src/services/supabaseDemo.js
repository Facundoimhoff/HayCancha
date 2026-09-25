// =============================================================================
// MODO DEMO (solo desarrollo): `npm run dev:demo`
// Reemplaza el cliente de Supabase por uno falso con datos de ejemplo, para poder ver y
// retocar el panel de administración sin iniciar sesión ni tocar la base real.
// vite.config.js lo activa únicamente con --mode demo; nunca entra al build de producción.
// =============================================================================

// Escenario de sesión para probar pantallas de alta: localStorage.setItem('demoRol', 'anon' | 'cliente' | 'cliente-pago')
//   anon = sin sesión (paso 1 del registro) · cliente = cuenta sin plan (paso 2) · cliente-pago = cuenta con plan activo (paso 3)
const ESCENARIO = (typeof localStorage !== 'undefined' && localStorage.getItem('demoRol')) || 'admin';

const ID_USUARIO = 'demo-admin';
const ID_CLUB = 'demo-club';

// Generador pseudoaleatorio determinista (siempre los mismos datos)
let semilla = 20260925;
const azar = () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const club = {
  id: ID_CLUB,
  nombre: 'Club Demo Pádel & Fútbol',
  admin_id: ID_USUARIO,
  provincia: 'Córdoba',
  ciudad: 'San Francisco',
  direccion: 'Av. Urquiza 332',
  telefono_contacto: '3564609641',
  correo_contacto: 'demo@gridplay.com',
  servicios: 'Parrillas, Vestuarios, Cantina, Techado',
  descripcion: 'Complejo con canchas de fútbol y pádel, cantina y estacionamiento.',
  color_primario: '#22c55e',
  imagen_url: '',
  fotos_club: '',
  redes_sociales: { instagram: '@clubdemo', tiktok: '', facebook: '' },
  estacionamiento: true,
};

const canchas = [
  { id: 'c1', club_id: ID_CLUB, nombre: 'Fútbol 5 · Cancha A', deporte: 'Fútbol', cantidad_jugadores: 10, superficie: 'Césped Sintético', techada: false, precio_hora: 42000, hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '', activa: true },
  { id: 'c2', club_id: ID_CLUB, nombre: 'Fútbol 7 · Cancha B', deporte: 'Fútbol', cantidad_jugadores: 14, superficie: 'Césped Sintético', techada: true, precio_hora: 60000, hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '', activa: true },
  { id: 'c3', club_id: ID_CLUB, nombre: 'Pádel 1 · Blindex', deporte: 'Pádel', cantidad_jugadores: 4, superficie: 'Césped Sintético', techada: true, precio_hora: 28000, hora_apertura: '09:00', hora_cierre: '23:00', imagen_url: '', activa: true },
  { id: 'c4', club_id: ID_CLUB, nombre: 'Pádel 2 · Muro', deporte: 'Pádel', cantidad_jugadores: 4, superficie: 'Cemento', techada: false, precio_hora: 24000, hora_apertura: '09:00', hora_cierre: '23:00', imagen_url: '', activa: true },
];

const productos = [
  { id: 1, club_id: ID_CLUB, nombre: 'Coca-Cola 1.5 Lts', precio: 6000, icono: '🥤', activo: true },
  { id: 2, club_id: ID_CLUB, nombre: 'Agua 500 ml', precio: 2500, icono: '💧', activo: true },
  { id: 3, club_id: ID_CLUB, nombre: 'Hamburguesa simple', precio: 8000, icono: '🍔', activo: true },
  { id: 4, club_id: ID_CLUB, nombre: 'Alquiler de paletas', precio: 5000, icono: '🎾', activo: true },
];

const clientes = [
  ['Lucas Pérez', '3564100001'], ['Martina Gómez', '3564100002'], ['Diego Fernández', '3564100003'],
  ['Sofía Rodríguez', '3564100004'], ['Nicolás Álvarez', '3564100005'], ['Camila Torres', '3564100006'],
  ['Joaquín Ruiz', '3564100007'], ['Valentina Díaz', '3564100008'], ['Tomás Sosa', '3564100009'],
  ['Lucía Herrera', '3564100010'], ['Mateo Acosta', '3564100011'], ['Julieta Romero', '3564100012'],
];

const generarTurnos = () => {
  const lista = [];
  let id = 1;
  const hoy = new Date();
  for (let delta = -40; delta <= 7; delta++) {
    const dia = new Date(hoy);
    dia.setDate(hoy.getDate() + delta);
    const finde = [0, 5, 6].includes(dia.getDay());
    for (const cancha of canchas) {
      const ocupacion = finde ? 0.62 : 0.34;
      for (let hora = 17; hora < 23; hora++) {
        if (azar() > ocupacion) continue;
        const [nombre, telefono] = elegir(clientes);
        const usaExtras = azar() < 0.35;
        const extras = usaExtras
          ? (() => {
              const p = elegir(productos);
              const cantidad = 1 + Math.floor(azar() * 3);
              return [{ id: p.id, nombre: p.nombre, precio_unitario: p.precio, cantidad, subtotal: p.precio * cantidad }];
            })()
          : null;
        lista.push({
          id: id++,
          cancha_id: cancha.id,
          fecha: iso(dia),
          hora_inicio: `${String(hora).padStart(2, '0')}:00`,
          nombre_cliente: nombre,
          telefono_cliente: telefono,
          precio_final: cancha.precio_hora,
          extras,
        });
      }
    }
  }
  // Un par de bloqueos por mantenimiento
  lista.push({ id, cancha_id: 'c2', fecha: iso(new Date(hoy.getTime() + 2 * 86400000)), hora_inicio: '18:00', nombre_cliente: 'Bloqueo por: Mantenimiento', telefono_cliente: 'BLOQUEO', precio_final: null, extras: null });
  return lista;
};


// ---- Vista del jugador: otros clubes (de otros dueños), sus canchas, productos y reseñas ----
const ID_CLUB_FREYRE = 'demo-club-freyre';
const ID_CLUB_AMIGOS = 'demo-club-amigos';

const clubesJugador = [
  {
    id: ID_CLUB_FREYRE, nombre: 'SPORT AUTOMOVIL CLUB', admin_id: 'otro-admin-1', provincia: 'Córdoba', ciudad: 'Freyre',
    direccion: 'Cabrera 4012', telefono_contacto: '3564123456', correo_contacto: 'sport@ejemplo.com',
    servicios: 'Vestuarios, Cantina, Parrillas', descripcion: 'El club de todo el pueblo. Fútbol 5 y 7 con césped sintético.',
    color_primario: '#0f172a', imagen_url: '', fotos_club: '', redes_sociales: {}, estacionamiento: true,
  },
  {
    id: ID_CLUB_AMIGOS, nombre: 'Los Amigos Fútbol', admin_id: 'otro-admin-2', provincia: 'Córdoba', ciudad: 'Freyre',
    direccion: 'Ruta 19 km 3', telefono_contacto: '3564777888', correo_contacto: '', servicios: 'Cantina',
    descripcion: '', color_primario: '#0f172a', imagen_url: '', fotos_club: '', redes_sociales: {}, estacionamiento: false,
  },
];
const canchasJugador = [
  { id: 'cf1', club_id: ID_CLUB_FREYRE, nombre: 'Fútbol 5 · Cancha 1', deporte: 'Fútbol', cantidad_jugadores: 5, superficie: 'Césped Sintético', techada: false, precio_hora: 42000, hora_apertura: '10:00', hora_cierre: '23:00', imagen_url: '', activa: true },
  { id: 'cf2', club_id: ID_CLUB_FREYRE, nombre: 'Fútbol 7 · Techada', deporte: 'Fútbol', cantidad_jugadores: 7, superficie: 'Césped Sintético', techada: true, precio_hora: 60000, hora_apertura: '10:00', hora_cierre: '23:00', imagen_url: '', activa: true },
  { id: 'ca1', club_id: ID_CLUB_AMIGOS, nombre: 'Fútbol 5', deporte: 'Fútbol', cantidad_jugadores: 5, superficie: 'Sintético', techada: false, precio_hora: 30000, hora_apertura: '16:00', hora_cierre: '23:00', imagen_url: '', activa: true },
];
const productosJugador = [
  { id: 11, club_id: ID_CLUB_FREYRE, nombre: 'Coca-Cola 1.5 Lts', precio: 6000, icono: '🥤', activo: true },
  { id: 12, club_id: ID_CLUB_FREYRE, nombre: 'Agua 500 ml', precio: 2500, icono: '💧', activo: true },
  { id: 13, club_id: ID_CLUB_FREYRE, nombre: 'Pecheras (juego x10)', precio: 4000, icono: '🎽', activo: true },
  { id: 14, club_id: ID_CLUB_FREYRE, nombre: 'Pelota', precio: 3000, icono: '⚽', activo: true },
];

const diaRelativo = (delta) => { const d = new Date(); d.setDate(d.getDate() + delta); return iso(d); };
const extra = (p, cantidad) => ({ id: p.id, nombre: p.nombre, precio_unitario: p.precio, cantidad, subtotal: p.precio * cantidad });

const turnosJugador = () => {
  const lista = [];
  let id = 90000;
  const propio = (cancha_id, delta, hora_inicio, extras = null) => {
    const precio = [...canchas, ...canchasJugador].find((c) => c.id === cancha_id).precio_hora;
    lista.push({ id: id++, cancha_id, fecha: diaRelativo(delta), hora_inicio, nombre_cliente: 'Admin Demo', telefono_cliente: '3564000000', precio_final: precio, extras, usuario_id: ID_USUARIO });
  };
  propio('cf1', -12, '20:00', [extra(productosJugador[0], 2)]);
  propio('cf2', -3, '19:00');
  propio('ca1', -20, '21:00');
  propio('cf1', 1, '21:00', [extra(productosJugador[0], 1), extra(productosJugador[1], 2)]);
  propio('cf2', 4, '18:00');
  propio('c3', 6, '20:00');
  // Otros jugadores ocupan horarios de las canchas nuevas (para ver "Ocupado" y días "Completos")
  for (let delta = 0; delta < 14; delta++) {
    for (const cancha of canchasJugador) {
      for (let h = 17; h < 23; h++) {
        if (azar() > (delta === 2 && cancha.id === 'ca1' ? 1 : 0.35)) continue;
        lista.push({ id: id++, cancha_id: cancha.id, fecha: diaRelativo(delta), hora_inicio: `${String(h).padStart(2, '0')}:00`, nombre_cliente: 'Otro jugador', telefono_cliente: '3564999999', precio_final: cancha.precio_hora, extras: null, usuario_id: 'otro' });
      }
    }
  }
  return lista;
};

const resenasBase = [
  [ID_CLUB_FREYRE, 'Lucas P.', 5, 'Muy buena cancha, el césped impecable y la atención de primera. Volvemos todos los jueves.', -30],
  [ID_CLUB_FREYRE, 'Martina G.', 5, 'La cantina tiene de todo y las canchas están siempre limpias.', -21],
  [ID_CLUB_FREYRE, 'Diego F.', 4, 'Muy buen lugar. Solo mejoraría la iluminación del fondo.', -15],
  [ID_CLUB_FREYRE, 'Sofía R.', 5, '', -9],
  [ID_CLUB_FREYRE, 'Nicolás A.', 3, 'Está bien, pero el estacionamiento se llena rápido.', -4],
  [ID_CLUB, 'Camila T.', 4, 'Lindas canchas de pádel.', -12],
  [ID_CLUB, 'Joaquín R.', 5, 'Excelente todo.', -7],
];
let idResena = 1;
const resenas = resenasBase.map(([club_id, autor, estrellas, comentario, delta]) => ({
  id: idResena++, club_id, usuario_id: `demo-${autor}`, autor, estrellas, comentario: comentario || null,
  created_at: new Date(Date.now() + delta * 86400000).toISOString(), oculta: false,
}));

const tablas = {
  usuarios: [{ id: ID_USUARIO, nombre_completo: 'Admin Demo', telefono: null, rol: ESCENARIO.startsWith('cliente') ? 'cliente' : 'admin' }],
  clubes: [club, ...clubesJugador],
  canchas: [...canchas, ...canchasJugador],
  turnos: [...generarTurnos(), ...turnosJugador()],
  productos: [...productos, ...productosJugador],
  resenas,
  kiosco: [],
  suscripciones: ESCENARIO === 'cliente' ? [] : [{ user_id: ID_USUARIO, estado: 'activa', plan: 'Full' }],
};

/** Constructor de consultas encadenables mínimo: select/eq/in/gte/lte/or/order/limit/single/maybeSingle. */
const TABLAS_CON_BORRADO = ['turnos', 'resenas'];

// Relaciones que PostgREST devuelve embebidas (se adjuntan siempre; es un demo)
const conRelaciones = (tabla, fila) => {
  if (tabla === 'clubes') return { ...fila, canchas: tablas.canchas.filter((c) => c.club_id === fila.id) };
  if (tabla === 'turnos') {
    const cancha = tablas.canchas.find((c) => c.id === fila.cancha_id) || null;
    return { ...fila, canchas: cancha ? { ...cancha, clubes: tablas.clubes.find((c) => c.id === cancha.club_id) || null } : null };
  }
  return fila;
};

class Consulta {
  constructor(tabla) { this.tabla = tabla; this.filtros = []; this.orden = []; this.tope = null; this.modo = 'select'; }
  select() { return this; }
  insert() { this.modo = 'escritura'; return this; }
  update() { this.modo = 'escritura'; return this; }
  upsert() { this.modo = 'escritura'; return this; }
  delete() { this.modo = TABLAS_CON_BORRADO.includes(this.tabla) ? 'borrar' : 'escritura'; return this; }
  eq(col, val) { this.filtros.push((f) => f[col] === val); return this; }
  in(col, vals) { this.filtros.push((f) => vals.includes(f[col])); return this; }
  gte(col, val) { this.filtros.push((f) => f[col] >= val); return this; }
  ilike(col, val) { const patron = String(val).replaceAll('%', '').toLowerCase(); this.filtros.push((f) => String(f[col] ?? '').toLowerCase().includes(patron)); return this; }
  lte(col, val) { this.filtros.push((f) => f[col] <= val); return this; }
  or(texto) {
    const terminos = texto.split(',').map((p) => p.split('.ilike.')).filter((p) => p.length === 2)
      .map(([col, patron]) => [col, patron.replaceAll('%', '').toLowerCase()]);
    this.filtros.push((f) => terminos.some(([col, t]) => String(f[col] ?? '').toLowerCase().includes(t)));
    return this;
  }
  order(col, { ascending = true } = {}) { this.orden.push([col, ascending]); return this; }
  limit(n) { this.tope = n; return this; }
  filas() {
    let filas = (tablas[this.tabla] || []).filter((f) => this.filtros.every((fn) => fn(f)) && (this.tabla !== 'resenas' || f.usuario_id === ID_USUARIO));
    for (const [col, asc] of [...this.orden].reverse()) {
      filas = [...filas].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    return (this.tope ? filas.slice(0, this.tope) : filas).map((f) => conRelaciones(this.tabla, f));
  }
  single() { return Promise.resolve({ data: this.filas()[0] ?? null, error: null }); }
  maybeSingle() { return this.single(); }
  then(resolver, rechazo) {
    let resultado;
    if (this.modo === 'borrar') {
      const fuente = tablas[this.tabla];
      const borradas = fuente.filter((f) => this.filtros.every((fn) => fn(f)) && (this.tabla !== 'resenas' || f.usuario_id === ID_USUARIO));
      for (const b of borradas) fuente.splice(fuente.indexOf(b), 1);
      resultado = { data: borradas.map(({ id }) => ({ id })), error: null };
    } else if (this.modo === 'escritura') {
      resultado = { data: null, error: null };
    } else {
      resultado = { data: this.filas(), error: null };
    }
    return Promise.resolve(resultado).then(resolver, rechazo);
  }
}

// ---- RPC del jugador (las reglas reales viven en la migración SQL; acá solo lo justo para ver la interfaz) ----
const falla = (codigo) => ({ data: null, error: { message: codigo } });
const ok = (data = null) => ({ data, error: null });
const hoyISO = () => diaRelativo(0);
const yaPaso = (fecha, hora) => new Date(`${fecha}T${hora}:00`) <= new Date();

const resumenDe = (clubId) => {
  const propias = resenas.filter((r) => r.club_id === clubId && !r.oculta);
  return propias.length ? { promedio: Math.round((propias.reduce((a, r) => a + r.estrellas, 0) / propias.length) * 10) / 10, cantidad: propias.length } : null;
};

const rpcs = {
  resumen_resenas: ({ p_club_ids }) => ok(p_club_ids.map((id) => ({ id, r: resumenDe(id) })).filter((x) => x.r).map((x) => ({ club_id: x.id, ...x.r }))),
  distribucion_resenas: ({ p_club_id }) => ok([5, 4, 3, 2, 1].map((n) => ({ estrellas: n, cantidad: resenas.filter((r) => r.club_id === p_club_id && r.estrellas === n).length })).filter((x) => x.cantidad)),
  resenas_club: ({ p_club_id, p_limite = 20, p_desde = 0 }) => ok(
    resenas.filter((r) => r.club_id === p_club_id && !r.oculta)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(p_desde, p_desde + p_limite)
      .map((r) => ({ id: r.id, estrellas: r.estrellas, comentario: r.comentario, created_at: r.created_at, autor: r.autor, es_mia: r.usuario_id === ID_USUARIO })),
  ),
  calificar_club: ({ p_club_id, p_estrellas, p_comentario }) => {
    if (!(p_estrellas >= 1 && p_estrellas <= 5)) return falla('ESTRELLAS_INVALIDAS');
    if (tablas.clubes.find((c) => c.id === p_club_id)?.admin_id === ID_USUARIO) return falla('NO_PERMITIDO');
    const jugo = tablas.turnos.some((t) => t.usuario_id === ID_USUARIO && tablas.canchas.find((c) => c.id === t.cancha_id)?.club_id === p_club_id && yaPaso(t.fecha, t.hora_inicio));
    if (!jugo) return falla('SIN_TURNO_JUGADO');
    const existente = resenas.find((r) => r.club_id === p_club_id && r.usuario_id === ID_USUARIO);
    if (existente) Object.assign(existente, { estrellas: p_estrellas, comentario: p_comentario });
    else resenas.push({ id: idResena++, club_id: p_club_id, usuario_id: ID_USUARIO, autor: 'Admin D.', estrellas: p_estrellas, comentario: p_comentario, created_at: new Date().toISOString(), oculta: false });
    return ok();
  },
  disponibilidad_cancha: ({ p_cancha_id, p_desde, p_hasta }) => ok(
    tablas.turnos.filter((t) => t.cancha_id === p_cancha_id && t.fecha >= p_desde && t.fecha <= p_hasta).map((t) => ({ fecha: t.fecha, hora_inicio: t.hora_inicio })),
  ),
  crear_reserva: ({ p_cancha_id, p_fecha, p_hora, p_nombre, p_telefono, p_extras = [] }) => {
    const cancha = tablas.canchas.find((c) => c.id === p_cancha_id);
    if (!cancha) return falla('CANCHA_NO_DISPONIBLE');
    if (p_fecha < hoyISO() || yaPaso(p_fecha, p_hora)) return falla('TURNO_PASADO');
    if (tablas.turnos.some((t) => t.cancha_id === p_cancha_id && t.fecha === p_fecha && t.hora_inicio === p_hora)) return falla('SLOT_OCUPADO');
    const extras = p_extras.filter((e) => e.cantidad > 0).map((e) => extra(tablas.productos.find((p) => p.id === e.id), e.cantidad));
    const id = Math.max(...tablas.turnos.map((t) => t.id)) + 1;
    tablas.turnos.push({ id, cancha_id: p_cancha_id, fecha: p_fecha, hora_inicio: p_hora, nombre_cliente: p_nombre, telefono_cliente: p_telefono, precio_final: cancha.precio_hora, extras: extras.length ? extras : null, usuario_id: ID_USUARIO });
    return ok(id);
  },
  actualizar_extras: ({ p_turno_id, p_extras }) => {
    const turno = tablas.turnos.find((t) => t.id === p_turno_id && t.usuario_id === ID_USUARIO);
    if (!turno) return falla('TURNO_NO_ENCONTRADO');
    if (yaPaso(turno.fecha, turno.hora_inicio)) return falla('TURNO_PASADO');
    const extras = p_extras.filter((e) => e.cantidad > 0).map((e) => extra(tablas.productos.find((p) => p.id === e.id), e.cantidad));
    turno.extras = extras.length ? extras : null;
    return ok(extras);
  },
};

const sesion = { access_token: 'demo', user: { id: ID_USUARIO, email: 'demo@gridplay.com', user_metadata: { full_name: 'Admin Demo' } } };

export const supabase = {
  from: (tabla) => new Consulta(tabla),
  rpc: (nombre, args = {}) => Promise.resolve(rpcs[nombre] ? rpcs[nombre](args) : { data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: ESCENARIO === 'anon' ? null : sesion } }),
    getUser: () => Promise.resolve({ data: { user: sesion.user } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve({ error: null }),
    // Solo para ver la interfaz: un correo que contenga "existe" simula una cuenta ya registrada
    signUp: ({ email }) => Promise.resolve({ data: { user: { identities: email.includes('existe') ? [] : [{}] }, session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: sesion.user }, error: { message: 'Invalid login credentials' } }),
    resetPasswordForEmail: () => Promise.resolve({ error: null }),
    signInWithOAuth: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};
