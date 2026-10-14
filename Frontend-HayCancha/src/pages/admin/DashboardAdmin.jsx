import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, LayoutGrid, Store, Building, LogOut, Menu, X, Building2, Star, CreditCard, Share2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { subirImagen } from '../../services/storage';
import { leerTodas } from '../../services/paginado';
import { Vacio } from './components/ui.jsx';
import { fechaISO, fechaCorta, moneda, pluralizar } from './lib/formato.js';
import { describirTurnoFijo, fijosConPrecio, mensajeTurnoFijo, resumenCreacion } from './lib/turnosFijos.js';
import { enriquecerTurnos } from './lib/metricas.js';
import { canchaVacia, canchaParaEditar } from './lib/deportes.js';
import VistaGeneral from './views/VistaGeneral.jsx';
import Reportes from './views/Reportes.jsx';
import Clientes from './views/Clientes.jsx';
import Canchas from './views/Canchas.jsx';
import MiClub from './views/MiClub.jsx';
import AvisoSuscripcion from './components/AvisoSuscripcion';
import { leerMisSuscripciones } from '../../services/suscripcion';
import { estadoDeSuscripcion } from '../../utils/suscripcion';
import Kiosco from './views/Kiosco.jsx';
import Resenas from './views/Resenas.jsx';
import MiPlan from './views/MiPlan.jsx';
import Compartir from './views/Compartir.jsx';
import { ModalTurno, ModalBloqueo, ModalDetalles, ModalCancha, ModalConfirmar, ModalCancelarFijo } from './modals/modales.jsx';
import './dashboard.css';

const NAV = [
  { seccion: 'Menú principal', items: [
    { id: 'general', texto: 'Vista general', icono: LayoutDashboard },
    { id: 'metricas', texto: 'Reportes', icono: BarChart3 },
    { id: 'clientes', texto: 'Clientes', icono: Users },
    { id: 'resenas', texto: 'Reseñas', icono: Star },
    { id: 'compartir', texto: 'Compartí tu club', icono: Share2 },
  ] },
  { seccion: 'Configuración', items: [
    { id: 'canchas', texto: 'Canchas', icono: LayoutGrid },
    { id: 'kiosco', texto: 'Kiosco y extras', icono: Store },
    { id: 'perfil', texto: 'Mi club', icono: Building },
    { id: 'plan', texto: 'Mi plan', icono: CreditCard },
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
  const [filasSuscripcion, setFilasSuscripcion] = useState(null); // null = todavía no se leyeron
  const suscripcion = useMemo(() => (filasSuscripcion ? estadoDeSuscripcion(filasSuscripcion) : null), [filasSuscripcion]);
  const resultadoPago = new URLSearchParams(window.location.search).get('pago'); // 'ok' | 'error' al volver de Mercado Pago
  const [canchas, setCanchas] = useState([]);
  const [turnosCrudos, setTurnosCrudos] = useState([]);
  const [turnosFijos, setTurnosFijos] = useState(null); // null = la base todavía no tiene turnos fijos
  const [modal, setModal] = useState(null); // { tipo, ...datos }
  const [exportando, setExportando] = useState(null); // 'pdf' | 'excel' mientras se genera el archivo
  const [errorExportar, setErrorExportar] = useState('');

  const hoy = fechaISO();
  const turnos = useMemo(() => enriquecerTurnos(turnosCrudos, canchas), [turnosCrudos, canchas]);

  const cargarSuscripcion = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setFilasSuscripcion(await leerMisSuscripciones(user.id));
  }, []);

  const cargarDatos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    // La identidad del club es admin_id (uid de auth); el email ya no interviene.
    const { data: club } = await supabase.from('clubes').select('*').eq('admin_id', user.id).limit(1).maybeSingle();
    if (!club) { setSinClub(true); setCargando(false); return; }
    setMiClub(club);
    leerMisSuscripciones(user.id).then(setFilasSuscripcion);

    const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', club.id).order('id', { ascending: true });
    setCanchas(canchasData || []);

    if (!canchasData?.length) { setTurnosCrudos([]); setCargando(false); return; }

    const idsCanchas = canchasData.map((c) => c.id);
    // Antes de leer los turnos, completa las semanas que falten de los turnos fijos (el backend también lo hace cada hora).
    const { data: fijosData, error: errorFijos } = await supabase.from('turnos_fijos').select('*').in('cancha_id', idsCanchas).eq('activo', true).order('dia_semana').order('hora_inicio');
    if (errorFijos) {
      setTurnosFijos(null);
    } else {
      setTurnosFijos(fijosData || []);
      if (fijosData?.length) await supabase.rpc('extender_mis_turnos_fijos');
    }

    const turnosData = await leerTodas(() => supabase
      .from('turnos')
      .select('*')
      .in('cancha_id', idsCanchas)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .order('id', { ascending: true }));
    setTurnosCrudos(turnosData);
    setCargando(false);
  }, [navigate]);

  // Carga inicial desde Supabase (los setState ocurren después de las esperas, no de forma síncrona)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const cerrarModal = useCallback(() => setModal(null), []);
  const irA = (id) => { setVista(id); setMenuMovil(false); };
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  // ---------- Turnos ----------
  /** Crea un turno fijo y devuelve el resumen para mostrar en la ventana (no la cierra). */
  const crearTurnoFijo = async ({ cancha_id, fecha, hora_inicio, hasta }, nombre, telefono, bloqueo) => {
    const { data, error } = await supabase.rpc('crear_turno_fijo', {
      p_cancha_id: cancha_id, p_desde: fecha, p_hora: hora_inicio, p_nombre: nombre, p_telefono: telefono,
      p_hasta: hasta || null, p_bloqueo: bloqueo,
    });
    if (error) throw new Error(mensajeTurnoFijo(error));
    await cargarDatos();
    return resumenCreacion(data);
  };

  const guardarTurno = async (form) => {
    if (form.repetir) return crearTurnoFijo(form, form.nombre_cliente.trim(), form.telefono_cliente, false);
    const { cancha_id, fecha, hora_inicio, telefono_cliente } = form;
    const { error } = await supabase.from('turnos').insert([{ cancha_id, fecha, hora_inicio, telefono_cliente, nombre_cliente: form.nombre_cliente.trim() }]);
    if (error) throw new Error(mensajeDeBase(error, 'No se pudo cargar el turno. Revisá los datos.'));
    await cargarDatos();
    cerrarModal();
  };

  const guardarBloqueo = async (form) => {
    if (form.repetir) return crearTurnoFijo(form, form.motivo, '', true);
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

  const borrarTurno = async (turno) => {
    const { data, error } = await supabase.from('turnos').delete().eq('id', turno.id).select('id');
    if (error || !data?.length) throw new Error('No se pudo cancelar el turno.');
    await cargarDatos();
    cerrarModal();
  };

  const terminarTurnoFijo = async (idFijo) => {
    const { error } = await supabase.rpc('terminar_turno_fijo', { p_id: idFijo });
    if (error) throw new Error(mensajeTurnoFijo(error, 'No se pudo terminar el turno fijo.'));
    await cargarDatos();
    cerrarModal();
  };

  const pedirTerminarFijo = (fijo) => setModal({
    tipo: 'confirmar',
    titulo: fijo.es_bloqueo ? 'Terminar bloqueo fijo' : 'Terminar turno fijo',
    texto: `${describirTurnoFijo(fijo)} · ${fijo.nombre_cliente}. Se borran los turnos que todavía no se jugaron y no se carga ninguno más.`,
    textoBoton: 'Terminar',
    onConfirmar: () => terminarTurnoFijo(fijo.id),
  });

  const fijoActivo = (turno) => turno.esFijo && turno.fecha >= hoy && turnosFijos?.some((f) => f.id === turno.turno_fijo_id);
  const pedirCancelarTurno = (turno) => setModal(fijoActivo(turno) ? { tipo: 'cancelarFijo', turno } : {
    tipo: 'confirmar',
    titulo: turno.esBloqueo ? 'Liberar horario' : 'Cancelar turno',
    texto: turno.esBloqueo
      ? '¿Querés liberar este horario bloqueado? Volverá a estar disponible para reservar.'
      : `¿Cancelar el turno de ${turno.nombre_cliente} del ${fechaCorta(turno.fecha)} a las ${turno.hora_inicio}? El horario quedará libre.`,
    textoBoton: turno.esBloqueo ? 'Liberar' : 'Cancelar turno',
    onConfirmar: () => borrarTurno(turno),
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

    // Si cambió el precio y la cancha tiene turnos fijos, el dueño elige si pasarlos al precio nuevo.
    const anterior = canchas.find((c) => c.id === form.id);
    const fijos = modo === 'editar' && turnosFijos ? fijosConPrecio(turnosFijos, form.id) : [];
    if (anterior && fijos.length && Number(anterior.precio_hora) !== datos.precio_hora) {
      setModal({
        tipo: 'confirmar',
        titulo: 'Cambiaste el precio',
        texto: `${datos.nombre} tiene ${pluralizar(fijos.length, 'turno fijo', 'turnos fijos')}. ¿Querés pasar los que todavía no se jugaron de ${moneda(anterior.precio_hora)} a ${moneda(datos.precio_hora)}? Si no, siguen con el precio anterior.`,
        textoBoton: 'Pasar al precio nuevo',
        textoVolver: 'Mantener el anterior',
        estilo: 'primario',
        onConfirmar: async () => {
          const { error: errorPrecio } = await supabase.rpc('actualizar_precio_turnos_fijos', { p_cancha_id: form.id });
          if (errorPrecio) throw new Error(mensajeTurnoFijo(errorPrecio, 'No se pudo actualizar el precio de los turnos fijos.'));
          await cargarDatos();
          cerrarModal();
        },
      });
      return;
    }
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
  // Las librerías de PDF y Excel pesan más que el resto del panel junto: se descargan recién al exportar.
  const exportar = async (tipo, generar) => {
    setErrorExportar('');
    setExportando(tipo);
    try {
      await generar();
    } catch (error) {
      console.error('No se pudo exportar el reporte:', error);
      setErrorExportar('No pudimos generar el archivo. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setExportando(null);
    }
  };

  const nombreArchivo = () => `${(miClub?.nombre || 'Mi_Complejo').replace(/\s+/g, '_')}_${fechaISO()}`;
  const filasReporte = () => turnos.filter((t) => !t.esBloqueo);

  const exportarExcel = () => exportar('excel', async () => {
    const XLSX = await import('xlsx');
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
  });

  const exportarPDF = () => exportar('pdf', async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
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
  });

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
        {vista !== 'plan' && <AvisoSuscripcion estado={suscripcion} pago={resultadoPago} />}
        <div className="dash-contenido" key={vista}>
          {vista === 'general' && (
            <VistaGeneral club={miClub} turnos={turnos} canchas={canchas} hoy={hoy} turnosFijos={turnosFijos}
              onNuevoTurno={() => setModal({ tipo: 'turno' })} onBloqueo={() => setModal({ tipo: 'bloqueo' })}
              onDetalles={(turno) => setModal({ tipo: 'detalles', turno })} onCancelar={pedirCancelarTurno} onTerminarFijo={pedirTerminarFijo} />
          )}
          {vista === 'metricas' && <Reportes turnos={turnos} canchas={canchas} hoy={hoy} onExportarPDF={exportarPDF} onExportarExcel={exportarExcel} exportando={exportando} errorExportar={errorExportar} />}
          {vista === 'clientes' && <Clientes turnos={turnos} />}
          {vista === 'canchas' && (
            <Canchas canchas={canchas} onNueva={() => setModal({ tipo: 'cancha', modo: 'crear', inicial: canchaVacia() })}
              onEditar={(c) => setModal({ tipo: 'cancha', modo: 'editar', inicial: canchaParaEditar(c) })} onEliminar={pedirEliminarCancha} />
          )}
          {vista === 'kiosco' && <Kiosco clubId={miClub?.id} />}
          {vista === 'resenas' && <Resenas />}
          {vista === 'compartir' && <Compartir club={miClub} canchas={canchas} />}
          {vista === 'perfil' && <MiClub miClub={miClub} setMiClub={setMiClub} />}
          {vista === 'plan' && <MiPlan estado={suscripcion} filas={filasSuscripcion || []} onCambio={cargarSuscripcion} />}
        </div>
      </main>

      {modal?.tipo === 'turno' && <ModalTurno canchas={canchas} hoy={hoy} permiteFijo={turnosFijos !== null} onGuardar={guardarTurno} onCerrar={cerrarModal} />}
      {modal?.tipo === 'bloqueo' && <ModalBloqueo canchas={canchas} hoy={hoy} permiteFijo={turnosFijos !== null} onGuardar={guardarBloqueo} onCerrar={cerrarModal} />}
      {modal?.tipo === 'cancelarFijo' && (
        <ModalCancelarFijo turno={modal.turno} onSoloEste={() => borrarTurno(modal.turno)}
          onTerminar={() => terminarTurnoFijo(modal.turno.turno_fijo_id)} onCerrar={cerrarModal} />
      )}
      {modal?.tipo === 'detalles' && <ModalDetalles turno={modal.turno} club={miClub} onCancelar={pedirCancelarTurno} onCerrar={cerrarModal} />}
      {modal?.tipo === 'cancha' && <ModalCancha modo={modal.modo} inicial={modal.inicial} onGuardar={(form, archivos) => guardarCancha(form, archivos, modal.modo)} onCerrar={cerrarModal} />}
      {modal?.tipo === 'confirmar' && (
        <ModalConfirmar titulo={modal.titulo} texto={modal.texto} textoBoton={modal.textoBoton} textoVolver={modal.textoVolver}
          estilo={modal.estilo} onConfirmar={modal.onConfirmar} onCerrar={cerrarModal} />
      )}
    </div>
  );
};

export default DashboardAdmin;
