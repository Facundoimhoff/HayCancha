import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, Clock, Plus, Edit, ImageIcon, Ban,
  Building, MapPin, Map, CheckCircle 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../index.css';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('general');
  const [errorAcceso, setErrorAcceso] = useState(false);

  const [miClub, setMiClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [turnosTotales, setTurnosTotales] = useState([]); // <-- NUEVO: Guardamos TODOS los turnos para el gráfico
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [turnosPasados, setTurnosPasados] = useState([]);
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  
  const [imagenCanchaFile, setImagenCanchaFile] = useState(null);
  const [imagenCanchaEditFile, setImagenCanchaEditFile] = useState(null);

  const [metricas, setMetricas] = useState({ 
    ingresosDia: 0, 
    ingresosSemana: 0, 
    ingresosMes: 0, 
    turnosMes: 0 
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [formBloqueo, setFormBloqueo] = useState({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });

  const [mostrarModalCancha, setMostrarModalCancha] = useState(false);
  const [formCancha, setFormCancha] = useState({ 
    nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
  });

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState({ 
    id: '', nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
  });

  // <-- NUEVO: Estado para el modal de Detalles
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const mesActualNombre = `${meses[now.getMonth()].toUpperCase()} ${now.getFullYear()}`;

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: clubData } = await supabase.from('clubes').select('*').eq('admin_email', user.email).single();
      if (!clubData) { setErrorAcceso(true); setCargando(false); return; }
      setMiClub(clubData);

      const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', clubData.id).order('id', { ascending: true });
      setCanchas(canchasData || []);
      
      if (!canchasData || canchasData.length === 0) { setCargando(false); return; }

      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const { data: turnosData } = await supabase.from('turnos').select('*').in('cancha_id', canchasData.map(c => c.id)).order('fecha', { ascending: true }).order('hora_inicio', { ascending: true });

      setTurnosTotales(turnosData || []); // Guardamos TODOS para usarlos en el gráfico luego

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const mapaClientes = {};
      const prox = [];
      const pasados = []; 

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;
        const esBloqueo = t.telefono_cliente === 'BLOQUEO'; 

        if (!esBloqueo) {
          if (t.fecha.startsWith(mesActualStr)) {
            iMes += precio;
            tMes += 1;
          }
          if (t.fecha >= semanaStr) iSem += precio;
          if (t.fecha === hoyStr) iDia += precio;

          if (!mapaClientes[t.telefono_cliente]) {
            mapaClientes[t.telefono_cliente] = { nombre: t.nombre_cliente, telefono: t.telefono_cliente, cant: 0 };
          }
          mapaClientes[t.telefono_cliente].cant += 1;
        }

        if (t.fecha >= hoyStr) {
          prox.push({ ...t, nombre_cancha: c?.nombre || '?', esBloqueo, precio });
        } else if (t.fecha.startsWith(mesActualStr)) {
          pasados.push({ ...t, nombre_cancha: c?.nombre || '?', esBloqueo, precio });
        }
      });

      setMetricas({ ingresosDia: iDia, ingresosSemana: iSem, ingresosMes: iMes, turnosMes: tMes });
      setClientes(Object.values(mapaClientes).sort((a, b) => b.cant - a.cant));
      setProximosTurnos(prox);
      setTurnosPasados(pasados.reverse()); 

    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const cancelarTurno = async (id, esBloqueo) => { 
    const mensaje = esBloqueo ? "¿Liberar este horario bloqueado?" : "¿Estás seguro de cancelar este turno?";
    if(window.confirm(mensaje)) { 
      await supabase.from('turnos').delete().eq('id', id); 
      cargarDatos(); 
      setMostrarModalDetalles(false); // Cierra el modal por si cancela desde adentro
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
        nombre_cliente: formBloqueo.motivo ? `Bloqueo por: ${formBloqueo.motivo}` : 'Bloqueo por: Mantenimiento',
        telefono_cliente: 'BLOQUEO' 
      }]);
      if (error) throw error;
      setMostrarModalBloqueo(false);
      setFormBloqueo({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });
      await cargarDatos();
    } catch (err) { alert("Error al bloquear horario: " + err.message); }
  };
  
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  const crearCanchaManual = async (e) => { 
    e.preventDefault();
    try {
      let logoUrl = formCancha.imagen_url;
      if (imagenCanchaFile) {
        const fileExt = imagenCanchaFile.name.split('.').pop();
        const fileName = `canchas/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, imagenCanchaFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('canchas').insert([{ 
        club_id: miClub.id, nombre: formCancha.nombre, deporte: formCancha.deporte,
        precio_hora: Number(formCancha.precio_hora), hora_apertura: formCancha.hora_apertura,
        hora_cierre: formCancha.hora_cierre, imagen_url: logoUrl
      }]);
      if (error) { alert("Error: " + error.message); return; }
      setMostrarModalCancha(false);
      setFormCancha({ nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' });
      setImagenCanchaFile(null); 
      await cargarDatos(); 
    } catch (err) { alert("Error inesperado al guardar: " + err.message); }
  };

  const abrirModalEditar = (cancha) => {
    setCanchaEditando({
      id: cancha.id, nombre: cancha.nombre, deporte: cancha.deporte || '', precio_hora: cancha.precio_hora,
      hora_apertura: cancha.hora_apertura || '08:00', hora_cierre: cancha.hora_cierre || '23:00', imagen_url: cancha.imagen_url || ''
    });
    setImagenCanchaEditFile(null); 
    setMostrarModalEditar(true);
  };

  const guardarEdicionCancha = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = canchaEditando.imagen_url;
      if (imagenCanchaEditFile) {
        const fileExt = imagenCanchaEditFile.name.split('.').pop();
        const fileName = `canchas/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, imagenCanchaEditFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('canchas').update({
        nombre: canchaEditando.nombre, deporte: canchaEditando.deporte, precio_hora: Number(canchaEditando.precio_hora),
        hora_apertura: canchaEditando.hora_apertura, hora_cierre: canchaEditando.hora_cierre, imagen_url: logoUrl
      }).eq('id', canchaEditando.id);
      if (error) { alert("Error al guardar: " + error.message); return; }
      setMostrarModalEditar(false);
      setImagenCanchaEditFile(null);
      await cargarDatos();
    } catch (err) { alert("Error inesperado al editar: " + err.message); }
  };

  const PantallaPerfil = () => {
    const [formPerfil, setFormPerfil] = useState({ nombre: miClub?.nombre || '', provincia: miClub?.provincia || '', ciudad: miClub?.ciudad || '' });
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Neuquén", "Río Negro"];

    const guardarPerfil = async (e) => {
      e.preventDefault();
      setGuardando(true);
      setMensaje({ texto: '', tipo: '' });
      try {
        const { error } = await supabase.from('clubes').update({ nombre: formPerfil.nombre, provincia: formPerfil.provincia, ciudad: formPerfil.ciudad }).eq('id', miClub.id);
        if (error) throw error;
        setMiClub({ ...miClub, ...formPerfil });
        setMensaje({ texto: '¡Datos actualizados correctamente!', tipo: 'exito' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      } catch (err) { setMensaje({ texto: 'Error al guardar los cambios.', tipo: 'error' }); } finally { setGuardando(false); }
    };

    return (
      <div className="perfil-wrapper">
        <div className="perfil-header">
          <Building size={24} color="#2563eb" />
          <h2>Perfil de tu Club</h2>
        </div>
        {mensaje.texto && (
          <div className={`perfil-alerta ${mensaje.tipo}`}>
            {mensaje.tipo === 'exito' && <CheckCircle size={18} />}
            <strong>{mensaje.texto}</strong>
          </div>
        )}
        <form onSubmit={guardarPerfil} className="perfil-form">
          <div>
            <label className="form-label">Nombre del Club</label>
            <div className="input-icon-wrapper">
              <Building size={18} className="input-icon" />
              <input type="text" required value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})} className="form-input-icon" />
            </div>
          </div>
          <div>
            <label className="form-label">Provincia</label>
            <div className="input-icon-wrapper">
              <Map size={18} className="input-icon" />
              <select required value={formPerfil.provincia} onChange={(e) => setFormPerfil({...formPerfil, provincia: e.target.value})} className="form-input-icon">
                <option value="">Seleccioná tu provincia</option>
                {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Ciudad</label>
            <div className="input-icon-wrapper">
              <MapPin size={18} className="input-icon" />
              <input type="text" required placeholder="Ej: San Francisco" value={formPerfil.ciudad} onChange={(e) => setFormPerfil({...formPerfil, ciudad: e.target.value})} className="form-input-icon" />
            </div>
          </div>
          <button type="submit" disabled={guardando} className="btn-guardar">{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
        </form>
      </div>
    );
  };

  const PantallaGeneral = () => (
    <div>
      <div className="general-header">
        <h2>Vista General</h2>
        <div className="acciones-header">
          <button onClick={() => setMostrarModalBloqueo(true)} className="btn-accion bloqueo">
            <Ban size={18} /> Bloquear
          </button>
          <button onClick={() => setMostrarModal(true)} className="btn-accion nuevo">
            <Plus size={18} /> Nuevo Turno
          </button>
        </div>
      </div>
      
      <div className="metricas-grid">
        <div className="metrica-card">
          <div className="icono-box verde"><DollarSign size={24} color="#16a34a" /></div>
          <div className="metrica-info">
            <p>Caja Acumulada</p>
            <h3>${metricas.ingresosMes}</h3>
          </div>
        </div>
        <div className="metrica-card">
          <div className="icono-box azul"><CalendarIcon size={24} color="#2563eb" /></div>
          <div className="metrica-info">
            <p>Turnos del Mes</p>
            <h3>{metricas.turnosMes}</h3>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 1: TURNOS PRÓXIMOS --- */}
      <div className="seccion-turnos">
        <h3 className="titulo-seccion azul">
          <Clock size={20} /> Turnos Próximos de {mesActualNombre}
        </h3>
        <div className="turnos-lista">
          {proximosTurnos.length === 0 ? <p className="texto-ayuda">No hay turnos agendados.</p> : proximosTurnos.slice(0,10).map(t => (
            <div key={t.id} className={`turno-item ${t.esBloqueo ? 'bloqueo' : 'normal'}`}>
              <div>
                <p className="turno-nombre">
                  {t.esBloqueo ? <><Ban size={14} style={{display:'inline', marginRight:'4px'}}/> {t.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:')}</> : t.nombre_cliente}
                </p>
                <p className="turno-detalle">
                  {t.fecha.split('-').reverse().join('/')} • {t.hora_inicio} • {t.nombre_cancha}
                </p>
              </div>
              
              {/* BOTONERA TRIPLE */}
              <div className="turno-acciones-triple">
                {!t.esBloqueo && (
                  <a 
                    href={`https://wa.me/${t.telefono_cliente}?text=Hola!%20Te%20recordamos%20tu%20turno%20en%20${miClub?.nombre}%20el%20día%20${t.fecha.split('-').reverse().join('/')}%20a%20las%20${t.hora_inicio}hs.`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-accion-mini btn-recordatorio"
                    title="Enviar recordatorio"
                  >
                    <CheckCircle size={16} />
                  </a>
                )}
                
                <button 
                  onClick={() => {
                    setTurnoSeleccionado(t);
                    setMostrarModalDetalles(true);
                  }}
                  className="btn-accion-mini btn-detalles"
                  title="Ver detalles"
                >
                  <Users size={16} />
                </button>
                
                <button 
                  onClick={() => cancelarTurno(t.id, t.esBloqueo)}
                  className="btn-accion-mini btn-eliminar"
                  title={t.esBloqueo ? 'Liberar bloqueo' : 'Eliminar turno'}
                >
                  <Ban size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- SECCIÓN 2: TURNOS JUGADOS --- */}
      <div className="seccion-turnos">
        <h3 className="titulo-seccion verde">
          <CheckCircle size={20} /> Turnos Jugados de {mesActualNombre}
        </h3>
        <div className="turnos-lista">
          {turnosPasados.length === 0 ? (
            <p className="texto-ayuda">Todavía no hay turnos completados en este mes.</p>
          ) : (
            turnosPasados.map(t => (
              <div key={t.id} className="turno-item pasado">
                <div>
                  <p className="turno-nombre">
                    {t.esBloqueo ? <><Ban size={14} style={{display:'inline', marginRight:'4px'}}/> {t.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:')}</> : t.nombre_cliente}
                  </p>
                  <p className="turno-detalle">
                    {t.fecha.split('-').reverse().join('/')} • {t.hora_inicio} • {t.nombre_cancha}
                  </p>
                </div>
                {!t.esBloqueo && (
                  <div className="badge-ingreso">
                    + ${t.precio}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const PantallaMetricas = () => { 
    // <-- NUEVO: Cálculo dinámico de datos del gráfico con useMemo
    const datosFiltrados = useMemo(() => {
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      // Reiniciamos las ganancias de todas las canchas a 0
      const ganCancha = {};
      canchas.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0 });

      // Filtramos sobre TODOS los turnos cargados
      turnosTotales.forEach(t => {
        if (t.telefono_cliente === 'BLOQUEO') return; // No sumamos mantenimientos
        
        let cumpleFiltro = false;
        if (filtroTiempo === 'dia' && t.fecha === hoyStr) cumpleFiltro = true;
        else if (filtroTiempo === 'semana' && t.fecha >= semanaStr) cumpleFiltro = true;
        else if (filtroTiempo === 'mes' && t.fecha.startsWith(mesActualStr)) cumpleFiltro = true;

        if (cumpleFiltro && ganCancha[t.cancha_id]) {
          const c = canchas.find(x => x.id === t.cancha_id);
          ganCancha[t.cancha_id].ganancias += c ? Number(c.precio_hora) : 0;
        }
      });

      return Object.values(ganCancha);
    }, [filtroTiempo, turnosTotales, canchas]);

    const totalCalculado = datosFiltrados.reduce((acc, curr) => acc + curr.ganancias, 0);

    return (
      <div>
        <div className="metricas-header">
          <h2>Análisis de Ingresos</h2>
          <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} className="select-filtro">
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>
        <div className="grafico-container">
          <h3 className="grafico-titulo">${totalCalculado} Recaudado</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosFiltrados}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="nombre"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="ganancias" fill="#3b82f6"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PantallaClientes = () => ( 
    <div className="clientes-wrapper">
      <h2>Clientes Frecuentes</h2>
      <table className="tabla-clientes">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Total Turnos</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c, i) => (
            <tr key={i}>
              <td>{c.nombre}</td>
              <td>{c.telefono}</td>
              <td><span className="badge-turnos">{c.cant} turnos</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const PantallaAjustes = () => ( 
    <div>
      <header className="content-header">
        <h1>Mis Canchas</h1>
        <button className="btn-agregar" onClick={() => setMostrarModalCancha(true)}>
          <Plus size={18} /> Agregar Cancha
        </button>
      </header>
      
      <div className="canchas-list">
        {canchas.map(c => (
          <div key={c.id} className="cancha-card">
            <div className={`cancha-imagen-placeholder ${c.imagen_url ? 'con-imagen' : ''}`}>
              {c.imagen_url ? <img src={c.imagen_url} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon color="#9ca3af" size={32} />}
            </div>
            <div className="cancha-info">
              <h3>{c.nombre} <span className="cancha-deporte">{c.deporte}</span></h3>
              <p>${c.precio_hora} / hora • ⏰ {c.hora_apertura || '08:00'} a {c.hora_cierre || '23:00'}</p>
            </div>
            <button className="btn-editar" onClick={() => abrirModalEditar(c)} title="Editar información">
              <Edit size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (cargando) return <div className="dashboard-mensaje">Cargando panel...</div>;
  if (errorAcceso) return <div className="dashboard-error">Acceso Denegado. Solo administradores.</div>;

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

      {mostrarModalDetalles && turnoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#2563eb" /> Detalles del Turno
            </h3>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
              <div className="detalle-item">
                <span className="detalle-label">Cliente:</span>
                <span className="detalle-valor">
                  {turnoSeleccionado.esBloqueo ? turnoSeleccionado.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:') : turnoSeleccionado.nombre_cliente}
                </span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Teléfono:</span>
                <span className="detalle-valor">{turnoSeleccionado.telefono_cliente}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Fecha:</span>
                <span className="detalle-valor">{turnoSeleccionado.fecha.split('-').reverse().join('/')}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Hora:</span>
                <span className="detalle-valor">{turnoSeleccionado.hora_inicio} hs</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Cancha:</span>
                <span className="detalle-valor">{turnoSeleccionado.nombre_cancha}</span>
              </div>
              {!turnoSeleccionado.esBloqueo && (
                <div className="detalle-item" style={{ borderTop: '2px solid #e2e8f0', marginTop: '8px', paddingTop: '12px' }}>
                  <span className="detalle-label" style={{ color: '#16a34a' }}>Precio a cobrar:</span>
                  <span className="detalle-valor" style={{ color: '#16a34a', fontSize: '1.2rem', fontWeight: 'bold' }}>${turnoSeleccionado.precio}</span>
                </div>
              )}
            </div>

            <div className="modal-acciones" style={{ marginTop: '5px' }}>
              <button onClick={() => setMostrarModalDetalles(false)} className="btn-modal secundario">
                Cerrar
              </button>
              {!turnoSeleccionado.esBloqueo && (
                <button 
                  onClick={() => cancelarTurno(turnoSeleccionado.id, turnoSeleccionado.esBloqueo)} 
                  className="btn-modal advertencia" style={{ backgroundColor: '#ef4444' }}
                >
                  Cancelar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay">
          <form onSubmit={crearTurnoManual} className="modal-content">
            <h3>Nuevo Turno Manual</h3>
            <input type="date" required onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} className="modal-input solo" />
            <input type="time" required onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} className="modal-input solo" />
            <input type="text" placeholder="Nombre Cliente" required onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} className="modal-input solo" />
            <input type="text" placeholder="Teléfono" required onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} className="modal-input solo" />
            <select required onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})} className="modal-input solo">
              <option value="">Seleccionar cancha...</option>
              {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div className="modal-acciones">
              <button type="submit" className="btn-modal primario">Guardar</button>
              <button type="button" onClick={() => setMostrarModal(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal-overlay">
          <form onSubmit={crearBloqueo} className="modal-content">
            <h3 className="modal-header-bloqueo"><Ban size={20}/> Bloquear Horario</h3>
            <p className="modal-desc">Usá esto para bloquear la cancha por mantenimiento o limpieza. Los clientes no podrán reservarla.</p>
            
            <input type="date" required onChange={(e) => setFormBloqueo({...formBloqueo, fecha: e.target.value})} className="modal-input solo" />
            <input type="time" required onChange={(e) => setFormBloqueo({...formBloqueo, hora_inicio: e.target.value})} className="modal-input solo" />
            
            <select required onChange={(e) => setFormBloqueo({...formBloqueo, cancha_id: e.target.value})} className="modal-input solo">
              <option value="">Seleccionar cancha...</option>
              {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <input type="text" placeholder="Motivo (Ej: Mantenimiento)" onChange={(e) => setFormBloqueo({...formBloqueo, motivo: e.target.value})} className="modal-input solo" />
            
            <div className="modal-acciones">
              <button type="submit" className="btn-modal advertencia">Bloquear</button>
              <button type="button" onClick={() => setMostrarModalBloqueo(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalCancha && (
        <div className="modal-overlay">
          <form onSubmit={crearCanchaManual} className="modal-content">
            <h3>Crear Nueva Cancha</h3>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Nombre</label>
                <input type="text" placeholder="Ej: Cancha 1" required value={formCancha.nombre} onChange={(e) => setFormCancha({...formCancha, nombre: e.target.value})} className="modal-input"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <input type="text" placeholder="Ej: Pádel" required value={formCancha.deporte} onChange={(e) => setFormCancha({...formCancha, deporte: e.target.value})} className="modal-input"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Precio por Hora ($)</label>
              <input type="number" required value={formCancha.precio_hora} onChange={(e) => setFormCancha({...formCancha, precio_hora: e.target.value})} className="modal-input"/>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={formCancha.hora_apertura} onChange={(e) => setFormCancha({...formCancha, hora_apertura: e.target.value})} className="modal-input"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={formCancha.hora_cierre} onChange={(e) => setFormCancha({...formCancha, hora_cierre: e.target.value})} className="modal-input"/>
              </div>
            </div>

            <div className="modal-col" style={{ marginBottom: '15px' }}>
              <label className="modal-label" style={{ marginBottom: '4px' }}>Foto de la Cancha (Opcional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImagenCanchaFile(e.target.files[0]);
                  }
                }} 
                className="modal-input solo"
                style={{ padding: '8px' }}
              />
            </div>

            <div className="modal-acciones">
              <button type="submit" className="btn-modal primario">Crear Cancha</button>
              <button type="button" onClick={() => setMostrarModalCancha(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalEditar && (
        <div className="modal-overlay">
          <form onSubmit={guardarEdicionCancha} className="modal-content">
            <h3>Editar Cancha</h3>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Nombre</label>
                <input type="text" required value={canchaEditando.nombre} onChange={(e) => setCanchaEditando({...canchaEditando, nombre: e.target.value})} className="modal-input"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <input type="text" required value={canchaEditando.deporte} onChange={(e) => setCanchaEditando({...canchaEditando, deporte: e.target.value})} className="modal-input"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Precio por Hora ($)</label>
              <input type="number" required value={canchaEditando.precio_hora} onChange={(e) => setCanchaEditando({...canchaEditando, precio_hora: e.target.value})} className="modal-input"/>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={canchaEditando.hora_apertura} onChange={(e) => setCanchaEditando({...canchaEditando, hora_apertura: e.target.value})} className="modal-input"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={canchaEditando.hora_cierre} onChange={(e) => setCanchaEditando({...canchaEditando, hora_cierre: e.target.value})} className="modal-input"/>
              </div>
            </div>

            <div className="modal-col" style={{ marginBottom: '15px' }}>
              <label className="modal-label" style={{ marginBottom: '4px' }}>Cambiar Foto (Opcional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImagenCanchaEditFile(e.target.files[0]);
                  }
                }} 
                className="modal-input solo"
                style={{ padding: '8px' }}
              />
              {canchaEditando.imagen_url && !imagenCanchaEditFile && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#16a34a' }}>✓ Ya tiene una imagen cargada</p>
              )}
            </div>

            <div className="modal-acciones">
              <button type="submit" className="btn-modal primario">Guardar Cambios</button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;