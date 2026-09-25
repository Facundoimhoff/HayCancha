import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { useFormspree } from '../../hooks/useFormspree';
import './FormularioContacto.css';

const FormularioContacto = () => {
  const navigate = useNavigate();
  const { enviar, enviando, enviado, error } = useFormspree('https://formspree.io/f/xrengjgv', { mensajeOk: 3000 });

  return (
    <main className="contacto-container">
      
      {/* Botón para volver a la Landing */}
      <div className="contacto-header-wrapper">
        <button onClick={() => navigate(-1)} className="btn-volver-contacto">
          <ArrowLeft size={20} /> Volver al inicio
        </button>
      </div>

      <div className="contacto-card">
        
        <div className="contacto-header">
          <div className="contacto-icono-box">
            <MessageSquare size={30} color="#2563eb" />
          </div>
          <h1 className="contacto-titulo">Contacto</h1>
          <p className="contacto-subtitulo">
            ¿Sos un club y querés este sistema? ¿Tenés alguna sugerencia? Escribinos y te contactamos a la brevedad.
          </p>
        </div>

        {enviado ? (
          <div className="mensaje-exito">
            <CheckCircle size={50} style={{ margin: '0 auto 15px auto' }} />
            <h3 className="exito-titulo">¡Mensaje enviado!</h3>
            <p className="exito-texto">Gracias por contactarte. Te responderemos pronto.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="contacto-form">
            
            <div>
              <label htmlFor="contacto-nombre" className="form-label-contacto">Tu Nombre / Empresa</label>
              <input 
                id="contacto-nombre"
                type="text" 
                name="nombre" 
                required 
                placeholder="Ej: Sport Automovil Club" 
                className="form-input-contacto" 
              />
            </div>

            <div>
              <label htmlFor="contacto-email" className="form-label-contacto">Email de contacto</label>
              <input 
                id="contacto-email"
                type="email" 
                name="email" 
                required 
                placeholder="tu@email.com" 
                className="form-input-contacto" 
              />
            </div>

            <div>
              <label htmlFor="contacto-mensaje" className="form-label-contacto">Mensaje</label>
              <textarea 
                id="contacto-mensaje"
                name="mensaje" 
                required 
                rows="5" 
                placeholder="Dejanos tu comentario, crítica o solicitud..." 
                className="form-input-contacto form-textarea-contacto"
              ></textarea>
            </div>

            {error && <p className="contacto-error" role="alert">{error}</p>}

            <button type="submit" className="btn-enviar-contacto" disabled={enviando}>
              <Send size={20} /> {enviando ? 'Enviando…' : 'Enviar Mensaje'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default FormularioContacto;