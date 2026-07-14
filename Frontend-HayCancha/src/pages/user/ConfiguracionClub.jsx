import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Building, MapPin, Map, CheckCircle } from 'lucide-react';

const ConfiguracionClub = () => {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Estado para guardar los datos del formulario
  const [club, setClub] = useState({
    id: null,
    nombre: '',
    provincia: '',
    ciudad: '',
    // Podés agregar más campos acá si tenés (direccion, telefono, etc)
  });

  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán"];

  useEffect(() => {
    cargarDatosDelClub();
  }, []);

  const cargarDatosDelClub = async () => {
    setCargando(true);
    try {
      // 1. Obtenemos el usuario que inició sesión
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Buscamos el club que le pertenece a este usuario
        // NOTA: Asegurate de que tu tabla 'clubes' tenga una columna 'admin_id' o 'user_id'
        const { data, error } = await supabase
          .from('clubes')
          .select('*')
          .eq('user_id', user.id) // Cambiá 'user_id' por el nombre de tu columna si es distinto
          .single(); // Usamos single() porque un admin tiene un solo club

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
      // Actualizamos los datos en Supabase usando el ID del club
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
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    } catch (error) {
      console.error("Error al guardar:", error.message);
      setMensaje({ texto: 'Hubo un error al guardar los cambios.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Cargando información de tu club...</div>;
  }

  // Si no se encontró un club vinculado a este usuario
  if (!club.id) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
        No encontramos un club asociado a tu cuenta. Contactá a soporte.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <Building size={24} color="#2563eb" />
        <h2 style={{ margin: 0, color: '#111827' }}>Perfil de tu Club</h2>
      </div>

      {mensaje.texto && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#166534' : '#ef4444'
        }}>
          {mensaje.tipo === 'exito' && <CheckCircle size={18} />}
          <strong>{mensaje.texto}</strong>
        </div>
      )}

      <form onSubmit={guardarCambios} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* NOMBRE DEL CLUB */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Nombre del Club</label>
          <div style={{ position: 'relative' }}>
            <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
            <input 
              type="text" 
              name="nombre"
              value={club.nombre}
              onChange={manejarCambio}
              required
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* PROVINCIA */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Provincia</label>
          <div style={{ position: 'relative' }}>
            <Map size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
            <select 
              name="provincia"
              value={club.provincia}
              onChange={manejarCambio}
              required
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', backgroundColor: 'white' }}
            >
              <option value="">Seleccioná tu provincia</option>
              {provincias.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CIUDAD */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Ciudad</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
            <input 
              type="text" 
              name="ciudad"
              value={club.ciudad}
              onChange={manejarCambio}
              placeholder="Ej: San Francisco"
              required
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <button 
          type="submit" 
          disabled={guardando}
          style={{ 
            marginTop: '10px',
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '12px', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: guardando ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            opacity: guardando ? 0.7 : 1
          }}
        >
          <Save size={20} /> 
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>

      </form>
    </div>
  );
};

export default ConfiguracionClub;