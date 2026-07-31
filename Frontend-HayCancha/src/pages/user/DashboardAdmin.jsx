import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, Clock, Plus, Edit, ImageIcon, Ban,
  Building, MapPin, Map, CheckCircle, Download, FileText, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../../index.css';
import './DashboardAdmin.css';

const COLORES_GRAFICO = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('general');
  const [errorAcceso, setErrorAcceso] = useState(false);

  const [miClub, setMiClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [turnosTotales, setTurnosTotales] = useState([]);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [turnosPasados, setTurnosPasados] = useState([]);
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  
  const [imagenCanchaFile, setImagenCanchaFile] = useState(null);
  const [imagenCanchaEditFile, setImagenCanchaEditFile] = useState(null);

  const [metricas, setMetricas] = useState({ ingresosDia: 0, ingresosSemana: 0, ingresosMes: 0, turnosMes: 0 });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [formBloqueo, setFormBloqueo] = useState({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });

  const [mostrarModalCancha, setMostrarModalCancha] = useState(false);
  const [formCancha, setFormCancha] = useState({ nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' });

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState({ id: '', nombre: '', deporte: '', precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' });

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
      setTurnosTotales(turnosData || []);

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const mapaClientes = {};
      const prox = [];
      const pasados = []; 

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;
        const esBloqueo = t.telefono_cliente === 'BLOQUEO'; 

        if (!esBloqueo) {
          if (t.fecha.startsWith(mesActualStr)) { iMes += precio; tMes += 1; }
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
      setMostrarModalDetalles(false); 
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

  const exportarExcel = () => {
    const dataAExportar = turnosTotales
      .filter(t => t.telefono_cliente !== 'BLOQUEO')
      .map(t => {
        const canchaInfo = canchas.find(c => c.id === t.cancha_id);
        return {
          Fecha: t.fecha.split('-').reverse().join('/'),
          Hora: t.hora_inicio,
          Cliente: t.nombre_cliente,
          Teléfono: t.telefono_cliente,
          Cancha: canchaInfo?.nombre || 'Desconocida',
          'Ingreso ($)': canchaInfo?.precio_hora || 0,
        };
      });

    const ws = XLSX.utils.json_to_sheet(dataAExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Métricas GridPlay");
    XLSX.writeFile(wb, `Reporte_${miClub?.nombre.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Reporte de Ingresos - ${miClub?.nombre}`, 14, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableData = turnosTotales
      .filter(t => t.telefono_cliente !== 'BLOQUEO')
      .map(t => {
        const canchaInfo = canchas.find(c => c.id === t.cancha_id);
        return [
          t.fecha.split('-').reverse().join('/'),
          t.hora_inicio,
          t.nombre_cliente,
          canchaInfo?.nombre || 'Desconocida',
          `$${canchaInfo?.precio_hora || 0}`
        ];
      });

    doc.autoTable({
      head: [['Fecha', 'Hora', 'Cliente', 'Cancha', 'Ingreso']],
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }, // Slate-900 (Color empresarial)
    });

    doc.save(`Reporte_${miClub?.nombre.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.pdf`);
  };


  /* ================= VISTAS DE PANTALLA ================= */

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
        <div>
          <h2>Vista General</h2>
          <p className="subtitle-header">Resumen de actividad de {mesActualNombre}</p>
        </div>
        <div className="acciones-header">
          <button onClick={() => setMostrarModalBloqueo(true)} className="btn-accion bloqueo">
            <Ban size={18} /> Bloquear Horario
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
            <p>Ingresos del Mes</p>
            <h3>${metricas.ingresosMes.toLocaleString('es-AR')}</h3>
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

      <div className="seccion-turnos">
        <h3 className="titulo-seccion azul">
          <Clock size={20} /> Turnos Próximos
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
              <div className="turno-acciones-triple">
                {!t.esBloqueo && (
                  <a 
                    href={`https://wa.me/${t.telefono_cliente}?text=Hola!%20Te%20recordamos%20tu%20turno%20en%20${miClub?.nombre}%20el%20día%20${t.fecha.split('-').reverse().join('/')}%20a%20las%20${t.hora_inicio}hs.`} 
                    target="_blank" rel="noopener noreferrer" className="btn-accion-mini btn-recordatorio" title="Enviar recordatorio"
                  >
                    <CheckCircle size={16} />
                  </a>
                )}
                <button onClick={() => { setTurnoSeleccionado(t); setMostrarModalDetalles(true); }} className="btn-accion-mini btn-detalles" title="Ver detalles">
                  <Users size={16} />
                </button>
                <button onClick={() => cancelarTurno(t.id, t.esBloqueo)} className="btn-accion-mini btn-eliminar" title={t.esBloqueo ? 'Liberar bloqueo' : 'Eliminar turno'}>
                  <Ban size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PantallaMetricas = () => { 
    // ESTADO NUEVO: Controla si se muestra el mensaje de info del gráfico
    const [mostrarInfo, setMostrarInfo] = useState(false);

    const datosFiltrados = useMemo(() => {
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const ganCancha = {};
      canchas.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0, cantidad: 0 });

      turnosTotales.forEach(t => {
        if (t.telefono_cliente === 'BLOQUEO') return; 
        
        let cumpleFiltro = false;
        if (filtroTiempo === 'dia' && t.fecha === hoyStr) cumpleFiltro = true;
        else if (filtroTiempo === 'semana' && t.fecha >= semanaStr) cumpleFiltro = true;
        else if (filtroTiempo === 'mes' && t.fecha.startsWith(mesActualStr)) cumpleFiltro = true;

        if (cumpleFiltro && ganCancha[t.cancha_id]) {
          const c = canchas.find(x => x.id === t.cancha_id);
          ganCancha[t.cancha_id].ganancias += c ? Number(c.precio_hora) : 0;
          ganCancha[t.cancha_id].cantidad += 1;
        }
      });

      return Object.values(ganCancha);
    }, [filtroTiempo, turnosTotales, canchas]);

    const totalCalculado = datosFiltrados.reduce((acc, curr) => acc + curr.ganancias, 0);

    return (
      <div>
        <div className="general-header">
          <div>
            <h2>Reportes Financieros</h2>
            <p className="subtitle-header">Análisis de ingresos y rendimiento</p>
          </div>
          <div className="acciones-header">
            <button onClick={exportarPDF} className="btn-accion export-pdf">
              <FileText size={18} /> Exportar PDF
            </button>
            <button onClick={exportarExcel} className="btn-accion export-excel">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="metricas-filtros-bar">
          <span className="filtro-label">Filtrar por:</span>
          <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} className="select-filtro-enterprise">
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>

        <div className="metricas-charts-grid">
          <div className="grafico-container">
            <div className="grafico-header">
              <h3 className="grafico-titulo">Ingresos por Cancha</h3>
              <span className="grafico-total-badge">${totalCalculado.toLocaleString('es-AR')}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosFiltrados} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
                <Bar dataKey="ganancias" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container relative">
            <div className="grafico-header">
              
              {/* ACÁ ESTÁ EL NUEVO BOTÓN DE INFO */}
              <h3 className="grafico-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Distribución de Turnos
                <button 
                  onClick={() => setMostrarInfo(!mostrarInfo)} 
                  className={`btn-info-grafico ${mostrarInfo ? 'activo' : ''}`}
                  title="¿Qué significa este gráfico?"
                >
                  <Info size={18} />
                </button>
              </h3>

            </div>

            {/* CAJITA DE EXPLICACIÓN (Se muestra solo si tocaron el botón) */}
            {mostrarInfo && (
              <div className="info-grafico-box">
                Este gráfico te muestra rápidamente cuál es tu <strong>cancha "estrella"</strong>. Te sirve para saber qué instalaciones se usan más, enfocar promociones o decidir dónde invertir en mantenimiento.
              </div>
            )}

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={datosFiltrados} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="cantidad">
                  {datosFiltrados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const PantallaClientes = () => ( 
    <div className="clientes-wrapper">
      <div className="general-header">
        <div>
          <h2>Base de Clientes</h2>
          <p className="subtitle-header">Directorio de jugadores registrados</p>
        </div>
      </div>
      <div className="tabla-container-enterprise">
        <table className="tabla-clientes-enterprise">
          <thead>
            <tr>
              <th>Nombre del Jugador</th>
              <th>Teléfono de Contacto</th>
              <th>Actividad</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={i}>
                <td className="fw-bold text-slate-800">{c.nombre}</td>
                <td>
                  <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noopener noreferrer" className="link-whatsapp-tabla">
                    {c.telefono}
                  </a>
                </td>
                <td><span className="badge-turnos-enterprise">{c.cant} turnos</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PantallaAjustes = () => ( 
    <div>
      <header className="content-header">
        <div>
          <h2>Gestión de Canchas</h2>
          <p className="subtitle-header">Administrá instalaciones y precios</p>
        </div>
        <button className="btn-agregar" onClick={() => setMostrarModalCancha(true)}>
          <Plus size={18} /> Agregar Cancha
        </button>
      </header>
      
      <div className="canchas-list">
        {canchas.map(c => (
          <div key={c.id} className="cancha-card-enterprise">
            <div className={`cancha-imagen-placeholder ${c.imagen_url ? 'con-imagen' : ''}`}>
              {c.imagen_url ? <img src={c.imagen_url} alt={c.nombre} /> : <ImageIcon color="#9ca3af" size={32} />}
            </div>
            <div className="cancha-info">
              <h3>{c.nombre} <span className="cancha-deporte">{c.deporte}</span></h3>
              <p className="cancha-precio-badge">${c.precio_hora} / hora</p>
              <p className="cancha-horario">⏰ {c.hora_apertura || '08:00'} a {c.hora_cierre || '23:00'}</p>
            </div>
            <button className="btn-editar-enterprise" onClick={() => abrirModalEditar(c)} title="Editar información">
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
      <aside className="sidebar-enterprise">
        <div className="sidebar-header">
          <div className="logo-empresa">
            GridPlay<span className="dot-green">.</span>
          </div>
          {miClub && <p className="club-name-enterprise">{miClub.nombre}</p>}
        </div>
        
        <nav className="sidebar-nav">
          <span className="nav-section-title">MENÚ PRINCIPAL</span>
          <button className={`nav-item-enterprise ${vistaActual === 'general' ? 'active' : ''}`} onClick={() => setVistaActual('general')}><LayoutDashboard size={20} /> Vista General</button>
          <button className={`nav-item-enterprise ${vistaActual === 'metricas' ? 'active' : ''}`} onClick={() => setVistaActual('metricas')}><BarChart3 size={20} /> Reportes</button>
          <button className={`nav-item-enterprise ${vistaActual === 'clientes' ? 'active' : ''}`} onClick={() => setVistaActual('clientes')}><Users size={20} /> Clientes</button>
          
          <span className="nav-section-title mt-4">CONFIGURACIÓN</span>
          <button className={`nav-item-enterprise ${vistaActual === 'ajustes' ? 'active' : ''}`} onClick={() => setVistaActual('ajustes')}><Settings size={20} /> Canchas</button>
          <button className={`nav-item-enterprise ${vistaActual === 'perfil' ? 'active' : ''}`} onClick={() => setVistaActual('perfil')}><Building size={20} /> Mi Club</button>
        </nav>
        
        <button className="btn-salir-enterprise" onClick={cerrarSesion}><LogOut size={20} /> Cerrar Sesión</button>
      </aside>

      <main className="main-content-enterprise">
        <div className="content-wrapper">
          {vistaActual === 'general' && <PantallaGeneral />}
          {vistaActual === 'metricas' && <PantallaMetricas />}
          {vistaActual === 'clientes' && <PantallaClientes />}
          {vistaActual === 'ajustes' && <PantallaAjustes />}
          {vistaActual === 'perfil' && <PantallaPerfil />}
        </div>
      </main>

      {/* --- MODALES --- */}

      {mostrarModalDetalles && turnoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#0f172a' }}>
              <Users size={20} color="#2563eb" /> Detalles del Turno
            </h3>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
              <div className="detalle-item">
                <span className="detalle-label">Cliente:</span>
                <span className="detalle-valor">{turnoSeleccionado.esBloqueo ? turnoSeleccionado.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:') : turnoSeleccionado.nombre_cliente}</span>
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
                <div className="detalle-item" style={{ borderTop: '1px solid #e2e8f0', marginTop: '12px', paddingTop: '12px' }}>
                  <span className="detalle-label" style={{ color: '#16a34a' }}>Precio a cobrar:</span>
                  <span className="detalle-valor" style={{ color: '#16a34a', fontSize: '1.2rem', fontWeight: 'bold' }}>${turnoSeleccionado.precio}</span>
                </div>
              )}
            </div>

            <div className="modal-acciones" style={{ marginTop: '16px' }}>
              <button onClick={() => setMostrarModalDetalles(false)} className="btn-modal secundario">Cerrar</button>
              {!turnoSeleccionado.esBloqueo && (
                <button onClick={() => cancelarTurno(turnoSeleccionado.id, turnoSeleccionado.esBloqueo)} className="btn-modal advertencia" style={{ backgroundColor: '#ef4444' }}>
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
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Fecha</label>
                <input type="date" required onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} className="modal-input solo" />
              </div>
              <div className="modal-col">
                <label className="modal-label">Hora</label>
                <input type="time" required onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} className="modal-input solo" />
              </div>
            </div>
            <div>
              <label className="modal-label">Cancha</label>
              <select required onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})} className="modal-input solo">
                <option value="">Seleccionar cancha...</option>
                {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="modal-label">Nombre del Cliente</label>
              <input type="text" placeholder="Ej: Juan Pérez" required onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} className="modal-input solo" />
            </div>
            <div>
              <label className="modal-label">Teléfono</label>
              <input type="text" placeholder="Ej: 3564123456" required onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} className="modal-input solo" />
            </div>
            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Guardar Turno</button>
              <button type="button" onClick={() => setMostrarModal(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal-overlay">
          <form onSubmit={crearBloqueo} className="modal-content">
            <h3 className="modal-header-bloqueo"><Ban size={20}/> Bloquear Horario</h3>
            <p className="modal-desc" style={{ marginBottom: '15px' }}>Impedí reservas en un horario específico por limpieza o mantenimiento.</p>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Fecha</label>
                <input type="date" required onChange={(e) => setFormBloqueo({...formBloqueo, fecha: e.target.value})} className="modal-input solo" />
              </div>
              <div className="modal-col">
                <label className="modal-label">Hora</label>
                <input type="time" required onChange={(e) => setFormBloqueo({...formBloqueo, hora_inicio: e.target.value})} className="modal-input solo" />
              </div>
            </div>
            
            <div>
              <label className="modal-label">Cancha a bloquear</label>
              <select required onChange={(e) => setFormBloqueo({...formBloqueo, cancha_id: e.target.value})} className="modal-input solo">
                <option value="">Seleccionar cancha...</option>
                {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="modal-label">Motivo (Opcional)</label>
              <input type="text" placeholder="Ej: Mantenimiento de red" onChange={(e) => setFormBloqueo({...formBloqueo, motivo: e.target.value})} className="modal-input solo" />
            </div>
            
            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal advertencia">Aplicar Bloqueo</button>
              <button type="button" onClick={() => setMostrarModalBloqueo(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalCancha && (
        <div className="modal-overlay">
          <form onSubmit={crearCanchaManual} className="modal-content">
            <h3>Nueva Cancha</h3>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Nombre</label>
                <input type="text" placeholder="Ej: Cancha 1" required value={formCancha.nombre} onChange={(e) => setFormCancha({...formCancha, nombre: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <input type="text" placeholder="Ej: Pádel" required value={formCancha.deporte} onChange={(e) => setFormCancha({...formCancha, deporte: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Precio por Hora ($)</label>
              <input type="number" required value={formCancha.precio_hora} onChange={(e) => setFormCancha({...formCancha, precio_hora: e.target.value})} className="modal-input solo"/>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={formCancha.hora_apertura} onChange={(e) => setFormCancha({...formCancha, hora_apertura: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={formCancha.hora_cierre} onChange={(e) => setFormCancha({...formCancha, hora_cierre: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Foto de la Cancha (Opcional)</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setImagenCanchaFile(e.target.files[0]); }} className="modal-input solo" style={{ padding: '8px' }}/>
            </div>

            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Guardar Cancha</button>
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
                <input type="text" required value={canchaEditando.nombre} onChange={(e) => setCanchaEditando({...canchaEditando, nombre: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <input type="text" required value={canchaEditando.deporte} onChange={(e) => setCanchaEditando({...canchaEditando, deporte: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Precio por Hora ($)</label>
              <input type="number" required value={canchaEditando.precio_hora} onChange={(e) => setCanchaEditando({...canchaEditando, precio_hora: e.target.value})} className="modal-input solo"/>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={canchaEditando.hora_apertura} onChange={(e) => setCanchaEditando({...canchaEditando, hora_apertura: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={canchaEditando.hora_cierre} onChange={(e) => setCanchaEditando({...canchaEditando, hora_cierre: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Cambiar Foto (Opcional)</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setImagenCanchaEditFile(e.target.files[0]); }} className="modal-input solo" style={{ padding: '8px' }}/>
              {canchaEditando.imagen_url && !imagenCanchaEditFile && (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#16a34a' }}>✓ Imagen cargada previamente</p>
              )}
            </div>

            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Actualizar Cambios</button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;