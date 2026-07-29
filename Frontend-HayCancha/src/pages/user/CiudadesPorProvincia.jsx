import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HeaderCliente from './HeaderCliente'; // 1. Importar el header
import './CiudadesPorProvincia.css';

export default function CiudadesPorProvincia() {
  const { provincia } = useParams();
  const navigate = useNavigate();
  
  const [ciudades, setCiudades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const provinciaNombre = decodeURIComponent(provincia);

  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        setCargando(true);
        const { data, error: sbError } = await supabase
          .from('clubes')
          .select('ciudad, provincia')
          .ilike('provincia', provinciaNombre);

        if (sbError) throw sbError;

        const ciudadesUnicas = [...new Set(data.map(item => item.ciudad))].filter(Boolean);
        setCiudades(ciudadesUnicas);

      } catch (err) {
        console.error("Error al cargar ciudades:", err);
        setError("No pudimos cargar las ciudades de esta provincia.");
      } finally {
        setCargando(false);
      }
    };

    cargarCiudades();
  }, [provinciaNombre]);

  return (
    <>
      {/* 2. EL HEADER PEGADO ARRIBA DE TODO */}
      <HeaderCliente />

      <div className="explorar-page" style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Botón Volver */}
        <button onClick={() => navigate(-1)} className="btn-flotante-volver" style={{ position: 'relative', top: '0', left: '0', marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Volver
        </button>

        <h1 className="titulo-seccion" style={{ fontSize: '2.5rem', marginBottom: '30px', fontWeight: '900', fontStyle: 'italic' }}>
          CIUDADES EN <span style={{ color: '#22c55e' }}>{provinciaNombre.toUpperCase()}</span>
        </h1>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <Loader2 size={50} className="spinner" style={{ animation: 'spin 1s linear infinite', color: '#22c55e' }} />
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</div>
        ) : ciudades.length === 0 ? (
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
            <h3>No hay ciudades con clubes registrados en esta provincia todavía.</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {ciudades.map((ciudad, index) => (
              <div 
                key={index} 
                className="result-card club-card" 
                onClick={() => navigate(`/buscar?q=${encodeURIComponent(ciudad)}`)}
                style={{ cursor: 'pointer', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '800' }}>{ciudad}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}><MapPin size={14}/> Ver clubes disponibles</p>
                </div>
                <ArrowRight size={20} style={{ color: '#22c55e' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}