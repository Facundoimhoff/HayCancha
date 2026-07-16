import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Map } from 'lucide-react';

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

  // 1. EL TRUCO DEL ORDEN: Ordenamos las provincias alfabéticamente de la A a la Z
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
    // Viajamos a la nueva pantalla hermosa pasando los datos en la URL
    navigate(`/explorar/${provinciaSeleccionada}/${ciudad}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', marginBottom: '25px', padding: 0, fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Volver al inicio
        </button>

        {/* PASO 1: PROVINCIA */}
        <div>
          <h2 style={{ color: '#111827', margin: '0 0 5px 0' }}>1. Elegí tu Provincia</h2>
          
          {/* 2. EL TRUCO DEL SCROLL HORIZONTAL */}
          <div style={{ 
            display: 'flex', 
            overflowX: 'auto', /* Esto crea la barrita */
            gap: '10px', 
            marginTop: '15px',
            paddingBottom: '10px' /* Para que la barra de scroll no tape los botones */
          }}>
            {provinciasOrdenadas.map(prov => (
              <button 
                key={prov} 
                onClick={() => seleccionarProvincia(prov)}
                style={{ 
                  whiteSpace: 'nowrap', /* Evita que "Buenos Aires" se parta en dos renglones */
                  flexShrink: 0, /* Evita que los botones se deformen o achiquen */
                  padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '8px', 
                  background: provinciaSeleccionada === prov ? '#2563eb' : 'white', 
                  color: provinciaSeleccionada === prov ? 'white' : '#374151', 
                  cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                }}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {/* PASO 2: CIUDAD */}
        {provinciaSeleccionada && (
          <div style={{ marginTop: '25px', borderTop: '1px solid #e5e7eb', paddingTop: '25px' }}>
            <h2 style={{ color: '#111827', margin: '0 0 5px 0' }}>2. Elegí tu Ciudad</h2>
            
            {buscando ? (
              <p style={{ color: '#6b7280', marginTop: '10px' }}>Buscando ciudades...</p>
            ) : ciudadesDisponibles.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                {ciudadesDisponibles.map(ciudad => (
                  <button 
                    key={ciudad}
                    onClick={() => irAExplorar(ciudad)}
                    style={{ 
                      padding: '8px 16px', border: '1px solid #93c5fd', borderRadius: '20px', 
                      background: 'white', color: '#1e40af', cursor: 'pointer', fontWeight: '500',
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                  >
                    <Map size={14} /> {ciudad}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: '#ef4444', marginTop: '10px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>
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