import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, Search, ArrowLeft } from 'lucide-react';

const SeleccionUbicacion = () => {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [clubes, setClubes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [filtroCiudad, setFiltroCiudad] = useState(''); // Para buscar por ciudad
  const navigate = useNavigate();

  // Podés ir agregando más provincias a medida que consigas clubes ahí
  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán"];

  const buscarPorProvincia = async (provincia) => {
    setBuscando(true);
    setProvinciaSeleccionada(provincia);
    setFiltroCiudad(''); // Reseteamos la ciudad si cambia de provincia
    
    // Traemos todos los clubes de esa provincia
    const { data, error } = await supabase
      .from('clubes')
      .select('*')
      .eq('provincia', provincia);
    
    if (error) {
      console.error("Error al buscar:", error);
    } else {
      setClubes(data || []);
    }
    setBuscando(false);
  };

  // Esta función filtra los clubes en tiempo real a medida que el usuario escribe la ciudad
  const clubesFiltrados = clubes.filter(club => 
    club.ciudad && club.ciudad.toLowerCase().includes(filtroCiudad.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#4b5563', marginBottom: '20px', padding: 0 }}
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <h2 style={{ color: '#111827', margin: '0 0 5px 0' }}>¿Dónde vas a jugar?</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Seleccioná tu provincia para ver los clubes disponibles.</p>
        
        {/* BOTONES DE PROVINCIAS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
          {provincias.map(prov => (
            <button 
              key={prov} 
              onClick={() => buscarPorProvincia(prov)}
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

        {/* RESULTADOS Y BUSCADOR DE CIUDAD */}
        {provinciaSeleccionada && (
          <div>
            <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>
              Clubes en {provinciaSeleccionada}
            </h3>

            {/* BARRA PARA BUSCAR POR CIUDAD */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
              <input 
                type="text" 
                placeholder="Filtrar por ciudad (Ej: San Francisco)" 
                value={filtroCiudad}
                onChange={(e) => setFiltroCiudad(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            {buscando ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Buscando clubes...</p>
            ) : clubesFiltrados.length > 0 ? (
              <div style={{ display: 'grid', gap: '15px' }}>
                {clubesFiltrados.map(club => (
                  <div 
                    key={club.id} 
                    onClick={() => navigate(`/club/${club.id}`)} 
                    style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: '#111827' }}>{club.nombre}</strong>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                        <MapPin size={14} /> {club.ciudad}
                      </span>
                    </div>
                    <ArrowRight size={18} color="#9ca3af" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#4b5563' }}>No encontramos clubes en esta ubicación.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionUbicacion;