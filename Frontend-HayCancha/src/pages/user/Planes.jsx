import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/supabase';
// IMPORTANTE: Importamos el archivo CSS
import './Planes.css';

const Planes = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      // 1. Llamamos a tu "cuarto seguro" en Supabase en 1 línea de código
      const { data, error } = await supabase.functions.invoke('crear-pago');

      if (error) {
        throw error;
      }

      // 2. Si todo sale bien, Mercado Pago nos devuelve el init_point y viajamos al instante
      if (data && data.init_point) {
        window.location.href = data.init_point; 
      } else {
        throw new Error("No se recibió el link de pago");
      }
      
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
      alert("Hubo un error al conectar con Mercado Pago.");
      setCargando(false); 
    }
  };

  return (
    <div className="planes-container">
      <div className="planes-wrapper">
        
        <button onClick={() => navigate(-1)} className="btn-volver-planes">
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="planes-header">
          <h1 className="planes-titulo">Gestioná tu club como un profesional</h1>
          <p className="planes-subtitulo">
            Un único plan con todo lo que necesitás para digitalizar tus canchas.
          </p>
        </div>

        {/* TARJETA ÚNICA DE PLAN */}
        <div className="plan-card">
          
          <div className="plan-badge">
            <Zap size={16} /> PLAN FULL
          </div>

          <div className="plan-precio-header">
            <h2 className="plan-nombre">Suscripción Mensual</h2>
            <div className="plan-precio-wrapper">
              <span className="plan-moneda">$</span>
              <span className="plan-monto">15</span>
              <span className="plan-periodo">/mes</span>
            </div>
          </div>

          <div className="plan-beneficios">
            {[
              'Reservas ilimitadas', 
              'Panel de métricas y finanzas', 
              'Bloqueo de horarios (Mantenimiento)', 
              'Soporte prioritario 24/7'
            ].map((beneficio, index) => (
              <div key={index} className="plan-beneficio-item">
                <CheckCircle size={20} color="#16a34a" />
                <span className="plan-beneficio-texto">{beneficio}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={iniciarPago}
            disabled={cargando}
            className={`btn-comprar ${cargando ? 'cargando' : 'activo'}`}
          >
            {cargando ? 'Conectando seguro...' : 'Comenzar ahora'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Planes;