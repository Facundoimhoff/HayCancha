import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarX2, ArrowLeft, Plus, MapPin, Navigation, MessageCircle, ShoppingBag, Star, RotateCcw, Trash2, History,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/authContext';
import { misResenas } from '../../services/resenas';
import { mensajeDeServidor } from '../../utils/validaciones';
import {
  moneda, inicioDeTurno, yaEmpezo, partesDeFecha, fechaLarga, cuandoEs, totalDeTurno, totalExtras,
  enlaceMapa, enlaceWhatsApp,
} from '../../utils/reservas';
import Hoja from '../../components/user/Hoja';
import ModalExtras from '../../components/user/ModalExtras';
import ModalResena from '../../components/user/ModalResena';
import { Estrellas } from '../../components/user/Estrellas';
import './MisReservas.css';

const CONSULTA = `
  id, fecha, hora_inicio, precio_final, extras, cancha_id,
  canchas ( id, nombre, deporte, club_id,
    clubes ( id, nombre, direccion, ciudad, provincia, telefono_contacto, imagen_url ) )
`;

/**
 * Reservas del jugador logueado. La ruta está protegida y, además, las policies RLS de `turnos`
 * solo devuelven las filas cuyo usuario_id es el de la sesión.
 */
const MisReservas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [resenas, setResenas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('proximas');
  const [recarga, setRecarga] = useState(0);

  const [aCancelar, setACancelar] = useState(null);
  const [errorCancelar, setErrorCancelar] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [conExtras, setConExtras] = useState(null);
  const [aCalificar, setACalificar] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const { data, error: errorTurnos } = await supabase
        .from('turnos')
        .select(CONSULTA)
        .eq('usuario_id', user.id)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(200);
      if (cancelado) return;

      if (errorTurnos) {
        console.error('Error al cargar reservas:', errorTurnos);
        setError('No pudimos cargar tus reservas. Intentá de nuevo en unos minutos.');
        setCargando(false);
        return;
      }

      const lista = (data || []).map((t) => ({ ...t, cancha: t.canchas || null, club: t.canchas?.clubes || null }));
      setTurnos(lista);
      setCargando(false);

      const clubIds = [...new Set(lista.map((t) => t.club?.id).filter(Boolean))];
      const propias = await misResenas(clubIds);
      if (!cancelado) setResenas(propias);
    })();

    return () => { cancelado = true; };
  }, [user.id, recarga]);

  const { proximas, historial } = useMemo(() => {
    const ahora = new Date();
    const futuras = turnos.filter((t) => !yaEmpezo(t.fecha, t.hora_inicio, ahora));
    const pasadas = turnos.filter((t) => yaEmpezo(t.fecha, t.hora_inicio, ahora));
    futuras.sort((a, b) => inicioDeTurno(a.fecha, a.hora_inicio) - inicioDeTurno(b.fecha, b.hora_inicio));
    return { proximas: futuras, historial: pasadas };
  }, [turnos]);

  const visibles = pestana === 'proximas' ? proximas : historial;

  const avisar = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 4000);
  };

  const cancelar = async () => {
    setCancelando(true);
    setErrorCancelar('');
    try {
      // .select() permite detectar el caso "RLS filtró la fila": sin error pero sin nada borrado.
      const { data, error: errorBorrado } = await supabase.from('turnos').delete().eq('id', aCancelar.id).select('id');
      if (errorBorrado) throw errorBorrado;
      if (!data?.length) throw new Error('No se pudo cancelar la reserva.');

      setTurnos((lista) => lista.filter((t) => t.id !== aCancelar.id));
      setACancelar(null);
      avisar('Tu reserva fue cancelada.');
    } catch (err) {
      console.error(err);
      setErrorCancelar(mensajeDeServidor(err, 'No pudimos cancelar la reserva. Si el problema sigue, contactá al club.'));
    } finally {
      setCancelando(false);
    }
  };

  const extrasActualizados = (idTurno, extras) => {
    setTurnos((lista) => lista.map((t) => (t.id === idTurno ? { ...t, extras } : t)));
    avisar('Actualizamos los extras de tu reserva.');
  };

  const resenaActualizada = (clubId, nueva) => {
    setResenas((actuales) => {
      const copia = { ...actuales };
      if (nueva) copia[clubId] = nueva; else delete copia[clubId];
      return copia;
    });
    avisar(nueva ? '¡Gracias por tu reseña!' : 'Eliminamos tu reseña.');
  };

  return (
    <div className="mr-pagina">
      <div className="mr-contenedor">
        <header className="mr-cabecera">
          <div>
            <h1>Mis reservas</h1>
            <p>Tus próximos partidos y tu historial.</p>
          </div>
          <div className="mr-cabecera-acciones">
            <button type="button" onClick={() => navigate(-1)} className="gp-btn gp-btn--fantasma gp-btn--chico"><ArrowLeft size={16} /> Volver</button>
            <Link to="/seleccionar-ubicacion" className="gp-btn gp-btn--primario gp-btn--chico"><Plus size={16} /> Nueva reserva</Link>
          </div>
        </header>

        <div className="mr-pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={pestana === 'proximas'} className={pestana === 'proximas' ? 'activa' : ''} onClick={() => setPestana('proximas')}>
            Próximas <span>{proximas.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={pestana === 'historial'} className={pestana === 'historial' ? 'activa' : ''} onClick={() => setPestana('historial')}>
            Historial <span>{historial.length}</span>
          </button>
        </div>

        {mensaje && <p className="gp-alerta gp-alerta--exito mr-mensaje" role="status">{mensaje}</p>}

        {cargando ? (
          <div className="mr-lista" aria-busy="true">{[0, 1].map((i) => <div key={i} className="mr-esqueleto" />)}</div>
        ) : error ? (
          <div className="mr-vacio" role="alert">
            <CalendarX2 size={44} aria-hidden="true" />
            <h2>{error}</h2>
            <button type="button" className="gp-btn gp-btn--primario" onClick={() => { setError(''); setCargando(true); setRecarga((n) => n + 1); }}>Reintentar</button>
          </div>
        ) : visibles.length === 0 ? (
          <div className="mr-vacio">
            {pestana === 'proximas' ? <CalendarX2 size={44} aria-hidden="true" /> : <History size={44} aria-hidden="true" />}
            <h2>{pestana === 'proximas' ? 'No tenés reservas próximas' : 'Todavía no jugaste ningún partido'}</h2>
            <p>{pestana === 'proximas' ? 'Cuando reserves una cancha, la vas a ver acá.' : 'Cuando termine tu primer turno, lo vas a ver acá y vas a poder calificar el club.'}</p>
            {pestana === 'proximas' && <Link to="/seleccionar-ubicacion" className="gp-btn gp-btn--primario">Reservar una cancha</Link>}
          </div>
        ) : (
          <ul className="mr-lista">
            {visibles.map((turno) => {
              const parte = partesDeFecha(turno.fecha);
              const futura = pestana === 'proximas';
              const club = turno.club;
              const extras = Array.isArray(turno.extras) ? turno.extras : [];
              const miResena = club ? resenas[club.id] : null;
              const mapa = enlaceMapa(club);
              const whatsapp = enlaceWhatsApp(club?.telefono_contacto, `Hola! Consulto por mi reserva del ${fechaLarga(turno.fecha)} a las ${turno.hora_inicio} hs en ${turno.cancha?.nombre || 'la cancha'}.`);

              return (
                <li key={turno.id} className={`mr-tarjeta ${futura ? '' : 'pasada'}`}>
                  <div className="mr-fecha" aria-hidden="true">
                    <span>{parte.semana}</span>
                    <strong>{parte.dia}</strong>
                    <span>{parte.mes}</span>
                  </div>

                  <div className="mr-cuerpo">
                    <div className="mr-titulo">
                      <h2>{turno.hora_inicio} hs · {turno.cancha?.nombre || 'Cancha'}</h2>
                      <span className={`mr-cuando ${futura ? 'proxima' : ''}`}>{cuandoEs(turno.fecha, turno.hora_inicio)}</span>
                    </div>
                    <p className="mr-fecha-larga">{fechaLarga(turno.fecha)}</p>
                    {club && (
                      <p className="mr-club">
                        <MapPin size={14} />
                        <Link to={`/club/${club.id}`}>{club.nombre}</Link>
                        {club.direccion && <span> · {club.direccion}</span>}
                      </p>
                    )}

                    {extras.length > 0 && (
                      <ul className="mr-extras" aria-label="Extras de la reserva">
                        {extras.map((e) => <li key={e.id} className="gp-chip">{e.cantidad} × {e.nombre}</li>)}
                      </ul>
                    )}

                    <div className="mr-total">
                      <strong>{moneda(totalDeTurno(turno))}</strong>
                      {extras.length > 0 && <small>cancha {moneda(turno.precio_final)} + extras {moneda(totalExtras(extras))}</small>}
                    </div>

                    <div className="mr-acciones">
                      {futura ? (
                        <>
                          {club && (
                            <button type="button" className="gp-btn gp-btn--secundario gp-btn--chico" onClick={() => setConExtras(turno)}>
                              <ShoppingBag size={15} /> {extras.length ? 'Editar extras' : 'Agregar extras'}
                            </button>
                          )}
                          {mapa && <a className="gp-btn gp-btn--fantasma gp-btn--chico" href={mapa} target="_blank" rel="noreferrer"><Navigation size={15} /> Cómo llegar</a>}
                          {whatsapp && <a className="gp-btn gp-btn--fantasma gp-btn--chico" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Club</a>}
                          <button type="button" className="gp-btn gp-btn--peligro-suave gp-btn--chico mr-cancelar" onClick={() => { setErrorCancelar(''); setACancelar(turno); }}>
                            <Trash2 size={15} /> Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {club && (
                            miResena ? (
                              <button type="button" className="mr-mi-resena" onClick={() => setACalificar(club)} aria-label="Editar mi calificación">
                                <Estrellas valor={miResena.estrellas} tam={16} /> <span>Tu calificación · Editar</span>
                              </button>
                            ) : (
                              <button type="button" className="gp-btn gp-btn--secundario gp-btn--chico" onClick={() => setACalificar(club)}>
                                <Star size={15} /> Calificar el club
                              </button>
                            )
                          )}
                          {turno.cancha && (
                            <Link to={`/reservar/${turno.cancha.id}`} className="gp-btn gp-btn--fantasma gp-btn--chico"><RotateCcw size={15} /> Reservar de nuevo</Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {aCancelar && (
        <Hoja
          titulo="¿Cancelar esta reserva?"
          descripcion="Al cancelarla, el horario queda libre para otros jugadores."
          ancho="sm"
          onCerrar={() => !cancelando && setACancelar(null)}
          pie={(
            <>
              <span className="gp-espaciador" />
              <button type="button" className="gp-btn gp-btn--fantasma" onClick={() => setACancelar(null)} disabled={cancelando}>Mantener reserva</button>
              <button type="button" className="gp-btn gp-btn--peligro" onClick={cancelar} disabled={cancelando}>{cancelando ? 'Cancelando…' : 'Sí, cancelar'}</button>
            </>
          )}
        >
          <p className="mr-detalle-cancelar">
            <strong>{fechaLarga(aCancelar.fecha)} · {aCancelar.hora_inicio} hs</strong><br />
            {aCancelar.cancha?.nombre} · {aCancelar.club?.nombre}
          </p>
          {errorCancelar && <p className="gp-alerta gp-alerta--error" role="alert">{errorCancelar}</p>}
        </Hoja>
      )}

      {conExtras && (
        <ModalExtras turno={conExtras} onCerrar={() => setConExtras(null)} onGuardado={(extras) => extrasActualizados(conExtras.id, extras)} />
      )}

      {aCalificar && (
        <ModalResena
          club={aCalificar}
          inicial={resenas[aCalificar.id] || null}
          onCerrar={() => setACalificar(null)}
          onCambio={(nueva) => resenaActualizada(aCalificar.id, nueva)}
        />
      )}
    </div>
  );
};

export default MisReservas;
