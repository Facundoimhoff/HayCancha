import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';

const ReservaCancha = () => {
  const { idCancha } = useParams();
  const [cancha, setCancha] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el flujo
  const [paso, setPaso] = useState(1);
  const [diaExpandido, setDiaExpandido] = useState(null); 
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [turnosOcupados, setTurnosOcupados] = useState([]);

  // --- LÓGICA PARA GENERAR LOS PRÓXIMOS 7 DÍAS ---
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

        if (!diaExpandido) {
          setDiaExpandido(hoyBD);
        }

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

  const horariosBase = cancha?.horarios_disponibles 
    ? cancha.horarios_disponibles.split(',').map(h => h.trim()) 
    : ['18:00', '19:00', '20:00', '21:00', '22:00'];

  const confirmarReserva = async () => {
    try {
      setGuardando(true);
      
      const { error } = await supabase
        .from('turnos')
        .insert([
          {
            cancha_id: idCancha,
            fecha: fechaSeleccionada,
            hora_inicio: horaSeleccionada,
            nombre_cliente: nombre,
            telefono_cliente: telefono
          }
        ]);

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

  if (cargando) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando disponibilidad...</div>;
  if (!cancha) return <div style={{ padding: '20px', textAlign: 'center' }}>Cancha no encontrada</div>;

  return (
    <div className="reserva-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Link to={`/`} style={{ color: '#000', marginRight: '15px' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
          {cancha.nombre}
        </h1>
      </div>

      {/* PASO 1: Elegir Día y Horario */}
      {paso === 1 && (
        <div className="paso-horarios">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
            <Calendar size={18} style={{ marginRight: '8px' }} /> Seleccioná tu turno
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {diasSemana.map((dia) => {
              const estaAbierto = diaExpandido === dia.fechaBD;
              
              return (
                <div key={dia.fechaBD} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  
                  {/* Cabecera del Acordeón (El Día) */}
                  <div 
                    onClick={() => setDiaExpandido(estaAbierto ? null : dia.fechaBD)}
                    style={{ 
                      padding: '15px', 
                      backgroundColor: estaAbierto ? '#eff6ff' : '#f9fafb', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: estaAbierto ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <span style={{ textTransform: 'capitalize', fontWeight: estaAbierto ? 'bold' : 'normal', color: estaAbierto ? '#1e3a8a' : '#374151' }}>
                      {dia.textoMostrar}
                    </span>
                    <ChevronDown 
                      size={20} 
                      color={estaAbierto ? "#1e3a8a" : "#6b7280"} 
                      className={`flecha-icono ${estaAbierto ? 'abierta' : ''}`} 
                    />
                  </div>

                  {/* Contenido del Acordeón (Los Horarios de ese día) */}
                  {estaAbierto && (
                    <div className="animacion-acordeon" style={{ padding: '15px', backgroundColor: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {horariosBase.map((hora) => {
                        const estaOcupado = turnosOcupados.some(t => t.fecha === dia.fechaBD && t.hora_inicio === hora);
                        const estaSeleccionado = fechaSeleccionada === dia.fechaBD && horaSeleccionada === hora;

                        return (
                          <button
                            key={hora}
                            disabled={estaOcupado}
                            onClick={() => seleccionarTurno(dia.fechaBD, hora)}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              border: estaSeleccionado ? '2px solid #2563eb' : '1px solid #e5e7eb',
                              backgroundColor: estaOcupado ? '#f3f4f6' : (estaSeleccionado ? '#eff6ff' : '#fff'),
                              color: estaOcupado ? '#9ca3af' : '#000',
                              cursor: estaOcupado ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontWeight: 'bold'
                            }}
                          >
                            <span>{hora}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                              {estaOcupado ? 'Ocupado' : 'Libre'}
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
            <button 
              onClick={() => setPaso(2)}
              style={{ width: '100%', padding: '15px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', marginTop: '20px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
            >
              Continuar <ArrowRight size={20} style={{ marginLeft: '10px' }} />
            </button>
          )}
        </div>
      )}

      {/* PASO 2: Ingresar Datos */}
      {paso === 2 && (
        <div className="paso-datos">
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, color: '#1e3a8a', fontWeight: 'bold' }}>
              Confirmando turno para el {fechaSeleccionada.split('-').reverse().join('/')} a las {horaSeleccionada} hs
            </p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Tu Nombre</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Tu Teléfono (WhatsApp)</label>
            <input 
              type="tel" 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 3564..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setPaso(1)}
              style={{ padding: '15px', backgroundColor: '#fff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: '1' }}
            >
              Atrás
            </button>
            <button 
              onClick={confirmarReserva}
              disabled={!nombre || !telefono || guardando}
              style={{ padding: '15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: '2', opacity: (!nombre || !telefono || guardando) ? 0.5 : 1 }}
            >
              {guardando ? 'Guardando...' : 'Confirmar Turno'}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Éxito */}
      {paso === 3 && (
        <div className="paso-exito" style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircle size={60} color="#10b981" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>¡Reserva Confirmada!</h2>
          <p style={{ color: '#4b5563', marginBottom: '30px' }}>Te esperamos el {fechaSeleccionada.split('-').reverse().join('/')} a las {horaSeleccionada} hs. ¡A jugar!</p>
          <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReservaCancha;