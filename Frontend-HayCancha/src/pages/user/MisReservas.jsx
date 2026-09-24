import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/authContext';
import { fechaLocalISO } from '../../utils/validaciones';
import { CalendarX2, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// IMPORTANTE: Importar CSS
import './MisReservas.css';

/**
 * Reservas del jugador logueado. La ruta está protegida y, además, las policies RLS de `turnos`
 * solo devuelven las filas cuyo usuario_id es el de la sesión (ya no se busca por teléfono).
 */
const MisReservas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [misTurnos, setMisTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('turnos')
      .select('id, fecha, hora_inicio, canchas(nombre)')
      .eq('usuario_id', user.id)
      .gte('fecha', fechaLocalISO())
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .then(({ data, error: errorTurnos }) => {
        if (cancelado) return;
        if (errorTurnos) {
          console.error('Error al cargar reservas:', errorTurnos);
          setError('No pudimos cargar tus reservas. Intentá de nuevo en unos minutos.');
        } else {
          setMisTurnos((data || []).map((t) => ({ ...t, nombre_cancha: t.canchas?.nombre || 'Cancha' })));
        }
        setCargando(false);
      });

    return () => { cancelado = true; };
  }, [user.id]);

  const cancelarMiTurno = async (idTurno) => {
    const confirmar = window.confirm('¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
      // .select() permite detectar el caso "RLS filtró la fila": sin error pero sin nada borrado.
      const { data, error: errorBorrado } = await supabase
        .from('turnos')
        .delete()
        .eq('id', idTurno)
        .select('id');
      if (errorBorrado) throw errorBorrado;
      if (!data?.length) throw new Error('No se pudo cancelar la reserva.');

      setMisTurnos((turnos) => turnos.filter((t) => t.id !== idTurno));
      alert('Tu reserva fue cancelada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al intentar cancelar. Por favor, contactá al club.');
    }
  };

  return (
    <div className="mis-reservas-container">
      <div className="mis-reservas-wrapper">

        {/* ENCABEZADO */}
        <div className="mis-reservas-header">
          <h1 className="mis-reservas-titulo">Mis Reservas</h1>
          <button onClick={() => navigate(-1)} className="btn-volver-app">
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        {cargando && <div className="estado-carga">Cargando tus reservas...</div>}

        {error && !cargando && <div className="estado-vacio"><p>{error}</p></div>}

        {!cargando && !error && (
          <div className="resultados-container">
            {misTurnos.length === 0 ? (
              <div className="estado-vacio">
                <CalendarX2 size={48} className="estado-vacio-icono" />
                <h3>No tenés reservas próximas</h3>
                <p>Cuando reserves una cancha, la vas a ver acá.</p>
              </div>
            ) : (
              <div className="lista-turnos">
                {misTurnos.map((turno) => (
                  <div key={turno.id} className="turno-card">
                    <div className="turno-info-wrapper">
                      <div className="turno-icono-box">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="turno-fecha">
                          {turno.fecha.split('-').reverse().join('/')} a las {turno.hora_inicio}hs
                        </h3>
                        <p className="turno-cancha">{turno.nombre_cancha}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelarMiTurno(turno.id)}
                      className="btn-cancelar"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MisReservas;
