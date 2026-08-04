import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase'; // Asegurate de que la ruta sea la tuya
import { Plus, Trash2 } from 'lucide-react';

export default function GestorKiosco({ clubId }) {
  const [productos, setProductos] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // 1. Traer los productos del club cuando carga la pantalla
  useEffect(() => {
    if (clubId) cargarProductos();
  }, [clubId]);

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('club_id', clubId)
      .order('nombre', { ascending: true });
    
    if (!error) setProductos(data || []);
  };

  // 2. Función para agregar un producto nuevo
  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoPrecio) return;

    const { error } = await supabase
      .from('productos')
      .insert([
        { 
          club_id: clubId, 
          nombre: nuevoNombre, 
          precio: parseInt(nuevoPrecio) 
        }
      ]);

    if (!error) {
      setNuevoNombre('');
      setNuevoPrecio('');
      cargarProductos(); // Recarga la lista para mostrar el nuevo
    } else {
      alert("Error al guardar el producto");
    }
  };

  // 3. Función para borrar un producto
  const borrarProducto = async (id) => {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (!error) cargarProductos();
  };

  return (
    <div className="kiosco-admin-panel" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      <h3>Mi Kiosco / Extras</h3>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>
        Agregá bebidas o artículos de alquiler para que los jugadores los reserven junto con la cancha.
      </p>

      {/* Formulario para agregar */}
      <form onSubmit={agregarProducto} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Ej: Alquiler Pelota" 
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <input 
          type="number" 
          placeholder="Precio ($)" 
          value={nuevoPrecio}
          onChange={(e) => setNuevoPrecio(e.target.value)}
          style={{ width: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={18} /> Agregar
        </button>
      </form>

      {/* Lista de productos actuales */}
      <div className="lista-productos">
        {productos.map(prod => (
          <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: '600' }}>{prod.nombre}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>${prod.precio}</span>
              <button onClick={() => borrarProducto(prod.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {productos.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aún no agregaste productos.</p>}
      </div>
    </div>
  );
}