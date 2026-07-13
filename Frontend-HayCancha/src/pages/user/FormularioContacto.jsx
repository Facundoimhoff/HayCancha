import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react';

const FormularioContacto = () => {
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  // Reemplazá TU_CODIGO_FORMSPREE por el código que te da la página
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      
      {/* Botón para volver a la Landing */}
      <div style={{ maxWidth: '500px', margin: '0 auto 20px auto' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
        >
          <ArrowLeft size={20} /> Volver al inicio
        </button>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', padding: '40px 30px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#eff6ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
            <MessageSquare size={30} color="#2563eb" />
          </div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.8rem' }}>Contacto</h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: '10px' }}>
            ¿Sos un club y querés este sistema? ¿Tenés alguna sugerencia? Escribinos y te contactamos a la brevedad.
          </p>
        </div>

        {enviado ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#166534', border: '1px solid #bbf7d0' }}>
            <CheckCircle size={50} style={{ margin: '0 auto 15px auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>¡Mensaje enviado!</h3>
            <p style={{ margin: '10px 0 0 0', fontSize: '1rem' }}>Gracias por contactarte. Te responderemos pronto.</p>
          </div>
        ) : (
          <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Tu Nombre / Empresa</label>
              <input type="text" name="nombre" required placeholder="Ej: Sport Automovil Club" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Email de contacto</label>
              <input type="email" name="email" required placeholder="tu@email.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Mensaje</label>
              <textarea name="mensaje" required rows="5" placeholder="Dejanos tu comentario, crítica o solicitud..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical', fontSize: '1rem' }}></textarea>
            </div>

            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px', transition: 'background-color 0.2s' }}>
              <Send size={20} /> Enviar Mensaje
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormularioContacto;