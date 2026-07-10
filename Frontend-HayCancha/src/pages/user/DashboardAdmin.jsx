import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LogOut, DollarSign, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({
    ingresosMes: 0,
    turnosHoy: 0,
  });

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const { data: canchas } = await supabase.from('canchas').select('*');
        const { data: turnos } = await supabase.from('turnos').select('*');

        if (canchas && turnos) {
          let ingresos = 0;
          let hoyCount = 0;
          const hoy = new Date().toISOString().split('T')[0];

          turnos.forEach(turno => {
            const cancha = canchas.find(c => c.id === turno.cancha_id);
            if (cancha && turno.fecha.startsWith(hoy.substring(0, 7))) {
              ingresos += Number(cancha.precio_hora);
            }
            if (turno.fecha === hoy) hoyCount++;
          });

          setMetricas({ ingresosMes: ingresos, turnosHoy: hoyCount });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarDashboard();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (cargando) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando métricas...</div>;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1>Panel Administrativo (Modo Seguro)</h1>
        <button onClick={cerrarSesion} style={{ padding: '10px', color: 'red', cursor: 'pointer' }}>
          <LogOut size={18} /> Salir
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}>
          <DollarSign color="green" />
          <h3>Ingresos: ${metricas.ingresosMes}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', flex: 1 }}>
          <CalendarIcon color="blue" />
          <h3>Turnos Hoy: {metricas.turnosHoy}</h3>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;