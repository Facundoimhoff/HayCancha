import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Plus, Image as ImageIcon, Smile, UploadCloud } from 'lucide-react';

const GestorKiosco = ({ clubId }) => {
  const [productos, setProductos] = useState([]);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  
  // Estados para la Imagen / Emoji
  const [tipoIcono, setTipoIcono] = useState('emoji'); // Puede ser 'emoji' o 'imagen'
  const [emoji, setEmoji] = useState('🥤');
  const [imagenFile, setImagenFile] = useState(null);
  
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (clubId) cargarProductos();
  }, [clubId]);

  const cargarProductos = async () => {
    try {
      // ⚠️ CAMBIÁ 'kiosco' POR EL NOMBRE DE TU TABLA SI ES DISTINTO
      const { data, error } = await supabase
        .from('kiosco') 
        .select('*')
        .eq('club_id', clubId)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagenFile(e.target.files[0]);
    }
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nombre || !precio) return;
    setCargando(true);

    try {
      let iconoFinal = emoji; // Por defecto guarda el emoji

      // Si eligió subir imagen, la mandamos a Storage
      if (tipoIcono === 'imagen' && imagenFile) {
        const fileExt = imagenFile.name.split('.').pop();
        const fileName = `kiosco/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('imagenes')
          .upload(fileName, imagenFile);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('imagenes')
          .getPublicUrl(fileName);
          
        iconoFinal = urlData.publicUrl; // Guardamos el link de la foto
      } else if (tipoIcono === 'imagen' && !imagenFile) {
        iconoFinal = '📦'; // Fallback por si eligió imagen pero no subió nada
      }

      // ⚠️ CAMBIÁ 'kiosco' POR EL NOMBRE DE TU TABLA SI ES DISTINTO
      const { error } = await supabase.from('kiosco').insert([{
        club_id: clubId,
        nombre: nombre,
        precio: Number(precio),
        icono: iconoFinal // Acá guardamos la URL o el Emoji
      }]);

      if (error) throw error;

      // Limpiar el formulario
      setNombre('');
      setPrecio('');
      setEmoji('🥤');
      setImagenFile(null);
      setTipoIcono('emoji');
      
      cargarProductos();
    } catch (error) {
      alert("Error al agregar producto. ¿Agregaste la columna 'icono' en Supabase?: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Seguro que querés eliminar este producto?")) {
      // ⚠️ CAMBIÁ 'kiosco' POR EL NOMBRE DE TU TABLA SI ES DISTINTO
      await supabase.from('kiosco').delete().eq('id', id);
      cargarProductos();
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.1rem' }}>Agregar nuevo artículo</h3>
        <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>Completá el nombre, precio y elegí una miniatura.</p>
        
        <form onSubmit={agregarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Fila 1: Nombre y Precio */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Ej: Coca-Cola 1.5 Lts" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
              style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
            />
            <input 
              type="number" 
              placeholder="Precio ($)" 
              value={precio} 
              onChange={e => setPrecio(e.target.value)} 
              required 
              style={{ width: '140px', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
            />
          </div>

          {/* Fila 2: Selector de Emoji/Imagen y Botón Guardar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Miniatura:</span>
              
              {/* SWITCH EMOJI / IMAGEN */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setTipoIcono('emoji')} 
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: tipoIcono === 'emoji' ? 'white' : 'transparent', boxShadow: tipoIcono === 'emoji' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: tipoIcono === 'emoji' ? '#0f172a' : '#64748b', fontWeight: '600' }}
                >
                  <Smile size={16}/> Emoji
                </button>
                <button 
                  type="button" 
                  onClick={() => setTipoIcono('imagen')} 
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: tipoIcono === 'imagen' ? 'white' : 'transparent', boxShadow: tipoIcono === 'imagen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: tipoIcono === 'imagen' ? '#0f172a' : '#64748b', fontWeight: '600' }}
                >
                  <ImageIcon size={16}/> Imagen
                </button>
              </div>

              {/* INPUT DINÁMICO */}
              {tipoIcono === 'emoji' ? (
                <input 
                  type="text" 
                  value={emoji} 
                  onChange={e => setEmoji(e.target.value)} 
                  maxLength="2" 
                  title="Pegá un emoji acá" 
                  style={{ width: '50px', textAlign: 'center', fontSize: '1.4rem', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }} 
                />
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#1d4ed8', fontWeight: '600' }}>
                  <UploadCloud size={18}/> {imagenFile ? 'Imagen cargada ✓' : 'Subir foto'}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <button type="submit" disabled={cargando} style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}>
              <Plus size={18} /> {cargando ? 'Guardando...' : 'Agregar al Kiosco'}
            </button>
            
          </div>
        </form>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {productos.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* RENDERIZADO DINÁMICO: Imagen o Emoji */}
              {p.icono && p.icono.startsWith('http') ? (
                <img 
                  src={p.icono} 
                  alt={p.nombre} 
                  style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                />
              ) : (
                <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid #e2e8f0' }}>
                  {p.icono || '🏷️'}
                </div>
              )}
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem', textTransform: 'uppercase' }}>{p.nombre}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '1.15rem' }}>${p.precio}</span>
              <button 
                onClick={() => eliminarProducto(p.id)} 
                style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                title="Eliminar producto"
              >
                <Trash2 size={18} />
              </button>
            </div>

          </div>
        ))}
        
        {productos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <ImageIcon size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Aún no agregaste productos ni extras.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestorKiosco;