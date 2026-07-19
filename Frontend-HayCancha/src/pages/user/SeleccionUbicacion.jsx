import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ChevronRight, ArrowLeft, Map, Frown } from 'lucide-react';
import './SeleccionUbicacion.css';

// Lista fija con todas las provincias de Argentina
const TODAS_LAS_PROVINCIAS = [
  "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
  "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
];

const SeleccionUbicacion = () => {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [provinciaSelec, setProvinciaSelec] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUbicaciones = async () => {
      // Traemos las ubicaciones de los clubes que SÍ existen
      const { data, error } = await supabase
        .from('clubes')
        .select('provincia, ciudad');

      if (!error && data) {
        setUbicaciones(data);
      }
      setCargando(false);
    };

    cargarUbicaciones();
  }, []);

  const handleSeleccionProvincia = (prov) => {
    setProvinciaSelec(prov);
  };

  const handleSeleccionCiudad = (ciudad) => {
    navigate(`/explorar/${encodeURIComponent(provinciaSelec)}/${encodeURIComponent(ciudad)}`);
  };

  // Filtramos las ciudades que pertenecen a la provincia seleccionada (si es que hay)
  const ciudadesDisponibles = [...new Set(ubicaciones
    .filter(u => u.provincia === provinciaSelec)
    .map(u => u.ciudad)
  )].filter(Boolean).sort();

  return (
    <div className="ubicacion-container">
      
      {/* BOTÓN VOLVER FLOTANTE */}
      <button 
        onClick={() => provinciaSelec ? setProvinciaSelec(null) : navigate('/')} 
        className="btn-flotante-volver"
      >
        <ArrowLeft size={18} /> {provinciaSelec ? 'Cambiar Provincia' : 'Volver al Inicio'}
      </button>

      <div className="ubicacion-card">
        
        <div className="ubicacion-header">
          <div className="ubicacion-icono">
            {provinciaSelec ? <MapPin size={32} /> : <Map size={32} />}
          </div>
          <h1 className="ubicacion-titulo">
            {provinciaSelec ? 'Elegí tu Ciudad' : '¿Dónde querés jugar?'}
          </h1>
          <p className="ubicacion-subtitulo">
            {provinciaSelec 
              ? `Clubes disponibles en ${provinciaSelec}` 
              : 'Seleccioná tu provincia para empezar'}
          </p>
        </div>

        {cargando ? (
          <p className="estado-carga">Cargando mapa de clubes...</p>
        ) : (
          <div className="lista-vertical">
            
            {/* VISTA 1: TODAS LAS PROVINCIAS */}
            {!provinciaSelec && TODAS_LAS_PROVINCIAS.map((prov) => (
              <button 
                key={prov} 
                className="btn-opcion"
                onClick={() => handleSeleccionProvincia(prov)}
              >
                <span>{prov}</span>
                <ChevronRight size={20} className="icono-flecha" />
              </button>
            ))}

            {/* VISTA 2: CIUDADES DISPONIBLES (SI HAY CLUBES) */}
            {provinciaSelec && ciudadesDisponibles.length > 0 && ciudadesDisponibles.map((ciudad) => (
              <button 
                key={ciudad} 
                className="btn-opcion ciudad"
                onClick={() => handleSeleccionCiudad(ciudad)}
              >
                <span>{ciudad}</span>
                <ChevronRight size={20} className="icono-flecha" />
              </button>
            ))}

            {/* VISTA 3: MENSAJE CUANDO NO HAY CLUBES EN LA PROVINCIA */}
            {provinciaSelec && ciudadesDisponibles.length === 0 && (
              <div className="mensaje-vacio-ubicacion">
                <MapPin size={40} className="icono-vacio" />
                <h3>¡Ups! Todavía no llegamos</h3>
                <p>Por ahora ningún club de <strong>{provinciaSelec}</strong> está registrado en la plataforma. ¡Pronto habrá novedades!</p>
                <button onClick={() => setProvinciaSelec(null)} className="btn-volver-vacio">
                  Elegir otra provincia
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default SeleccionUbicacion;