import { useState } from 'react';
import { CalendarPlus, Ban, Users, Trash2, PlusCircle, Pencil, TriangleAlert } from 'lucide-react';
import { Modal, ModalCuerpo, ModalPie, Campo } from '../components/ui.jsx';
import { moneda, fechaCorta } from '../lib/formato.js';
import { OPCIONES_DEPORTE, DEPORTES, canchaVacia } from '../lib/deportes.js';
import { TIPOS_IMAGEN_ACEPTADOS } from '../../../services/storage.js';
import { validarTelefono } from '../../../utils/validaciones.js';

/** Ejecuta `accion` mostrando "guardando" y el error (si hay) dentro de la ventana. */
const useEnvio = () => {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const enviar = async (accion) => {
    setError('');
    setGuardando(true);
    try { await accion(); } catch (e) { setError(e?.message || 'No se pudo guardar. Intentá de nuevo.'); } finally { setGuardando(false); }
  };
  return { guardando, error, enviar, setError };
};

const MensajeError = ({ texto }) => (texto ? <p className="dash-error" role="alert">{texto}</p> : null);

const SelectorCancha = ({ canchas, valor, onCambio, etiqueta = 'Cancha' }) => (
  <Campo etiqueta={etiqueta}>
    <select required className="dash-input" value={valor} onChange={(e) => onCambio(e.target.value)}>
      <option value="">Seleccionar cancha…</option>
      {canchas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
    </select>
  </Campo>
);

export const ModalTurno = ({ canchas, hoy, onGuardar, onCerrar }) => {
  const [form, setForm] = useState({ cancha_id: '', fecha: hoy, hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  const { guardando, error, enviar, setError } = useEnvio();
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const enviarForm = (e) => {
    e.preventDefault();
    if (!validarTelefono(form.telefono_cliente)) { setError('Ingresá un teléfono válido (solo números, entre 6 y 20 dígitos).'); return; }
    enviar(() => onGuardar(form));
  };

  return (
    <Modal titulo="Nuevo turno" descripcion="Cargá una reserva manual (por ejemplo, una llamada o WhatsApp)" icono={CalendarPlus} onCerrar={onCerrar}>
      <form onSubmit={enviarForm}>
        <ModalCuerpo>
          <div className="dash-fila-2">
            <Campo etiqueta="Fecha"><input type="date" required className="dash-input" value={form.fecha} onChange={(e) => set('fecha')(e.target.value)} /></Campo>
            <Campo etiqueta="Hora"><input type="time" required className="dash-input" value={form.hora_inicio} onChange={(e) => set('hora_inicio')(e.target.value)} /></Campo>
          </div>
          <SelectorCancha canchas={canchas} valor={form.cancha_id} onCambio={set('cancha_id')} />
          <Campo etiqueta="Nombre del cliente"><input type="text" required maxLength={80} placeholder="Ej: Juan Pérez" className="dash-input" value={form.nombre_cliente} onChange={(e) => set('nombre_cliente')(e.target.value)} /></Campo>
          <Campo etiqueta="Teléfono"><input type="tel" required placeholder="Ej: 3564123456" className="dash-input" value={form.telefono_cliente} onChange={(e) => set('telefono_cliente')(e.target.value)} /></Campo>
          <MensajeError texto={error} />
        </ModalCuerpo>
        <ModalPie>
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="dash-btn dash-btn--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar turno'}</button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export const ModalBloqueo = ({ canchas, hoy, onGuardar, onCerrar }) => {
  const [form, setForm] = useState({ cancha_id: '', fecha: hoy, hora_inicio: '', motivo: '' });
  const { guardando, error, enviar } = useEnvio();
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  return (
    <Modal titulo="Bloquear horario" descripcion="Impedí reservas por limpieza o mantenimiento" icono={Ban} tono="ambar" onCerrar={onCerrar}>
      <form onSubmit={(e) => { e.preventDefault(); enviar(() => onGuardar(form)); }}>
        <ModalCuerpo>
          <div className="dash-fila-2">
            <Campo etiqueta="Fecha"><input type="date" required className="dash-input" value={form.fecha} onChange={(e) => set('fecha')(e.target.value)} /></Campo>
            <Campo etiqueta="Hora"><input type="time" required className="dash-input" value={form.hora_inicio} onChange={(e) => set('hora_inicio')(e.target.value)} /></Campo>
          </div>
          <SelectorCancha canchas={canchas} valor={form.cancha_id} onCambio={set('cancha_id')} etiqueta="Cancha a bloquear" />
          <Campo etiqueta="Motivo (opcional)"><input type="text" maxLength={80} placeholder="Ej: Mantenimiento de red" className="dash-input" value={form.motivo} onChange={(e) => set('motivo')(e.target.value)} /></Campo>
          <MensajeError texto={error} />
        </ModalCuerpo>
        <ModalPie>
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="dash-btn dash-btn--advertencia" disabled={guardando}>{guardando ? 'Aplicando…' : 'Aplicar bloqueo'}</button>
        </ModalPie>
      </form>
    </Modal>
  );
};

export const ModalDetalles = ({ turno, onCancelar, onCerrar }) => {
  const filas = [
    ['Cliente', turno.esBloqueo ? turno.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:') : turno.nombre_cliente],
    ['Teléfono', turno.esBloqueo ? '—' : turno.telefono_cliente],
    ['Fecha', fechaCorta(turno.fecha)],
    ['Hora', `${turno.hora_inicio} hs`],
    ['Cancha', turno.nombre_cancha],
  ];

  return (
    <Modal titulo="Detalle del turno" icono={Users} tono="azul" onCerrar={onCerrar}>
      <ModalCuerpo>
        <dl className="dash-detalle">
          {filas.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>

        {!turno.esBloqueo && (
          <>
            <div className="dash-detalle-cobro">
              <div><span>Alquiler de cancha</span><strong>{moneda(turno.precio)}</strong></div>
              {(turno.extras || []).map((e, i) => (
                <div key={i}><span><b>{e.cantidad}×</b> {e.nombre}</span><strong>{moneda(e.subtotal)}</strong></div>
              ))}
              <div className="total"><span>Total a cobrar</span><strong>{moneda(turno.total)}</strong></div>
            </div>
          </>
        )}
      </ModalCuerpo>
      <ModalPie>
        <button type="button" className="dash-btn dash-btn--secundario" onClick={onCerrar}>Cerrar</button>
        <button type="button" className="dash-btn dash-btn--peligro" onClick={() => onCancelar(turno)}>
          <Trash2 size={16} /> {turno.esBloqueo ? 'Liberar horario' : 'Cancelar turno'}
        </button>
      </ModalPie>
    </Modal>
  );
};

/** Crear y editar comparten formulario: `inicial` viene de canchaVacia() o canchaParaEditar(). */
export const ModalCancha = ({ modo, inicial, onGuardar, onCerrar }) => {
  const [form, setForm] = useState(inicial || canchaVacia());
  const [archivos, setArchivos] = useState([]);
  const { guardando, error, enviar } = useEnvio();
  const editar = modo === 'editar';
  const opciones = OPCIONES_DEPORTE[form.deporte];
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarDeporte = (deporte) => setForm((f) => ({
    ...f,
    deporte,
    cantidad_jugadores: OPCIONES_DEPORTE[deporte].jugadores[0].value,
    superficie: OPCIONES_DEPORTE[deporte].superficies[0],
  }));

  return (
    <Modal titulo={editar ? 'Editar cancha' : 'Nueva cancha'} descripcion={editar ? 'Actualizá precio, horarios y características' : 'Completá los datos para empezar a recibir reservas'} icono={editar ? Pencil : PlusCircle} onCerrar={onCerrar} ancho="lg">
      <form onSubmit={(e) => { e.preventDefault(); enviar(() => onGuardar(form, archivos)); }}>
        <ModalCuerpo>
          <div className="dash-fila-2">
            <Campo etiqueta="Nombre"><input type="text" required maxLength={80} placeholder="Ej: Cancha 1" className="dash-input" value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} /></Campo>
            <Campo etiqueta="Deporte">
              <select className="dash-input" value={form.deporte} onChange={(e) => cambiarDeporte(e.target.value)}>
                {DEPORTES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Campo>
          </div>
          <div className="dash-fila-2">
            <Campo etiqueta="Tipo de partido">
              <select className="dash-input" value={form.cantidad_jugadores} onChange={(e) => set('cantidad_jugadores')(e.target.value)}>
                {opciones.jugadores.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Tipo de piso">
              <select className="dash-input" value={form.superficie} onChange={(e) => set('superficie')(e.target.value)}>
                {opciones.superficies.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Campo>
          </div>
          <div className="dash-fila-2">
            <Campo etiqueta="Precio por hora ($)"><input type="number" required min="0" step="100" className="dash-input" value={form.precio_hora} onChange={(e) => set('precio_hora')(e.target.value)} /></Campo>
            <label className="dash-check">
              <input type="checkbox" checked={form.techada} onChange={(e) => set('techada')(e.target.checked)} />
              <span>Cancha techada</span>
            </label>
          </div>
          <div className="dash-fila-2">
            <Campo etiqueta="Apertura"><input type="time" required className="dash-input" value={form.hora_apertura} onChange={(e) => set('hora_apertura')(e.target.value)} /></Campo>
            <Campo etiqueta="Cierre"><input type="time" required className="dash-input" value={form.hora_cierre} onChange={(e) => set('hora_cierre')(e.target.value)} /></Campo>
          </div>
          <Campo etiqueta={editar ? 'Agregar fotos (opcional)' : 'Fotos de la cancha (opcional)'}
            ayuda={editar ? `Las fotos nuevas se suman a las existentes.${form.imagen_url && !archivos.length ? ' ✓ Ya tiene fotos cargadas.' : ''}` : 'JPG, PNG o WebP de hasta 5 MB. Podés elegir varias.'}>
            <input type="file" multiple accept={TIPOS_IMAGEN_ACEPTADOS} className="dash-input dash-input--archivo" onChange={(e) => setArchivos(Array.from(e.target.files || []))} />
          </Campo>
          <MensajeError texto={error} />
        </ModalCuerpo>
        <ModalPie>
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="dash-btn dash-btn--primario" disabled={guardando}>{guardando ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear cancha'}</button>
        </ModalPie>
      </form>
    </Modal>
  );
};


/** Confirmación de acciones destructivas (reemplaza a window.confirm). */
export const ModalConfirmar = ({ titulo, texto, textoBoton = 'Confirmar', onConfirmar, onCerrar }) => {
  const { guardando, error, enviar } = useEnvio();
  return (
    <Modal titulo={titulo} icono={TriangleAlert} tono="ambar" onCerrar={onCerrar}>
      <ModalCuerpo>
        <p className="dash-confirmar-texto">{texto}</p>
        <MensajeError texto={error} />
      </ModalCuerpo>
      <ModalPie>
        <button type="button" className="dash-btn dash-btn--secundario" onClick={onCerrar}>Volver</button>
        <button type="button" className="dash-btn dash-btn--peligro" disabled={guardando} onClick={() => enviar(onConfirmar)}>{guardando ? 'Procesando…' : textoBoton}</button>
      </ModalPie>
    </Modal>
  );
};
