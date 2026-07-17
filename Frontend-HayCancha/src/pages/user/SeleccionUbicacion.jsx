import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Map } from 'lucide-react';
// IMPORTANTE: Importamos nuestro nuevo archivo CSS
import './SeleccionUbicacion.css';

const SeleccionUbicacion = () => {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [clubesProvincia, setClubesProvincia] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  // Las 24 jurisdicciones de Argentina
  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad Autónoma de Buenos Aires", 
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", 
    "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", 
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
  ];

  // Ordenamos las provincias alfabéticamente de la A a la Z
  const provinciasOrdenadas = [...provincias].sort((a, b) => a.localeCompare(b));

  const seleccionarProvincia = async (provincia) => {
    setBuscando(true);
    setProvinciaSeleccionada(provincia);
    
    const { data, error } = await supabase
      .from('clubes')
      .select('*')
      .eq('provincia', provincia);
    
    if (!error) {
      setClubesProvincia(data || []);
    }
    setBuscando(false);
  };

  // Extraemos ciudades sin repetir
  const ciudadesDisponibles = [...new Set(clubesProvincia.map(club => club.ciudad))].filter(Boolean);

  const irAExplorar = (ciudad) => {
    navigate(`/explorar/${provinciaSeleccionada}/${ciudad}`);
  };

  return (
    <div className="seleccion-ubicacion-container">
      <div className="seleccion-ubicacion-card">
        
        <button onClick={() => navigate('/')} className="btn-volver">
          <ArrowLeft size={20} /> Volver al inicio
        </button>

        {/* PASO 1: PROVINCIA */}
        <div>
          <h2 className="seccion-titulo">1. Elegí tu Provincia</h2>
          
          <div className="provincias-scroll">
            {provinciasOrdenadas.map(prov => (
              <button 
                key={prov} 
                onClick={() => seleccionarProvincia(prov)}
                // Acá le decimos: si esta provincia es la elegida, agregale la clase "activa"
                className={`btn-provincia ${provinciaSeleccionada === prov ? 'activa' : ''}`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* PASO 2: CIUDAD */}
        {provinciaSeleccionada && (
          <div className="seccion-ciudades">
            <h2 className="seccion-titulo">2. Elegí tu Ciudad</h2>
            
            {buscando ? (
              <p className="texto-buscando">Buscando ciudades...</p>
            ) : ciudadesDisponibles.length > 0 ? (
              <div className="ciudades-grid">
                {ciudadesDisponibles.map(ciudad => (
                  <button 
                    key={ciudad}
                    onClick={() => irAExplorar(ciudad)}
                    className="btn-ciudad"
                  >
                    <Map size={14} /> {ciudad}
                  </button>
                ))}
              </div>
            ) : (
              <p className="texto-alerta">
                Aún no tenemos clubes registrados en {provinciaSeleccionada}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionUbicacion;