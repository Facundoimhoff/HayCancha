import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase'; 

const RegistroClub = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    provincia: '',
    ciudad: '',
    direccion: '',
    estacionamiento: false,
    imagen_url: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // 1. Creamos la cuenta del Admin en Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Guardamos los datos del club en la tabla 'clubes'
      // Ahora sí, mandamos todos los datos completos a la base de datos
      const { error: clubError } = await supabase
        .from('clubes')
        .insert([
          {
            nombre: formData.nombre,
            descripcion: formData.descripcion, 
            provincia: formData.provincia,     
            ciudad: formData.ciudad,
            direccion: formData.direccion,
            estacionamiento: formData.estacionamiento,
            imagen_url: formData.imagen_url,
            admin_id: authData.user.id // Vinculamos automáticamente el club con el nuevo administrador
          }
        ]);

      if (clubError) throw clubError;

      alert("¡Bienvenido a la familia! Tu club se registró con éxito. Por favor, iniciá sesión para empezar a cargar tus canchas.");
      
      // Lo mandamos a la pantalla de Login para que entre con su nuevo usuario
      navigate('/login'); 

    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Hubo un error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>¡Pago exitoso! 🎉</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Completá los datos de tu club para empezar a recibir reservas.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECCIÓN DATOS DEL CLUB */}
          <div>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>1. Datos del Club</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" name="nombre" placeholder="Nombre del Club" required onChange={handleChange} style={inputStyle} />
              <textarea name="descripcion" placeholder="Descripción breve (Opcional)" onChange={handleChange} style={{...inputStyle, minHeight: '80px'}} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" name="provincia" placeholder="Provincia" required onChange={handleChange} style={{...inputStyle, flex: 1}} />
                <input type="text" name="ciudad" placeholder="Ciudad" required onChange={handleChange} style={{...inputStyle, flex: 1}} />
              </div>
              
              <input type="text" name="direccion" placeholder="Dirección exacta" required onChange={handleChange} style={inputStyle} />
              <input type="url" name="imagen_url" placeholder="Link del logo del club (http://...)" required onChange={handleChange} style={inputStyle} />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#475569' }}>
                <input type="checkbox" name="estacionamiento" onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                El club cuenta con estacionamiento privado
              </label>
            </div>
          </div>

          {/* SECCIÓN CUENTA DE ADMIN */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>2. Tu Cuenta de Administrador</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Con estos datos vas a entrar a tu panel para gestionar las canchas.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" name="email" placeholder="Correo electrónico" required onChange={handleChange} style={inputStyle} />
              <input type="password" name="password" placeholder="Contraseña (mínimo 6 caracteres)" required minLength={6} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            style={{ marginTop: '20px', width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? 'Creando tu espacio...' : 'Finalizar Configuración'}
          </button>

        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box'
};

export default RegistroClub;