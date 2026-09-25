// =============================================================================
// MODO DEMO (solo desarrollo): `npm run dev:demo`
// Reemplaza el cliente de Supabase por uno falso con datos de ejemplo, para poder ver y
// retocar el panel de administración sin iniciar sesión ni tocar la base real.
// vite.config.js lo activa únicamente con --mode demo; nunca entra al build de producción.
// =============================================================================

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

const tablas = {
  usuarios: [{ id: ID_USUARIO, nombre_completo: 'Admin Demo', telefono: null, rol: 'admin' }],
  clubes: [club],
  canchas,
  turnos: generarTurnos(),
  productos,
  kiosco: [],
  suscripciones: [{ user_id: ID_USUARIO, estado: 'activa', plan: 'Full' }],
};

/** Constructor de consultas encadenables mínimo: select/eq/in/gte/order/limit/single/maybeSingle. */
class Consulta {
  constructor(tabla) { this.tabla = tabla; this.filtros = []; this.orden = []; this.tope = null; this.escritura = false; }
  select() { return this; }
  insert() { this.escritura = true; return this; }
  update() { this.escritura = true; return this; }
  upsert() { this.escritura = true; return this; }
  delete() { this.escritura = true; return this; }
  eq(col, val) { this.filtros.push((f) => f[col] === val); return this; }
  in(col, vals) { this.filtros.push((f) => vals.includes(f[col])); return this; }
  gte(col, val) { this.filtros.push((f) => f[col] >= val); return this; }
  order(col, { ascending = true } = {}) { this.orden.push([col, ascending]); return this; }
  limit(n) { this.tope = n; return this; }
  filas() {
    let filas = (tablas[this.tabla] || []).filter((f) => this.filtros.every((fn) => fn(f)));
    for (const [col, asc] of [...this.orden].reverse()) {
      filas = [...filas].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    return this.tope ? filas.slice(0, this.tope) : filas;
  }
  single() { return Promise.resolve({ data: this.filas()[0] ?? null, error: null }); }
  maybeSingle() { return this.single(); }
  then(resolver, rechazo) {
    const resultado = this.escritura ? { data: null, error: null } : { data: this.filas(), error: null };
    return Promise.resolve(resultado).then(resolver, rechazo);
  }
}

const sesion = { access_token: 'demo', user: { id: ID_USUARIO, email: 'demo@gridplay.com', user_metadata: { full_name: 'Admin Demo' } } };

export const supabase = {
  from: (tabla) => new Consulta(tabla),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: sesion } }),
    getUser: () => Promise.resolve({ data: { user: sesion.user } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};
