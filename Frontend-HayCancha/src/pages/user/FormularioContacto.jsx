import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

const FormularioContacto = () => {
  const [enviado, setEnviado] = useState(false);

  // Reemplazá TU_CODIGO_FORMSPREE por el código que te da la página
  const FORMSPREE_URL = "https://formspree.io/f/TU_CODIGO_FORMSPREE"; 

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
        // Después de 3 segundos, volvemos a mostrar el formulario normal
        setTimeout(() => setEnviado(false), 3000); 
      }
    } catch (error) {
      alert("Hubo un error al enviar el mensaje.");
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <MessageSquare size={32} color="#2563eb" style={{ marginBottom: '10px' }} />
        <h2 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Contacto & Sugerencias</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '5px' }}>
          ¿Sos un club y querés este sistema? ¿Tenés alguna sugerencia? Escribinos.
        </p>
      </div>

      {enviado ? (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#166534' }}>
          <CheckCircle size={40} style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ margin: 0 }}>¡Mensaje enviado!</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>Gracias por contactarte. Te responderemos pronto.</p>
        </div>
      ) : (
        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Tu Nombre / Empresa</label>
            <input type="text" name="nombre" required placeholder="Ej: Sport Automovil Club" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Email de contacto</label>
            <input type="email" name="email" required placeholder="tu@email.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151', fontSize: '0.9rem' }}>Mensaje</label>
            <textarea name="mensaje" required rows="4" placeholder="Dejanos tu comentario, crítica o solicitud..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
          </div>

          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Send size={18} /> Enviar Mensaje
          </button>
        </form>
      )}
    </div>
  );
};

export default FormularioContacto;