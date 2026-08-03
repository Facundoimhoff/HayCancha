import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { CheckCircle2, ImagePlus, MapPin, Lock, Mail, Building2, Car } from 'lucide-react';
import './RegistroClub.css';

const RegistroClub = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [imagenFile, setImagenFile] = useState(null); 
  const [previewLogo, setPreviewLogo] = useState(null);
  
  // NUEVO: Estado para el checkbox legal
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  
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
      const file = e.target.files[0];
      setImagenFile(file);
      setPreviewLogo(URL.createObjectURL(file));
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
      navigate('/login-admin'); 

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
          <div className="icono-exito-wrapper">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="registro-titulo">¡Pago exitoso!</h1>
          <p className="registro-subtitulo">Completá el perfil de tu complejo para empezar a recibir reservas.</p>
        </div>

        <form onSubmit={handleSubmit} className="registro-form">
          
          {/* --- SECCIÓN 1: PERFIL DEL CLUB --- */}
          <div className="registro-seccion">
            <h3 className="seccion-titulo"><Building2 size={18}/> 1. Perfil del Club</h3>
            <div className="club-perfil-layout">
              <div className="logo-upload-col">
                <label className="logo-upload-box" htmlFor="logo-upload">
                  {previewLogo ? (
                    <img src={previewLogo} alt="Preview Logo" className="logo-preview-img" />
                  ) : (
                    <div className="logo-upload-placeholder">
                      <ImagePlus size={32} />
                      <span>Subir Logo</span>
                    </div>
                  )}
                  <input 
                    id="logo-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    required 
                    style={{ display: 'none' }}
                  />
                </label>
                <p className="logo-ayuda">Formato JPG o PNG.</p>
              </div>

              <div className="texto-info-col">
                <div className="input-group">
                  <label>Nombre del Complejo</label>
                  <input type="text" name="nombre" placeholder="Ej: Sport Automóvil Club" required onChange={handleChange} className="form-input-reg" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Descripción (Visible para los clientes)</label>
                  <textarea name="descripcion" placeholder="Contale a los jugadores sobre tus instalaciones, iluminación, bar, etc..." onChange={handleChange} className="form-input-reg form-textarea-reg" />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECCIÓN 2: UBICACIÓN Y COMODIDADES --- */}
          <div className="registro-seccion">
            <h3 className="seccion-titulo"><MapPin size={18}/> 2. Ubicación y Servicios</h3>
            
            <div className="grid-2-col">
              <div className="input-group">
                <label>Provincia</label>
                <input type="text" name="provincia" placeholder="Ej: Córdoba" required onChange={handleChange} className="form-input-reg" />
              </div>
              <div className="input-group">
                <label>Ciudad</label>
                <input type="text" name="ciudad" placeholder="Ej: San Francisco" required onChange={handleChange} className="form-input-reg" />
              </div>
            </div>
            
            <div className="input-group">
              <label>Dirección Exacta</label>
              <input type="text" name="direccion" placeholder="Ej: Av. Urquiza 332" required onChange={handleChange} className="form-input-reg" />
            </div>

            <label className="toggle-servicio-container">
              <div className="toggle-info">
                <Car size={20} className={formData.estacionamiento ? 'text-green' : 'text-gray'} />
                <div>
                  <strong>Estacionamiento Privado</strong>
                  <p>Indicá si los jugadores tienen lugar para estacionar dentro del predio.</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" name="estacionamiento" onChange={handleChange} />
                <span className="slider"></span>
              </div>
            </label>
          </div>

          {/* --- SECCIÓN 3: CUENTA ADMIN --- */}
          <div className="registro-seccion cuenta-admin-seccion">
            <h3 className="seccion-titulo"><Lock size={18}/> 3. Tu Cuenta de Administrador</h3>
            <p className="seccion-descripcion">Con este correo y contraseña vas a ingresar a tu panel de control.</p>
            
            <div className="grid-2-col">
              <div className="input-group">
                <label>Correo electrónico</label>
                <div className="input-con-icono">
                  <Mail size={18} />
                  <input type="email" name="email" placeholder="admin@tuclub.com" required onChange={handleChange} className="form-input-reg" />
                </div>
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <div className="input-con-icono">
                  <Lock size={18} />
                  <input type="password" name="password" placeholder="Mínimo 6 caracteres" required minLength={6} onChange={handleChange} className="form-input-reg" />
                </div>
              </div>
            </div>
          </div>

          {/* --- CHECKBOX LEGAL OBLIGATORIO --- */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '10px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <input 
              type="checkbox" 
              id="terminos" 
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#22c55e' }}
            />
            <label htmlFor="terminos" style={{ fontSize: '0.95rem', color: '#334155', cursor: 'pointer', lineHeight: '1.4' }}>
              He leído y acepto los <a href="/terminos" target="_blank" style={{ color: '#16a34a', fontWeight: '600' }}>Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" style={{ color: '#16a34a', fontWeight: '600' }}>Política de Privacidad</a> de GridPlay. Entiendo mis derechos como consumidor.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={cargando || !aceptaTerminos}
            className={`btn-submit-registro ${(cargando || !aceptaTerminos) ? 'cargando' : 'activo'}`}
          >
            {cargando ? 'Configurando tu club...' : 'Finalizar Configuración'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default RegistroClub;