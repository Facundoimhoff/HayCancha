import { useState } from 'react';
import { supabase } from '../../../services/supabase';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../../services/storage';
import { Building, CheckCircle, ImagePlus, Map, MapPin, Phone, Trash2, X, Share2 } from 'lucide-react';

// Pantalla "Mi Club": perfil público del complejo (logo, contacto, servicios, redes y galería).
const MiClub = ({ miClub, setMiClub }) => {
  const [formPerfil, setFormPerfil] = useState({ 
    nombre: miClub?.nombre || '', 
    provincia: miClub?.provincia || '', 
    ciudad: miClub?.ciudad || '',
    color_primario: miClub?.color_primario || '#0f172a',
    imagen_url: miClub?.imagen_url || '',
    telefono_contacto: miClub?.telefono_contacto || '',
    correo_contacto: miClub?.correo_contacto || '',
    servicios: miClub?.servicios || '',
    descripcion: miClub?.descripcion || '',
    fotos_club: miClub?.fotos_club || '',
    redes_sociales: miClub?.redes_sociales || { instagram: '', tiktok: '', facebook: '' }
  });

  const [nuevoLogo, setNuevoLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(miClub?.imagen_url || null);
  
  // Nuevo estado para las fotos múltiples del club
  const [fotosClubFiles, setFotosClubFiles] = useState([]);
  const [, setFotoAdminIdx] = useState(0);
  
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  const provincias = ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Ciudad Autónoma de Buenos Aires"];

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNuevoLogo(e.target.files[0]);
      setPreviewLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const eliminarLogo = () => {
    if(window.confirm("¿Seguro que querés quitar el logo del club?")) {
      setNuevoLogo(null);
      setPreviewLogo(null);
      setFormPerfil(prev => ({ ...prev, imagen_url: '' }));
    }
  };

  const eliminarTodasFotosClub = () => {
    if(window.confirm("¿Seguro que querés eliminar todas las fotos de la galería del predio?")) {
      setFormPerfil(prev => ({ ...prev, fotos_club: '' }));
      setFotosClubFiles([]);
      setFotoAdminIdx(0);
    }
  };

  // NUEVA FUNCION: Eliminar foto individual
  const eliminarFotoIndividual = (indexParaBorrar) => {
    if(window.confirm("¿Seguro que querés eliminar esta foto del predio?")) {
      const fotosActuales = formPerfil.fotos_club.split(',').filter(u => u.trim() !== '');
      const nuevasFotos = fotosActuales.filter((_, index) => index !== indexParaBorrar);
      const nuevoStringFotos = nuevasFotos.join(',');
      setFormPerfil(prev => ({ ...prev, fotos_club: nuevoStringFotos }));
    }
  };

  const manejarRedSocial = (red, valor) => {
    setFormPerfil(prev => ({ ...prev, redes_sociales: { ...prev.redes_sociales, [red]: valor } }));
  };

  const fotosSubidas = formPerfil.fotos_club ? formPerfil.fotos_club.split(',').filter(u => u.trim() !== '') : [];

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });
    
    try {
      let finalLogoUrl = formPerfil.imagen_url;

      // Subida de logo
      if (nuevoLogo) {
        finalLogoUrl = await subirImagen(nuevoLogo, 'logos');
      }

      // Subida de fotos del predio
      let finalFotosClub = formPerfil.fotos_club || '';
      if (fotosClubFiles && fotosClubFiles.length > 0) {
        const urlsFotos = [];
        for (const file of fotosClubFiles) {
          try {
            urlsFotos.push(await subirImagen(file, 'clubes_fotos'));
          } catch (errorFoto) {
            console.error('No se pudo subir una foto del club:', errorFoto);
          }
        }
        const nuevasUrls = urlsFotos.join(',');
        finalFotosClub = finalFotosClub ? `${finalFotosClub},${nuevasUrls}` : nuevasUrls;
      }

      const { error } = await supabase.from('clubes').update({ 
        nombre: formPerfil.nombre, 
        provincia: formPerfil.provincia, 
        ciudad: formPerfil.ciudad,
        color_primario: formPerfil.color_primario,
        imagen_url: finalLogoUrl,
        telefono_contacto: formPerfil.telefono_contacto,
        correo_contacto: formPerfil.correo_contacto,
        servicios: formPerfil.servicios,
        descripcion: formPerfil.descripcion,
        fotos_club: finalFotosClub,
        redes_sociales: formPerfil.redes_sociales
      }).eq('id', miClub.id);
      
      if (error) throw error;
      
      setMiClub({ ...miClub, ...formPerfil, imagen_url: finalLogoUrl, fotos_club: finalFotosClub });
      setFormPerfil(prev => ({ ...prev, imagen_url: finalLogoUrl, fotos_club: finalFotosClub }));
      setFotosClubFiles([]);
      
      setMensaje({ texto: '¡Datos y fotos actualizados correctamente!', tipo: 'exito' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    } catch {
      setMensaje({ texto: 'Error al guardar los cambios.', tipo: 'error' }); 
    } finally { 
      setGuardando(false); 
    }
  };

  return (
    <div className="perfil-wrapper" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      <div className="perfil-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Building size={28} color="#2563eb" />
        <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>Configuración Pública de tu Club</h2>
      </div>

      {mensaje.texto && (
        <div className={`perfil-alerta ${mensaje.tipo}`} style={{ marginBottom: '20px' }}>
          {mensaje.tipo === 'exito' && <CheckCircle size={18} />}
          <strong>{mensaje.texto}</strong>
        </div>
      )}
      
      <form onSubmit={guardarPerfil}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
          
          {/* ========================================= */}
          {/* COLUMNA IZQUIERDA: PERFIL DEL CLUB        */}
          {/* ========================================= */}
          <div style={{ flex: '1 1 45%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-label">Logo del Club</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '130px', height: '130px', borderRadius: '12px', backgroundColor: '#f8fafc', 
                  border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', 
                  alignItems: 'center', padding: '8px', position: 'relative' 
                }}>
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Building size={40} color="#94a3b8" />
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ cursor: 'pointer', backgroundColor: '#f1f5f9', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', fontWeight: '600', textAlign: 'center', transition: 'background 0.2s' }}>
                    <ImagePlus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Subir Logo
                    <input type="file" accept={TIPOS_IMAGEN_ACEPTADOS} onChange={handleLogoChange} style={{ display: 'none' }} />
                  </label>
                  
                  {previewLogo && (
                    <button type="button" onClick={eliminarLogo} style={{ cursor: 'pointer', backgroundColor: '#fef2f2', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}>
                      <Trash2 size={16} /> Quitar Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Nombre del Club</label>
              <div className="input-icon-wrapper">
                <Building size={18} className="input-icon" />
                <input type="text" required value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})} className="form-input-icon" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label">Provincia</label>
                <div className="input-icon-wrapper">
                  <Map size={18} className="input-icon" />
                  <select required value={formPerfil.provincia} onChange={(e) => setFormPerfil({...formPerfil, provincia: e.target.value})} className="form-input-icon">
                    <option value="">Seleccioná tu provincia</option>
                    {provincias.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Ciudad</label>
                <div className="input-icon-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input type="text" required placeholder="Ej: San Francisco" value={formPerfil.ciudad} onChange={(e) => setFormPerfil({...formPerfil, ciudad: e.target.value})} className="form-input-icon" />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Descripción del Club (Acerca de nosotros)</label>
              <textarea 
                placeholder="Contale a los jugadores cómo son tus instalaciones, tu historia, iluminación..." 
                value={formPerfil.descripcion} 
                onChange={(e) => setFormPerfil({...formPerfil, descripcion: e.target.value})} 
                className="form-input-icon" 
                style={{ padding: '12px', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} 
              />
            </div>

            <div>
              <label className="form-label">Fotos de las instalaciones (Predio)</label>
              <input 
                type="file" multiple accept={TIPOS_IMAGEN_ACEPTADOS} 
                onChange={(e) => { if (e.target.files) setFotosClubFiles(Array.from(e.target.files)); }} 
                className="form-input-icon" style={{ padding: '8px' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Mostrale a tus clientes lo grande que es el club. Podés elegir varias fotos juntas.</p>
              
              {/* GRILLA DE FOTOS DEL PREDIO CON BOTON BORRAR INDIVIDUAL */}
              {fotosSubidas.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label">Galería actual ({fotosSubidas.length} fotos)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {fotosSubidas.map((foto, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={foto} alt={`Predio ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => eliminarFotoIndividual(idx)} 
                          title="Eliminar esta foto"
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={eliminarTodasFotosClub} style={{ marginTop: '20px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 'bold', width: '100%' }}>
                    <Trash2 size={16} /> Eliminar toda la galería
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Color de tu marca (Banner principal)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={formPerfil.color_primario} 
                  onChange={(e) => setFormPerfil({...formPerfil, color_primario: e.target.value})} 
                  style={{ width: '50px', height: '50px', padding: '0', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                />
                <span style={{ color: '#64748b', fontWeight: 'bold' }}>{formPerfil.color_primario}</span>
              </div>
            </div>
          </div>


          {/* ========================================= */}
          {/* COLUMNA DERECHA: CONTACTO Y REDES         */}
          {/* ========================================= */}
          <div style={{ flex: '1 1 45%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={18} color="#16a34a"/> Contacto y Servicios del Predio
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Teléfono (WhatsApp)</label>
                  <input type="text" placeholder="Ej: 3564609641" value={formPerfil.telefono_contacto} onChange={(e) => setFormPerfil({...formPerfil, telefono_contacto: e.target.value})} className="form-input-icon" style={{ paddingLeft: '12px' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Correo Electrónico</label>
                  <input type="email" placeholder="Ej: contacto@miclub.com" value={formPerfil.correo_contacto} onChange={(e) => setFormPerfil({...formPerfil, correo_contacto: e.target.value})} className="form-input-icon" style={{ paddingLeft: '12px' }} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Servicios (Separados por coma)</label>
                <input type="text" placeholder="Ej: Parrillas, Vestuarios, Cantina" value={formPerfil.servicios} onChange={(e) => setFormPerfil({...formPerfil, servicios: e.target.value})} className="form-input-icon" style={{ paddingLeft: '12px' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#ec4899"/> Redes Sociales
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Completá con tu @usuario o link directo.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Insta" style={{ width: '24px', height: '24px' }} />
                  <input type="text" placeholder="Instagram (@miclub)" value={formPerfil.redes_sociales?.instagram || ''} onChange={(e) => manejarRedSocial('instagram', e.target.value)} className="form-input-icon" style={{ paddingLeft: '12px', flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style={{ width: '24px', height: '24px' }} />
                  <input type="text" placeholder="TikTok (@miclub)" value={formPerfil.redes_sociales?.tiktok || ''} onChange={(e) => manejarRedSocial('tiktok', e.target.value)} className="form-input-icon" style={{ paddingLeft: '12px', flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Face" style={{ width: '24px', height: '24px' }} />
                  <input type="text" placeholder="Facebook (Link o Nombre)" value={formPerfil.redes_sociales?.facebook || ''} onChange={(e) => manejarRedSocial('facebook', e.target.value)} className="form-input-icon" style={{ paddingLeft: '12px', flex: 1 }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================= */}
        {/* BOTÓN GUARDAR                             */}
        {/* ========================================= */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={guardando} className="btn-guardar" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MiClub;
