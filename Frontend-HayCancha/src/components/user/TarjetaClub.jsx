import { MapPin } from 'lucide-react';

export default function TarjetaClub({ nombre, direccion, imagenUrl }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 border border-gray-100">
      <img 
        src={imagenUrl || "https://via.placeholder.com/400x200?text=Cancha+San+Francisco"} 
        alt={`Foto de ${nombre}`} 
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800">{nombre}</h2>
        <div className="flex items-center text-gray-500 mt-2">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{direccion}</span>
        </div>
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
          Ver Canchas y Turnos
        </button>
      </div>
    </div>
  );
}