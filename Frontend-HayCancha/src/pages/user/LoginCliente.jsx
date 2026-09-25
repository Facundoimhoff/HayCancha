import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import FormularioAcceso from '../../components/user/FormularioAcceso';
import './Auth.css';

/** Ingreso / registro del jugador. Si venía de una ruta protegida (ej. /mis-reservas) vuelve ahí después de ingresar. */
const LoginCliente = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from || '/seleccionar-ubicacion';

  return (
    <div className="au-pagina">
      <button type="button" onClick={() => navigate('/')} className="au-volver">
        <ArrowLeft size={18} /> Volver
      </button>

      <main className="au-card">
        <div className="au-header">
          <div className="au-icono"><CalendarDays size={30} aria-hidden="true" /></div>
          <h1>Tu cuenta de jugador</h1>
          <p>Ingresá o creá tu cuenta para reservar canchas y gestionar tus turnos.</p>
        </div>

        <FormularioAcceso
          redireccionEmail={`${window.location.origin}/login-cliente`}
          redireccionGoogle={`${window.location.origin}${destino}`}
          onAcceso={() => navigate(destino)}
        />
      </main>
    </div>
  );
};

export default LoginCliente;
