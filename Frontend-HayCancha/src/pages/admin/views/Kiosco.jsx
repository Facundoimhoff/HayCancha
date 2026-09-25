import { useEffect, useState } from 'react';
import { Package, Pencil, Plus, Smile, Trash2, UploadCloud } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../../services/storage';
import { listaImagenes } from '../../../utils/enlaces';
import { moneda } from '../lib/formato';
import { Panel, Campo, Chip, Vacio, Segmentado } from '../components/ui';
import { ModalConfirmar } from '../modals/modales';

const OPCIONES_ICONO = [{ valor: 'emoji', texto: 'Emoji' }, { valor: 'imagen', texto: 'Foto' }];

/** Miniatura de un producto: foto (solo https) o emoji. */
const Miniatura = ({ icono, nombre }) => {
  const foto = listaImagenes(icono)[0];
  return foto
    ? <img className="dash-prod-icono" src={foto} alt={nombre} loading="lazy" />
    : <span className="dash-prod-icono dash-prod-icono--emoji" aria-hidden="true">{icono || '🏷️'}</span>;
};

/** Kiosco y extras: productos que el jugador puede sumar a su reserva (tabla `productos`). */
const Kiosco = ({ clubId }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipoIcono, setTipoIcono] = useState('emoji');
  const [emoji, setEmoji] = useState('🥤');
  const [imagenFile, setImagenFile] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [editando, setEditando] = useState(null); // { id, nombre, precio }
  const [errorEdicion, setErrorEdicion] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!clubId) return undefined;
    let cancelado = false;

    (async () => {
      // `productos` es el catálogo que ve el jugador al reservar (la tabla `kiosco` quedó como legado)
      const { data, error: errorProductos } = await supabase.from('productos').select('*').eq('club_id', clubId).order('nombre', { ascending: true });
      if (cancelado) return;
      if (errorProductos) { console.error('Error al cargar productos:', errorProductos); setError('No pudimos cargar tus productos. Intentá de nuevo en unos minutos.'); }
      else { setError(''); setProductos(data || []); }
      setCargando(false);
    })();

    return () => { cancelado = true; };
  }, [clubId, recarga]);

  const recargar = () => setRecarga((n) => n + 1);

  const agregar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    const valor = Number(precio);
    if (nombre.trim().length < 2) { setErrorForm('Ingresá el nombre del producto.'); return; }
    if (!Number.isFinite(valor) || valor < 0) { setErrorForm('Ingresá un precio válido.'); return; }

    setAgregando(true);
    try {
      let icono = emoji.trim() || '🏷️';
      if (tipoIcono === 'imagen') icono = imagenFile ? await subirImagen(imagenFile, 'productos') : '📦';

      const { error: errorInsert } = await supabase.from('productos').insert([{ club_id: clubId, nombre: nombre.trim(), precio: valor, icono, activo: true }]);
      if (errorInsert) throw errorInsert;

      setNombre(''); setPrecio(''); setEmoji('🥤'); setImagenFile(null); setTipoIcono('emoji');
      recargar();
    } catch (err) {
      console.error('No se pudo agregar el producto:', err);
      setErrorForm(err?.message?.includes('5 MB') || err?.message?.includes('imagen') ? err.message : 'No pudimos agregar el producto. Intentá de nuevo.');
    } finally {
      setAgregando(false);
    }
  };

  const guardarEdicion = async () => {
    setErrorEdicion('');
    const valor = Number(editando.precio);
    if (editando.nombre.trim().length < 2) { setErrorEdicion('Ingresá el nombre del producto.'); return; }
    if (!Number.isFinite(valor) || valor < 0) { setErrorEdicion('Ingresá un precio válido.'); return; }

    const { error: errorUpdate } = await supabase.from('productos').update({ nombre: editando.nombre.trim(), precio: valor }).eq('id', editando.id);
    if (errorUpdate) { setErrorEdicion('No pudimos guardar los cambios.'); return; }
    setEditando(null);
    recargar();
  };

  const cambiarActivo = async (producto) => {
    setError('');
    const { error: errorUpdate } = await supabase.from('productos').update({ activo: producto.activo === false }).eq('id', producto.id);
    if (errorUpdate) { setError('No pudimos cambiar la disponibilidad del producto.'); return; }
    recargar();
  };

  const eliminar = async () => {
    const { error: errorDelete } = await supabase.from('productos').delete().eq('id', aEliminar.id);
    if (errorDelete) throw new Error('No pudimos eliminar el producto. Intentá de nuevo.');
    setAEliminar(null);
    recargar();
  };

  return (
    <>
      <header className="dash-page-head">
        <div><h1>Kiosco y extras</h1><p>Bebidas, alquileres y otros productos que los jugadores pueden sumar al reservar.</p></div>
      </header>

      <Panel titulo="Agregar artículo" descripcion="Nombre, precio y una miniatura.">
        <form onSubmit={agregar} className="dash-prod-form" noValidate>
          <div className="dash-fila-2">
            <Campo etiqueta="Nombre"><input type="text" maxLength={80} placeholder="Ej: Coca-Cola 1.5 Lts" className="dash-input" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
            <Campo etiqueta="Precio ($)"><input type="number" min="0" step="1" inputMode="numeric" placeholder="6000" className="dash-input" value={precio} onChange={(e) => setPrecio(e.target.value)} /></Campo>
          </div>

          <div className="dash-prod-icono-fila">
            <Segmentado etiqueta="Tipo de miniatura" opciones={OPCIONES_ICONO} valor={tipoIcono} onCambio={setTipoIcono} />
            {tipoIcono === 'emoji' ? (
              <label className="dash-prod-emoji"><Smile size={16} aria-hidden="true" />
                <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} aria-label="Emoji del producto" />
              </label>
            ) : (
              <label className="dash-btn dash-btn--secundario"><UploadCloud size={16} /> {imagenFile ? `${imagenFile.name.slice(0, 24)} ✓` : 'Subir foto'}
                <input type="file" accept={TIPOS_IMAGEN_ACEPTADOS} className="dash-solo-lector" onChange={(e) => setImagenFile(e.target.files?.[0] || null)} />
              </label>
            )}
            <button type="submit" className="dash-btn dash-btn--primario dash-prod-agregar" disabled={agregando}><Plus size={16} /> {agregando ? 'Guardando…' : 'Agregar al kiosco'}</button>
          </div>
          {errorForm && <p className="dash-error" role="alert">{errorForm}</p>}
        </form>
      </Panel>

      <Panel titulo="Tus productos" descripcion={productos.length ? `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'} · los ocultos no se le muestran a los jugadores.` : undefined} flush>
        {error && <p className="dash-error dash-prod-error" role="alert">{error}</p>}
        {cargando ? (
          <p className="dash-nada dash-prod-cargando">Cargando productos…</p>
        ) : productos.length === 0 ? (
          <Vacio icono={Package} titulo="Todavía no agregaste productos" texto="Sumá bebidas o alquileres y los jugadores podrán pedirlos al reservar." />
        ) : (
          <ul className="dash-prod-lista">
            {productos.map((p) => {
              const enEdicion = editando?.id === p.id;
              return (
                <li key={p.id} className={`dash-prod ${p.activo === false ? 'oculto' : ''}`}>
                  <Miniatura icono={p.icono} nombre={p.nombre} />
                  {enEdicion ? (
                    <div className="dash-prod-edicion">
                      <input type="text" maxLength={80} className="dash-input" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} aria-label="Nombre del producto" />
                      <input type="number" min="0" step="1" inputMode="numeric" className="dash-input" value={editando.precio} onChange={(e) => setEditando({ ...editando, precio: e.target.value })} aria-label="Precio del producto" />
                      <div className="dash-prod-acciones">
                        <button type="button" className="dash-btn dash-btn--primario dash-btn--chico" onClick={guardarEdicion}>Guardar</button>
                        <button type="button" className="dash-btn dash-btn--secundario dash-btn--chico" onClick={() => { setEditando(null); setErrorEdicion(''); }}>Cancelar</button>
                      </div>
                      {errorEdicion && <p className="dash-error" role="alert">{errorEdicion}</p>}
                    </div>
                  ) : (
                    <>
                      <div className="dash-prod-info">
                        <strong>{p.nombre}</strong>
                        <span>{moneda(p.precio)}</span>
                      </div>
                      {p.activo === false && <Chip tono="ambar">Oculto</Chip>}
                      <div className="dash-prod-acciones">
                        <button type="button" className="dash-btn dash-btn--secundario dash-btn--chico" onClick={() => cambiarActivo(p)}>{p.activo === false ? 'Mostrar' : 'Ocultar'}</button>
                        <button type="button" className="dash-icon-btn" onClick={() => { setErrorEdicion(''); setEditando({ id: p.id, nombre: p.nombre, precio: String(p.precio) }); }} aria-label={`Editar ${p.nombre}`}><Pencil size={16} /></button>
                        <button type="button" className="dash-icon-btn dash-icon-btn--peligro" onClick={() => setAEliminar(p)} aria-label={`Eliminar ${p.nombre}`}><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {aEliminar && (
        <ModalConfirmar
          titulo="¿Eliminar este producto?"
          texto={`“${aEliminar.nombre}” dejará de estar disponible. Las reservas que ya lo incluyen no cambian. Si solo querés pausarlo, usá “Ocultar”.`}
          textoBoton="Eliminar"
          onConfirmar={eliminar}
          onCerrar={() => setAEliminar(null)}
        />
      )}
    </>
  );
};

export default Kiosco;
