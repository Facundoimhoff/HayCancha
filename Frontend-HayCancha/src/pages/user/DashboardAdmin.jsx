import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, TrendingUp, Clock 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  
  // Estado para controlar qué "pantalla" estamos viendo
  const [vistaActual, setVistaActual] = useState('general');

  // Estados de datos
  const [metricas, setMetricas] = useState({
    ingresosHoy: 0,
    turnosHoy: 0,
    ingresosMes: 0,
    horaPico: '-'
  });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [proximosTurnos, setProximosTurnos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: canchas } = await supabase.from('canchas').select('*');
        const { data: turnos } = await supabase.from('turnos').select('*').order('fecha', { ascending: true }).order('hora_inicio', { ascending: true });

        const hoy = new Date().toISOString().split('T')[0];
        const mesActual = hoy.substring(0, 7);

        let ingresosDelMes = 0;
        let ingresosDeHoy = 0;
        let cantidadTurnosHoy = 0;
        const gananciasPorCancha = {};
        const conteoHoras = {};

        if (canchas) {
          canchas.forEach(c => gananciasPorCancha[c.id] = { nombre: c.nombre, ganancias: 0 });
        }

        const turnosFuturos = [];

        if (turnos && canchas) {
          turnos.forEach(turno => {
            const canchaDelTurno = canchas.find(c => c.id === turno.cancha_id);
            const precio = canchaDelTurno ? Number(canchaDelTurno.precio_hora) : 0;

            // Cálculos del mes
            if (turno.fecha.startsWith(mesActual)) {
              ingresosDelMes += precio;
              if (canchaDelTurno) gananciasPorCancha[turno.cancha_id].ganancias += precio;
              
              // Contar horas para sacar la hora pico
              conteoHoras[turno.hora_inicio] = (conteoHoras[turno.hora_inicio] || 0) + 1;
            }

            // Cálculos de hoy
            if (turno.fecha === hoy) {
              ingresosDeHoy += precio;
              cantidadTurnosHoy += 1;
            }

            // Turnos próximos
            if (turno.fecha >= hoy) {
              turnosFuturos.push({
                ...turno,
                nombre_cancha: canchaDelTurno ? canchaDelTurno.nombre : 'Eliminada'
              });
            }
          });
        }

        // Calcular hora pico
        let horaMasDemandada = '-';
        let maxRep = 0;
        for (const hora in conteoHoras) {
          if (conteoHoras[hora] > maxRep) {
            maxRep = conteoHoras[hora];
            horaMasDemandada = hora;
          }
        }

        setMetricas({
          ingresosHoy: ingresosDeHoy,
          turnosHoy: cantidadTurnosHoy,
          ingresosMes: ingresosDelMes,
          horaPico: horaMasDemandada
        });

        setDatosGrafico(Object.values(gananciasPorCancha).sort((a, b) => b.ganancias - a.ganancias));
        setProximosTurnos(turnosFuturos.slice(0, 8)); // Últimos 8 turnos

      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (cargando) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>Cargando sistema...</div>;

  // --- COMPONENTES DE LAS PANTALLAS INTERNAS ---

  const PantallaGeneral = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Vista General de Hoy</h2>
      
      {/* Tarjetas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '10px' }}><DollarSign size={24} color="#16a34a" /></div>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>Caja de Hoy</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>${metricas.ingresosHoy}</h3>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '10px' }}><CalendarIcon size={24} color="#2563eb" /></div>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>Turnos para Hoy</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>{metricas.turnosHoy}</h3>
          </div>
        </div>
      </div>

      {/* Tabla de agenda */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} /> Agenda Próxima</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proximosTurnos.length === 0 ? <p style={{ color: '#6b7280' }}>No hay turnos agendados.</p> : proximosTurnos.map(turno => (
            <div key={turno.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#111827', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>{turno.hora_inicio}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{turno.nombre_cliente}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{turno.fecha.split('-').reverse().join('/')} • {turno.nombre_cancha}</p>
                </div>
              </div>
              <a href={`https://wa.me/${turno.telefono_cliente}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#25D366', color: '#fff', padding: '8px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>WhatsApp</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PantallaMetricas = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Análisis y Métricas Mensuales</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>Proyección Mensual</p>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem' }}>${metricas.ingresosMes}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>Horario más Demandado</p>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem' }}>{metricas.horaPico} hs</h3>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: '400px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Ganancias por Cancha</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => [`$${value}`, 'Recaudado']} />
            <Bar dataKey="ganancias" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const PantallaAjustes = () => (
    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
      <Settings size={48} color="#9ca3af" style={{ marginBottom: '15px' }} />
      <h2>Configuración del Club</h2>
      <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>Acá construiremos el panel para que el administrador pueda cambiar los precios de las canchas, horarios de apertura y datos del club.</p>
    </div>
  );

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui' }}>
      
      {/* SIDEBAR LATERAL */}
      <aside style={{ width: '250px', backgroundColor: '#111827', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp color="#3b82f6" /> HayCancha Admin
          </h2>
        </div>
        
        <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setVistaActual('general')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'general' ? '#1f2937' : 'transparent', color: vistaActual === 'general' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LayoutDashboard size={20} /> Vista General
          </button>
          <button onClick={() => setVistaActual('metricas')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'metricas' ? '#1f2937' : 'transparent', color: vistaActual === 'metricas' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BarChart3 size={20} /> Métricas
          </button>
          <button onClick={() => setVistaActual('ajustes')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'ajustes' ? '#1f2937' : 'transparent', color: vistaActual === 'ajustes' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Settings size={20} /> Ajustes
          </button>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}>
          <button onClick={cerrarSesion} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO CENTRAL */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {vistaActual === 'general' && <PantallaGeneral />}
        {vistaActual === 'metricas' && <PantallaMetricas />}
        {vistaActual === 'ajustes' && <PantallaAjustes />}
      </main>

    </div>
  );
};

export default DashboardAdmin;