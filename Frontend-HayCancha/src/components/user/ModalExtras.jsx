import { useEffect, useMemo, useState } from 'react';
import Hoja from './Hoja';
import EditorExtras from './EditorExtras';
import { supabase } from '../../services/supabase';
import { mensajeDeServidor } from '../../utils/validaciones';
import { moneda, totalSeleccion, extrasParaEnviar, cantidadesDesdeExtras } from '../../utils/reservas';

/**
 * Agregar, cambiar o quitar los extras de una reserva futura propia.
 * Solo elige ids y cantidades: precios y nombres los pone el servidor (RPC actualizar_extras).
 * `onGuardado(extras)` recibe la lista final que devolvió el servidor.
 */
export default function ModalExtras({ turno, onCerrar, onGuardado }) {
  const clubId = turno.club?.id;
  const [productos, setProductos] = useState(null);
  const [cantidades, setCantidades] = useState(() => cantidadesDesdeExtras(turno.extras));
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const inicial = useMemo(() => cantidadesDesdeExtras(turno.extras), [turno.extras]);

  useEffect(() => {
    let cancelado = false;
    supabase.from('productos').select('*').eq('club_id', clubId).then(({ data, error: errorProductos }) => {
      if (cancelado) return;
      if (errorProductos) { setError('No pudimos cargar los productos del club.'); setProductos([]); return; }
      const activos = (data || []).filter((p) => p.activo !== false);
      // Un producto que el club dio de baja después de pedirlo se sigue mostrando (solo se puede bajar su cantidad)
      const dadosDeBaja = (turno.extras || [])
        .filter((e) => !activos.some((p) => p.id === e.id))
        .map((e) => ({ id: e.id, nombre: e.nombre, precio: e.precio_unitario }));
      setProductos([...activos, ...dadosDeBaja]);
    });
    return () => { cancelado = true; };
  }, [clubId, turno.extras]);

  const totalExtras = totalSeleccion(productos, cantidades);
  const total = (Number(turno.precio_final) || 0) + totalExtras;
  const hayCambios = useMemo(() => {
    const ids = new Set([...Object.keys(inicial), ...Object.keys(cantidades)]);
    return [...ids].some((id) => (inicial[id] || 0) !== (cantidades[id] || 0));
  }, [inicial, cantidades]);

  const guardar = async () => {
    setOcupado(true);
    setError('');
    try {
      const enviar = extrasParaEnviar(cantidades).filter((x) => x.cantidad > 0);
      const { data, error: errorRpc } = await supabase.rpc('actualizar_extras', { p_turno_id: turno.id, p_extras: enviar });
      if (errorRpc) throw errorRpc;
      onGuardado(Array.isArray(data) && data.length ? data : null);
      onCerrar();
    } catch (err) {
      console.error('Error al actualizar los extras:', err);
      setError(mensajeDeServidor(err, 'No pudimos guardar los cambios. Intentá de nuevo.'));
      setOcupado(false);
    }
  };

  return (
    <Hoja
      titulo={turno.extras?.length ? 'Editá tus extras' : 'Agregá extras'}
      descripcion={`${turno.cancha?.nombre || 'Tu reserva'} · ${turno.club?.nombre || ''}`}
      onCerrar={onCerrar}
      pie={(
        <>
          <div className="gp-total-corto">
            <small>Total de la reserva</small>
            <strong>{moneda(total)}</strong>
          </div>
          <span className="gp-espaciador" />
          <button type="button" className="gp-btn gp-btn--fantasma" onClick={onCerrar} disabled={ocupado}>Cancelar</button>
          <button type="button" className="gp-btn gp-btn--primario" onClick={guardar} disabled={ocupado || !hayCambios || productos === null}>
            {ocupado ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>
      )}
    >
      {productos === null ? (
        <p className="gp-extras-vacio">Cargando productos…</p>
      ) : (
        <EditorExtras productos={productos} cantidades={cantidades} onCambio={(id, n) => setCantidades((c) => ({ ...c, [id]: n }))} />
      )}
      {error && <p className="gp-alerta gp-alerta--error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </Hoja>
  );
}
