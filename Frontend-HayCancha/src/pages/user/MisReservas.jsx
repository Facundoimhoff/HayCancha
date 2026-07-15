import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Search, CalendarX2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MisReservas = () => {
  const [telefonoBusqueda, setTelefonoBusqueda] = useState('');
  const [misTurnos, setMisTurnos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Buscar los turnos asociados al teléfono
  const buscarMisTurnos = async (e) => {
    e.preventDefault();
    if (!telefonoBusqueda.trim()) return;

    setBuscando(true);
    setBusquedaRealizada(true);

    try {
      const hoy = new Date().toISOString().split('T')[0];

      // 1. Buscamos los turnos del cliente de hoy en adelante
      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('*')
        .eq('telefono_cliente', telefonoBusqueda)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true });

      if (errorTurnos) throw errorTurnos;

      // 2. Buscamos los nombres de las canchas para que se vea lindo
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

  // Función del cliente para cancelar SU turno
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#111827' }}>Mis Reservas</h1>
          <button onClick={() => navigate(-1)}>
  Volver
</button>
        </div>

        {/* Buscador por Teléfono */}
        <form onSubmit={buscarMisTurnos} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#4b5563' }}>
            Ingresá el número de teléfono con el que reservaste:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Ej: 3415123456" 
              value={telefonoBusqueda}
              onChange={(e) => setTelefonoBusqueda(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
              required
            />
            <button type="submit" disabled={buscando} style={{ backgroundColor: '#111827', color: '#fff', padding: '0 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} /> {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Resultados de la Búsqueda */}
        {busquedaRealizada && !buscando && (
          <div>
            {misTurnos.length === 0 ? (
              <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
                <CalendarX2 size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
                <h3>No encontramos reservas activas</h3>
                <p>No hay turnos próximos asociados a este número.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {misTurnos.map(turno => (
                  <div key={turno.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', color: '#2563eb' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#111827' }}>{turno.fecha.split('-').reverse().join('/')} a las {turno.hora_inicio}hs</h3>
                        <p style={{ margin: 0, color: '#6b7280' }}>{turno.nombre_cancha}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => cancelarMiTurno(turno.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px 15px', borderRadius: '8px', border: '1px solid #f87171', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
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