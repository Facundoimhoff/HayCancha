import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Building, MapPin, Map, CheckCircle } from 'lucide-react';
// IMPORTANTE: Importar CSS
import './ConfiguracionClub.css';

const ConfiguracionClub = () => {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  const [club, setClub] = useState({
    id: null,
    nombre: '',
    provincia: '',
    ciudad: '',
  });

  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán"];

  useEffect(() => {
    cargarDatosDelClub();
  }, []);

  const cargarDatosDelClub = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('clubes')
          .select('*')
          .eq('user_id', user.id) 
          .single(); 

        if (data) {
          setClub({
            id: data.id,
            nombre: data.nombre || '',
            provincia: data.provincia || '',
            ciudad: data.ciudad || '',
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar el club:", error.message);
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setClub(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const { error } = await supabase
        .from('clubes')
        .update({
          nombre: club.nombre,
          provincia: club.provincia,
          ciudad: club.ciudad,
        })
        .eq('id', club.id);

      if (error) throw error;

      setMensaje({ texto: '¡Datos actualizados correctamente!', tipo: 'exito' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    } catch (error) {
      console.error("Error al guardar:", error.message);
      setMensaje({ texto: 'Hubo un error al guardar los cambios.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="estado-cargando">Cargando información de tu club...</div>;
  }

  if (!club.id) {
    return (
      <div className="estado-error">
        No encontramos un club asociado a tu cuenta. Contactá a soporte.
      </div>
    );
  }

  return (
    <div className="configuracion-container">
      
      <div className="configuracion-header">
        <Building size={24} color="#2563eb" />
        <h2>Perfil de tu Club</h2>
      </div>

      {mensaje.texto && (
        <div className={`configuracion-alerta ${mensaje.tipo}`}>
          {mensaje.tipo === 'exito' && <CheckCircle size={18} />}
          <strong>{mensaje.texto}</strong>
        </div>
      )}

      <form onSubmit={guardarCambios} className="configuracion-form">
        
        <div>
          <label className="form-label-config">Nombre del Club</label>
          <div className="input-icon-wrapper">
            <Building size={18} className="input-icon" />
            <input 
              type="text" 
              name="nombre"
              value={club.nombre}
              onChange={manejarCambio}
              required
              className="form-input-config"
            />
          </div>
        </div>

        <div>
          <label className="form-label-config">Provincia</label>
          <div className="input-icon-wrapper">
            <Map size={18} className="input-icon" />
            <select 
              name="provincia"
              value={club.provincia}
              onChange={manejarCambio}
              required
              className="form-input-config form-select-config"
            >
              <option value="">Seleccioná tu provincia</option>
              {provincias.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label-config">Ciudad</label>
          <div className="input-icon-wrapper">
            <MapPin size={18} className="input-icon" />
            <input 
              type="text" 
              name="ciudad"
              value={club.ciudad}
              onChange={manejarCambio}
              placeholder="Ej: San Francisco"
              required
              className="form-input-config"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={guardando}
          className="btn-guardar-config"
        >
          <Save size={20} /> 
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>

      </form>
    </div>
  );
};

export default ConfiguracionClub;