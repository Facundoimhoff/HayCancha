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
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  
  // Métricas
  const [metricas, setMetricas] = useState({ 
    ingresosDia: 0, 
    ingresosSemana: 0, 
    ingresosMes: 0, 
    turnosMes: 0, 
    horaPico: '-' 
  });

  // Modal Turno Manual
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  const [guardandoTurno, setGuardandoTurno] = useState(false);

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: clubData } = await supabase
        .from('clubes')
        .select('*')
        .eq('admin_email', user.email)
        .single();

      if (!clubData) { setErrorAcceso(true); setCargando(false); return; }
      setMiClub(clubData);

      const { data: canchasData } = await supabase
        .from('canchas')
        .select('*')
        .eq('club_id', clubData.id);

      setCanchas(canchasData || []);
      if (!canchasData || canchasData.length === 0) { setCargando(false); return; }

      // --- CÁLCULO DE FECHAS LOCALES ---
      const now = new Date();
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const { data: turnosData } = await supabase
        .from('turnos')
        .select('*')
        .in('cancha_id', canchasData.map(c => c.id))
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const ganCancha = {};
      const conteoHoras = {};
      const mapaClientes = {};
      const prox = [];

      canchasData.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;

        if (t.fecha.startsWith(mesActualStr)) {
          iMes += precio;
          tMes += 1;
          if (c) ganCancha[t.cancha_id].ganancias += precio;
          conteoHoras[t.hora_inicio] = (conteoHoras[t.hora_inicio] || 0) + 1;
        }

        if (t.fecha >= semanaStr) iSem += precio;
        if (t.fecha === hoyStr) iDia += precio;

        if (t.fecha >= hoyStr) prox.push({ ...t, nombre_cancha: c?.nombre || '?' });
        
        if (!mapaClientes[t.telefono_cliente]) mapaClientes[t.telefono_cliente] = { nombre: t.nombre_cliente, telefono: t.telefono_cliente, cant: 0 };
        mapaClientes[t.telefono_cliente].cant += 1;
      });

      setMetricas({ ingresosDia: iDia, ingresosSemana: iSem, ingresosMes: iMes, turnosMes: tMes, horaPico: Object.keys(conteoHoras).reduce((a, b) => conteoHoras[a] > conteoHoras[b] ? a : b, '-') });
      setClientes(Object.values(mapaClientes).sort((a, b) => b.cant - a.cant));
      setDatosGrafico(Object.values(ganCancha));
      setProximosTurnos(prox);

    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const cancelarTurno = async (id) => { if(window.confirm("¿Cancelar turno?")) { await supabase.from('turnos').delete().eq('id', id); cargarDatos(); } };
  const crearTurnoManual = async (e) => { e.preventDefault(); setGuardandoTurno(true); await supabase.from('turnos').insert([formTurno]); setMostrarModal(false); cargarDatos(); setGuardandoTurno(false); };
  const cambiarPrecioCancha = async (id, p) => { const n = window.prompt("Nuevo precio:", p); if(n) { await supabase.from('canchas').update({ precio_hora: Number(n) }).eq('id', id); cargarDatos(); } };
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  // --- COMPONENTES ---
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
          {proximosTurnos.length === 0 ? <p style={{ color: '#6b7280' }}>No hay turnos agendados.</p> : proximosTurnos.slice(0,10).map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div><p style={{ margin: 0, fontWeight: 'bold' }}>{t.nombre_cliente}</p><p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{t.fecha} • {t.nombre_cancha}</p></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => cancelarTurno(t.id)} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <a href={`https://wa.me/${t.telefono_cliente}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#25D366', color: '#fff', padding: '8px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PantallaMetricas = () => {
    const v = filtroTiempo === 'dia' ? metricas.ingresosDia : filtroTiempo === 'semana' ? metricas.ingresosSemana : metricas.ingresosMes;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Análisis</h2>
          <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} style={{ padding: '10px' }}>
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: '350px' }}>
          <h3 style={{ color: '#16a34a' }}>${v} Recaudado</h3>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={datosGrafico}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="nombre"/><YAxis/><Tooltip/><Bar dataKey="ganancias" fill="#3b82f6"/></BarChart></ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PantallaClientes = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0' }}>Clientes</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {clientes.map((c, i) => <tr key={i} style={{ borderBottom: '1px solid #ddd' }}><td style={{ padding: '10px' }}>{c.nombre}</td><td style={{ padding: '10px' }}>{c.telefono}</td><td style={{ padding: '10px' }}>{c.cant} turnos</td></tr>)}
      </table>
    </div>
  );

  const PantallaAjustes = () => (
    <div>
      <h2 style={{ margin: '0 0 20px 0' }}>Mis Canchas</h2>
      {canchas.map(c => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#fff', border: '1px solid #eee', marginBottom: '10px', borderRadius: '8px' }}>{c.nombre} - ${c.precio_hora} <button onClick={() => cambiarPrecioCancha(c.id, c.precio_hora)}><Edit size={16}/></button></div>)}
    </div>
  );

  if (cargando) return <div>Cargando...</div>;
  if (errorAcceso) return <div>Acceso Denegado</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <aside style={{ width: '250px', backgroundColor: '#111827', color: '#fff', padding: '20px' }}>
        <h2>Panel Admin</h2>
        {miClub && <h3>{miClub.nombre}</h3>}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => setVistaActual('general')}>General</button>
          <button onClick={() => setVistaActual('metricas')}>Métricas</button>
          <button onClick={() => setVistaActual('clientes')}>Clientes</button>
          <button onClick={() => setVistaActual('ajustes')}>Canchas</button>
          <button onClick={cerrarSesion} style={{ marginTop: '20px', backgroundColor: 'red' }}>Salir</button>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '40px' }}>
        {vistaActual === 'general' && <PantallaGeneral />}
        {vistaActual === 'metricas' && <PantallaMetricas />}
        {vistaActual === 'clientes' && <PantallaClientes />}
        {vistaActual === 'ajustes' && <PantallaAjustes />}
      </main>
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={crearTurnoManual} style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
            <input type="date" required onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} />
            <input type="time" required onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} />
            <input type="text" placeholder="Nombre" required onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} />
            <input type="text" placeholder="Tel" required onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} />
            <select onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})}>{canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <button type="submit">Guardar</button>
            <button type="button" onClick={() => setMostrarModal(false)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;