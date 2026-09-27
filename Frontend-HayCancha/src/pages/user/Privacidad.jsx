import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import './Legales.css';

export default function Privacidad() {
  const navigate = useNavigate();

  return (
    <div className="legales-page">
      <nav className="legales-nav">
        <button onClick={() => navigate(-1)} className="btn-volver-legal">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="legales-logo">GridPlay<span className="text-green">.</span></div>
      </nav>

      <div className="legales-container">
        <div className="legales-header">
          <ShieldCheck size={48} className="text-green icon-legal" />
          <h1>Política de Privacidad</h1>
          <p>Última actualización: Septiembre de 2026</p>
        </div>

        <div className="legales-content">
          <h2>1. Información que recopilamos</h2>
          <p>En GridPlay recopilamos la información necesaria para brindarte nuestro software de gestión de reservas deportivas. Esto incluye:</p>
          <ul>
            <li><strong>Datos de la cuenta del Club:</strong> Nombre, correo electrónico, teléfono, dirección del complejo y contraseña (encriptada).</li>
            <li><strong>Datos de los jugadores:</strong> Cuando un cliente final reserva una cancha a través de nuestra plataforma, recopilamos su nombre, teléfono y correo electrónico para gestionar el turno.</li>
            <li><strong>Datos de uso y cookies:</strong> Información sobre cómo interactuás con la plataforma, dirección IP y tipo de dispositivo. Utilizamos Google Analytics de forma anonimizada para mejorar nuestros servicios.</li>
            <li><strong>Ubicación del jugador (solo si la activás):</strong> Si tocás “Usar mi ubicación”, tu navegador te pide permiso. Con tu ubicación mostramos el mapa y los clubes más cercanos. <strong>No la guardamos</strong> en nuestra base de datos ni la asociamos a tu cuenta.</li>
            <li><strong>Ubicación del club:</strong> El dueño de un club puede marcar dónde queda su complejo en el mapa. Esa ubicación es pública, igual que el nombre y la dirección del club.</li>
          </ul>

          <h2>2. ¿Para qué utilizamos tu información?</h2>
          <p>Los datos recopilados se utilizan exclusivamente para:</p>
          <ul>
            <li>Proveer, operar y mantener el software de GridPlay.</li>
            <li>Procesar las reservas y enviar notificaciones de confirmación o cancelación por correo o WhatsApp.</li>
            <li>Procesar los pagos de la suscripción a través de Mercado Pago.</li>
            <li>Cumplir con obligaciones legales y prevenir fraudes.</li>
          </ul>

          <h2>3. Protección de Datos (Ley Nº 25.326)</h2>
          <p>El titular de los datos personales tiene la facultad de ejercer el derecho de acceso, rectificación, actualización y supresión de los mismos en forma gratuita a intervalos no inferiores a seis meses. La Agencia de Acceso a la Información Pública (AAIP) tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.</p>

          <h2>4. Compartir información con terceros</h2>
          <p>GridPlay <strong>no vende, alquila ni comercializa</strong> tus datos personales ni los de tus clientes. Solo compartimos información con proveedores de servicios estrictamente necesarios para la operatividad de la plataforma (como servidores de alojamiento web y pasarelas de pago como Mercado Pago).</p>
          <p>Para el mapa usamos <strong>OpenStreetMap</strong>: sus servidores nos entregan las imágenes del mapa y, cuando activás tu ubicación o un club busca su dirección, reciben las coordenadas o la dirección para devolvernos el nombre de la ciudad. Como en cualquier sitio web, OpenStreetMap puede ver tu dirección IP al cargar el mapa. Su política está en <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">osmfoundation.org</a>.</p>

          <h2>5. Contacto</h2>
          <p>Si tenés alguna duda sobre esta Política de Privacidad o querés ejercer tus derechos sobre tus datos, podés contactarnos enviando un correo a <strong>legal@gridplay.app</strong>.</p>
        </div>
      </div>
    </div>
  );
}