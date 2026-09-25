// Catálogo de deportes: tipos de partido y superficies posibles para cada uno.

export const OPCIONES_DEPORTE = {
  'Fútbol': {
    jugadores: [
      { label: 'Fútbol 5 (10 jugadores)', value: 10 },
      { label: 'Fútbol 7 (14 jugadores)', value: 14 },
      { label: 'Fútbol 8 (16 jugadores)', value: 16 },
      { label: 'Fútbol 9 (18 jugadores)', value: 18 },
      { label: 'Fútbol 11 (22 jugadores)', value: 22 },
    ],
    superficies: ['Césped Sintético', 'Césped Natural', 'Cemento / Baldosa', 'Parquet (Futsal)', 'Tierra / Arena'],
  },
  'Pádel': {
    jugadores: [
      { label: 'Dobles (4 jugadores)', value: 4 },
      { label: 'Singles (2 jugadores)', value: 2 },
    ],
    superficies: ['Césped Sintético', 'Cemento', 'Piso Modular / Plástico'],
  },
  'Tenis': {
    jugadores: [
      { label: 'Singles (2 jugadores)', value: 2 },
      { label: 'Dobles (4 jugadores)', value: 4 },
    ],
    superficies: ['Polvo de Ladrillo', 'Cemento (Cancha Rápida)', 'Césped Natural', 'Césped Sintético'],
  },
  'Básquet': {
    jugadores: [
      { label: '5 vs 5 (10 jugadores)', value: 10 },
      { label: '3 vs 3 (6 jugadores)', value: 6 },
    ],
    superficies: ['Parquet (Madera flotante)', 'Cemento', 'Goma Deportiva / Sintético'],
  },
};

export const DEPORTES = Object.keys(OPCIONES_DEPORTE);

export const normalizarDeporte = (dep) => {
  if (!dep) return 'Fútbol';
  const d = dep.toUpperCase();
  if (d.includes('BASKET') || d.includes('BASQUET') || d.includes('BÁSQUET')) return 'Básquet';
  if (d.includes('PADEL') || d.includes('PÁDEL')) return 'Pádel';
  if (d.includes('TENIS')) return 'Tenis';
  return 'Fútbol';
};

/** Valores iniciales de un formulario de cancha nueva. */
export const canchaVacia = () => ({
  nombre: '',
  deporte: 'Fútbol',
  cantidad_jugadores: OPCIONES_DEPORTE['Fútbol'].jugadores[0].value,
  superficie: OPCIONES_DEPORTE['Fútbol'].superficies[0],
  techada: false,
  precio_hora: '',
  hora_apertura: '08:00',
  hora_cierre: '23:00',
  imagen_url: '',
});

/** Prepara una cancha existente para editarla (con valores válidos para su deporte). */
export const canchaParaEditar = (cancha) => {
  const deporte = normalizarDeporte(cancha.deporte);
  const opciones = OPCIONES_DEPORTE[deporte];
  return {
    id: cancha.id,
    nombre: cancha.nombre,
    deporte,
    precio_hora: cancha.precio_hora,
    hora_apertura: cancha.hora_apertura?.slice(0, 5) || '08:00',
    hora_cierre: cancha.hora_cierre?.slice(0, 5) || '23:00',
    imagen_url: cancha.imagen_url || '',
    cantidad_jugadores: opciones.jugadores.some((j) => Number(j.value) === Number(cancha.cantidad_jugadores))
      ? Number(cancha.cantidad_jugadores)
      : opciones.jugadores[0].value,
    superficie: opciones.superficies.includes(cancha.superficie) ? cancha.superficie : opciones.superficies[0],
    techada: cancha.techada || false,
  };
};
