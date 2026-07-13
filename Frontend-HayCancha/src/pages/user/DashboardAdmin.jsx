import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, Clock, Plus, Edit, Image as ImageIcon 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../index.css';

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
  
  const [metricas, setMetricas] = useState({ ingresosDia: 0, ingresosSemana: 0, ingresosMes: 0, turnosMes: 0 });

  // Modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  
  const [mostrarModalCancha, setMostrarModalCancha] = useState(false);
  const [formCancha, setFormCancha] = useState({ nombre: '', precio_hora: '' });

  // NUEVO: Estados para Editar Cancha
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState({ 
    id: '', nombre: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
  });

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: clubData } = await supabase.from('clubes').select('*').eq('admin_email', user.email).single();
      if (!clubData) { setErrorAcceso(true); setCargando(false); return; }
      setMiClub(clubData);

      const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', clubData.id);
      setCanchas(canchasData || []);
      
      if (!canchasData || canchasData.length === 0) { setCargando(false); return; }

      // Fechas para métricas
      const now = new Date();
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const { data: turnosData } = await supabase.from('turnos').select('*').in('cancha_id', canchasData.map(c => c.id)).order('fecha').order('hora_inicio');

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const ganCancha = {};
      const mapaClientes = {};
      const prox = [];

      canchasData.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;

        if (t.fecha.startsWith(mesActualStr)) { iMes += precio; tMes += 1; if (c) ganCancha[t.cancha_id].ganancias += precio; }
        if (t.fecha >= semanaStr) iSem += precio;
        if (t.fecha === hoyStr) iDia += precio;
        if (t.fecha >= hoyStr) prox.push({ ...t, nombre_cancha: c?.nombre || '?' });
        
        if (!mapaClientes[t.telefono_cliente]) mapaClientes[t.telefono_cliente] = { nombre: t.nombre_cliente, telefono: t.telefono_cliente, cant: 0 };
        mapaClientes[t.telefono_cliente].cant += 1;
      });

      setMetricas({ ingresosDia: iDia, ingresosSemana: iSem, ingresosMes: iMes, turnosMes: tMes });
      setClientes(Object.values(mapaClientes).sort((a, b) => b.cant - a.cant));
      setDatosGrafico(Object.values(ganCancha));
      setProximosTurnos(prox);

    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const cancelarTurno = async (id) => { if(window.confirm("¿Cancelar turno?")) { await supabase.from('turnos').delete().eq('id', id); cargarDatos(); } };
  const crearTurnoManual = async (e) => { e.preventDefault(); await supabase.from('turnos').insert([formTurno]); setMostrarModal(false); cargarDatos(); };
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  const crearCanchaManual = async (e) => {
    e.preventDefault();
    await supabase.from('canchas').insert([{ club_id: miClub.id, nombre: formCancha.nombre, precio_hora: Number(formCancha.precio_hora) }]);
    setMostrarModalCancha(false);
    cargarDatos(); 
  };

  // NUEVO: Funciones para Editar Cancha
  const abrirModalEditar = (cancha) => {
    setCanchaEditando({
      id: cancha.id,
      nombre: cancha.nombre,
      precio_hora: cancha.precio_hora,
      hora_apertura: cancha.hora_apertura || '08:00', // Valor por defecto si está vacío
      hora_cierre: cancha.hora_cierre || '23:00',
      imagen_url: cancha.imagen_url || ''
    });
    setMostrarModalEditar(true);
  };

  const guardarEdicionCancha = async (e) => {
    e.preventDefault();
    await supabase.from('canchas').update({
      nombre: canchaEditando.nombre,
      precio_hora: Number(canchaEditando.precio_hora),
      hora_apertura: canchaEditando.hora_apertura,
      hora_cierre: canchaEditando.hora_cierre,
      imagen_url: canchaEditando.imagen_url
    }).eq('id', canchaEditando.id);
    
    setMostrarModalEditar(false);
    cargarDatos();
  };


  // --- PANTALLAS ---
  const PantallaGeneral = () => ( /* ... (Igual que antes, lo omito por brevedad, dejá tu código de General acá) ... */
    <div><h2 style={{ marginBottom: '20px' }}>Vista General</h2> {/* ... */} </div>
  );

  const PantallaMetricas = () => ( /* ... (Igual que antes) ... */
    <div><h2>Métricas</h2>{/* ... */}</div>
  );

  const PantallaClientes = () => ( /* ... (Igual que antes) ... */
    <div><h2>Clientes</h2>{/* ... */}</div>
  );

  // NUEVA: Pantalla Ajustes actualizada con el botón de editar
  const PantallaAjustes = () => (
    <div>
      <header className="content-header">
        <h1 style={{ margin: 0 }}>Mis Canchas</h1>
        <button className="btn-agregar" onClick={() => setMostrarModalCancha(true)}>
          <Plus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}/> Agregar Cancha
        </button>
      </header>

      <div className="canchas-list">
        {canchas.map(c => (
          <div key={c.id} className="cancha-card">
            
            {/* Si tiene imagen guardada, la muestra. Si no, muestra el icono gris */}
            <div className="cancha-imagen-placeholder" style={c.imagen_url ? { padding: 0, overflow: 'hidden', border: 'none' } : {}}>
              {c.imagen_url ? (
                <img src={c.imagen_url} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon color="#9ca3af" size={32} />
              )}
            </div>

            <div className="cancha-info">
              <h3>{c.nombre}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                ${c.precio_hora} / hora • ⏰ {c.hora_apertura || '08:00'} a {c.hora_cierre || '23:00'}
              </p>
            </div>
            
            <button className="btn-editar" onClick={() => abrirModalEditar(c)} title="Editar información">
              <Edit size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (cargando) return <div>Cargando...</div>;
  if (errorAcceso) return <div>Acceso Denegado</div>;

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Panel Admin</h2>
          {miClub && <p className="club-name">{miClub.nombre}</p>}
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${vistaActual === 'general' ? 'active' : ''}`} onClick={() => setVistaActual('general')}><LayoutDashboard size={20} /> General</button>
          <button className={`nav-item ${vistaActual === 'metricas' ? 'active' : ''}`} onClick={() => setVistaActual('metricas')}><BarChart3 size={20} /> Métricas</button>
          <button className={`nav-item ${vistaActual === 'clientes' ? 'active' : ''}`} onClick={() => setVistaActual('clientes')}><Users size={20} /> Clientes</button>
          <button className={`nav-item ${vistaActual === 'ajustes' ? 'active' : ''}`} onClick={() => setVistaActual('ajustes')}><Settings size={20} /> Canchas</button>
        </nav>
        <button className="btn-salir" onClick={cerrarSesion}><LogOut size={20} /> Salir</button>
      </aside>

      {/* CONTENIDO MAIN */}
      <main className="main-content">
        {vistaActual === 'general' && <PantallaGeneral />}
        {vistaActual === 'metricas' && <PantallaMetricas />}
        {vistaActual === 'clientes' && <PantallaClientes />}
        {vistaActual === 'ajustes' && <PantallaAjustes />}
      </main>

      {/* MODAL: EDITAR CANCHA */}
      {mostrarModalEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={guardarEdicionCancha} style={{ background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Editar Cancha</h3>
            
            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Nombre</label>
              <input type="text" value={canchaEditando.nombre} required onChange={(e) => setCanchaEditando({...canchaEditando, nombre: e.target.value})} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}/>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Precio por Hora ($)</label>
              <input type="number" value={canchaEditando.precio_hora} required onChange={(e) => setCanchaEditando({...canchaEditando, precio_hora: e.target.value})} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}/>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Apertura</label>
                <input type="time" value={canchaEditando.hora_apertura} required onChange={(e) => setCanchaEditando({...canchaEditando, hora_apertura: e.target.value})} style={{ width: '85%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Cierre</label>
                <input type="time" value={canchaEditando.hora_cierre} required onChange={(e) => setCanchaEditando({...canchaEditando, hora_cierre: e.target.value})} style={{ width: '85%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}/>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Link de la Imagen (URL)</label>
              <input type="url" placeholder="https://ejemplo.com/foto.jpg" value={canchaEditando.imagen_url} onChange={(e) => setCanchaEditando({...canchaEditando, imagen_url: e.target.value})} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}/>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Pegá un link directo a una foto de la cancha.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Guardar Cambios</button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* (Acá abajo dejás tus otros modales que ya tenías: el de Nuevo Turno y el de Agregar Cancha nueva) */}
    </div>
  );
};

export default DashboardAdmin;