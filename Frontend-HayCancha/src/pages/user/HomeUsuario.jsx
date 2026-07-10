import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import TarjetaClub from '../../components/user/TarjetaClub';

export default function HomeUsuario() {
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerClubes = async () => {
      // Traemos todos los clubes de la base de datos
      const { data, error } = await supabase.from('clubes').select('*');

      if (error) {
        console.error("Error trayendo clubes:", error);
      } else {
        setClubes(data);
      }
      setCargando(false);
    };

    obtenerClubes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6 pt-4 text-center">
        <h1 className="text-3xl font-extrabold text-blue-600">HayCancha</h1>
        <p className="text-gray-500 text-sm mt-1">San Francisco, Córdoba</p>
      </header>

      {cargando ? (
        <p className="text-center text-gray-400">Buscando clubes...</p>
      ) : clubes.length === 0 ? (
        <p className="text-center text-gray-400">Todavía no hay clubes adheridos.</p>
      ) : (
        <div className="max-w-md mx-auto">
          {clubes.map((club) => (
            <TarjetaClub 
              key={club.id} 
              nombre={club.nombre} 
              direccion={club.direccion} 
            />
          ))}
        </div>
      )}
    </div>
  );
}