import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, Clock, Plus, Edit, ImageIcon, Ban,
  Building, MapPin, Map, CheckCircle 
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
  
  // Archivos de Imagen
  const [imagenCanchaFile, setImagenCanchaFile] = useState(null);
  const [imagenCanchaEditFile, setImagenCanchaEditFile] = useState(null);

  // Métricas
  const [metricas, setMetricas] = useState({ 
    ingresosDia: 0, 
    ingresosSemana: 0, 
    ingresosMes: 0, 
    turnosMes: 0 
  });

  // Modal Turno Manual
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  
  // Modal Bloquear Horario
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [formBloqueo, setFormBloqueo] = useState({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });

  // Modal Nueva Cancha
  const [mostrarModalCancha, setMostrarModalCancha] = useState(false);
  const [formCancha, setFormCancha] = useState({ 
    nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
  });

  // Modal Editar Cancha
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState({ 
    id: '', nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
  });

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: clubData } = await supabase.from('clubes').select('*').eq('admin_id', user.id).single();
      // Si por alguna razón tu base sigue usando admin_email en vez de admin_id, cambialo arriba.
      if (!clubData) { setErrorAcceso(true); setCargando(false); return; }
      setMiClub(clubData);

      const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', clubData.id).order('id', { ascending: true });
      setCanchas(canchasData || []);
      
      if (!canchasData || canchasData.length === 0) { setCargando(false); return; }

      const now = new Date();
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const { data: turnosData } = await supabase.from('turnos').select('*').in('cancha_id', canchasData.map(c => c.id)).order('fecha', { ascending: true }).order('hora_inicio', { ascending: true });

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const ganCancha = {};
      const mapaClientes = {};
      const prox = [];

      canchasData.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;
        const esBloqueo = t.telefono_cliente === 'BLOQUEO'; 

        if (!esBloqueo) {
          if (t.fecha.startsWith(mesActualStr)) {
            iMes += precio;
            tMes += 1;
            if (c) ganCancha[t.cancha_id].ganancias += precio;
          }
          if (t.fecha >= semanaStr) iSem += precio;
          if (t.fecha === hoyStr) iDia += precio;

          if (!mapaClientes[t.telefono_cliente]) {
            mapaClientes[t.telefono_cliente] = { nombre: t.nombre_cliente, telefono: t.telefono_cliente, cant: 0 };
          }
          mapaClientes[t.telefono_cliente].cant += 1;
        }

        if (t.fecha >= hoyStr) prox.push({ ...t, nombre_cancha: c?.nombre || '?', esBloqueo });
      });

      setMetricas({ ingresosDia: iDia, ingresosSemana: iSem, ingresosMes: iMes, turnosMes: tMes });
      setClientes(Object.values(mapaClientes).sort((a, b) => b.cant - a.cant));
      setDatosGrafico(Object.values(ganCancha));
      setProximosTurnos(prox);

    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Funciones de Acciones
  const cancelarTurno = async (id, esBloqueo) => { 
    const mensaje = esBloqueo ? "¿Liberar este horario bloqueado?" : "¿Estás seguro de cancelar este turno?";
    if(window.confirm(mensaje)) { 
      await supabase.from('turnos').delete().eq('id', id); 
      cargarDatos(); 
    } 
  };
  
  const crearTurnoManual = async (e) => { 
    e.preventDefault(); 
    await supabase.from('turnos').insert([formTurno]); 
    setMostrarModal(false); 
    cargarDatos(); 
  };

  const crearBloqueo = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('turnos').insert([{
        cancha_id: formBloqueo.cancha_id,
        fecha: formBloqueo.fecha,
        hora_inicio: formBloqueo.hora_inicio,
        nombre_cliente: `Bloqueado: ${formBloqueo.motivo || 'Mantenimiento'}`,
        telefono_cliente: 'BLOQUEO' 
      }]);

      if (error) throw error;

      setMostrarModalBloqueo(false);
      setFormBloqueo({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });
      await cargarDatos();
    } catch (err) {
      alert("Error al bloquear horario: " + err.message);
    }
  };
  
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  // --- LOGICA DE CREAR Y EDITAR CANCHAS CON FOTOS --- //

  const crearCanchaManual = async (e) => { 
    e.preventDefault();
    try {
      let logoUrl = formCancha.imagen_url;

      // Magia de subida de imagen
      if (imagenCanchaFile) {
        const fileExt = imagenCanchaFile.name.split('.').pop();
        const fileName = `canchas/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('imagenes')
          .upload(fileName, imagenCanchaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('imagenes')
          .getPublicUrl(fileName);

        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('canchas').insert([{ 
        club_id: miClub.id, 
        nombre: formCancha.nombre, 
        deporte: formCancha.deporte,
        precio_hora: Number(formCancha.precio_hora), 
        hora_apertura: formCancha.hora_apertura,
        hora_cierre: formCancha.hora_cierre, 
        imagen_url: logoUrl
      }]);

      if (error) { alert("Error: " + error.message); return; }
      
      setMostrarModalCancha(false);
      setFormCancha({ nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' });
      setImagenCanchaFile(null); // Reseteamos la foto
      await cargarDatos(); 
    } catch (err) { 
      alert("Error inesperado al guardar: " + err.message); 
    }
  };

  const abrirModalEditar = (cancha) => {
    setCanchaEditando({
      id: cancha.id, nombre: cancha.nombre, deporte: cancha.deporte || '', precio_hora: cancha.precio_hora,
      hora_apertura: cancha.hora_apertura || '08:00', hora_cierre: cancha.hora_cierre || '23:00', imagen_url: cancha.imagen_url || ''
    });
    setImagenCanchaEditFile(null); // Limpiamos si había alguna foto vieja seleccionada
    setMostrarModalEditar(true);
  };

  const guardarEdicionCancha = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = canchaEditando.imagen_url;

      // Magia de subida de imagen para EDICIÓN
      if (imagenCanchaEditFile) {
        const fileExt = imagenCanchaEditFile.name.split('.').pop();
        const fileName = `canchas/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('imagenes')
          .upload(fileName, imagenCanchaEditFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('imagenes')
          .getPublicUrl(fileName);

        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('canchas').update({
        nombre: canchaEditando.nombre, 
        deporte: canchaEditando.deporte, 
        precio_hora: Number(canchaEditando.precio_hora),
        hora_apertura: canchaEditando.hora_apertura, 
        hora_cierre: canchaEditando.hora_cierre, 
        imagen_url: logoUrl
      }).eq('id', canchaEditando.id);
      
      if (error) { alert("Error al guardar: " + error.message); return; }
      
      setMostrarModalEditar(false);
      setImagenCanchaEditFile(null);
      await cargarDatos();
    } catch (err) {
      alert("Error inesperado al editar: " + err.message);
    }
  };


  // --- COMPONENTES DE PANTALLA ---

  const PantallaPerfil = () => {
    const [formPerfil, setFormPerfil] = useState({
      nombre: miClub?.nombre || '',
      provincia: miClub?.provincia || '',
      ciudad: miClub?.ciudad || ''
    });
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    
    const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Neuquén", "Río Negro"];

    const guardarPerfil = async (e) => {
      e.preventDefault();
      setGuardando(true);
      setMensaje({ texto: '', tipo: '' });

      try {
        const { error } = await supabase.from('clubes').update({
          nombre: formPerfil.nombre,
          provincia: formPerfil.provincia,
          ciudad: formPerfil.ciudad
        }).eq('id', miClub.id);

        if (error) throw error;

        setMiClub({ ...miClub, ...formPerfil });
        setMensaje({ texto: '¡Datos actualizados correctamente!', tipo: 'exito' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      } catch (err) {
        setMensaje({ texto: 'Error al guardar los cambios.', tipo: 'error' });
      } finally {
        setGuardando(false);
      }
    };

    return (
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
          <Building size={24} color="#2563eb" />
          <h2 style={{ margin: 0, color: '#111827' }}>Perfil de tu Club</h2>
        </div>

        {mensaje.texto && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#166534' : '#ef4444' }}>
            {mensaje.tipo === 'exito' && <CheckCircle size={18} />}
            <strong>{mensaje.texto}</strong>
          </div>
        )}

        <form onSubmit={guardarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Nombre del Club</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
              <input type="text" required value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Provincia</label>
            <div style={{ position: 'relative' }}>
              <Map size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
              <select required value={formPerfil.provincia} onChange={(e) => setFormPerfil({...formPerfil, provincia: e.target.value})} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', backgroundColor: 'white' }}>
                <option value="">Seleccioná tu provincia</option>
                {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Ciudad</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
              <input type="text" required placeholder="Ej: San Francisco" value={formPerfil.ciudad} onChange={(e) => setFormPerfil({...formPerfil, ciudad: e.target.value})} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button type="submit" disabled={guardando} style={{ marginTop: '10px', backgroundColor: '#2563eb', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    );
  };

  const PantallaGeneral = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Vista General (Este Mes)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setMostrarModalBloqueo(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Ban size={18} /> Bloquear
          </button>
          <button onClick={() => setMostrarModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Plus size={18} /> Nuevo Turno
          </button>
        </div>
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
            <div key={t.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', 
              backgroundColor: t.esBloqueo ? '#fef3c7' : '#f9fafb', 
              borderLeft: t.esBloqueo ? '4px solid #f59e0b' : '4px solid #3b82f6', 
              borderRadius: '8px', borderRight: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb'
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: t.esBloqueo ? '#b45309' : '#111827' }}>
                  {t.esBloqueo ? <><Ban size={14} style={{display:'inline', marginRight:'4px'}}/> {t.nombre_cliente}</> : t.nombre_cliente}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                  {t.fecha.split('-').reverse().join('/')} • {t.hora_inicio} • {t.nombre_cancha}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => cancelarTurno(t.id, t.esBloqueo)} style={{ backgroundColor: t.esBloqueo ? '#fff' : '#ef4444', color: t.esBloqueo ? '#b45309' : '#fff', padding: '8px', border: t.esBloqueo ? '1px solid #b45309' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {t.esBloqueo ? 'Liberar' : 'Cancelar'}
                </button>
                {!t.esBloqueo && (
                  <a href={`https://wa.me/${t.telefono_cliente}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#25D366', color: '#fff', padding: '8px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>WhatsApp</a>
                )}
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
          <h2 style={{ margin: 0 }}>Análisis de Ingresos</h2>
          <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
            <option value="dia">Hoy</option><option value="semana">Esta Semana</option><option value="mes">Este Mes</option>
          </select>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: '350px' }}>
          <h3 style={{ color: '#16a34a' }}>${v} Recaudado</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="nombre"/><YAxis/><Tooltip/><Bar dataKey="ganancias" fill="#3b82f6"/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PantallaClientes = () => ( 
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>Clientes Frecuentes</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr style={{ backgroundColor: '#f1f5f9' }}><th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Nombre</th><th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Teléfono</th><th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Total Turnos</th></tr></thead>
        <tbody>
          {clientes.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '12px' }}>{c.nombre}</td><td style={{ padding: '12px' }}>{c.telefono}</td><td style={{ padding: '12px' }}><span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 'bold' }}>{c.cant} turnos</span></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const PantallaAjustes = () => ( 
    <div>
      <header className="content-header"><h1 style={{ margin: 0 }}>Mis Canchas</h1><button className="btn-agregar" onClick={() => setMostrarModalCancha(true)}><Plus size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }}/> Agregar Cancha</button></header>
      <div className="canchas-list">
        {canchas.map(c => (
          <div key={c.id} className="cancha-card">
            <div className="cancha-imagen-placeholder" style={c.imagen_url ? { padding: 0, overflow: 'hidden', border: 'none' } : {}}>
              {c.imagen_url ? <img src={c.imagen_url} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon color="#9ca3af" size={32} />}
            </div>
            <div className="cancha-info">
              <h3>{c.nombre} <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', color: '#475569' }}>{c.deporte}</span></h3>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>${c.precio_hora} / hora • ⏰ {c.hora_apertura || '08:00'} a {c.hora_cierre || '23:00'}</p>
            </div>
            <button className="btn-editar" onClick={() => abrirModalEditar(c)} title="Editar información"><Edit size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  if (cargando) return <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.2rem' }}>Cargando panel...</div>;
  if (errorAcceso) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Acceso Denegado. Solo administradores.</div>;

  return (
    <div className="dashboard-container">
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
          <button className={`nav-item ${vistaActual === 'perfil' ? 'active' : ''}`} onClick={() => setVistaActual('perfil')}><Building size={20} /> Mi Club</button>
        </nav>
        <button className="btn-salir" onClick={cerrarSesion}><LogOut size={20} /> Salir</button>
      </aside>

      <main className="main-content">
        {vistaActual === 'general' && <PantallaGeneral />}
        {vistaActual === 'metricas' && <PantallaMetricas />}
        {vistaActual === 'clientes' && <PantallaClientes />}
        {vistaActual === 'ajustes' && <PantallaAjustes />}
        {vistaActual === 'perfil' && <PantallaPerfil />}
      </main>

      {/* --- MODALES --- */}

      {/* 1. Modal Agregar Turno Manual */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={crearTurnoManual} style={{ background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
            <h3 style={{ margin: 0 }}>Nuevo Turno Manual</h3>
            <input type="date" required onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="time" required onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Nombre Cliente" required onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Teléfono" required onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <select required onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Seleccionar cancha...</option>
              {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Guardar</button>
              <button type="button" onClick={() => setMostrarModal(false)} style={{ background: '#e5e7eb', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal Bloquear Horario (Mantenimiento) */}
      {mostrarModalBloqueo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={crearBloqueo} style={{ background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
            <h3 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><Ban size={20}/> Bloquear Horario</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Usá esto para bloquear la cancha por mantenimiento o limpieza. Los clientes no podrán reservarla.</p>
            
            <input type="date" required onChange={(e) => setFormBloqueo({...formBloqueo, fecha: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="time" required onChange={(e) => setFormBloqueo({...formBloqueo, hora_inicio: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            
            <select required onChange={(e) => setFormBloqueo({...formBloqueo, cancha_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">Seleccionar cancha...</option>
              {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <input type="text" placeholder="Motivo (Ej: Mantenimiento)" onChange={(e) => setFormBloqueo({...formBloqueo, motivo: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#f59e0b', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Bloquear</button>
              <button type="button" onClick={() => setMostrarModalBloqueo(false)} style={{ background: '#e5e7eb', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Modal CREAR Cancha */}
      {mostrarModalCancha && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={crearCanchaManual} style={{ background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Crear Nueva Cancha</h3>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Nombre</label>
                <input type="text" placeholder="Ej: Cancha 1" required value={formCancha.nombre} onChange={(e) => setFormCancha({...formCancha, nombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Deporte</label>
                <input type="text" placeholder="Ej: Pádel" required value={formCancha.deporte} onChange={(e) => setFormCancha({...formCancha, deporte: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Precio por Hora ($)</label>
              <input type="number" required value={formCancha.precio_hora} onChange={(e) => setFormCancha({...formCancha, precio_hora: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Apertura</label>
                <input type="time" required value={formCancha.hora_apertura} onChange={(e) => setFormCancha({...formCancha, hora_apertura: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Cierre</label>
                <input type="time" required value={formCancha.hora_cierre} onChange={(e) => setFormCancha({...formCancha, hora_cierre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
              <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>
                Foto de la Cancha (Opcional)
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImagenCanchaFile(e.target.files[0]);
                  }
                }} 
                style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Crear Cancha</button>
              <button type="button" onClick={() => setMostrarModalCancha(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Modal EDITAR Cancha */}
      {mostrarModalEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form onSubmit={guardarEdicionCancha} style={{ background: '#fff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Editar Cancha</h3>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Nombre</label>
                <input type="text" required value={canchaEditando.nombre} onChange={(e) => setCanchaEditando({...canchaEditando, nombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Deporte</label>
                <input type="text" required value={canchaEditando.deporte} onChange={(e) => setCanchaEditando({...canchaEditando, deporte: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Precio por Hora ($)</label>
              <input type="number" required value={canchaEditando.precio_hora} onChange={(e) => setCanchaEditando({...canchaEditando, precio_hora: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Apertura</label>
                <input type="time" required value={canchaEditando.hora_apertura} onChange={(e) => setCanchaEditando({...canchaEditando, hora_apertura: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Cierre</label>
                <input type="time" required value={canchaEditando.hora_cierre} onChange={(e) => setCanchaEditando({...canchaEditando, hora_cierre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }}/>
              </div>
            </div>

            {/* NUEVO INPUT DE IMAGEN PARA EDICIÓN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
              <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Cambiar Foto (Opcional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImagenCanchaEditFile(e.target.files[0]);
                  }
                }} 
                style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }} 
              />
              {canchaEditando.imagen_url && !imagenCanchaEditFile && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#16a34a' }}>✓ Ya tiene una imagen cargada</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Guardar Cambios</button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;