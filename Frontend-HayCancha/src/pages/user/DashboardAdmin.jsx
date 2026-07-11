import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, TrendingUp, Clock, Plus, Edit 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('general');
  const [errorAcceso, setErrorAcceso] = useState(false);

  // Estados Globales
  const [miClub, setMiClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [datosGrafico, setDatosGrafico] = useState([]);
  
  // Nuevo estado para las métricas detalladas
  const [metricas, setMetricas] = useState({ 
    ingresosDia: 0, 
    ingresosSemana: 0, 
    ingresosMes: 0, 
    turnosMes: 0, 
    horaPico: '-' 
  });

  // Selector de filtro para la pantalla de métricas ('dia', 'semana', 'mes')
  const [filtroTiempo, setFiltroTiempo] = useState('mes');

  // Estados para Modal de Turno Manual
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  const [guardandoTurno, setGuardandoTurno] = useState(false);

  const cargarDatos = async () => {
    try {
      // 1. ¿QUIÉN INICIÓ SESIÓN?
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // 2. ¿QUÉ CLUB LE PERTENECE A ESTE CORREO?
      const { data: clubData, error: clubError } = await supabase
        .from('clubes')
        .select('*')
        .eq('admin_email', user.email)
        .single();

      if (clubError || !clubData) {
        setErrorAcceso(true);
        setCargando(false);
        return;
      }

      setMiClub(clubData);

      // 3. TRAEMOS CANCHAS
      const { data: canchasData } = await supabase
        .from('canchas')
        .select('*')
        .eq('club_id', clubData.id);

      if (canchasData) setCanchas(canchasData);

      if (!canchasData || canchasData.length === 0) {
        setCargando(false);
        return;
      }

      // 4. TRAEMOS TURNOS
      const idsCanchas = canchasData.map(c => c.id);
      const { data: turnosData } = await supabase
        .from('turnos')
        .select('*')
        .in('cancha_id', idsCanchas)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });

      // --- CÁLCULO DE FECHAS Y MÉTRICAS ACTUALIZADO ---
      const hoyDate = new Date();
      const hoy = hoyDate.toISOString().split('T')[0];
      const mesActual = hoy.substring(0, 7);

      // Calcular la fecha del Lunes de esta semana
      const diaSemana = hoyDate.getDay() || 7; // Convertimos Domingo (0) a 7
      const lunesDate = new Date(hoyDate);
      lunesDate.setDate(hoyDate.getDate() - diaSemana + 1);
      const inicioSemana = lunesDate.toISOString().split('T')[0];

      let ingMes = 0, ingSem = 0, ingDia = 0, turMes = 0;
      const gananciasPorCancha = {};
      const conteoHoras = {};
      const mapaClientes = {};
      const turnosFuturos = [];

      canchasData.forEach(c => gananciasPorCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

      if (turnosData) {
        turnosData.forEach(turno => {
          const canchaDelTurno = canchasData.find(c => c.id === turno.cancha_id);
          const precio = canchaDelTurno ? Number(canchaDelTurno.precio_hora) : 0;

          // Clientes
          if (!mapaClientes[turno.telefono_cliente]) {
            mapaClientes[turno.telefono_cliente] = { nombre: turno.nombre_cliente, telefono: turno.telefono_cliente, cantidad_reservas: 0 };
          }
          mapaClientes[turno.telefono_cliente].cantidad_reservas += 1;

          // Cálculos Mensuales (para la general y métricas)
          if (turno.fecha.startsWith(mesActual)) {
            ingMes += precio;
            turMes += 1;
            if (canchaDelTurno) gananciasPorCancha[turno.cancha_id].ganancias += precio;
            conteoHoras[turno.hora_inicio] = (conteoHoras[turno.hora_inicio] || 0) + 1;
          }

          // Cálculos Semanales
          if (turno.fecha >= inicioSemana && turno.fecha <= hoy) {
            ingSem += precio;
          }

          // Cálculos Diarios
          if (turno.fecha === hoy) {
            ingDia += precio;
          }

          // Agenda próxima
          if (turno.fecha >= hoy) {
            turnosFuturos.push({ ...turno, nombre_cancha: canchaDelTurno ? canchaDelTurno.nombre : 'Eliminada' });
          }
        });
      }

      let horaMasDemandada = '-';
      let maxRep = 0;
      for (const hora in conteoHoras) {
        if (conteoHoras[hora] > maxRep) { maxRep = conteoHoras[hora]; horaMasDemandada = hora; }
      }

      setClientes(Object.values(mapaClientes).sort((a, b) => b.cantidad_reservas - a.cantidad_reservas));
      setDatosGrafico(Object.values(gananciasPorCancha).sort((a, b) => b.ganancias - a.ganancias));
      setProximosTurnos(turnosFuturos);
      
      // Guardamos todos los datos calculados en el estado central
      setMetricas({ 
        ingresosDia: ingDia, 
        ingresosSemana: ingSem, 
        ingresosMes: ingMes, 
        turnosMes: turMes, 
        horaPico: horaMasDemandada 
      });

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const cancelarTurno = async (idTurno) => {
    if (!window.confirm("¿Cancelar y eliminar este turno?")) return;
    try {
      await supabase.from('turnos').delete().eq('id', idTurno);
      cargarDatos(); 
    } catch (error) { alert("Error al cancelar el turno."); }
  };

  const crearTurnoManual = async (e) => {
    e.preventDefault();
    setGuardandoTurno(true);
    try {
      const { error } = await supabase.from('turnos').insert([formTurno]);
      if (error) throw error;
      alert("Turno guardado correctamente");
      setMostrarModal(false);
      setFormTurno({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
      cargarDatos();
    } catch (error) {
      alert("Error al guardar el turno.");
    } finally {
      setGuardandoTurno(false);
    }
  };

  const cambiarPrecioCancha = async (id, precioActual) => {
    const nuevoPrecio = window.prompt("Ingresá el nuevo precio por hora:", precioActual);
    if (!nuevoPrecio || isNaN(nuevoPrecio)) return;
    try {
      const { error } = await supabase.from('canchas').update({ precio_hora: Number(nuevoPrecio) }).eq('id', id);
      if (error) throw error;
      cargarDatos();
    } catch (error) { alert("Error al actualizar el precio"); }
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (cargando) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>Cargando sistema...</div>;
  if (errorAcceso) return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}><h2 style={{ color: '#ef4444' }}>Acceso Denegado</h2><button onClick={cerrarSesion} style={{ padding: '10px 20px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Volver</button></div>;

  // --- PANTALLA GENERAL (ACTUALIZADA AL MES) ---
  const PantallaGeneral = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Vista General (Este Mes)</h2>
        <button onClick={() => setMostrarModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Plus size={18} /> Nuevo Turno Manual
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '10px' }}><DollarSign size={24} color="#16a34a" /></div>
          <div><p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>Caja Acumulada</p><h3 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>${metricas.ingresosMes}</h3></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e5e7eb' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '10px' }}><CalendarIcon size={24} color="#2563eb" /></div>
          <div><p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 'bold' }}>Turnos del Mes</p><h3 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>{metricas.turnosMes}</h3></div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} /> Agenda Próxima</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proximosTurnos.length === 0 ? <p style={{ color: '#6b7280' }}>No hay turnos agendados.</p> : proximosTurnos.slice(0,10).map(turno => (
            <div key={turno.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#111827', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>{turno.hora_inicio}</span>
                <div><p style={{ margin: 0, fontWeight: 'bold' }}>{turno.nombre_cliente}</p><p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{turno.fecha.split('-').reverse().join('/')} • {turno.nombre_cancha}</p></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => cancelarTurno(turno.id)} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <a href={`https://wa.me/${turno.telefono_cliente}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#25D366', color: '#fff', padding: '8px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- PANTALLA MÉTRICAS (CON SELECTOR DE TIEMPO) ---
  const PantallaMetricas = () => {
    // Lógica dinámica para mostrar el número y el título según el filtro
    const valorRecaudacion = 
      filtroTiempo === 'dia' ? metricas.ingresosDia : 
      filtroTiempo === 'semana' ? metricas.ingresosSemana : 
      metricas.ingresosMes;

    const textoRecaudacion = 
      filtroTiempo === 'dia' ? 'Recaudación de Hoy' : 
      filtroTiempo === 'semana' ? 'Recaudación de Esta Semana' : 
      'Recaudación de Este Mes';

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#111827' }}>Análisis y Métricas</h2>
          
          {/* Selector de Filtro */}
          <select 
            value={filtroTiempo} 
            onChange={(e) => setFiltroTiempo(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: 'bold', color: '#374151', cursor: 'pointer', outline: 'none' }}
          >
            <option value="dia">Ver Hoy</option>
            <option value="semana">Ver Esta Semana</option>
            <option value="mes">Ver Este Mes</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>{textoRecaudacion}</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#16a34a' }}>${valorRecaudacion}</h3>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>Horario Pico (Mes)</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2rem' }}>{metricas.horaPico} hs</h3>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: '350px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Ganancias por Cancha (Mes)</h3>
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
  };

  const PantallaClientes = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Mi Base de Clientes</h2>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280' }}>
              <th style={{ padding: '10px' }}>Nombre del Cliente</th>
              <th style={{ padding: '10px' }}>Teléfono</th>
              <th style={{ padding: '10px' }}>Reservas Totales</th>
              <th style={{ padding: '10px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Aún no hay clientes registrados.</td></tr> : clientes.map((cli, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{cli.nombre} {index === 0 && '👑'}</td>
                <td style={{ padding: '15px 10px' }}>{cli.telefono}</td>
                <td style={{ padding: '15px 10px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{cli.cantidad_reservas} turnos</span>
                </td>
                <td style={{ padding: '15px 10px' }}>
                  <a href={`https://wa.me/${cli.telefono}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}>Enviar Promo</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PantallaAjustes = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Mis Canchas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {canchas.length === 0 ? <p>No tenés canchas cargadas todavía.</p> : canchas.map(cancha => (
          <div key={cancha.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{cancha.nombre}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>{cancha.tipo} • Precio actual: <strong style={{ color: '#111827' }}>${cancha.precio_hora}</strong></p>
            </div>
            <button onClick={() => cambiarPrecioCancha(cancha.id, cancha.precio_hora)} style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Edit size={16} /> Editar Precio
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui' }}>
      <aside style={{ width: '250px', backgroundColor: '#111827', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af' }}><TrendingUp color="#3b82f6" /> Panel Admin</h2>
          {miClub && <h3 style={{ margin: '10px 0 0 0', color: '#fff', fontSize: '1.2rem' }}>{miClub.nombre}</h3>}
        </div>
        <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setVistaActual('general')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'general' ? '#1f2937' : 'transparent', color: vistaActual === 'general' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><LayoutDashboard size={20} /> General</button>
          <button onClick={() => setVistaActual('metricas')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'metricas' ? '#1f2937' : 'transparent', color: vistaActual === 'metricas' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><BarChart3 size={20} /> Métricas</button>
          <button onClick={() => setVistaActual('clientes')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'clientes' ? '#1f2937' : 'transparent', color: vistaActual === 'clientes' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Users size={20} /> Mis Clientes</button>
          <button onClick={() => setVistaActual('ajustes')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: vistaActual === 'ajustes' ? '#1f2937' : 'transparent', color: vistaActual === 'ajustes' ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Settings size={20} /> Mis Canchas</button>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #1f2937' }}><button onClick={cerrarSesion} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><LogOut size={20} /> Cerrar Sesión</button></div>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        {vistaActual === 'general' && <PantallaGeneral />}
        {vistaActual === 'metricas' && <PantallaMetricas />}
        {vistaActual === 'clientes' && <PantallaClientes />}
        {vistaActual === 'ajustes' && <PantallaAjustes />}
      </main>

      {/* MODAL DE CARGA MANUAL */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Agendar Turno Manual</h2>
            <form onSubmit={crearTurnoManual} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Cancha</label>
                <select required value={formTurno.cancha_id} onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                  <option value="">Seleccioná una cancha...</option>
                  {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.precio_hora})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Fecha</label>
                  <input type="date" required value={formTurno.fecha} onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Hora (Ej: 18:00)</label>
                  <input type="time" required value={formTurno.hora_inicio} onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Nombre del Cliente</label>
                <input type="text" required placeholder="Ej: Juan Pérez" value={formTurno.nombre_cliente} onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Teléfono</label>
                <input type="text" required placeholder="Ej: 3415123456" value={formTurno.telefono_cliente} onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardandoTurno} style={{ flex: 1, padding: '12px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {guardandoTurno ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;