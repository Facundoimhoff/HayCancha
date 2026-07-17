import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Search, CalendarX2, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// IMPORTANTE: Importar CSS
import './MisReservas.css';

const MisReservas = () => {
  const navigate = useNavigate(); 
  const [telefonoBusqueda, setTelefonoBusqueda] = useState('');
  const [misTurnos, setMisTurnos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const buscarMisTurnos = async (e) => {
    e.preventDefault();
    if (!telefonoBusqueda.trim()) return;

    setBuscando(true);
    setBusquedaRealizada(true);

    try {
      const hoy = new Date().toISOString().split('T')[0];

      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('*')
        .eq('telefono_cliente', telefonoBusqueda)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true });

      if (errorTurnos) throw errorTurnos;

      const { data: canchas } = await supabase.from('canchas').select('id, nombre');
      
      const turnosCompletos = turnos.map(turno => {
        const cancha = canchas.find(c => c.id === turno.cancha_id);
        return { ...turno, nombre_cancha: cancha ? cancha.nombre : 'Cancha' };
      });

      setMisTurnos(turnosCompletos);
    } catch (error) {
      console.error("Error al buscar turnos:", error);
      alert("Hubo un error al buscar tus reservas.");
    } finally {
      setBuscando(false);
    }
  };

  const cancelarMiTurno = async (idTurno) => {
    const confirmar = window.confirm("¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.");
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('turnos').delete().eq('id', idTurno);
      if (error) throw error;

      setMisTurnos(turnos => turnos.filter(t => t.id !== idTurno));
      alert("Tu reserva fue cancelada correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al intentar cancelar. Por favor, contactá al club.");
    }
  };

  return (
    <div className="mis-reservas-container">
      <div className="mis-reservas-wrapper">
        
        {/* ENCABEZADO */}
        <div className="mis-reservas-header">
          <h1 className="mis-reservas-titulo">Mis Reservas</h1>
          <button onClick={() => navigate(-1)} className="btn-volver-app">
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        {/* Buscador por Teléfono */}
        <form onSubmit={buscarMisTurnos} className="buscador-form">
          <label className="buscador-label">
            Ingresá el número de teléfono con el que reservaste:
          </label>
          <div className="buscador-input-group">
            <input 
              type="text" 
              placeholder="Ej: 3415123456" 
              value={telefonoBusqueda}
              onChange={(e) => setTelefonoBusqueda(e.target.value)}
              className="buscador-input"
              required
            />
            <button 
              type="submit" 
              disabled={buscando} 
              className={`btn-buscar ${buscando ? 'cargando' : 'activo'}`}
            >
              <Search size={18} /> {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Resultados de la Búsqueda */}
        {busquedaRealizada && !buscando && (
          <div className="resultados-container">
            {misTurnos.length === 0 ? (
              <div className="estado-vacio">
                <CalendarX2 size={48} className="estado-vacio-icono" />
                <h3>No encontramos reservas activas</h3>
                <p>No hay turnos próximos asociados a este número.</p>
              </div>
            ) : (
              <div className="lista-turnos">
                {misTurnos.map(turno => (
                  <div key={turno.id} className="turno-card">
                    <div className="turno-info-wrapper">
                      <div className="turno-icono-box">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="turno-fecha">
                          {turno.fecha.split('-').reverse().join('/')} a las {turno.hora_inicio}hs
                        </h3>
                        <p className="turno-cancha">{turno.nombre_cancha}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => cancelarMiTurno(turno.id)}
                      className="btn-cancelar"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MisReservas;