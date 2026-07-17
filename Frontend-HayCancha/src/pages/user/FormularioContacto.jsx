import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react';
// IMPORTANTE: Importar CSS
import './FormularioContacto.css';

const FormularioContacto = () => {
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const FORMSPREE_URL = "https://formspree.io/f/xrengjgv"; 

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setEnviado(true);
        form.reset();
        setTimeout(() => setEnviado(false), 3000); 
      }
    } catch (error) {
      alert("Hubo un error al enviar el mensaje.");
    }
  };

  return (
    <div className="contacto-container">
      
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
          <h2 className="contacto-titulo">Contacto</h2>
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
          <form onSubmit={manejarEnvio} className="contacto-form">
            
            <div>
              <label className="form-label-contacto">Tu Nombre / Empresa</label>
              <input 
                type="text" 
                name="nombre" 
                required 
                placeholder="Ej: Sport Automovil Club" 
                className="form-input-contacto" 
              />
            </div>

            <div>
              <label className="form-label-contacto">Email de contacto</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="tu@email.com" 
                className="form-input-contacto" 
              />
            </div>

            <div>
              <label className="form-label-contacto">Mensaje</label>
              <textarea 
                name="mensaje" 
                required 
                rows="5" 
                placeholder="Dejanos tu comentario, crítica o solicitud..." 
                className="form-input-contacto form-textarea-contacto"
              ></textarea>
            </div>

            <button type="submit" className="btn-enviar-contacto">
              <Send size={20} /> Enviar Mensaje
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormularioContacto;