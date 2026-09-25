import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LayoutDashboard, BarChart3, Users, LayoutGrid, Store, Building, LogOut, Menu, X, Building2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { subirImagen } from '../../services/storage';
import { Vacio } from './components/ui.jsx';
import { fechaISO, fechaCorta, moneda } from './lib/formato.js';
import { enriquecerTurnos } from './lib/metricas.js';
import { canchaVacia, canchaParaEditar } from './lib/deportes.js';
import VistaGeneral from './views/VistaGeneral.jsx';
import Reportes from './views/Reportes.jsx';
import Clientes from './views/Clientes.jsx';
import Canchas from './views/Canchas.jsx';
import MiClub from './views/MiClub.jsx';
import GestorKiosco from '../user/GestorKiosco.jsx';
import { ModalTurno, ModalBloqueo, ModalDetalles, ModalCancha, ModalConfirmar } from './modals/modales.jsx';
import './dashboard.css';

const NAV = [
  { seccion: 'Menú principal', items: [
    { id: 'general', texto: 'Vista general', icono: LayoutDashboard },
    { id: 'metricas', texto: 'Reportes', icono: BarChart3 },
    { id: 'clientes', texto: 'Clientes', icono: Users },
  ] },
  { seccion: 'Configuración', items: [
    { id: 'canchas', texto: 'Canchas', icono: LayoutGrid },
    { id: 'kiosco', texto: 'Kiosco y extras', icono: Store },
    { id: 'perfil', texto: 'Mi club', icono: Building },
  ] },
];

const mensajeDeBase = (error, porDefecto) => (error?.code === '23505' ? 'Ese horario ya está ocupado en esa cancha.' : porDefecto);

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [sinClub, setSinClub] = useState(false);
  const [vista, setVista] = useState('general');
  const [menuMovil, setMenuMovil] = useState(false);

  const [miClub, setMiClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [turnosCrudos, setTurnosCrudos] = useState([]);
  const [modal, setModal] = useState(null); // { tipo, ...datos }

  const hoy = fechaISO();
  const turnos = useMemo(() => enriquecerTurnos(turnosCrudos, canchas), [turnosCrudos, canchas]);

  const cargarDatos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    // La identidad del club es admin_id (uid de auth); el email ya no interviene.
    const { data: club } = await supabase.from('clubes').select('*').eq('admin_id', user.id).limit(1).maybeSingle();
    if (!club) { setSinClub(true); setCargando(false); return; }
    setMiClub(club);

    const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', club.id).order('id', { ascending: true });
    setCanchas(canchasData || []);

    if (!canchasData?.length) { setTurnosCrudos([]); setCargando(false); return; }

    const { data: turnosData } = await supabase
      .from('turnos')
      .select('*')
      .in('cancha_id', canchasData.map((c) => c.id))
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });
    setTurnosCrudos(turnosData || []);
    setCargando(false);
  }, [navigate]);

  // Carga inicial desde Supabase (los setState ocurren después de las esperas, no de forma síncrona)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const cerrarModal = useCallback(() => setModal(null), []);
  const irA = (id) => { setVista(id); setMenuMovil(false); };
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  // ---------- Turnos ----------
  const guardarTurno = async (form) => {
    const { error } = await supabase.from('turnos').insert([{ ...form, nombre_cliente: form.nombre_cliente.trim() }]);
    if (error) throw new Error(mensajeDeBase(error, 'No se pudo cargar el turno. Revisá los datos.'));
    await cargarDatos();
    cerrarModal();
  };

  const guardarBloqueo = async (form) => {
    const { error } = await supabase.from('turnos').insert([{
      cancha_id: form.cancha_id,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      nombre_cliente: form.motivo ? `Bloqueo por: ${form.motivo.trim()}` : 'Bloqueo por: Mantenimiento',
      telefono_cliente: 'BLOQUEO',
    }]);
    if (error) throw new Error(mensajeDeBase(error, 'No se pudo bloquear el horario.'));
    await cargarDatos();
    cerrarModal();
  };

  const pedirCancelarTurno = (turno) => setModal({
    tipo: 'confirmar',
    titulo: turno.esBloqueo ? 'Liberar horario' : 'Cancelar turno',
    texto: turno.esBloqueo
      ? '¿Querés liberar este horario bloqueado? Volverá a estar disponible para reservar.'
      : `¿Cancelar el turno de ${turno.nombre_cliente} del ${fechaCorta(turno.fecha)} a las ${turno.hora_inicio}? El horario quedará libre.`,
    textoBoton: turno.esBloqueo ? 'Liberar' : 'Cancelar turno',
    onConfirmar: async () => {
      const { data, error } = await supabase.from('turnos').delete().eq('id', turno.id).select('id');
      if (error || !data?.length) throw new Error('No se pudo cancelar el turno.');
      await cargarDatos();
      cerrarModal();
    },
  });

  // ---------- Canchas ----------
  const subirFotos = async (archivos) => {
    const urls = [];
    for (const archivo of archivos) urls.push(await subirImagen(archivo, 'canchas'));
    return urls;
  };

  const guardarCancha = async (form, archivos, modo) => {
    const nuevas = archivos.length ? await subirFotos(archivos) : [];
    const existentes = form.imagen_url ? form.imagen_url.split(',').filter(Boolean) : [];
    const datos = {
      nombre: form.nombre.trim(),
      deporte: form.deporte,
      cantidad_jugadores: Number(form.cantidad_jugadores),
      superficie: form.superficie,
      techada: Boolean(form.techada),
      precio_hora: Number(form.precio_hora) || 0,
      hora_apertura: form.hora_apertura,
      hora_cierre: form.hora_cierre,
      imagen_url: [...existentes, ...nuevas].join(','),
    };

    const { error } = modo === 'editar'
      ? await supabase.from('canchas').update(datos).eq('id', form.id)
      : await supabase.from('canchas').insert([{ ...datos, club_id: miClub.id }]);
    if (error) throw new Error('No se pudo guardar la cancha. Revisá los datos e intentá de nuevo.');

    await cargarDatos();
    cerrarModal();
  };

  const pedirEliminarCancha = (cancha) => setModal({
    tipo: 'confirmar',
    titulo: 'Eliminar cancha',
    texto: `Se eliminará "${cancha.nombre}" y todos los turnos que tenga reservados. Esta acción no se puede deshacer.`,
    textoBoton: 'Eliminar cancha',
    onConfirmar: async () => {
      const { error } = await supabase.from('canchas').delete().eq('id', cancha.id);
      if (error) throw new Error('No se pudo eliminar la cancha.');
      await cargarDatos();
      cerrarModal();
    },
  });

  // ---------- Exportaciones (se rehacen en la Fase 7) ----------
  const nombreArchivo = () => `${(miClub?.nombre || 'Mi_Complejo').replace(/\s+/g, '_')}_${fechaISO()}`;
  const filasReporte = () => turnos.filter((t) => !t.esBloqueo);

  const exportarExcel = () => {
    const filas = filasReporte().map((t) => ({
      Fecha: fechaCorta(t.fecha),
      Hora: t.hora_inicio,
      Cliente: t.nombre_cliente,
      Teléfono: t.telefono_cliente,
      Cancha: t.nombre_cancha,
      'Alquiler ($)': t.precio,
      'Extras ($)': t.extrasTotal,
      'Total ($)': t.total,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Turnos');
    XLSX.writeFile(libro, `Reporte_${nombreArchivo()}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const filas = filasReporte();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Reporte de ingresos - ${miClub?.nombre || 'Mi complejo'}`, 14, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el: ${fechaCorta(fechaISO())}`, 14, 28);
    autoTable(doc, {
      head: [['Fecha', 'Hora', 'Cliente', 'Cancha', 'Total']],
      body: filas.map((t) => [fechaCorta(t.fecha), t.hora_inicio, t.nombre_cliente || 'Sin nombre', t.nombre_cancha, moneda(t.total)]),
      foot: [['', '', '', 'Total facturado', moneda(filas.reduce((a, t) => a + t.total, 0))]],
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [22, 163, 74] },
    });
    doc.save(`Reporte_${nombreArchivo()}.pdf`);
  };

  if (cargando) return <div className="dash"><div className="dash-mensaje" style={{ width: '100%' }}>Cargando panel…</div></div>;

  if (sinClub) {
    return (
      <div className="dash">
        <div className="dash-mensaje" style={{ width: '100%' }}>
          <Vacio icono={Building2} titulo="No encontramos un club asociado a tu cuenta"
            texto="Completá el registro de tu complejo para usar el panel."
            accion={<button type="button" className="dash-btn dash-btn--primario" onClick={() => navigate('/registro-club')}>Registrar mi club</button>} />
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <header className="dash-topbar">
        <button type="button" className="dash-icon-btn" onClick={() => setMenuMovil(true)} aria-label="Abrir menú"><Menu size={22} /></button>
        <span className="dash-logo">GridPlay</span>
        <span style={{ width: 34 }} />
      </header>

      {menuMovil && <div className="dash-fondo-menu" onClick={() => setMenuMovil(false)} />}

      <aside className={`dash-sidebar ${menuMovil ? 'abierto' : ''}`}>
        <div className="dash-marca">
          <span className="dash-logo">GridPlay</span>
          <button type="button" className="dash-icon-btn dash-cerrar-menu" onClick={() => setMenuMovil(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>

        <div className="dash-club">
          <span className="dash-club-avatar">{miClub?.imagen_url ? <img src={miClub.imagen_url} alt="" /> : (miClub?.nombre || 'C').charAt(0).toUpperCase()}</span>
          <div className="dash-club-texto">
            <strong>{miClub?.nombre}</strong>
            <span>Administrador</span>
          </div>
        </div>

        <nav className="dash-nav" aria-label="Secciones del panel">
          {NAV.map((grupo) => (
            <div key={grupo.seccion}>
              <span className="dash-nav-titulo">{grupo.seccion}</span>
              {grupo.items.map(({ id, texto, icono: Icono }) => (
                <button key={id} type="button" className={`dash-nav-item ${vista === id ? 'activo' : ''}`} aria-current={vista === id ? 'page' : undefined} onClick={() => irA(id)}>
                  <Icono size={18} /> {texto}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button type="button" className="dash-salir" onClick={cerrarSesion}><LogOut size={18} /> Cerrar sesión</button>
      </aside>

      <main className="dash-main">
        <div className="dash-contenido" key={vista}>
          {vista === 'general' && (
            <VistaGeneral club={miClub} turnos={turnos} canchas={canchas} hoy={hoy}
              onNuevoTurno={() => setModal({ tipo: 'turno' })} onBloqueo={() => setModal({ tipo: 'bloqueo' })}
              onDetalles={(turno) => setModal({ tipo: 'detalles', turno })} onCancelar={pedirCancelarTurno} />
          )}
          {vista === 'metricas' && <Reportes turnos={turnos} canchas={canchas} hoy={hoy} onExportarPDF={exportarPDF} onExportarExcel={exportarExcel} />}
          {vista === 'clientes' && <Clientes turnos={turnos} />}
          {vista === 'canchas' && (
            <Canchas canchas={canchas} onNueva={() => setModal({ tipo: 'cancha', modo: 'crear', inicial: canchaVacia() })}
              onEditar={(c) => setModal({ tipo: 'cancha', modo: 'editar', inicial: canchaParaEditar(c) })} onEliminar={pedirEliminarCancha} />
          )}
          {vista === 'kiosco' && (
            <>
              <header className="dash-page-head">
                <div><h1>Kiosco y extras</h1><p>Administrá bebidas, paletas y otros productos que se ofrecen al reservar</p></div>
              </header>
              <GestorKiosco clubId={miClub?.id} />
            </>
          )}
          {vista === 'perfil' && <MiClub miClub={miClub} setMiClub={setMiClub} />}
        </div>
      </main>

      {modal?.tipo === 'turno' && <ModalTurno canchas={canchas} hoy={hoy} onGuardar={guardarTurno} onCerrar={cerrarModal} />}
      {modal?.tipo === 'bloqueo' && <ModalBloqueo canchas={canchas} hoy={hoy} onGuardar={guardarBloqueo} onCerrar={cerrarModal} />}
      {modal?.tipo === 'detalles' && <ModalDetalles turno={modal.turno} onCancelar={pedirCancelarTurno} onCerrar={cerrarModal} />}
      {modal?.tipo === 'cancha' && <ModalCancha modo={modal.modo} inicial={modal.inicial} onGuardar={(form, archivos) => guardarCancha(form, archivos, modal.modo)} onCerrar={cerrarModal} />}
      {modal?.tipo === 'confirmar' && <ModalConfirmar titulo={modal.titulo} texto={modal.texto} textoBoton={modal.textoBoton} onConfirmar={modal.onConfirmar} onCerrar={cerrarModal} />}
    </div>
  );
};

export default DashboardAdmin;
