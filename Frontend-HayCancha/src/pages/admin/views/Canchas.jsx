import { Plus, Pencil, Trash2, Image as ImageIcon, Clock, Users, Layers, Umbrella } from 'lucide-react';
import { Chip, Vacio } from '../components/ui.jsx';
import { moneda } from '../lib/formato.js';
import { OPCIONES_DEPORTE, normalizarDeporte } from '../lib/deportes.js';

const TONO_DEPORTE = { 'Fútbol': 'verde', 'Pádel': 'azul', 'Tenis': 'ambar', 'Básquet': 'violeta' };

const TarjetaCancha = ({ cancha, onEditar, onEliminar }) => {
  const foto = cancha.imagen_url ? cancha.imagen_url.split(',')[0] : null;
  const deporte = normalizarDeporte(cancha.deporte);
  const opciones = OPCIONES_DEPORTE[deporte];
  const jugadores = cancha.cantidad_jugadores || opciones.jugadores[0].value;
  const superficie = cancha.superficie || opciones.superficies[0];

  return (
    <article className="dash-cancha">
      <div className={`dash-cancha-foto ${foto ? '' : 'sin-foto'}`}>
        {foto ? <img src={foto} alt={cancha.nombre} loading="lazy" /> : <ImageIcon size={30} />}
        <Chip tono={TONO_DEPORTE[deporte]} className="dash-cancha-deporte">{deporte}</Chip>
      </div>
      <div className="dash-cancha-cuerpo">
        <div className="dash-cancha-titulo">
          <h3>{cancha.nombre}</h3>
          <strong className="dash-cancha-precio">{moneda(cancha.precio_hora)}<small> / hora</small></strong>
        </div>
        <ul className="dash-cancha-datos">
          <li><Clock size={14} />{(cancha.hora_apertura || '08:00').slice(0, 5)} a {(cancha.hora_cierre || '23:00').slice(0, 5)} hs</li>
          <li><Users size={14} />{jugadores} jugadores</li>
          <li><Layers size={14} />{superficie}</li>
          {cancha.techada && <li><Umbrella size={14} />Techada</li>}
        </ul>
        <div className="dash-cancha-acciones">
          <button type="button" className="dash-btn dash-btn--secundario dash-btn--chico" onClick={() => onEditar(cancha)}><Pencil size={14} /> Editar</button>
          <button type="button" className="dash-btn dash-btn--peligro-suave dash-btn--chico" onClick={() => onEliminar(cancha)} aria-label={`Eliminar ${cancha.nombre}`}><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  );
};

const Canchas = ({ canchas, onNueva, onEditar, onEliminar }) => (
  <>
    <header className="dash-page-head">
      <div>
        <h1>Canchas</h1>
        <p>Instalaciones, precios y horarios de tu complejo</p>
      </div>
      <div className="dash-page-acciones">
        <button type="button" className="dash-btn dash-btn--primario" onClick={onNueva}><Plus size={16} /> Agregar cancha</button>
      </div>
    </header>

    {canchas.length === 0 ? (
      <div className="dash-panel">
        <Vacio icono={ImageIcon} titulo="Todavía no cargaste canchas" texto="Agregá tu primera cancha para empezar a recibir reservas."
          accion={<button type="button" className="dash-btn dash-btn--primario" onClick={onNueva}><Plus size={16} /> Agregar cancha</button>} />
      </div>
    ) : (
      <div className="dash-grid dash-grid--canchas">
        {canchas.map((c) => <TarjetaCancha key={c.id} cancha={c} onEditar={onEditar} onEliminar={onEliminar} />)}
      </div>
    )}
  </>
);

export default Canchas;
