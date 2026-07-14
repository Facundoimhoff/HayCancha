import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ArrowLeft, ArrowRight, Map } from 'lucide-react';

const SeleccionUbicacion = () => {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [clubesProvincia, setClubesProvincia] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  // Lista de provincias. Podés ir sumando a medida que te expandas.
  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán"];

  const seleccionarProvincia = async (provincia) => {
    setBuscando(true);
    setProvinciaSeleccionada(provincia);
    setCiudadSeleccionada(''); // Si cambia de provincia, reseteamos la ciudad elegida
    
    // Traemos todos los clubes de esa provincia desde Supabase
    const { data, error } = await supabase
      .from('clubes')
      .select('*')
      .eq('provincia', provincia);
    
    if (error) {
      console.error("Error al buscar:", error);
    } else {
      setClubesProvincia(data || []);
    }
    setBuscando(false);
  };

  // MAGIA REACT: Extraemos las ciudades de los clubes y quitamos las repetidas y las vacías
  const ciudadesDisponibles = [...new Set(clubesProvincia.map(club => club.ciudad))].filter(Boolean);

  // Filtramos para mostrar únicamente los clubes de la ciudad seleccionada
  const clubesAMostrar = clubesProvincia.filter(club => club.ciudad === ciudadSeleccionada);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', marginBottom: '25px', padding: 0, fontWeight: 'bold' }}
        >
          <ArrowLeft size={20} /> Volver al inicio
        </button>

        {/* PASO 1: SELECCIONAR PROVINCIA */}
        <div>
          <h2 style={{ color: '#111827', margin: '0 0 5px 0' }}>1. Elegí tu Provincia</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
            {provincias.map(prov => (
              <button 
                key={prov} 
                onClick={() => seleccionarProvincia(prov)}
                style={{ 
                  padding: '10px 15px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  background: provinciaSeleccionada === prov ? '#2563eb' : 'white', 
                  color: provinciaSeleccionada === prov ? 'white' : '#374151', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '25px 0' }} />

        {/* PASO 2: SELECCIONAR CIUDAD */}
        {provinciaSeleccionada && (
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ color: '#111827', margin: '0 0 5px 0' }}>2. Elegí tu Ciudad</h2>
            
            {buscando ? (
              <p style={{ color: '#6b7280', marginTop: '10px' }}>Buscando ciudades...</p>
            ) : ciudadesDisponibles.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                {ciudadesDisponibles.map(ciudad => (
                  <button 
                    key={ciudad}
                    onClick={() => setCiudadSeleccionada(ciudad)}
                    style={{ 
                      padding: '8px 16px', 
                      border: '1px solid #93c5fd', 
                      borderRadius: '20px', 
                      background: ciudadSeleccionada === ciudad ? '#eff6ff' : 'white', 
                      color: ciudadSeleccionada === ciudad ? '#1e40af' : '#4b5563',
                      borderColor: ciudadSeleccionada === ciudad ? '#3b82f6' : '#d1d5db',
                      cursor: 'pointer', 
                      fontWeight: '500',
                    }}
                  >
                    <Map size={14} style={{ display: 'inline', marginRight: '5px', marginBottom: '-2px' }} />
                    {ciudad}
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

        {/* PASO 3: MOSTRAR CLUBES */}
        {ciudadSeleccionada && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#111827', marginBottom: '15px' }}>
              Clubes en {ciudadSeleccionada}
            </h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              {clubesAMostrar.map(club => (
                <div 
                  key={club.id} 
                  onClick={() => navigate(`/club/${club.id}`)} 
                  style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#111827' }}>{club.nombre}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                      <MapPin size={14} /> {club.ciudad}, {club.provincia}
                    </span>
                  </div>
                  <ArrowRight size={18} color="#9ca3af" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SeleccionUbicacion;