import { MapPin, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TarjetaClub({ id, nombre, direccion, imagenUrl }) {
  return (
    <Link to={`/club/${id}`} className="tarjeta-link">
      <div className="tarjeta-club">
        
        <div className="tarjeta-imagen-contenedor">
          <img 
            src={imagenUrl || "https://images.unsplash.com/photo-1574629810360-7efbb1b39445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
            alt={`Foto de ${nombre}`} 
            className="tarjeta-imagen"
          />
          <div className="tarjeta-gradiente"></div>
          
          <div className="tarjeta-badge">
            RESERVAS ABIERTAS
          </div>

          <div className="tarjeta-info-principal">
            <h2 className="tarjeta-nombre">{nombre}</h2>
            <div className="tarjeta-direccion">
              <MapPin size={16} className="icono-direccion" />
              <span>{direccion}</span>
            </div>
          </div>
        </div>

        <div className="tarjeta-footer">
          <div className="etiqueta-nuevo">
            <Star size={14} className="icono-estrella" fill="currentColor" />
            <span className="texto-nuevo">Nuevo en app</span>
          </div>
          <div className="accion-ver">
            Ver turnos <ChevronRight size={18} className="icono-flecha" />
          </div>
        </div>

      </div>
    </Link>
  );
}