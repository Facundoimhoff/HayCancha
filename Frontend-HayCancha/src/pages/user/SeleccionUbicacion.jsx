import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ChevronRight, ArrowLeft, Map } from 'lucide-react';
import './SeleccionUbicacion.css';

const SeleccionUbicacion = () => {
  const navigate = useNavigate();
  const [ubicaciones, setUbicaciones] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [provinciaSelec, setProvinciaSelec] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUbicaciones = async () => {
      // Traemos todas las provincias y ciudades de los clubes existentes
      const { data, error } = await supabase
        .from('clubes')
        .select('provincia, ciudad');

      if (!error && data) {
        setUbicaciones(data);
        // Filtramos para que no haya provincias repetidas
        const provsUnicas = [...new Set(data.map(item => item.provincia))].filter(Boolean).sort();
        setProvincias(provsUnicas);
      }
      setCargando(false);
    };

    cargarUbicaciones();
  }, []);

  const handleSeleccionProvincia = (prov) => {
    setProvinciaSelec(prov);
  };

  const handleSeleccionCiudad = (ciudad) => {
    // Cuando elige ciudad, lo mandamos al HomeUsuario de esa zona
    navigate(`/explorar/${encodeURIComponent(provinciaSelec)}/${encodeURIComponent(ciudad)}`);
  };

  // Filtramos las ciudades que pertenecen a la provincia seleccionada
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
          <p className="estado-carga">Buscando zonas disponibles...</p>
        ) : (
          <div className="lista-vertical">
            {/* VISTA 1: PROVINCIAS */}
            {!provinciaSelec && provincias.map((prov) => (
              <button 
                key={prov} 
                className="btn-opcion"
                onClick={() => handleSeleccionProvincia(prov)}
              >
                <span>{prov}</span>
                <ChevronRight size={20} className="icono-flecha" />
              </button>
            ))}

            {!provinciaSelec && provincias.length === 0 && !cargando && (
              <p className="estado-carga">Aún no hay clubes registrados en la plataforma.</p>
            )}

            {/* VISTA 2: CIUDADES */}
            {provinciaSelec && ciudadesDisponibles.map((ciudad) => (
              <button 
                key={ciudad} 
                className="btn-opcion ciudad"
                onClick={() => handleSeleccionCiudad(ciudad)}
              >
                <span>{ciudad}</span>
                <ChevronRight size={20} className="icono-flecha" />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SeleccionUbicacion;