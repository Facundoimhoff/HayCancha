import { useMemo, useState } from 'react';
import { Search, MessageCircle, Users, UserRound } from 'lucide-react';
import { Panel, Chip, Vacio } from '../components/ui.jsx';
import { moneda, fechaCorta, iniciales, pluralizar } from '../lib/formato.js';
import { clientesDe } from '../lib/metricas.js';

const Clientes = ({ turnos }) => {
  const [busqueda, setBusqueda] = useState('');
  const clientes = useMemo(() => clientesDe(turnos.filter((t) => t.fecha)), [turnos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nombre?.toLowerCase().includes(q) || String(c.telefono).includes(q));
  }, [clientes, busqueda]);

  const recurrentes = clientes.filter((c) => c.turnos >= 3).length;
  const gastoPromedio = clientes.length ? Math.round(clientes.reduce((a, c) => a + c.gastado, 0) / clientes.length) : 0;

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Clientes</h1>
          <p>Directorio de jugadores que reservaron en tu club</p>
        </div>
      </header>

      <div className="dash-resumen-chips">
        <Chip tono="azul"><Users size={14} /> {pluralizar(clientes.length, 'cliente', 'clientes')}</Chip>
        <Chip tono="verde"><UserRound size={14} /> {recurrentes} recurrentes (3+ turnos)</Chip>
        <Chip tono="neutro">Gasto promedio {moneda(gastoPromedio)}</Chip>
      </div>

      <Panel
        titulo="Todos los clientes"
        descripcion="Ordenados por lo que más gastaron"
        acciones={
          <label className="dash-buscador">
            <Search size={16} />
            <input type="search" placeholder="Buscar por nombre o teléfono" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </label>
        }
        flush
      >
        {visibles.length === 0 ? (
          <Vacio icono={Users} titulo={clientes.length ? 'No encontramos coincidencias' : 'Todavía no hay clientes'}
            texto={clientes.length ? 'Probá con otro nombre o número.' : 'Cuando alguien reserve una cancha, va a aparecer acá.'} />
        ) : (
          <div className="dash-tabla-scroll">
            <table className="dash-tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="ocultar-sm">Teléfono</th>
                  <th className="num">Turnos</th>
                  <th className="num">Gastado</th>
                  <th className="ocultar-sm">Última visita</th>
                  <th aria-label="Contactar" />
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => (
                  <tr key={c.telefono}>
                    <td>
                      <div className="dash-celda-persona">
                        <span className="dash-avatar">{iniciales(c.nombre)}</span>
                        <strong>{c.nombre}</strong>
                      </div>
                    </td>
                    <td className="ocultar-sm">{c.telefono}</td>
                    <td className="num"><Chip tono={c.turnos >= 3 ? 'verde' : 'neutro'}>{c.turnos}</Chip></td>
                    <td className="num"><strong>{moneda(c.gastado)}</strong></td>
                    <td className="ocultar-sm">{c.ultima ? fechaCorta(c.ultima) : '—'}</td>
                    <td className="acciones">
                      <a className="dash-icon-btn" href={`https://wa.me/${String(c.telefono).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label={`Escribirle a ${c.nombre} por WhatsApp`} title="WhatsApp">
                        <MessageCircle size={17} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

export default Clientes;
