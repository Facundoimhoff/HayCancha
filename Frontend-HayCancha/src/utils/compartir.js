// Textos y enlaces para que el dueño comparta su club. Funciones puras, con pruebas.

/** Dirección pública de la ficha del club. */
export const enlaceDelClub = (origen, clubId) => `${String(origen || '').replace(/\/+$/, '')}/club/${encodeURIComponent(clubId)}`;

/** Mensaje listo para mandar por WhatsApp o pegar en una publicación. */
export const mensajeParaCompartir = (nombreClub, url) =>
  `¡Ya podés reservar tu cancha en ${nombreClub || 'nuestro club'} desde el celular! Elegí día y horario, y listo: ${url}`;

/** Texto corto para la biografía de Instagram (el link va aparte, en el campo "Enlace" del perfil). */
export const textoParaBio = () => 'Reservá tu cancha online 👇';

/** Enlace de WhatsApp que abre el selector de contacto con el mensaje ya escrito. */
export const enlaceWhatsAppCompartir = (mensaje) => `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

/** Nombre de archivo sin caracteres raros: "Sport Automóvil Club" -> "sport-automovil-club". */
export const nombreDeArchivo = (texto) =>
  String(texto || 'club').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'club';

/**
 * Parte un texto en renglones que entren en `anchoMaximo`, midiendo con `medir(texto) -> px`.
 * Como mucho `maximoRenglones`; si no entra, el último termina en "…".
 */
export const partirEnRenglones = (texto, medir, anchoMaximo, maximoRenglones = 2) => {
  const palabras = String(texto || '').trim().split(/\s+/).filter(Boolean);
  const renglones = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (!actual || medir(prueba) <= anchoMaximo) { actual = prueba; continue; }
    renglones.push(actual);
    actual = palabra;
  }
  if (actual) renglones.push(actual);
  if (renglones.length <= maximoRenglones) return renglones;

  const visibles = renglones.slice(0, maximoRenglones);
  let ultimo = visibles[maximoRenglones - 1];
  while (ultimo && medir(`${ultimo}…`) > anchoMaximo) ultimo = ultimo.slice(0, -1).trimEnd();
  visibles[maximoRenglones - 1] = `${ultimo}…`;
  return visibles;
};
