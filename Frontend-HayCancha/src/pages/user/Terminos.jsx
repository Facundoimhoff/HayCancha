import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import './Legales.css';

export default function Terminos() {
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
          <FileText size={48} className="text-green icon-legal" />
          <h1>Términos y Condiciones</h1>
          <p>Última actualización: Agosto de 2026</p>
        </div>

        <div className="legales-content">
          <h2>1. Descripción del Servicio</h2>
          <p>GridPlay ofrece un software como servicio (SaaS) diseñado para la gestión de complejos deportivos y automatización de reservas. GridPlay provee únicamente la infraestructura tecnológica. No somos propietarios de las canchas ni intervenimos en la relación directa entre el Club y el Jugador.</p>

          <h2>2. Pagos, Suscripciones y Facturación</h2>
          <p>El acceso al panel de administrador requiere el pago de una suscripción mensual. Los pagos son procesados de forma segura a través de Mercado Pago. Al suscribirte, autorizás el cobro automático recurrente según el plan elegido. Si el pago no pudiera procesarse, GridPlay se reserva el derecho de suspender temporalmente el acceso al sistema.</p>

          <h2>3. Botón de Arrepentimiento y Baja del Servicio</h2>
          <p>De acuerdo con la Ley de Defensa del Consumidor (Nº 24.240), el usuario tiene derecho a revocar la aceptación del servicio dentro de los <strong>diez (10) días corridos</strong> contados a partir de la contratación, obteniendo el reintegro total del dinero. Asimismo, el usuario puede solicitar la <strong>baja de la suscripción</strong> en cualquier momento desde su panel de control o contactándose con nosotros, sin penalidad alguna para los meses subsiguientes.</p>

          <h2>4. Responsabilidades del Club</h2>
          <p>El Club es el único responsable de mantener actualizados los horarios, precios, disponibilidad de las canchas y del correcto trato comercial con los jugadores que reserven a través de la plataforma. GridPlay no se responsabiliza por turnos superpuestos derivados de un mal uso del sistema ni por la inasistencia de los jugadores.</p>

          <h2>5. Disponibilidad del Sistema</h2>
          <p>Nos esforzamos por mantener GridPlay operativo las 24 horas del día. Sin embargo, no garantizamos que el servicio sea ininterrumpido o libre de errores debido a mantenimientos programados o caídas de servidores de terceros. En caso de mantenimiento, avisaremos con anticipación razonable.</p>

          <h2>6. Propiedad Intelectual</h2>
          <p>El software, diseño, código fuente y marca "GridPlay" son propiedad exclusiva de la empresa. Queda prohibida su reproducción, ingeniería inversa o uso comercial no autorizado.</p>
        </div>
      </div>
    </div>
  );
}