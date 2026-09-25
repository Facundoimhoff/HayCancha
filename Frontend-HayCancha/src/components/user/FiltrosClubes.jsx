import { CloudRain, X } from 'lucide-react';
import { hayFiltros, FILTROS_INICIALES } from '../../utils/filtrosClubes';
import './componentes.css';

/** Barra de filtros compartida por "Explorar" y "Buscar". `filtros` es { deporte, jugadores, techada, orden }. */
export default function FiltrosClubes({ filtros, onCambio }) {
  const cambiar = (parche) => onCambio({ ...filtros, ...parche });

  return (
    <div className="gp-filtros" role="search" aria-label="Filtrar clubes">
      <select aria-label="Deporte" value={filtros.deporte} onChange={(e) => cambiar({ deporte: e.target.value })}>
        <option value="">Todos los deportes</option>
        <option value="Fútbol">Fútbol</option>
        <option value="Pádel">Pádel</option>
        <option value="Tenis">Tenis</option>
      </select>

      <select aria-label="Cantidad de jugadores" value={filtros.jugadores} onChange={(e) => cambiar({ jugadores: e.target.value })}>
        <option value="">Jugadores</option>
        <option value="5">Fútbol 5</option>
        <option value="7">Fútbol 7</option>
        <option value="11">Fútbol 11</option>
        <option value="4">Dobles (Pádel / Tenis)</option>
      </select>

      <select aria-label="Ordenar" value={filtros.orden} onChange={(e) => cambiar({ orden: e.target.value })}>
        <option value="">Recomendados</option>
        <option value="mejor">Mejor calificados</option>
        <option value="menor">Precio: menor a mayor</option>
        <option value="mayor">Precio: mayor a menor</option>
      </select>

      <button type="button" className={`gp-toggle ${filtros.techada ? 'activo' : ''}`} aria-pressed={filtros.techada} onClick={() => cambiar({ techada: !filtros.techada })}>
        <CloudRain size={16} /> Techada
      </button>

      {hayFiltros(filtros) && (
        <button type="button" className="gp-filtros-limpiar" onClick={() => onCambio(FILTROS_INICIALES)}>
          <X size={14} /> Limpiar
        </button>
      )}
    </div>
  );
}
