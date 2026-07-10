import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

const ReservaCancha = () => {
  const { idCancha } = useParams();
  const [cancha, setCancha] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el flujo
  const [paso, setPaso] = useState(1);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Estados para los turnos reales
  const [horarios, setHorarios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Obtenemos la fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar la info de la cancha
        const { data: dataCancha, error: errorCancha } = await supabase
          .from('canchas')
          .select('*')
          .eq('id', idCancha)
          .single();

        if (errorCancha) throw errorCancha;
        setCancha(dataCancha);

        // 2. Cargar los turnos de HOY para esta cancha específica
        const { data: turnosHoy, error: errorTurnos } = await supabase
          .from('turnos')
          .select('hora_inicio')
          .eq('cancha_id', idCancha)
          .eq('fecha', hoy);

        if (errorTurnos) throw errorTurnos;

        // Extraemos solo las horas que ya están guardadas (ej: ['18:00', '20:00'])
        const horasOcupadas = turnosHoy.map(turno => turno.hora_inicio);

        // 3. Armamos la grilla de horarios dinámicamente
        const horasBase = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
        const grillaHorarios = horasBase.map(hora => ({
          hora,
          estado: horasOcupadas.includes(hora) ? 'ocupado' : 'disponible'
        }));

        setHorarios(grillaHorarios);

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [idCancha, hoy]);

  const confirmarReserva = async () => {
    try {
      setGuardando(true);
      
      // INSERTAR EN SUPABASE
      const { error } = await supabase
        .from('turnos')
        .insert([
          {
            cancha_id: idCancha,
            fecha: hoy,
            hora_inicio: horaSeleccionada,
            nombre_cliente: nombre,
            telefono_cliente: telefono
          }
        ]);

      if (error) throw error;
      
      // Si salió todo bien, pasamos a la pantalla de éxito
      setPaso(3); 
    } catch (error) {
      console.error("Error al guardar la reserva:", error);
      alert("Hubo un error al procesar el turno. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando horarios...</div>;
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

      {/* PASO 1: Elegir Horario */}
      {paso === 1 && (
        <div className="paso-horarios">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#4b5563' }}>Horarios para hoy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {horarios.map((h) => (
              <button
                key={h.hora}
                disabled={h.estado === 'ocupado'}
                onClick={() => setHoraSeleccionada(h.hora)}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  border: horaSeleccionada === h.hora ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  backgroundColor: h.estado === 'ocupado' ? '#f3f4f6' : (horaSeleccionada === h.hora ? '#eff6ff' : '#fff'),
                  color: h.estado === 'ocupado' ? '#9ca3af' : '#000',
                  cursor: h.estado === 'ocupado' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}
              >
                <span>{h.hora}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                  {h.estado === 'ocupado' ? 'Ocupado' : 'Libre'}
                </span>
              </button>
            ))}
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
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#1e3a8a', fontWeight: 'bold' }}>Reservando a las {horaSeleccionada} hs</p>
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
          <p style={{ color: '#4b5563', marginBottom: '30px' }}>Te esperamos a las {horaSeleccionada} hs. ¡A jugar!</p>
          <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReservaCancha;