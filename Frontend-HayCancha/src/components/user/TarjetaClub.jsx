import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, CloudRain, Car, LayoutGrid, Trophy } from 'lucide-react';
import { Calificacion } from './Estrellas';
import { deportesDelClub, precioDesde, moneda } from '../../utils/reservas';
import './componentes.css';

/**
 * Tarjeta de un club para las listas (explorar y buscar).
 * club: fila de `clubes` con `canchas` embebidas; resumen: { promedio, cantidad } o undefined.
 */
export default function TarjetaClub({ club, resumen }) {
  const canchas = club.canchas || [];
  const deportes = deportesDelClub(club);
  const desde = precioDesde(club);
  const techada = club.techada === true || canchas.some((c) => c.techada);
  const foto = (club.imagen_url || '').split(',')[0].trim();

  return (
    <Link to={`/club/${club.id}`} className="gp-tc">
      <div className={`gp-tc-media ${foto ? '' : 'gp-tc-media--vacio'}`}>
        {foto ? <img src={foto} alt="" loading="lazy" /> : <Trophy size={56} className="gp-tc-marca" aria-hidden="true" />}
        <div className="gp-tc-degradado" />
        <Calificacion resumen={resumen} className="gp-tc-calif" />
        <span className="gp-tc-abierto">Reservas abiertas</span>
        <div className="gp-tc-titulo">
          <h2>{club.nombre}</h2>
          <p><MapPin size={15} /> {club.direccion || club.ciudad}</p>
        </div>
      </div>

      <div className="gp-tc-pie">
        <div className="gp-tc-datos">
          {deportes.slice(0, 3).map((d) => <span key={d} className="gp-chip gp-chip--marca">{d}</span>)}
          <span className="gp-chip"><LayoutGrid size={13} /> {canchas.length} {canchas.length === 1 ? 'cancha' : 'canchas'}</span>
          {techada && <span className="gp-chip"><CloudRain size={13} /> Techada</span>}
          {club.estacionamiento && <span className="gp-chip"><Car size={13} /> Estacionamiento</span>}
        </div>

        <div className="gp-tc-accion">
          {desde > 0 && (
            <div className="gp-tc-precio">
              <small>Desde</small>
              <strong>{moneda(desde)}</strong>
              <small>/hora</small>
            </div>
          )}
          <span className="gp-tc-cta">Ver turnos <ChevronRight size={18} /></span>
        </div>
      </div>
    </Link>
  );
}
