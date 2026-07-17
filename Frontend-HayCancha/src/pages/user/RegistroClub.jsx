import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
// IMPORTANTE: Importamos nuestro CSS
import './RegistroClub.css';

const RegistroClub = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [imagenFile, setImagenFile] = useState(null); 
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    provincia: '',
    ciudad: '',
    direccion: '',
    estacionamiento: false,
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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // 1. Creamos la cuenta del Admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. LÓGICA DE SUBIDA DE IMAGEN
      let logoUrl = ''; 
      
      if (imagenFile) {
        const fileExt = imagenFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`; 

        const { error: uploadError } = await supabase.storage
          .from('imagenes')
          .upload(filePath, imagenFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('imagenes')
          .getPublicUrl(filePath);

        logoUrl = urlData.publicUrl;
      }

      // 3. Guardamos todo en la base de datos
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
            imagen_url: logoUrl, 
            admin_id: authData.user.id
          }
        ]);

      if (clubError) throw clubError;

      alert("¡Bienvenido a la familia! Tu club se registró con éxito. Por favor, iniciá sesión para empezar a cargar tus canchas.");
      navigate('/login'); 

    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Hubo un error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-club-container">
      <div className="registro-club-card">
        
        <div className="registro-header">
          <h1 className="registro-titulo">¡Pago exitoso! 🎉</h1>
          <p className="registro-subtitulo">Completá los datos de tu club para empezar a recibir reservas.</p>
        </div>

        <form onSubmit={handleSubmit} className="registro-form">
          
          <div>
            <h3 className="seccion-titulo">1. Datos del Club</h3>
            
            <div className="flex-col">
              <input type="text" name="nombre" placeholder="Nombre del Club" required onChange={handleChange} className="form-input" />
              <textarea name="descripcion" placeholder="Descripción breve (Opcional)" onChange={handleChange} className="form-input form-textarea" />
              
              <div className="flex-row">
                <input type="text" name="provincia" placeholder="Provincia" required onChange={handleChange} className="form-input half" />
                <input type="text" name="ciudad" placeholder="Ciudad" required onChange={handleChange} className="form-input half" />
              </div>
              
              <input type="text" name="direccion" placeholder="Dirección exacta" required onChange={handleChange} className="form-input" />
              
              <div className="file-container">
                <label className="file-label">Logo del Club (Imagen)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  required 
                  className="form-input form-input-file" 
                />
              </div>
              
              <label className="checkbox-container">
                <input type="checkbox" name="estacionamiento" onChange={handleChange} className="checkbox-input" />
                El club cuenta con estacionamiento privado
              </label>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <h3 className="seccion-titulo">2. Tu Cuenta de Administrador</h3>
            <p className="seccion-descripcion">Con estos datos vas a entrar a tu panel para gestionar las canchas.</p>
            
            <div className="flex-col">
              <input type="email" name="email" placeholder="Correo electrónico" required onChange={handleChange} className="form-input" />
              <input type="password" name="password" placeholder="Contraseña (mínimo 6 caracteres)" required minLength={6} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`btn-submit ${cargando ? 'cargando' : 'activo'}`}
          >
            {cargando ? 'Subiendo imagen y creando...' : 'Finalizar Configuración'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default RegistroClub;