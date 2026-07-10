import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LogOut, DollarSign, Calendar as CalendarIcon, TrendingUp, Clock, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  
  // Estados para nuestras métricas y datos
  const [metricas, setMetricas] = useState({
    ingresosMes: 0,
    turnosHoy: 0,
    canchaTop: '-'
  });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [proximosTurnos, setProximosTurnos] = useState([]);

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        // 1. Buscamos todas las canchas para saber sus precios y nombres
        const { data: canchas, error: errorCanchas } = await supabase.from('canchas').select('*');
        if (errorCanchas) throw errorCanchas;

        // 2. Buscamos TODOS los turnos (podrías filtrar por mes, acá traemos todos para la demo)
        const { data: turnos, error: errorTurnos } = await supabase
          .from('turnos')
          .select('*')
          .order('fecha', { ascending: true })
          .order('hora_inicio', { ascending: true });
        if (errorTurnos) throw errorTurnos;

        // --- FECHAS ÚTILES ---
        const hoy = new Date().toISOString().split('T')[0];
        const mesActual = hoy.substring(0, 7); // Ej: "2026-07"

        // --- VARIABLES PARA CÁLCULOS ---
        let ingresosDelMes = 0;
        let cantidadTurnosHoy = 0;
        const gananciasPorCancha = {}; // Para el gráfico de bastones

        // Inicializamos el contador de ganancias por cancha en 0
        canchas.forEach(c => gananciasPorCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

        // --- PROCESAMIENTO DE DATOS ---
        const turnosFuturos = [];

        turnos.forEach(turno => {
          const canchaDelTurno = canchas.find(c => c.id === turno.cancha_id);
          const precio = canchaDelTurno ? Number(canchaDelTurno.precio_hora) : 0;

          // Si el turno es de este mes, sumamos a las ganancias del mes y al gráfico
          if (turno.fecha.startsWith(mesActual)) {
            ingresosDelMes += precio;
            if (canchaDelTurno) {
              gananciasPorCancha[turno.cancha_id].ganancias += precio;
            }
          }

          // Si el turno es de hoy, sumamos al contador
          if (turno.fecha === hoy) {
            cantidadTurnosHoy += 1;
          }

          // Guardamos los turnos de hoy en adelante para la tablita
          if (turno.fecha >= hoy) {
            turnosFuturos.push({
              ...turno,
              nombre_cancha: canchaDelTurno ? canchaDelTurno.nombre : 'Eliminada'
            });
          }
        });

        // Preparamos los datos para el gráfico de Recharts (convertimos el objeto en un array)
        const arrayGrafico = Object.values(gananciasPorCancha).sort((a, b) => b.ganancias - a.ganancias);
        
        // Calculamos la cancha que más recaudó
        const canchaTop = arrayGrafico.length > 0 && arrayGrafico[0].ganancias > 0 
          ? arrayGrafico[0].nombre 
          : 'Aún sin datos';

        // Actualizamos los estados para que React dibuje la pantalla
        setMetricas({
          ingresosMes: ingresosDelMes,
          turnosHoy: cantidadTurnosHoy,
          canchaTop: canchaTop
        });
        setDatosGrafico(arrayGrafico);
        setProximosTurnos(turnosFuturos.slice(0, 5)); // Mostramos solo los 5 más próximos

      } catch (error) {
        console.error("Error al cargar datos:", error);
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

  if (cargando) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '1.2rem', fontWeight: 'bold' }}>
      Cargando métricas del club...
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '30px 20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER DEL DASHBOARD */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111827', fontWeight: '800' }}>Panel Administrativo</h1>
          <p style={{ margin: 0, color: '#6b7280', marginTop: '4px' }}>Resumen de actividad y rendimiento</p>
        </div>
        <button 
          onClick={cerrarSesion}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
        >
          <LogOut size={18} /> Salir
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TARJETAS DE INDICADORES (KPIs) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          {/* Tarjeta 1: Ingresos */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#dcfce7', padding: '16px', borderRadius: '12px', marginRight: '20px' }}>
              <DollarSign size={32} color="#16a34a" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos del Mes</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', color: '#111827', fontWeight: '800' }}>${metricas.ingresosMes}</h2>
            </div>
          </div>

          {/* Tarjeta 2: Turnos de Hoy */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', marginRight: '20px' }}>
              <CalendarIcon size={32} color="#2563eb" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Turnos para Hoy</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', color: '#111827', fontWeight: '800' }}>{metricas.turnosHoy}</h2>
            </div>
          </div>

          {/* Tarjeta 3: Cancha más rentable */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '12px', marginRight: '20px' }}>
              <TrendingUp size={32} color="#d97706" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancha Estrella</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', color: '#111827', fontWeight: '800' }}>{metricas.canchaTop}</h2>
            </div>
          </div>

        </div>

        {/* CONTENEDOR PRINCIPAL: GRÁFICO Y TABLA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          {/* Gráfico de Bastones (Ganancias por Cancha) */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#6b7280" /> Rendimiento por Cancha (Mes)
            </h3>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 14}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 14}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`$${value}`, 'Recaudado']}
                  />
                  <Bar dataKey="ganancias" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Próximos Turnos (Estilo Moderno) */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#6b7280" /> Agenda Próxima
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {proximosTurnos.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                  <CalendarIcon size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: '10px' }} />
                  <p>No hay reservas próximas registradas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {proximosTurnos.map((turno) => (
                    <div key={turno.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', border: '1px solid #f3f4f6', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
                          {turno.hora_inicio}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Users size={16} color="#6b7280" /> {turno.nombre_cliente}
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                            {turno.fecha.split('-').reverse().join('/')} • {turno.nombre_cancha}
                          </p>
                        </div>
                      </div>

                      <a 
                        href={`https://wa.me/${turno.telefono_cliente}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', transition: 'opacity 0.2s' }}
                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        WhatsApp
                      </a>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;