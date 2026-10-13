const TAMANO_PAGINA = 1000;

/**
 * Lee TODAS las filas de una consulta. Supabase devuelve como mucho 1000 por pedido y corta en silencio:
 * sin esto, una lista ordenada de más vieja a más nueva pierde justo las filas recientes.
 * `armarConsulta` devuelve una consulta nueva cada vez (con un orden estable, terminado en una columna única).
 * Si una página falla, devuelve lo leído hasta ahí.
 */
export const leerTodas = async (armarConsulta) => {
  const filas = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await armarConsulta().range(desde, desde + TAMANO_PAGINA - 1);
    if (error) {
      console.error('Error al leer una página de datos:', error);
      break;
    }
    filas.push(...(data || []));
    if (!data || data.length < TAMANO_PAGINA) break;
  }
  return filas;
};
