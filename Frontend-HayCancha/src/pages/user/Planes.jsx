import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, ArrowLeft, CalendarCheck, TrendingUp, Users, Smartphone } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './Planes.css';

const Planes = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.functions.invoke('crear-pago');

      if (error) {
        throw error;
      }

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
    <div className="planes-page-modern">
      
      {/* Navbar / Botón Volver */}
      <nav className="planes-nav">
        <button onClick={() => navigate(-1)} className="btn-volver-modern">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="planes-logo">
          GridPlay<span className="text-green">.</span>
        </div>
      </nav>

      <div className="planes-layout">
        
        {/* COLUMNA IZQUIERDA: Textos de venta, beneficios y foto */}
        <div className="planes-info-section">
          <span className="badge-exclusivo">PARA COMPLEJOS DEPORTIVOS</span>
          <h1 className="planes-titulo-main">
            ADMINISTRÁ TU CLUB DE <br/>LA MEJOR MANERA.
          </h1>
          <p className="planes-descripcion-main">
            Olvidate del papel y el lápiz. Digitalizá tus canchas, automatizá tus reservas y aumentá tus ingresos. Todo desde un solo lugar.
          </p>

          <div className="beneficios-grid">
            <div className="beneficio-item">
              <div className="ben-icon"><CalendarCheck size={24} /></div>
              <div>
                <h4>Reservas 24/7</h4>
                <p>Tus clientes reservan solos, incluso cuando dormís.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><TrendingUp size={24} /></div>
              <div>
                <h4>Control de Ingresos</h4>
                <p>Métricas claras para saber cuánto rinde cada cancha.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><Users size={24} /></div>
              <div>
                <h4>Base de Clientes</h4>
                <p>Conocé a tus jugadores y fidelizalos fácilmente.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><Smartphone size={24} /></div>
              <div>
                <h4>Gestión Móvil</h4>
                <p>Administrá bloqueos y turnos desde tu celular.</p>
              </div>
            </div>
          </div>

          <div className="planes-imagen-contexto">
            <img 
              src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop" 
              alt="Cancha de Padel" 
            />
            <div className="overlay-imagen">
              <p>Sumate a los clubes que ya modernizaron su gestión.</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tarjeta de Precio (Fija) */}
        <div className="planes-card-section">
          <div className="plan-card-premium">
            
            <div className="plan-badge-top">
              <Zap size={16} fill="currentColor" /> PLAN FULL
            </div>

            <div className="plan-precio-header">
              <h2 className="plan-nombre">Suscripción Mensual</h2>
              <div className="plan-precio-wrapper">
                <span className="plan-moneda">$</span>
                <span className="plan-monto">15</span>
                <span className="plan-periodo">/mes</span>
              </div>
              <p className="plan-sub-precio">Facturación mensual. Cancelá cuando quieras.</p>
            </div>

            <div className="plan-divisor"></div>

            <h3 className="plan-lista-titulo">¿Qué incluye?</h3>
            <div className="plan-beneficios-lista">
              {[
                'Canchas y reservas ilimitadas', 
                'Panel de administrador privado', 
                'Métricas de finanzas y ocupación', 
                'Bloqueo de horarios por mantenimiento', 
                'Soporte técnico prioritario 24/7',
                'Visibilidad en nuestra App'
              ].map((beneficio, index) => (
                <div key={index} className="plan-beneficio-row">
                  <CheckCircle size={20} className="check-verde" />
                  <span>{beneficio}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={iniciarPago}
              disabled={cargando}
              className={`btn-comprar-modern ${cargando ? 'cargando' : 'activo'}`}
            >
              {cargando ? 'Generando link de pago...' : 'Comenzar ahora'}
            </button>
            <p className="texto-seguro">Pago 100% seguro a través de Mercado Pago.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Planes;