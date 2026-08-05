import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  LogOut, LayoutDashboard, BarChart3, Settings, 
  DollarSign, Calendar as CalendarIcon, Users, Clock, Plus, Edit, ImageIcon, Ban,
  Building, MapPin, Map, CheckCircle, Download, FileText, Info, ImagePlus, Menu, X, Store, MoreVertical, Trash2, Phone, Share2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import '../../index.css';
import './DashboardAdmin.css';
import GestorKiosco from './GestorKiosco';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORES_GRAFICO = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const OPCIONES_DEPORTE = {
  'Fútbol': {
    jugadores: [
      { label: 'Fútbol 5 (10 jugadores)', value: 10 },
      { label: 'Fútbol 7 (14 jugadores)', value: 14 },
      { label: 'Fútbol 8 (16 jugadores)', value: 16 },
      { label: 'Fútbol 9 (18 jugadores)', value: 18 },
      { label: 'Fútbol 11 (22 jugadores)', value: 22 }
    ],
    superficies: ['Césped Sintético', 'Césped Natural', 'Cemento / Baldosa', 'Parquet (Futsal)', 'Tierra / Arena']
  },
  'Pádel': {
    jugadores: [
      { label: 'Dobles (4 jugadores)', value: 4 },
      { label: 'Singles (2 jugadores)', value: 2 }
    ],
    superficies: ['Césped Sintético', 'Cemento', 'Piso Modular / Plástico']
  },
  'Tenis': {
    jugadores: [
      { label: 'Singles (2 jugadores)', value: 2 },
      { label: 'Dobles (4 jugadores)', value: 4 }
    ],
    superficies: ['Polvo de Ladrillo', 'Cemento (Cancha Rápida)', 'Césped Natural', 'Césped Sintético']
  },
  'Básquet': {
    jugadores: [
      { label: '5 vs 5 (10 jugadores)', value: 10 },
      { label: '3 vs 3 (6 jugadores)', value: 6 }
    ],
    superficies: ['Parquet (Madera flotante)', 'Cemento', 'Goma Deportiva / Sintético']
  }
};

const normalizarDeporte = (dep) => {
  if (!dep) return 'Fútbol';
  const d = dep.toUpperCase();
  if (d.includes('BASKET') || d.includes('BASQUET') || d.includes('BÁSQUET')) return 'Básquet';
  if (d.includes('PADEL') || d.includes('PÁDEL')) return 'Pádel';
  if (d.includes('TENIS')) return 'Tenis';
  return 'Fútbol';
};

// ==========================================
// COMPONENTE DE LA VISTA PERFIL
// ==========================================
const PantallaPerfil = ({ miClub, setMiClub }) => {
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
    setNuevoLogo(null);
    setPreviewLogo(null);
    setFormPerfil(prev => ({ ...prev, imagen_url: '' }));
  };

  const manejarRedSocial = (red, valor) => {
    setFormPerfil(prev => ({ ...prev, redes_sociales: { ...prev.redes_sociales, [red]: valor } }));
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });
    
    try {
      let finalLogoUrl = formPerfil.imagen_url;

      // Subida de logo
      if (nuevoLogo) {
        const fileExt = nuevoLogo.name.split('.').pop();
        const fileName = `logos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, nuevoLogo);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
        finalLogoUrl = urlData.publicUrl;
      }

      // Subida de fotos del predio
      let finalFotosClub = formPerfil.fotos_club || '';
      if (fotosClubFiles && fotosClubFiles.length > 0) {
        const urlsFotos = [];
        for (let i = 0; i < fotosClubFiles.length; i++) {
          const file = fotosClubFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `clubes_fotos/${Date.now()}_${i}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
            urlsFotos.push(urlData.publicUrl);
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
      
      setMensaje({ texto: '¡Datos y redes actualizados correctamente!', tipo: 'exito' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    } catch (err) { 
      setMensaje({ texto: 'Error al guardar los cambios.', tipo: 'error' }); 
    } finally { 
      setGuardando(false); 
    }
  };

  return (
    <div className="perfil-wrapper" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      <div className="perfil-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Building size={28} color="#2563eb" />
        <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>Perfil de tu Club</h2>
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
          {/* COLUMNA IZQUIERDA: DATOS BÁSICOS          */}
          {/* ========================================= */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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
                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
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
                type="file" multiple accept="image/*" 
                onChange={(e) => { if (e.target.files) setFotosClubFiles(Array.from(e.target.files)); }} 
                className="form-input-icon" style={{ padding: '8px' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Mostrale a tus clientes lo grande que es el club. Podés elegir varias fotos juntas.</p>
              
              {formPerfil.fotos_club && (!fotosClubFiles || fotosClubFiles.length === 0) && (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#16a34a' }}>✓ Imágenes del predio cargadas previamente</p>
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
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
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


// ==========================================
// COMPONENTE PRINCIPAL (DASHBOARD)
// ==========================================
const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('general');
  const [errorAcceso, setErrorAcceso] = useState(false);

  const [miClub, setMiClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [turnosTotales, setTurnosTotales] = useState([]);
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [turnosPasados, setTurnosPasados] = useState([]);
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const cambiarVista = (vista) => {
    setVistaActual(vista);
    setMenuMobileAbierto(false);
  };

  const [imagenCanchaFiles, setImagenCanchaFiles] = useState([]);
  const [imagenCanchaEditFiles, setImagenCanchaEditFiles] = useState([]);

  const [metricas, setMetricas] = useState({ ingresosDia: 0, ingresosSemana: 0, ingresosMes: 0, turnosMes: 0 });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [formTurno, setFormTurno] = useState({ cancha_id: '', fecha: '', hora_inicio: '', nombre_cliente: '', telefono_cliente: '' });
  
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [formBloqueo, setFormBloqueo] = useState({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });

  const [mostrarModalCancha, setMostrarModalCancha] = useState(false);
  const [formCancha, setFormCancha] = useState({ 
    nombre: '', 
    deporte: 'Fútbol', 
    cantidad_jugadores: OPCIONES_DEPORTE['Fútbol'].jugadores[0].value, 
    superficie: OPCIONES_DEPORTE['Fútbol'].superficies[0],
    techada: false, 
    precio_hora: '', 
    hora_apertura: '08:00', 
    hora_cierre: '23:00', 
    imagen_url: '' 
  });

  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState({ 
    id: '', nombre: '', deporte: 'Fútbol', cantidad_jugadores: '10', techada: false, superficie: 'Césped Sintético',
    precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' });

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const mesActualNombre = `${meses[now.getMonth()].toUpperCase()} ${now.getFullYear()}`;

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: clubData } = await supabase.from('clubes').select('*').eq('admin_email', user.email).single();
      if (!clubData) { setErrorAcceso(true); setCargando(false); return; }
      setMiClub(clubData);

      const { data: canchasData } = await supabase.from('canchas').select('*').eq('club_id', clubData.id).order('id', { ascending: true });
      setCanchas(canchasData || []);
      
      if (!canchasData || canchasData.length === 0) { setCargando(false); return; }

      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const { data: turnosData } = await supabase.from('turnos').select('*').in('cancha_id', canchasData.map(c => c.id)).order('fecha', { ascending: true }).order('hora_inicio', { ascending: true });
      setTurnosTotales(turnosData || []);

      let iMes = 0, iSem = 0, iDia = 0, tMes = 0;
      const mapaClientes = {};
      const prox = [];
      const pasados = []; 

      turnosData?.forEach(t => {
        const c = canchasData.find(x => x.id === t.cancha_id);
        const precio = c ? Number(c.precio_hora) : 0;
        const esBloqueo = t.telefono_cliente === 'BLOQUEO'; 

        if (!esBloqueo) {
          if (t.fecha.startsWith(mesActualStr)) { iMes += precio; tMes += 1; }
          if (t.fecha >= semanaStr) iSem += precio;
          if (t.fecha === hoyStr) iDia += precio;

          if (!mapaClientes[t.telefono_cliente]) {
            mapaClientes[t.telefono_cliente] = { nombre: t.nombre_cliente, telefono: t.telefono_cliente, cant: 0 };
          }
          mapaClientes[t.telefono_cliente].cant += 1;
        }

        if (t.fecha >= hoyStr) {
          prox.push({ ...t, nombre_cancha: c?.nombre || '?', esBloqueo, precio });
        } else if (t.fecha.startsWith(mesActualStr)) {
          pasados.push({ ...t, nombre_cancha: c?.nombre || '?', esBloqueo, precio });
        }
      });

      setMetricas({ ingresosDia: iDia, ingresosSemana: iSem, ingresosMes: iMes, turnosMes: tMes });
      setClientes(Object.values(mapaClientes).sort((a, b) => b.cant - a.cant));
      setProximosTurnos(prox);
      setTurnosPasados(pasados.reverse()); 

    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const subirMultiplesImagenes = async (archivos) => {
    const urls = [];
    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `canchas/${Date.now()}_${i}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('imagenes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(fileName);
      urls.push(urlData.publicUrl);
    }
    return urls.join(','); 
  };

  const cancelarTurno = async (id, esBloqueo) => { 
    const mensaje = esBloqueo ? "¿Liberar este horario bloqueado?" : "¿Estás seguro de cancelar este turno?";
    if(window.confirm(mensaje)) { 
      await supabase.from('turnos').delete().eq('id', id); 
      cargarDatos(); 
      setMostrarModalDetalles(false); 
    } 
  };
  
  const crearTurnoManual = async (e) => { 
    e.preventDefault(); 
    await supabase.from('turnos').insert([formTurno]); 
    setMostrarModal(false); 
    cargarDatos(); 
  };

  const crearBloqueo = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('turnos').insert([{
        cancha_id: formBloqueo.cancha_id,
        fecha: formBloqueo.fecha,
        hora_inicio: formBloqueo.hora_inicio,
        nombre_cliente: formBloqueo.motivo ? `Bloqueo por: ${formBloqueo.motivo}` : 'Bloqueo por: Mantenimiento',
        telefono_cliente: 'BLOQUEO' 
      }]);
      if (error) throw error;
      setMostrarModalBloqueo(false);
      setFormBloqueo({ cancha_id: '', fecha: '', hora_inicio: '', motivo: '' });
      await cargarDatos();
    } catch (err) { alert("Error al bloquear horario: " + err.message); }
  };
  
  const cerrarSesion = async () => { await supabase.auth.signOut(); navigate('/'); };

  const handleDeporteNuevaCancha = (e) => {
    const deporteSelec = e.target.value;
    setFormCancha({
      ...formCancha,
      deporte: deporteSelec,
      cantidad_jugadores: OPCIONES_DEPORTE[deporteSelec].jugadores[0].value,
      superficie: OPCIONES_DEPORTE[deporteSelec].superficies[0]
    });
  };

  const handleDeporteEdicionCancha = (e) => {
    const deporteSelec = e.target.value;
    setCanchaEditando({
      ...canchaEditando,
      deporte: deporteSelec,
      cantidad_jugadores: OPCIONES_DEPORTE[deporteSelec].jugadores[0].value,
      superficie: OPCIONES_DEPORTE[deporteSelec].superficies[0]
    });
  };

  const crearCanchaManual = async (e) => { 
    e.preventDefault();
    try {
      let finalUrls = formCancha.imagen_url || '';
      if (imagenCanchaFiles && imagenCanchaFiles.length > 0) {
        finalUrls = await subirMultiplesImagenes(imagenCanchaFiles);
      }

      const { error } = await supabase.from('canchas').insert([{ 
        club_id: miClub.id, 
        nombre: formCancha.nombre, 
        deporte: formCancha.deporte,
        cantidad_jugadores: Number(formCancha.cantidad_jugadores),
        superficie: formCancha.superficie,
        techada: Boolean(formCancha.techada),
        precio_hora: Number(formCancha.precio_hora) || 0, 
        hora_apertura: formCancha.hora_apertura || '08:00',
        hora_cierre: formCancha.hora_cierre || '23:00', 
        imagen_url: finalUrls
      }]);
      
      if (error) throw error;

      setMostrarModalCancha(false);
      setFormCancha({ 
        nombre: '', deporte: 'Fútbol', 
        cantidad_jugadores: OPCIONES_DEPORTE['Fútbol'].jugadores[0].value, 
        superficie: OPCIONES_DEPORTE['Fútbol'].superficies[0],
        techada: false, precio_hora: '', hora_apertura: '08:00', hora_cierre: '23:00', imagen_url: '' 
      });
      setImagenCanchaFiles([]); 
      await cargarDatos(); 
    } catch (err) { 
      alert("Error al guardar la cancha: " + err.message); 
    }
  };

  const abrirModalEditar = (cancha) => {
    const depSeguro = normalizarDeporte(cancha.deporte);
    const dict = OPCIONES_DEPORTE[depSeguro];

    const supValida = dict.superficies.includes(cancha.superficie) 
      ? cancha.superficie 
      : dict.superficies[0];

    const jugValido = dict.jugadores.some(j => Number(j.value) === Number(cancha.cantidad_jugadores))
      ? Number(cancha.cantidad_jugadores)
      : dict.jugadores[0].value;

    setCanchaEditando({
      id: cancha.id, 
      nombre: cancha.nombre, 
      deporte: depSeguro, 
      precio_hora: cancha.precio_hora,
      hora_apertura: cancha.hora_apertura || '08:00', 
      hora_cierre: cancha.hora_cierre || '23:00', 
      imagen_url: cancha.imagen_url || '', 
      cantidad_jugadores: jugValido, 
      superficie: supValida,
      techada: cancha.techada || false
    });
    setImagenCanchaEditFiles([]); 
    setMostrarModalEditar(true);
  };

  const guardarEdicionCancha = async (e) => {
    e.preventDefault();
    try {
      let finalUrls = canchaEditando.imagen_url || '';
      if (imagenCanchaEditFiles && imagenCanchaEditFiles.length > 0) {
        const nuevasUrls = await subirMultiplesImagenes(imagenCanchaEditFiles);
        finalUrls = finalUrls ? `${finalUrls},${nuevasUrls}` : nuevasUrls;
      }

      const { error } = await supabase.from('canchas').update({
        nombre: canchaEditando.nombre, 
        deporte: canchaEditando.deporte, 
        cantidad_jugadores: Number(canchaEditando.cantidad_jugadores),
        superficie: canchaEditando.superficie,
        techada: canchaEditando.techada,
        precio_hora: Number(canchaEditando.precio_hora),
        hora_apertura: canchaEditando.hora_apertura, 
        hora_cierre: canchaEditando.hora_cierre, 
        imagen_url: finalUrls
      }).eq('id', canchaEditando.id);
      
      if (error) throw error;
      
      setMostrarModalEditar(false);
      setImagenCanchaEditFiles([]);
      await cargarDatos();
    } catch (err) { alert("Error al editar: " + err.message); }
  };

  const eliminarCancha = async (idCancha) => {
    if (window.confirm("⚠️ ¿ESTÁS SEGURO? Se eliminará esta cancha por completo y todos los turnos que haya reservados en ella. Esta acción no se puede deshacer.")) {
      try {
        await supabase.from('turnos').delete().eq('cancha_id', idCancha);
        const { error } = await supabase.from('canchas').delete().eq('id', idCancha);
        if (error) throw error;
        
        alert("Cancha eliminada con éxito.");
        await cargarDatos();
      } catch (err) {
        alert("Error al eliminar la cancha: " + err.message);
      }
    }
  };

  const exportarExcel = () => {
    const dataAExportar = turnosTotales
      .filter(t => t.telefono_cliente !== 'BLOQUEO')
      .map(t => {
        const canchaInfo = canchas.find(c => c.id === t.cancha_id);
        return {
          Fecha: t.fecha.split('-').reverse().join('/'),
          Hora: t.hora_inicio,
          Cliente: t.nombre_cliente,
          Teléfono: t.telefono_cliente,
          Cancha: canchaInfo?.nombre || 'Desconocida',
          'Ingreso ($)': canchaInfo?.precio_hora || 0,
        };
      });

    const ws = XLSX.utils.json_to_sheet(dataAExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Métricas GridPlay");
    XLSX.writeFile(wb, `Reporte_${miClub?.nombre.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportarPDF = () => {
    if (!turnosTotales || !canchas) {
      alert("Cargando datos, por favor aguardá un segundo...");
      return;
    }
    const doc = new jsPDF();
    const nombreClub = miClub?.nombre || 'Mi_Complejo'; 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Reporte de Ingresos - ${nombreClub}`, 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const fechaTexto = new Date().toLocaleDateString();
    doc.text(`Generado el: ${fechaTexto}`, 14, 28);
    const tableData = turnosTotales
      .filter(t => t.telefono_cliente !== 'BLOQUEO')
      .map(t => {
        const canchaInfo = canchas.find(c => c.id === t.cancha_id);
        return [
          t.fecha.split('-').reverse().join('/'),
          t.hora_inicio,
          t.nombre_cliente || 'Sin nombre',
          canchaInfo?.nombre || 'Desconocida',
          `$${canchaInfo?.precio_hora || 0}`
        ];
      });
    autoTable(doc, {
      head: [['Fecha', 'Hora', 'Cliente', 'Cancha', 'Ingreso']],
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
    });
    const fechaArchivo = fechaTexto.replace(/\//g, '-');
    const nombreLimpio = nombreClub.replace(/\s+/g, '_'); 
    doc.save(`Reporte_${nombreLimpio}_${fechaArchivo}.pdf`);
  };

  const PantallaGeneral = () => (
    <div>
      <div className="general-header">
        <div>
          <h2>Vista General</h2>
          <p className="subtitle-header">Resumen de actividad de {mesActualNombre}</p>
        </div>
        <div className="acciones-header">
          <button onClick={() => setMostrarModalBloqueo(true)} className="btn-accion bloqueo">
            <Ban size={18} /> Bloquear Horario
          </button>
          <button onClick={() => setMostrarModal(true)} className="btn-accion nuevo">
            <Plus size={18} /> Nuevo Turno
          </button>
        </div>
      </div>
      
      <div className="metricas-grid">
        <div className="metrica-card">
          <div className="icono-box verde"><DollarSign size={24} color="#16a34a" /></div>
          <div className="metrica-info">
            <p>Ingresos del Mes</p>
            <h3>${metricas.ingresosMes.toLocaleString('es-AR')}</h3>
          </div>
        </div>
        <div className="metrica-card">
          <div className="icono-box azul"><CalendarIcon size={24} color="#2563eb" /></div>
          <div className="metrica-info">
            <p>Turnos del Mes</p>
            <h3>{metricas.turnosMes}</h3>
          </div>
        </div>
      </div>

      <div className="seccion-turnos">
        <h3 className="titulo-seccion azul">
          <Clock size={20} /> Turnos Próximos
        </h3>
        <div className="turnos-lista">
          {proximosTurnos.length === 0 ? <p className="texto-ayuda">No hay turnos agendados.</p> : proximosTurnos.slice(0,10).map(t => {
            const totalExtras = t.extras ? t.extras.reduce((acc, item) => acc + item.subtotal, 0) : 0;
            const totalTurno = t.precio + totalExtras;
            return (
            <div key={t.id} className={`turno-item ${t.esBloqueo ? 'bloqueo' : 'normal'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div>
                <p className="turno-nombre">
                  {t.esBloqueo ? <><Ban size={14} style={{display:'inline', marginRight:'4px'}}/> {t.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:')}</> : t.nombre_cliente}
                </p>
                <p className="turno-detalle">
                  {t.fecha.split('-').reverse().join('/')} • {t.hora_inicio} • {t.nombre_cancha}
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!t.esBloqueo && (
                  <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '1.1rem' }}>${totalTurno}</span>
                )}
                <button onClick={() => setMenuAbiertoId(menuAbiertoId === t.id ? null : t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#64748b' }}>
                  <MoreVertical size={20} />
                </button>
                {menuAbiertoId === t.id && (
                  <div style={{ position: 'absolute', right: '0', top: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '160px', overflow: 'hidden' }}>
                    {!t.esBloqueo && (
                      <a href={`https://wa.me/${t.telefono_cliente}?text=Hola!%20Te%20recordamos%20tu%20turno%20en%20${miClub?.nombre}%20el%20día%20${t.fecha.split('-').reverse().join('/')}%20a%20las%20${t.hora_inicio}hs.`} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 15px', textDecoration: 'none', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', fontWeight: '500' }}>
                        <CheckCircle size={16} color="#16a34a" /> Enviar WhatsApp
                      </a>
                    )}
                    <button onClick={() => { setTurnoSeleccionado(t); setMostrarModalDetalles(true); setMenuAbiertoId(null); }} style={{ padding: '12px 15px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: '500' }}>
                      <Users size={16} color="#2563eb" /> Ver detalles
                    </button>
                    <button onClick={() => { cancelarTurno(t.id, t.esBloqueo); setMenuAbiertoId(null); }} style={{ padding: '12px 15px', background: '#fef2f2', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: '500' }}>
                      <Ban size={16} /> {t.esBloqueo ? 'Liberar horario' : 'Cancelar turno'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );

  const PantallaMetricas = () => { 
    const [mostrarInfo, setMostrarInfo] = useState(false);
    const datosFiltrados = useMemo(() => {
      const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const mesActualStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const day = now.getDay() || 7; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      const semanaStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

      const ganCancha = {};
      canchas.forEach(c => ganCancha[c.id] = { nombre: c.nombre, ganancias: 0, cantidad: 0 });

      turnosTotales.forEach(t => {
        if (t.telefono_cliente === 'BLOQUEO') return; 
        
        let cumpleFiltro = false;
        if (filtroTiempo === 'dia' && t.fecha === hoyStr) cumpleFiltro = true;
        else if (filtroTiempo === 'semana' && t.fecha >= semanaStr) cumpleFiltro = true;
        else if (filtroTiempo === 'mes' && t.fecha.startsWith(mesActualStr)) cumpleFiltro = true;

        if (cumpleFiltro && ganCancha[t.cancha_id]) {
          const c = canchas.find(x => x.id === t.cancha_id);
          ganCancha[t.cancha_id].ganancias += c ? Number(c.precio_hora) : 0;
          ganCancha[t.cancha_id].cantidad += 1;
        }
      });

      return Object.values(ganCancha);
    }, [filtroTiempo, turnosTotales, canchas]);

    const totalCalculado = datosFiltrados.reduce((acc, curr) => acc + curr.ganancias, 0);

    return (
      <div>
        <div className="general-header">
          <div>
            <h2>Reportes Financieros</h2>
            <p className="subtitle-header">Análisis de ingresos y rendimiento</p>
          </div>
          <div className="acciones-header">
            <button onClick={exportarPDF} className="btn-accion export-pdf">
              <FileText size={18} /> Exportar PDF
            </button>
            <button onClick={exportarExcel} className="btn-accion export-excel">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="metricas-filtros-bar">
          <span className="filtro-label">Filtrar por:</span>
          <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} className="select-filtro-enterprise">
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>

        <div className="metricas-charts-grid">
          <div className="grafico-container">
            <div className="grafico-header">
              <h3 className="grafico-titulo">Ingresos por Cancha</h3>
              <span className="grafico-total-badge">${totalCalculado.toLocaleString('es-AR')}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosFiltrados} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
                <Bar dataKey="ganancias" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container relative">
            <div className="grafico-header">
              <h3 className="grafico-titulo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Distribución de Turnos
                <button onClick={() => setMostrarInfo(!mostrarInfo)} className={`btn-info-grafico ${mostrarInfo ? 'activo' : ''}`}>
                  <Info size={18} />
                </button>
              </h3>
            </div>
            {mostrarInfo && (
              <div className="info-grafico-box">
                Este gráfico te muestra rápidamente cuál es tu <strong>cancha "estrella"</strong>.
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={datosFiltrados} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="cantidad" nameKey="nombre" >
                  {datosFiltrados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} turnos`, name]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const PantallaClientes = () => ( 
    <div className="clientes-wrapper">
      <div className="general-header">
        <div>
          <h2>Base de Clientes</h2>
          <p className="subtitle-header">Directorio de jugadores registrados</p>
        </div>
      </div>
      <div className="tabla-container-enterprise">
        <table className="tabla-clientes-enterprise">
          <thead>
            <tr>
              <th>Nombre del Jugador</th>
              <th>Teléfono de Contacto</th>
              <th>Actividad</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={i}>
                <td className="fw-bold text-slate-800">{c.nombre}</td>
                <td>
                  <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noopener noreferrer" className="link-whatsapp-tabla">
                    {c.telefono}
                  </a>
                </td>
                <td><span className="badge-turnos-enterprise">{c.cant} turnos</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PantallaAjustes = () => ( 
    <div>
      <header className="content-header">
        <div>
          <h2>Gestión de Canchas y Extras</h2>
          <p className="subtitle-header">Administrá instalaciones, precios y kiosco</p>
        </div>
        <button className="btn-agregar" onClick={() => setMostrarModalCancha(true)}>
          <Plus size={18} /> Agregar Cancha
        </button>
      </header>
      
      <div className="canchas-list">
        {canchas.map(c => {
          const primeraImagen = c.imagen_url ? c.imagen_url.split(',')[0] : null;
          const depNormalizado = normalizarDeporte(c.deporte);
          const dict = OPCIONES_DEPORTE[depNormalizado];
          const jugDisplay = c.cantidad_jugadores || dict.jugadores[0].value;
          const supDisplay = c.superficie || dict.superficies[0];

          return (
            <div key={c.id} className="cancha-card-enterprise" style={{ position: 'relative' }}>
              <div className={`cancha-imagen-placeholder ${primeraImagen ? 'con-imagen' : ''}`}>
                {primeraImagen ? <img src={primeraImagen} alt={c.nombre} /> : <ImageIcon color="#9ca3af" size={32} />}
              </div>
              <div className="cancha-info">
                <h3>{c.nombre} <span className="cancha-deporte">{depNormalizado}</span></h3>
                <p className="cancha-precio-badge">${c.precio_hora} / hora</p>
                <p className="cancha-horario">⏰ {c.hora_apertura || '08:00'} a {c.hora_cierre || '23:00'}</p>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                  <span>👥 {jugDisplay} jug.</span>
                  <span>• {supDisplay}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', position: 'absolute', top: '16px', right: '16px' }}>
                <button 
                  onClick={() => abrirModalEditar(c)} 
                  title="Editar información" 
                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => eliminarCancha(c.id)} 
                  title="Eliminar cancha" 
                  style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const PantallaKiosco = () => (
    <div>
      <header className="content-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Kiosco y Extras</h2>
          <p className="subtitle-header">Administrá bebidas, paletas y otros productos</p>
        </div>
      </header>
      <GestorKiosco clubId={miClub?.id} />
    </div>
  );

  if (cargando) return <div className="dashboard-mensaje">Cargando panel...</div>;
  if (errorAcceso) return <div className="dashboard-error">Acceso Denegado. Solo administradores.</div>;

  return (
    <div className="dashboard-container">
      
      <div className="mobile-topbar-enterprise">
        <button className="btn-hamburguesa" onClick={() => setMenuMobileAbierto(true)}>
          <Menu size={28} />
        </button>
        <div className="logo-empresa" style={{ fontSize: '1.4rem' }}>
          GridPlay<span className="dot-green-circle"></span>
        </div>
        <div style={{ width: '28px' }}></div> 
      </div>

      {menuMobileAbierto && (
        <div className="sidebar-overlay" onClick={() => setMenuMobileAbierto(false)}></div>
      )}

      <aside className={`sidebar-enterprise ${menuMobileAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-empresa">
            GridPlay<span className="dot-green-circle"></span>
          </div>
          {miClub && <p className="club-name-enterprise">{miClub.nombre}</p>}
          
          <button className="btn-cerrar-sidebar-mobile" onClick={() => setMenuMobileAbierto(false)}>
            <X size={24} color="#94a3b8" />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <span className="nav-section-title">MENÚ PRINCIPAL</span>
          <button className={`nav-item-enterprise ${vistaActual === 'general' ? 'active' : ''}`} onClick={() => cambiarVista('general')}><LayoutDashboard size={20} /> Vista General</button>
          <button className={`nav-item-enterprise ${vistaActual === 'metricas' ? 'active' : ''}`} onClick={() => cambiarVista('metricas')}><BarChart3 size={20} /> Reportes</button>
          <button className={`nav-item-enterprise ${vistaActual === 'clientes' ? 'active' : ''}`} onClick={() => cambiarVista('clientes')}><Users size={20} /> Clientes</button>
          
          <span className="nav-section-title mt-4">CONFIGURACIÓN</span>
          <button className={`nav-item-enterprise ${vistaActual === 'ajustes' ? 'active' : ''}`} onClick={() => cambiarVista('ajustes')}><Settings size={20} /> Canchas</button>
          <button className={`nav-item-enterprise ${vistaActual === 'kiosco' ? 'active' : ''}`} onClick={() => cambiarVista('kiosco')}><Store size={20} /> Kiosco y Extras</button>
          <button className={`nav-item-enterprise ${vistaActual === 'perfil' ? 'active' : ''}`} onClick={() => cambiarVista('perfil')}><Building size={20} /> Mi Club</button>
        </nav>
        
        <button className="btn-salir-enterprise" onClick={cerrarSesion}><LogOut size={20} /> Cerrar Sesión</button>
      </aside>

      <main className="main-content-enterprise">
        <div className="content-wrapper">
          {vistaActual === 'general' && <PantallaGeneral />}
          {vistaActual === 'metricas' && <PantallaMetricas />}
          {vistaActual === 'clientes' && <PantallaClientes />}
          {vistaActual === 'ajustes' && <PantallaAjustes />}
          {vistaActual === 'kiosco' && <PantallaKiosco />} 
          {vistaActual === 'perfil' && <PantallaPerfil miClub={miClub} setMiClub={setMiClub} />}
        </div>
      </main>

      {/* --- MODALES --- */}
      {mostrarModalDetalles && turnoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#0f172a' }}>
              <Users size={20} color="#2563eb" /> Detalles del Turno
            </h3>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
              <div className="detalle-item">
                <span className="detalle-label">Cliente:</span>
                <span className="detalle-valor">{turnoSeleccionado.esBloqueo ? turnoSeleccionado.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:') : turnoSeleccionado.nombre_cliente}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Teléfono:</span>
                <span className="detalle-valor">{turnoSeleccionado.telefono_cliente}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Fecha:</span>
                <span className="detalle-valor">{turnoSeleccionado.fecha.split('-').reverse().join('/')}</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Hora:</span>
                <span className="detalle-valor">{turnoSeleccionado.hora_inicio} hs</span>
              </div>
              <div className="detalle-item">
                <span className="detalle-label">Cancha:</span>
                <span className="detalle-valor">{turnoSeleccionado.nombre_cancha}</span>
              </div>

              {!turnoSeleccionado.esBloqueo && turnoSeleccionado.extras && turnoSeleccionado.extras.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '12px', paddingTop: '12px' }}>
                  <span className="detalle-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                    Productos adicionales:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.95rem' }}>
                    {turnoSeleccionado.extras.map((extra, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        <strong>{extra.cantidad}x</strong> {extra.nombre} <span style={{ color: '#94a3b8' }}>(${extra.subtotal})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!turnoSeleccionado.esBloqueo && (
                <div className="detalle-item" style={{ borderTop: '1px solid #e2e8f0', marginTop: '12px', paddingTop: '12px', alignItems: 'center' }}>
                  <span className="detalle-label" style={{ color: '#16a34a' }}>Total a cobrar:</span>
                  <span className="detalle-valor" style={{ color: '#16a34a', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ${turnoSeleccionado.precio + (turnoSeleccionado.extras ? turnoSeleccionado.extras.reduce((acc, item) => acc + item.subtotal, 0) : 0)}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-acciones" style={{ marginTop: '16px' }}>
              <button onClick={() => setMostrarModalDetalles(false)} className="btn-modal secundario">Cerrar</button>
              {!turnoSeleccionado.esBloqueo && (
                <button onClick={() => cancelarTurno(turnoSeleccionado.id, turnoSeleccionado.esBloqueo)} className="btn-modal advertencia" style={{ backgroundColor: '#ef4444' }}>
                  Cancelar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay">
          <form onSubmit={crearTurnoManual} className="modal-content">
            <h3>Nuevo Turno Manual</h3>
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Fecha</label>
                <input type="date" required onChange={(e) => setFormTurno({...formTurno, fecha: e.target.value})} className="modal-input solo" />
              </div>
              <div className="modal-col">
                <label className="modal-label">Hora</label>
                <input type="time" required onChange={(e) => setFormTurno({...formTurno, hora_inicio: e.target.value})} className="modal-input solo" />
              </div>
            </div>
            <div>
              <label className="modal-label">Cancha</label>
              <select required onChange={(e) => setFormTurno({...formTurno, cancha_id: e.target.value})} className="modal-input solo">
                <option value="">Seleccionar cancha...</option>
                {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="modal-label">Nombre del Cliente</label>
              <input type="text" placeholder="Ej: Juan Pérez" required onChange={(e) => setFormTurno({...formTurno, nombre_cliente: e.target.value})} className="modal-input solo" />
            </div>
            <div>
              <label className="modal-label">Teléfono</label>
              <input type="text" placeholder="Ej: 3564123456" required onChange={(e) => setFormTurno({...formTurno, telefono_cliente: e.target.value})} className="modal-input solo" />
            </div>
            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Guardar Turno</button>
              <button type="button" onClick={() => setMostrarModal(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {mostrarModalBloqueo && (
        <div className="modal-overlay">
          <form onSubmit={crearBloqueo} className="modal-content">
            <h3 className="modal-header-bloqueo"><Ban size={20}/> Bloquear Horario</h3>
            <p className="modal-desc" style={{ marginBottom: '15px' }}>Impedí reservas en un horario específico por limpieza o mantenimiento.</p>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Fecha</label>
                <input type="date" required onChange={(e) => setFormBloqueo({...formBloqueo, fecha: e.target.value})} className="modal-input solo" />
              </div>
              <div className="modal-col">
                <label className="modal-label">Hora</label>
                <input type="time" required onChange={(e) => setFormBloqueo({...formBloqueo, hora_inicio: e.target.value})} className="modal-input solo" />
              </div>
            </div>
            
            <div>
              <label className="modal-label">Cancha a bloquear</label>
              <select required onChange={(e) => setFormBloqueo({...formBloqueo, cancha_id: e.target.value})} className="modal-input solo">
                <option value="">Seleccionar cancha...</option>
                {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="modal-label">Motivo (Opcional)</label>
              <input type="text" placeholder="Ej: Mantenimiento de red" onChange={(e) => setFormBloqueo({...formBloqueo, motivo: e.target.value})} className="modal-input solo" />
            </div>
            
            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal advertencia">Aplicar Bloqueo</button>
              <button type="button" onClick={() => setMostrarModalBloqueo(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR CANCHA - CON LÓGICA DINÁMICA                                  */}
      {/* ========================================================================= */}
      {mostrarModalCancha && (
        <div className="modal-overlay">
          <form onSubmit={crearCanchaManual} className="modal-content">
            <h3>Nueva Cancha</h3>
            
           <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Nombre</label>
                <input type="text" placeholder="Ej: Cancha 1" required value={formCancha.nombre} onChange={(e) => setFormCancha({...formCancha, nombre: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <select value={formCancha.deporte} onChange={handleDeporteNuevaCancha} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  <option value="Fútbol">Fútbol</option>
                  <option value="Pádel">Pádel</option>
                  <option value="Tenis">Tenis</option>
                  <option value="Básquet">Básquet</option>
                </select>
              </div>
            </div>

            <div className="modal-row">
              {/* SELECT DINÁMICO DE JUGADORES */}
              <div className="modal-col">
                <label className="modal-label">Tipo de Partido</label>
                <select value={formCancha.cantidad_jugadores} onChange={(e) => setFormCancha({...formCancha, cantidad_jugadores: e.target.value})} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  {OPCIONES_DEPORTE[formCancha.deporte].jugadores.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                  ))}
                </select>
              </div>
              
              {/* SELECT DINÁMICO DE SUPERFICIE */}
              <div className="modal-col">
                <label className="modal-label">Tipo de Piso</label>
                <select value={formCancha.superficie} onChange={(e) => setFormCancha({...formCancha, superficie: e.target.value})} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  {OPCIONES_DEPORTE[formCancha.deporte].superficies.map((sup) => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Precio por Hora ($)</label>
                <input type="number" required value={formCancha.precio_hora} onChange={(e) => setFormCancha({...formCancha, precio_hora: e.target.value})} className="modal-input solo"/>
              </div>
              
              <div className="modal-col" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={formCancha.techada} 
                    onChange={(e) => setFormCancha({...formCancha, techada: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: '#22c55e', cursor: 'pointer' }}
                  />
                  ¿Es cancha techada?
                </label>
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={formCancha.hora_apertura} onChange={(e) => setFormCancha({...formCancha, hora_apertura: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={formCancha.hora_cierre} onChange={(e) => setFormCancha({...formCancha, hora_cierre: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Fotos de la Cancha (Opcional)</label>
              <input 
                type="file" multiple accept="image/*" 
                onChange={(e) => { if (e.target.files) setImagenCanchaFiles(Array.from(e.target.files)); }} 
                className="modal-input solo" style={{ padding: '8px' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Podés seleccionar varias imágenes a la vez.</p>
            </div>

            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Guardar Cancha</button>
              <button type="button" onClick={() => setMostrarModalCancha(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDITAR CANCHA - CON LÓGICA DINÁMICA REPARADA                        */}
      {/* ========================================================================= */}
      {mostrarModalEditar && (
        <div className="modal-overlay">
          <form onSubmit={guardarEdicionCancha} className="modal-content">
            <h3>Editar Cancha</h3>
            
            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Nombre</label>
                <input type="text" required value={canchaEditando.nombre} onChange={(e) => setCanchaEditando({...canchaEditando, nombre: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Deporte</label>
                <select value={canchaEditando.deporte} onChange={handleDeporteEdicionCancha} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  <option value="Fútbol">Fútbol</option>
                  <option value="Pádel">Pádel</option>
                  <option value="Tenis">Tenis</option>
                  <option value="Básquet">Básquet</option>
                </select>
              </div>
            </div>

            <div className="modal-row">
              {/* SELECT DINÁMICO DE JUGADORES */}
              <div className="modal-col">
                <label className="modal-label">Tipo de Partido</label>
                <select value={canchaEditando.cantidad_jugadores} onChange={(e) => setCanchaEditando({...canchaEditando, cantidad_jugadores: e.target.value})} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  {OPCIONES_DEPORTE[canchaEditando.deporte].jugadores.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                  ))}
                </select>
              </div>
              
              {/* SELECT DINÁMICO DE SUPERFICIE */}
              <div className="modal-col">
                <label className="modal-label">Tipo de Piso</label>
                <select value={canchaEditando.superficie} onChange={(e) => setCanchaEditando({...canchaEditando, superficie: e.target.value})} className="modal-input solo" style={{ cursor: 'pointer' }}>
                  {OPCIONES_DEPORTE[canchaEditando.deporte].superficies.map((sup) => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Precio por Hora ($)</label>
                <input type="number" required value={canchaEditando.precio_hora} onChange={(e) => setCanchaEditando({...canchaEditando, precio_hora: e.target.value})} className="modal-input solo"/>
              </div>
              
              <div className="modal-col" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={canchaEditando.techada} 
                    onChange={(e) => setCanchaEditando({...canchaEditando, techada: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: '#22c55e', cursor: 'pointer' }}
                  />
                  ¿Es cancha techada?
                </label>
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Apertura</label>
                <input type="time" required value={canchaEditando.hora_apertura} onChange={(e) => setCanchaEditando({...canchaEditando, hora_apertura: e.target.value})} className="modal-input solo"/>
              </div>
              <div className="modal-col">
                <label className="modal-label">Cierre</label>
                <input type="time" required value={canchaEditando.hora_cierre} onChange={(e) => setCanchaEditando({...canchaEditando, hora_cierre: e.target.value})} className="modal-input solo"/>
              </div>
            </div>

            <div>
              <label className="modal-label">Cambiar Fotos (Opcional)</label>
              <input 
                type="file" multiple accept="image/*" 
                onChange={(e) => { if (e.target.files) setImagenCanchaEditFiles(Array.from(e.target.files)); }} 
                className="modal-input solo" style={{ padding: '8px' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Las fotos nuevas se sumarán a las que ya tenés.</p>
              
              {canchaEditando.imagen_url && (!imagenCanchaEditFiles || imagenCanchaEditFiles.length === 0) && (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#16a34a' }}>✓ Imágenes cargadas previamente</p>
              )}
            </div>

            <div className="modal-acciones" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-modal primario">Actualizar Cambios</button>
              <button type="button" onClick={() => setMostrarModalEditar(false)} className="btn-modal secundario">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;