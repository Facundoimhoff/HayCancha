import { Search, CalendarDays, CheckCircle } from 'lucide-react';
import './seccionesLanding.css';

const PASOS = [
  { icono: Search, titulo: 'Elegí tu club', texto: 'Buscá por ubicación, ciudad o nombre y filtrá por deporte, cantidad de jugadores y si la cancha es techada.' },
  { icono: CalendarDays, titulo: 'Mirá los turnos libres', texto: 'Ves en el momento qué días y horarios están disponibles en cada cancha, sin llamar ni esperar respuesta.' },
  { icono: CheckCircle, titulo: 'Reservá y sumá extras', texto: 'Confirmás en unos toques, sumás bebidas o alquileres si el club los ofrece y encontrás todo en Mis reservas.' },
];

/** Pasos para reservar. El orden importa: es un recorrido real de la app. */
export default function ComoFunciona() {
  return (
    <section className="cf" aria-labelledby="cf-titulo">
      <div className="cf-contenedor">
        <h2 id="cf-titulo" className="cf-titulo">Reservá en tres pasos</h2>
        <ol className="cf-lista">
          {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="cf-paso">
              <span className="cf-numero" aria-hidden="true">{i + 1}</span>
              <span className="cf-icono" aria-hidden="true"><Icono size={22} /></span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
