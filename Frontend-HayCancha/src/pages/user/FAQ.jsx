import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const preguntasGridPlay = [
  {
    id: "faq-1",
    pregunta: "¿Cuánto tiempo tarda en estar funcionando mi club en GridPlay?",
    respuesta: "Es casi inmediato. Te creás la cuenta, agregás tus canchas, subís el logo y fotos del predio, y en menos de 10 minutos ya tenés tu enlace público listo para recibir reservas."
  },
  {
    id: "faq-2",
    pregunta: "¿Me cobran comisiones por cada turno reservado?",
    respuesta: "¡Para nada! En GridPlay cobramos una suscripción fija. El 100% del dinero de los turnos y de las ventas de tu kiosco es tuyo. Sin letras chicas ni comisiones ocultas por reserva."
  },
  {
    id: "faq-3",
    pregunta: "¿Mis clientes tienen que descargarse una aplicación para reservar?",
    respuesta: "No hace falta. Tu complejo tendrá un perfil web único y optimizado para celulares. Tus clientes simplemente entran a tu link desde WhatsApp o Instagram, eligen el horario y listo. Cero barreras."
  },
  {
    id: "faq-4",
    pregunta: "¿Es difícil enseñarle a usar el sistema a mis empleados?",
    respuesta: "GridPlay está diseñado para ser extremadamente intuitivo. Si tu equipo sabe usar WhatsApp, en 5 minutos van a entender cómo agregar un turno manual, bloquear una cancha por lluvia o anotar la venta de una bebida."
  },
  {
    id: "faq-5",
    pregunta: "¿Cuáles son sus costos de instalación o configuración?",
    respuesta: "La configuración inicial es totalmente gratuita. Vos mismo podés armar tu perfil desde el panel, o te ayudamos nosotros paso a paso sin cobrarte ningún cargo extra de 'alta de servicio'."
  },
  {
    id: "faq-6",
    pregunta: "¿El soporte técnico tiene costo extra?",
    respuesta: "No, las actualizaciones del sistema y el soporte técnico directo por WhatsApp están incluidos en tu plan mensual. Si tenés una duda o un problema, nos mandás un mensaje y lo resolvemos al instante."
  }
];

const FAQ = () => {
  const [activo, setActivo] = useState(null);

  const toggleAcordeon = (index) => {
    setActivo(activo === index ? null : index);
  };

  return (
    <section className="sys-faq-section">
      <div className="sys-container">
        <div className="sys-text-center">
          <h2 className="sys-h2">Preguntas Frecuentes</h2>
          <p className="sys-lead">Resolvemos tus dudas principales antes de transformar tu club.</p>
        </div>
        
        <div className="sys-accordion">
          {preguntasGridPlay.map((item, index) => {
            const isOpen = activo === index;
            
            return (
              <div 
                key={item.id} 
                className={`sys-accordion-item ${isOpen ? 'is-active' : ''}`}
              >
                <h3 className="sys-accordion-header">
                  <button 
                    type="button"
                    className="sys-accordion-button"
                    aria-expanded={isOpen}
                    aria-controls={`collapse-${item.id}`}
                    onClick={() => toggleAcordeon(index)}
                  >
                    {item.pregunta}
                    <ChevronDown 
                      size={20} 
                      className="sys-accordion-icon" 
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                
                <div 
                  id={`collapse-${item.id}`}
                  className="sys-accordion-collapse"
                  style={{ 
                    maxHeight: isOpen ? '200px' : '0',
                    opacity: isOpen ? '1' : '0'
                  }}
                >
                  <div className="sys-accordion-body">
                    {item.respuesta}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;