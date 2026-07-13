import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Planes = () => {
  const manejarPago = async (nombrePlan, precioPlan) => {
    try {
      // Llamamos a nuestro backend en el puerto 3000
      const respuesta = await fetch('https://haycancha.onrender.com/api/crear-suscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: nombrePlan, precio: precioPlan })
      });
      
      const data = await respuesta.json();
      
      // Si Mercado Pago nos devolvió el link, redirigimos al usuario a la pasarela
      if (data.linkPago) {
        window.location.href = data.linkPago; // Magia: te lleva a Mercado Pago
      } else {
        alert('Error: Mercado Pago no devolvió el link de pago.');
      }
    } catch (error) {
      alert('Hubo un error al conectar con la pasarela de pagos. Asegurate de que el backend (puerto 3000) esté encendido.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: 'system-ui' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Botón Volver */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4b5563', textDecoration: 'none', fontWeight: 'bold', marginBottom: '30px' }}>
          <ArrowLeft size={20} /> Volver al inicio
        </Link>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '15px' }}>Llevá tu club al próximo nivel</h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Automatizá tus reservas, conocé tus métricas y aumentá tus ingresos. Elegí el plan que mejor se adapte a tu complejo.
          </p>
        </div>

        {/* Contenedor de Tarjetas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
          
          {/* Tarjeta 1: Plan Básico */}
          <div style={{ flex: '1 1 300px', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: '0 0 10px 0' }}>Básico</h2>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>Ideal para complejos pequeños.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '30px' }}>
              $15.000 <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' }}>/mes</span>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#374151' }}><CheckCircle2 size={20} color="#10b981" /> Hasta 2 canchas</li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#374151' }}><CheckCircle2 size={20} color="#10b981" /> Reservas web ilimitadas</li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#374151' }}><CheckCircle2 size={20} color="#10b981" /> Panel de control básico</li>
            </ul>

            <button 
              onClick={() => manejarPago('Básico', 15000)} 
              style={{ width: '100%', padding: '15px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#2563eb'; e.target.style.color = '#fff'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = '#eff6ff'; e.target.style.color = '#2563eb'; }}
            >
              Comenzar con Básico
            </button>
          </div>

          {/* Tarjeta 2: Plan Pro (Destacada) */}
          <div style={{ flex: '1 1 300px', maxWidth: '400px', backgroundColor: '#111827', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3b82f6', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              MÁS ELEGIDO
            </div>
            
            <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: '0 0 10px 0' }}>Pro</h2>
            <p style={{ color: '#9ca3af', margin: '0 0 20px 0' }}>Para clubes que quieren dominar.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '30px' }}>
              $25.000 <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 'normal' }}>/mes</span>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#e5e7eb' }}><CheckCircle2 size={20} color="#3b82f6" /> Canchas ilimitadas</li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#e5e7eb' }}><CheckCircle2 size={20} color="#3b82f6" /> Métricas y estadísticas avanzadas</li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#e5e7eb' }}><CheckCircle2 size={20} color="#3b82f6" /> Base de datos de clientes</li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#e5e7eb' }}><CheckCircle2 size={20} color="#3b82f6" /> Soporte prioritario por WhatsApp</li>
            </ul>

            <button 
              onClick={() => manejarPago('Pro', 15000)}
              style={{ width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Comenzar con Pro
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Planes;