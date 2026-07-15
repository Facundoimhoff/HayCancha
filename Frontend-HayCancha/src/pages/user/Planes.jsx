import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, ArrowLeft } from 'lucide-react';


const Planes = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      // ACÁ LLAMÁS A TU BACKEND O FUNCIÓN DE SUPABASE PARA CREAR EL PAGO
      // Ejemplo: const response = await fetch('TU_URL_DE_MERCADO_PAGO', { ... })
      // const data = await response.json();
      
      // Simulamos la respuesta rápida para que veas que no tiene que tardar
      console.log("Iniciando pago por $15...");
      
      // LA REDIRECCIÓN DEBE SER INMEDIATA AL init_point QUE TE DA MERCADO PAGO
      // window.location.href = data.init_point; 
      
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
      alert("Hubo un error al conectar con Mercado Pago.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#64748b', marginBottom: '30px', padding: 0, fontWeight: 'bold' }}
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-1px' }}>
            Gestioná tu club como un profesional
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>
            Un único plan con todo lo que necesitás para digitalizar tus canchas.
          </p>
        </div>

        {/* TARJETA ÚNICA DE PLAN */}
        <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '2px solid #2563eb', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={16} /> PLAN FULL
          </div>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 15px 0' }}>Suscripción Mensual</h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>$</span>
              <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-2px' }}>15</span>
              <span style={{ color: '#64748b', fontWeight: '500' }}>/mes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
            {['Reservas ilimitadas', 'Panel de métricas y finanzas', 'Bloqueo de horarios (Mantenimiento)', 'Soporte prioritario 24/7'].map((beneficio, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#16a34a" />
                <span style={{ color: '#475569', fontWeight: '500' }}>{beneficio}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={iniciarPago}
            disabled={cargando}
            style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: cargando ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', opacity: cargando ? 0.8 : 1 }}
          >
            {cargando ? 'Conectando con Mercado Pago...' : 'Comenzar ahora'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Planes;