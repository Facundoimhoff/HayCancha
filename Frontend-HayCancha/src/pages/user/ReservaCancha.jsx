import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Users, Layers, CloudRain, CalendarPlus, Navigation, MessageCircle,
  ChevronRight, Sunrise, Sun, Moon, CalendarDays, Clock,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/authContext';
import { resumenPorClub } from '../../services/resenas';
import { validarTelefono, mensajeDeServidor } from '../../utils/validaciones';
import {
  moneda, proximosDias, fechaLarga, fechaCorta, totalSeleccion, extrasParaEnviar,
  enlaceCalendario, enlaceMapa, enlaceWhatsApp,
} from '../../utils/reservas';
import { Calificacion } from '../../components/user/Estrellas';
import EditorExtras from '../../components/user/EditorExtras';
import FormularioAcceso from '../../components/user/FormularioAcceso';
import { Pasos } from '../../components/user/Formulario';
import './ReservaCancha.css';

const PASOS = ['Horario', 'Confirmar', 'Listo'];
const FRANJAS = [
  { id: 'manana', nombre: 'Mañana', Icono: Sunrise, desde: 0, hasta: 13 },
  { id: 'tarde', nombre: 'Tarde', Icono: Sun, desde: 13, hasta: 19 },
  { id: 'noche', nombre: 'Noche', Icono: Moon, desde: 19, hasta: 24 },
];

const generarHoras = (apertura, cierre) => {
  const desde = parseInt(String(apertura || '08:00').split(':')[0], 10);
  const hasta = parseInt(String(cierre || '23:00').split(':')[0], 10);
  const horas = [];
  for (let h = desde; h < hasta; h++) horas.push(`${String(h).padStart(2, '0')}:00`);
  return horas;
};

const ReservaCancha = () => {
  const { idCancha } = useParams();
  const navigate = useNavigate();
  const { user, perfil, cargando: cargandoSesion, recargarPerfil } = useAuth();

  const [cancha, setCancha] = useState(null);
  const [club, setClub] = useState(null);
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [ocupados, setOcupados] = useState(() => new Set());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  const dias = useMemo(() => proximosDias(14), []);
  const hoy = dias[0].fecha;

  const [paso, setPaso] = useState(1);
  const [diaVisible, setDiaVisible] = useState(hoy);
  const [seleccion, setSeleccion] = useState(null); // { fecha, hora }
  const [aviso, setAviso] = useState('');

  // Solo se guarda lo que el usuario edita; si no tocó nada, se usa lo del perfil
  const [nombreEditado, setNombreEditado] = useState(null);
  const [telefonoEditado, setTelefonoEditado] = useState(null);
  const nombre = nombreEditado ?? (perfil?.nombre_completo || user?.user_metadata?.full_name || '');
  const telefono = telefonoEditado ?? (perfil?.telefono || '');
  const [cantidades, setCantidades] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorReserva, setErrorReserva] = useState('');
  const [reserva, setReserva] = useState(null);

  // Los turnos de otras personas no son legibles (RLS): la disponibilidad sale de una RPC que solo devuelve horarios ocupados.
  const cargarOcupados = useCallback(async () => {
    const { data, error } = await supabase.rpc('disponibilidad_cancha', {
      p_cancha_id: idCancha,
      p_desde: dias[0].fecha,
      p_hasta: dias[dias.length - 1].fecha,
    });
    if (error) throw error;
    setOcupados(new Set((data || []).map((t) => `${t.fecha}|${String(t.hora_inicio).slice(0, 5)}`)));
  }, [idCancha, dias]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { data: dataCancha, error: errorCancha } = await supabase.from('canchas').select('*').eq('id', idCancha).single();
        if (errorCancha) throw errorCancha;
        if (cancelado) return;
        setCancha(dataCancha);

        if (dataCancha?.club_id) {
          const { data: dataClub } = await supabase.from('clubes').select('*').eq('id', dataCancha.club_id).single();
          const { data: dataProductos } = await supabase.from('productos').select('*').eq('club_id', dataCancha.club_id);
          if (cancelado) return;
          setClub(dataClub || null);
          setProductos((dataProductos || []).filter((p) => p.activo !== false));
          resumenPorClub([dataCancha.club_id]).then((r) => { if (!cancelado) setResumen(r[dataCancha.club_id] || null); });
        }

        await cargarOcupados();
      } catch (err) {
        console.error('Error al cargar datos de la reserva:', err);
        if (!cancelado) setErrorCarga(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => { cancelado = true; };
  }, [idCancha, cargarOcupados]);

  // Si dejó la pestaña abierta un rato, al volver se refresca la disponibilidad
  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === 'visible') cargarOcupados().catch(() => {}); };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [cargarOcupados]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [paso]);

  const horas = useMemo(() => (cancha ? generarHoras(cancha.hora_apertura, cancha.hora_cierre) : []), [cancha]);
  const horaActual = new Date().getHours();

  const estadoHora = (fecha, hora) => {
    if (fecha === hoy && Number(hora.slice(0, 2)) <= horaActual) return 'pasado';
    return ocupados.has(`${fecha}|${hora}`) ? 'ocupado' : 'libre';
  };

  const libresDelDia = (fecha) => horas.filter((h) => estadoHora(fecha, h) === 'libre').length;
  const libresHoy = libresDelDia(diaVisible);

  const precioCancha = Number(cancha?.precio_hora) || 0;
  const totalExtrasElegidos = totalSeleccion(productos, cantidades);
  const total = precioCancha + totalExtrasElegidos;
  const lineasExtras = productos.filter((p) => (cantidades[p.id] || 0) > 0);

  const elegirHora = (hora) => {
    setAviso('');
    setSeleccion({ fecha: diaVisible, hora });
  };

  const confirmar = async (e) => {
    e.preventDefault();
    setErrorReserva('');

    if (!validarTelefono(telefono)) {
      setErrorReserva('Ingresá un teléfono válido (solo números, entre 6 y 20 dígitos).');
      return;
    }

    setGuardando(true);
    try {
      // Solo se mandan ids y cantidades: nombre, precio y totales los calcula el servidor.
      const extras = extrasParaEnviar(cantidades).filter((x) => x.cantidad > 0);
      const { error } = await supabase.rpc('crear_reserva', {
        p_cancha_id: idCancha,
        p_fecha: seleccion.fecha,
        p_hora: seleccion.hora,
        p_nombre: nombre,
        p_telefono: telefono,
        p_extras: extras,
      });
      if (error) throw error;

      setReserva({ ...seleccion, nombre, total });
      setPaso(3);

      // Guarda el teléfono en el perfil para no pedirlo la próxima vez (si falla, no afecta la reserva)
      if (user && perfil?.telefono !== telefono) {
        supabase.from('usuarios').update({ telefono }).eq('id', user.id).then(() => recargarPerfil?.());
      }
    } catch (err) {
      console.error('Error al guardar la reserva:', err);
      const horarioPerdido = err?.message?.includes('SLOT_OCUPADO') || err?.message?.includes('TURNO_PASADO');
      if (horarioPerdido) {
        setSeleccion(null);
        setPaso(1);
        setAviso(mensajeDeServidor(err));
        cargarOcupados().catch(() => {});
      } else {
        setErrorReserva(mensajeDeServidor(err, 'Hubo un error al procesar el turno. Intentá de nuevo.'));
      }
    } finally {
      setGuardando(false);
    }
  };

  const reservarOtro = () => {
    setReserva(null);
    setSeleccion(null);
    setCantidades({});
    setErrorReserva('');
    setPaso(1);
    cargarOcupados().catch(() => {});
  };

  const rutaVuelta = club?.provincia && club?.ciudad
    ? `/explorar/${encodeURIComponent(club.provincia)}/${encodeURIComponent(club.ciudad)}`
    : '/';

  if (cargando) return <div className="estado-carga">Cargando disponibilidad...</div>;
  if (errorCarga || !cancha) {
    return (
      <div className="estado-carga">
        <p>No pudimos cargar esta cancha. Puede que ya no exista o que haya un problema de conexión.</p>
        <Link to="/" className="gp-btn gp-btn--primario">Volver al inicio</Link>
      </div>
    );
  }

  const superficie = cancha.superficie || (cancha.deporte === 'Pádel' ? 'Blindex / Sintético' : 'Sintético');

  return (
    <div className="rc-pagina">
      <div className="rc-contenedor">
        <header className="rc-cabecera">
          <button type="button" onClick={() => navigate(-1)} className="rc-volver" aria-label="Volver">
            <ArrowLeft size={22} />
          </button>
          <div className="rc-cabecera-texto">
            <h1>{cancha.nombre}</h1>
            {club && <Link to={`/club/${club.id}`}>{club.nombre}</Link>}
          </div>
          <div className="rc-precio-hora">
            <strong>{moneda(precioCancha)}</strong>
            <small>por hora</small>
          </div>
        </header>

        <div className="rc-chips">
          <span className="gp-chip gp-chip--marca">{cancha.deporte}</span>
          <span className="gp-chip"><Users size={13} /> {cancha.cantidad_jugadores || 5} jugadores</span>
          <span className="gp-chip"><Layers size={13} /> {superficie}</span>
          {cancha.techada && <span className="gp-chip"><CloudRain size={13} /> Techada</span>}
          {club && <Calificacion resumen={resumen} className="rc-calif" />}
        </div>

        <Pasos pasos={PASOS} actual={paso} etiqueta="Progreso de la reserva" />

        {/* ---------------- PASO 1: HORARIO ---------------- */}
        {paso === 1 && (
          <section className="rc-seccion">
            <h2>Elegí día y horario</h2>
            {aviso && <p className="gp-alerta gp-alerta--aviso" role="alert">{aviso}</p>}

            <div className="rc-dias" role="tablist" aria-label="Días disponibles">
              {dias.map((dia) => {
                const libres = libresDelDia(dia.fecha);
                const activo = diaVisible === dia.fecha;
                return (
                  <button
                    key={dia.fecha}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    className={`rc-dia ${activo ? 'activo' : ''} ${libres === 0 ? 'completo' : ''}`}
                    onClick={() => setDiaVisible(dia.fecha)}
                  >
                    <span className="rc-dia-semana">{dia.etiqueta || dia.corto}</span>
                    <span className="rc-dia-numero">{dia.numero}</span>
                    <span className="rc-dia-mes">{libres === 0 ? 'Completo' : dia.mes}</span>
                  </button>
                );
              })}
            </div>

            <p className="rc-dia-titulo">
              <CalendarDays size={16} /> {fechaLarga(diaVisible)}
              <span>{libresHoy === 0 ? 'Sin horarios libres' : `${libresHoy} ${libresHoy === 1 ? 'horario libre' : 'horarios libres'}`}</span>
            </p>

            {libresHoy === 0 && (
              <div className="rc-sin-turnos">
                <Clock size={22} aria-hidden="true" />
                <p>No quedan horarios este día. Probá con otro: los que tienen <strong>Completo</strong> ya no tienen lugar.</p>
              </div>
            )}

            {FRANJAS.map(({ id, nombre: nombreFranja, Icono, desde, hasta }) => {
              const deLaFranja = horas.filter((h) => Number(h.slice(0, 2)) >= desde && Number(h.slice(0, 2)) < hasta);
              if (deLaFranja.length === 0) return null;
              return (
                <div key={id} className="rc-franja">
                  <h3><Icono size={15} /> {nombreFranja}</h3>
                  <div className="rc-horas">
                    {deLaFranja.map((hora) => {
                      const estado = estadoHora(diaVisible, hora);
                      const elegida = seleccion?.fecha === diaVisible && seleccion?.hora === hora;
                      return (
                        <button
                          key={hora}
                          type="button"
                          disabled={estado !== 'libre'}
                          aria-pressed={elegida}
                          className={`rc-hora ${estado} ${elegida ? 'elegida' : ''}`}
                          onClick={() => elegirHora(hora)}
                        >
                          <strong>{hora}</strong>
                          <span>{elegida ? 'Elegido' : estado === 'libre' ? 'Libre' : estado === 'ocupado' ? 'Ocupado' : 'Pasó'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className={`rc-barra ${seleccion ? 'visible' : ''}`} aria-hidden={!seleccion}>
              {seleccion && (
                <>
                  <div>
                    <strong>{fechaCorta(seleccion.fecha)} · {seleccion.hora} hs</strong>
                    <span>{moneda(precioCancha)} · 1 hora</span>
                  </div>
                  <button type="button" className="gp-btn gp-btn--primario" onClick={() => setPaso(2)}>
                    Continuar <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* ---------------- PASO 2: CONFIRMAR ---------------- */}
        {paso === 2 && seleccion && (
          <section className="rc-seccion">
            <h2>{user ? 'Confirmá tu reserva' : 'Ingresá para reservar'}</h2>

            <div className="rc-resumen">
              <div className="rc-resumen-fila">
                <span>Turno</span>
                <strong>{fechaLarga(seleccion.fecha)} · {seleccion.hora} hs</strong>
              </div>
              <div className="rc-resumen-fila">
                <span>Cancha</span>
                <strong>{cancha.nombre}{club ? ` · ${club.nombre}` : ''}</strong>
              </div>
              <button type="button" className="rc-cambiar" onClick={() => setPaso(1)}>Cambiar horario</button>
            </div>

            {!user ? (
              cargandoSesion ? <p className="rc-cargando">Cargando…</p> : <FormularioAcceso />
            ) : (
              <form onSubmit={confirmar} className="gp-form">
                <p className="rc-conectado">Conectado como <strong>{user.email}</strong></p>

                <div className="rc-fila-2">
                  <label className="gp-campo">
                    <span>Nombre y apellido</span>
                    <input type="text" required maxLength={80} autoComplete="name" value={nombre} onChange={(e) => setNombreEditado(e.target.value)} placeholder="Ej: Juan Pérez" />
                  </label>
                  <label className="gp-campo">
                    <span>Teléfono (WhatsApp)</span>
                    <input type="tel" required inputMode="tel" autoComplete="tel" value={telefono} onChange={(e) => setTelefonoEditado(e.target.value)} placeholder="Ej: 3564123456" />
                  </label>
                </div>

                {productos.length > 0 && (
                  <div className="rc-extras">
                    <h3>¿Te falta algo para el partido? <span>Opcional</span></h3>
                    <p>Bebidas o alquileres: los dejan listos para cuando llegues.</p>
                    <EditorExtras productos={productos} cantidades={cantidades} onCambio={(id, n) => setCantidades((c) => ({ ...c, [id]: n }))} />
                  </div>
                )}

                <div className="rc-total">
                  <div className="rc-total-fila"><span>Cancha (1 hora)</span><span>{moneda(precioCancha)}</span></div>
                  {lineasExtras.map((p) => (
                    <div key={p.id} className="rc-total-fila"><span>{cantidades[p.id]} × {p.nombre}</span><span>{moneda(p.precio * cantidades[p.id])}</span></div>
                  ))}
                  <div className="rc-total-fila rc-total-final"><span>Total</span><strong>{moneda(total)}</strong></div>
                  <small>El total se abona en el club.</small>
                </div>

                {errorReserva && <p className="gp-alerta gp-alerta--error" role="alert">{errorReserva}</p>}

                <div className="rc-acciones">
                  <button type="button" className="gp-btn gp-btn--fantasma" onClick={() => setPaso(1)} disabled={guardando}>Atrás</button>
                  <button type="submit" className="gp-btn gp-btn--primario" disabled={guardando || !nombre.trim() || !telefono.trim()}>
                    {guardando ? 'Reservando…' : `Confirmar turno · ${moneda(total)}`}
                  </button>
                </div>
              </form>
            )}

            {!user && !cargandoSesion && (
              <div className="rc-acciones">
                <button type="button" className="gp-btn gp-btn--fantasma" onClick={() => setPaso(1)}>Atrás</button>
              </div>
            )}
          </section>
        )}

        {/* ---------------- PASO 3: LISTO ---------------- */}
        {paso === 3 && reserva && (
          <section className="rc-seccion rc-exito">
            <CheckCircle2 size={64} className="rc-exito-icono" aria-hidden="true" />
            <h2>¡Reserva confirmada!</h2>
            <p>Te esperamos. Guardamos tu turno en “Mis reservas”.</p>

            <div className="rc-resumen rc-resumen--exito">
              <div className="rc-resumen-fila"><span>Cuándo</span><strong>{fechaLarga(reserva.fecha)} · {reserva.hora} hs</strong></div>
              <div className="rc-resumen-fila"><span>Dónde</span><strong>{cancha.nombre}{club ? ` · ${club.nombre}` : ''}</strong></div>
              {club?.direccion && <div className="rc-resumen-fila"><span>Dirección</span><strong>{club.direccion}, {club.ciudad}</strong></div>}
              <div className="rc-resumen-fila"><span>Total a abonar</span><strong>{moneda(reserva.total)}</strong></div>
            </div>

            <div className="rc-atajos">
              <a className="gp-btn gp-btn--secundario" target="_blank" rel="noreferrer"
                href={enlaceCalendario({ fecha: reserva.fecha, hora: reserva.hora, titulo: `${cancha.deporte} en ${club?.nombre || cancha.nombre}`, lugar: [club?.direccion, club?.ciudad].filter(Boolean).join(', ') })}>
                <CalendarPlus size={18} /> Agregar al calendario
              </a>
              {enlaceMapa(club) && (
                <a className="gp-btn gp-btn--secundario" href={enlaceMapa(club)} target="_blank" rel="noreferrer"><Navigation size={18} /> Cómo llegar</a>
              )}
              {enlaceWhatsApp(club?.telefono_contacto, `¡Hola! Reservé ${cancha.nombre} el ${fechaLarga(reserva.fecha)} a las ${reserva.hora} hs a nombre de ${reserva.nombre}.`) && (
                <a className="gp-btn gp-btn--secundario" target="_blank" rel="noreferrer"
                  href={enlaceWhatsApp(club.telefono_contacto, `¡Hola! Reservé ${cancha.nombre} el ${fechaLarga(reserva.fecha)} a las ${reserva.hora} hs a nombre de ${reserva.nombre}.`)}>
                  <MessageCircle size={18} /> Avisar al club
                </a>
              )}
            </div>

            <div className="rc-acciones rc-acciones--centro">
              <Link to="/mis-reservas" className="gp-btn gp-btn--primario">Ver mis reservas</Link>
              <button type="button" className="gp-btn gp-btn--fantasma" onClick={reservarOtro}>Reservar otro horario</button>
              <Link to={rutaVuelta} className="gp-btn gp-btn--fantasma">Volver a los clubes</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ReservaCancha;
