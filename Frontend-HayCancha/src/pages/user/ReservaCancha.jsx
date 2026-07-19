import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';
// IMPORTANTE: Importamos nuestro CSS premium
import './ReservaCancha.css';

const ReservaCancha = () => {
  const { idCancha } = useParams();
  const navigate = useNavigate(); 
  const [cancha, setCancha] = useState(null);
  const [club, setClub] = useState(null); 
  const [cargando, setCargando] = useState(true);
  
  const [paso, setPaso] = useState(1);
  const [diaExpandido, setDiaExpandido] = useState(null); 
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [turnosOcupados, setTurnosOcupados] = useState([]);

  const generarProximosDias = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      
      const fechaBD = fecha.toISOString().split('T')[0]; 
      const nombreDia = fecha.toLocaleDateString('es-AR', { weekday: 'long' }); 
      const numeroDia = fecha.getDate();
      const nombreMes = fecha.toLocaleDateString('es-AR', { month: 'long' }); 

      dias.push({
        fechaBD,
        textoMostrar: `${nombreDia} ${numeroDia} de ${nombreMes}`
      });
    }
    return dias;
  };

  const diasSemana = generarProximosDias();
  const hoyBD = diasSemana[0].fechaBD; 

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: dataCancha, error: errorCancha } = await supabase
          .from('canchas')
          .select('*')
          .eq('id', idCancha)
          .single();

        if (errorCancha) throw errorCancha;
        setCancha(dataCancha);

        if (dataCancha?.club_id) {
          const { data: dataClub, error: errorClub } = await supabase
            .from('clubes')
            .select('provincia, ciudad')
            .eq('id', dataCancha.club_id)
            .single();
            
          if (!errorClub) setClub(dataClub);
        }

        if (!diaExpandido) setDiaExpandido(hoyBD);

        const { data: turnos, error: errorTurnos } = await supabase
          .from('turnos')
          .select('fecha, hora_inicio')
          .eq('cancha_id', idCancha)
          .gte('fecha', hoyBD); 

        if (errorTurnos) throw errorTurnos;
        setTurnosOcupados(turnos || []);

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [idCancha, hoyBD, diaExpandido]);

  const generarHorariosDisponibles = (apertura, cierre) => {
    const horarios = [];
    const horaInicioStr = apertura || '08:00';
    const horaFinStr = cierre || '23:00';

    let horaActual = parseInt(horaInicioStr.split(':')[0]); 
    const horaFin = parseInt(horaFinStr.split(':')[0]);    

    while (horaActual < horaFin) {
      horarios.push(`${horaActual.toString().padStart(2, '0')}:00`);
      horaActual++;
    }
    return horarios;
  };

  const horariosBase = cancha ? generarHorariosDisponibles(cancha.hora_apertura, cancha.hora_cierre) : [];

  const confirmarReserva = async () => {
    try {
      setGuardando(true);
      const { error } = await supabase
        .from('turnos')
        .insert([{
          cancha_id: idCancha,
          fecha: fechaSeleccionada,
          hora_inicio: horaSeleccionada,
          nombre_cliente: nombre,
          telefono_cliente: telefono
        }]);

      if (error) throw error;
      setPaso(3); 
    } catch (error) {
      console.error("Error al guardar la reserva:", error);
      alert("Hubo un error al procesar el turno. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarTurno = (fecha, hora) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(hora);
  };

  const obtenerRutaVuelta = () => {
    if (club && club.provincia && club.ciudad) {
      return `/explorar/${encodeURIComponent(club.provincia)}/${encodeURIComponent(club.ciudad)}`;
    }
    return '/'; 
  };

  if (cargando) return <div className="estado-carga">Cargando disponibilidad...</div>;
  if (!cancha) return <div className="estado-carga">Cancha no encontrada</div>;

  return (
    <div className="reserva-container">
      
      {/* HEADER */}
      <div className="header-reserva">
        <button onClick={() => navigate(-1)} className="btn-volver-reserva">
          <ArrowLeft size={24} />
        </button>
        <h1 className="titulo-cancha">{cancha.nombre}</h1>
      </div>

      {/* --- NUEVO: BARRA DE PASOS (STEPPER) --- */}
      <div className="stepper-reserva">
        <div className={`stepper-item ${paso >= 1 ? 'activo' : ''}`}>
          <span className="stepper-numero">1</span>
          <span className="stepper-label">Horario</span>
        </div>
        <div className="stepper-linea"></div>
        <div className={`stepper-item ${paso >= 2 ? 'activo' : ''}`}>
          <span className="stepper-numero">2</span>
          <span className="stepper-label">Datos</span>
        </div>
        <div className="stepper-linea"></div>
        <div className={`stepper-item ${paso >= 3 ? 'activo' : ''}`}>
          <span className="stepper-numero">3</span>
          <span className="stepper-label">Listo</span>
        </div>
      </div>

      {/* PASO 1: Elegir Día y Horario */}
      {paso === 1 && (
        <div className="paso-horarios">
          <h2 className="titulo-paso">
            Elegí día y horario
          </h2>
          
          <div className="lista-dias">
            {diasSemana.map((dia) => {
              const estaAbierto = diaExpandido === dia.fechaBD;
              
              return (
                <div key={dia.fechaBD} className="dia-card">
                  
                  {/* Cabecera del Acordeón (El Día) */}
                  <div 
                    onClick={() => setDiaExpandido(estaAbierto ? null : dia.fechaBD)}
                    className={`dia-header ${estaAbierto ? 'abierto' : ''}`}
                  >
                    <span className="dia-texto">{dia.textoMostrar}</span>
                    <ChevronDown size={20} className={`flecha-icono ${estaAbierto ? 'abierta' : ''}`} />
                  </div>

                  {/* Contenido del Acordeón (Los Horarios de ese día) */}
                  {estaAbierto && (
                    <div className="animacion-acordeon">
                      {horariosBase.map((hora) => {
                        const estaOcupado = turnosOcupados.some(t => t.fecha === dia.fechaBD && t.hora_inicio === hora);
                        const estaSeleccionado = fechaSeleccionada === dia.fechaBD && horaSeleccionada === hora;

                        let claseBoton = 'btn-hora disponible';
                        if (estaOcupado) claseBoton = 'btn-hora ocupado';
                        else if (estaSeleccionado) claseBoton = 'btn-hora seleccionado';

                        return (
                          <button
                            key={hora}
                            disabled={estaOcupado}
                            onClick={() => seleccionarTurno(dia.fechaBD, hora)}
                            className={claseBoton}
                          >
                            <span>{hora}</span>
                            <span className="hora-estado">
                              {estaOcupado ? 'Ocupado' : estaSeleccionado ? 'Elegido' : 'Libre'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {horaSeleccionada && (
            <button onClick={() => setPaso(2)} className="btn-continuar">
              Continuar
            </button>
          )}
        </div>
      )}

      {/* PASO 2: Ingresar Datos */}
      {paso === 2 && (
        <div className="paso-datos">
          <h2 className="titulo-paso">Tus Datos</h2>
          
          <div className="info-reserva-box">
            <p className="info-reserva-texto">
              Confirmando turno para el {fechaSeleccionada.split('-').reverse().join('/')} a las {horaSeleccionada} hs
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre y Apellido</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (WhatsApp)</label>
            <input 
              type="tel" 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 3564..."
              className="form-input"
            />
          </div>

          <div className="btn-group">
            <button onClick={() => setPaso(1)} className="btn-atras">
              Atrás
            </button>
            <button 
              onClick={confirmarReserva}
              disabled={!nombre || !telefono || guardando}
              className="btn-confirmar"
            >
              {guardando ? 'Guardando...' : 'Confirmar Turno'}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Éxito */}
      {paso === 3 && (
        <div className="paso-exito">
          <CheckCircle size={60} color="#22c55e" className="icono-exito" />
          <h2 className="titulo-exito">¡Reserva Confirmada!</h2>
          <p className="texto-exito">Te esperamos el {fechaSeleccionada.split('-').reverse().join('/')} a las {horaSeleccionada} hs. ¡A jugar!</p>
          <Link to={obtenerRutaVuelta()} className="btn-link-volver">
            Volver a los clubes
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReservaCancha;