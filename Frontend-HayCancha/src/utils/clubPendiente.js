// Alta de club a medio terminar, guardada en el navegador: los datos del club ya tipeados y el id del pago
// de Mercado Pago. Sirve para no perder ninguno de los dos si el dueño tiene que salir de la pantalla
// (confirmar el mail, ingresar con una cuenta que ya tenía) antes de terminar.
// Forma: { club: {...}, preapprovalId: string | null }

const CLAVE = 'gridplay_club_pendiente';

export const leerPendiente = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
};

export const guardarPendiente = (datos) => {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* localStorage puede fallar (modo privado): no es crítico */ }
};

export const borrarPendiente = () => {
  try { localStorage.removeItem(CLAVE); } catch { /* idem */ }
};

/** Guarda el id del pago apenas vuelve de Mercado Pago, sin pisar los datos del club ya guardados. */
export const recordarPago = (preapprovalId) => guardarPendiente({ ...leerPendiente(), preapprovalId });

/** Descarta solo el pago (por ejemplo, uno que ya pertenece a otra cuenta) y conserva los datos del club. */
export const olvidarPago = () => {
  const pendiente = leerPendiente();
  if (!pendiente) return;
  if (pendiente.club) guardarPendiente({ club: pendiente.club, preapprovalId: null });
  else borrarPendiente();
};

export const pagoPendiente = () => leerPendiente()?.preapprovalId || null;
