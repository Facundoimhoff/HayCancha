import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Camera, Check, ExternalLink, ImagePlus, Music2, Globe, Trash2, X } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../../services/storage';
import { validarTelefono } from '../../../utils/validaciones';
import { enlaceRed, colorClub, listaImagenes } from '../../../utils/enlaces';
import { Panel, Campo } from '../components/ui';

const PROVINCIAS = ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Ciudad Autónoma de Buenos Aires'];
const REDES = [
  { id: 'instagram', nombre: 'Instagram', ejemplo: '@miclub', Icono: Camera },
  { id: 'tiktok', nombre: 'TikTok', ejemplo: '@miclub', Icono: Music2 },
  { id: 'facebook', nombre: 'Facebook', ejemplo: 'Link o nombre de la página', Icono: Globe },
];

const formularioInicial = (club) => ({
  nombre: club?.nombre || '',
  provincia: club?.provincia || '',
  ciudad: club?.ciudad || '',
  direccion: club?.direccion || '',
  color_primario: colorClub(club?.color_primario),
  telefono_contacto: club?.telefono_contacto || '',
  correo_contacto: club?.correo_contacto || '',
  estacionamiento: club?.estacionamiento === true,
  servicios: club?.servicios || '',
  descripcion: club?.descripcion || '',
  redes: { instagram: '', tiktok: '', facebook: '', ...(club?.redes_sociales || {}) },
});

const ErrorCampo = ({ texto }) => (texto ? <span className="dash-campo-error" role="alert">{texto}</span> : null);

/** Pantalla "Mi club": perfil público del complejo (logo, contacto, servicios, redes y galería). Los cambios se aplican al guardar. */
const MiClub = ({ miClub, setMiClub }) => {
  const [form, setForm] = useState(() => formularioInicial(miClub));
  const [logoActual, setLogoActual] = useState(miClub?.imagen_url || '');
  const [logoNuevo, setLogoNuevo] = useState(null);
  const [fotosActuales, setFotosActuales] = useState(() => listaImagenes(miClub?.fotos_club));
  const [fotosNuevas, setFotosNuevas] = useState([]); // [{ archivo, vista }]
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);
  // Foto del estado guardado: sirve para saber si hay cambios sin guardar
  const [base, setBase] = useState(() => JSON.stringify({ f: formularioInicial(miClub), l: miClub?.imagen_url || '', p: listaImagenes(miClub?.fotos_club) }));
  const temporizador = useRef(null);

  const vistaLogo = useMemo(() => (logoNuevo ? URL.createObjectURL(logoNuevo) : logoActual), [logoNuevo, logoActual]);
  useEffect(() => () => { if (logoNuevo) URL.revokeObjectURL(vistaLogo); }, [logoNuevo, vistaLogo]);
  // Las vistas previas se liberan al quitarlas, al guardar y al salir de la pantalla (no en cada cambio de la lista)
  const fotosRef = useRef([]);
  useEffect(() => { fotosRef.current = fotosNuevas; }, [fotosNuevas]);
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.vista)), []);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const hayCambios = logoNuevo !== null || fotosNuevas.length > 0
    || JSON.stringify({ f: form, l: logoActual, p: fotosActuales }) !== base;

  const limpiarAviso = () => setAviso((a) => (a.tipo === 'error' ? { tipo: '', texto: '' } : a));

  const cambiar = (campo) => (e) => {
    limpiarAviso();
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };
  const cambiarRed = (red) => (e) => {
    limpiarAviso();
    setForm((f) => ({ ...f, redes: { ...f.redes, [red]: e.target.value } }));
    setErrores((prev) => (prev[red] ? { ...prev, [red]: undefined } : prev));
  };

  const elegirFotos = (e) => {
    const archivos = Array.from(e.target.files || []);
    setFotosNuevas((actuales) => [...actuales, ...archivos.map((archivo) => ({ archivo, vista: URL.createObjectURL(archivo) }))]);
    e.target.value = '';
  };

  const validar = () => {
    const nuevos = {};
    if (form.nombre.trim().length < 2) nuevos.nombre = 'Ingresá el nombre del club.';
    if (!form.provincia) nuevos.provincia = 'Elegí la provincia.';
    if (!form.ciudad.trim()) nuevos.ciudad = 'Ingresá la ciudad.';
    if (form.telefono_contacto.trim() && !validarTelefono(form.telefono_contacto)) nuevos.telefono_contacto = 'Solo números, entre 6 y 20 dígitos.';
    if (form.correo_contacto.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_contacto.trim())) nuevos.correo_contacto = 'Ingresá un correo válido.';
    for (const { id, nombre } of REDES) {
      if (form.redes[id]?.trim() && !enlaceRed(id, form.redes[id])) nuevos[id] = `No reconocemos ese usuario o link de ${nombre}.`;
    }
    return nuevos;
  };

  const guardar = async (e) => {
    e.preventDefault();
    setAviso({ tipo: '', texto: '' });

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      setAviso({ tipo: 'error', texto: 'Revisá los campos marcados antes de guardar.' });
      return;
    }

    setGuardando(true);
    try {
      let imagen_url = logoActual;
      if (logoNuevo) imagen_url = await subirImagen(logoNuevo, 'logos');

      const subidas = [];
      let fallidas = 0;
      for (const { archivo } of fotosNuevas) {
        try { subidas.push(await subirImagen(archivo, 'clubes_fotos')); } catch (err) { console.error('No se pudo subir una foto del club:', err); fallidas += 1; }
      }
      const fotos = [...fotosActuales, ...subidas];

      const cambios = {
        nombre: form.nombre.trim(),
        provincia: form.provincia,
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim(),
        color_primario: form.color_primario,
        imagen_url,
        telefono_contacto: form.telefono_contacto.trim(),
        correo_contacto: form.correo_contacto.trim(),
        estacionamiento: form.estacionamiento,
        servicios: form.servicios.trim(),
        descripcion: form.descripcion.trim(),
        fotos_club: fotos.join(','),
        redes_sociales: form.redes,
      };
      const { error } = await supabase.from('clubes').update(cambios).eq('id', miClub.id);
      if (error) throw error;

      setMiClub({ ...miClub, ...cambios });
      setLogoActual(imagen_url);
      setLogoNuevo(null);
      setFotosActuales(fotos);
      fotosNuevas.forEach((f) => URL.revokeObjectURL(f.vista));
      setFotosNuevas([]);
      setBase(JSON.stringify({ f: form, l: imagen_url, p: fotos }));

      setAviso(fallidas
        ? { tipo: 'aviso', texto: `Guardamos los cambios, pero ${fallidas === 1 ? 'una foto no se pudo subir' : `${fallidas} fotos no se pudieron subir`}. Probá subirlas de nuevo (JPG, PNG o WebP, hasta 5 MB).` }
        : { tipo: 'exito', texto: '¡Cambios guardados! Ya los ven los jugadores.' });
      clearTimeout(temporizador.current);
      if (!fallidas) temporizador.current = setTimeout(() => setAviso({ tipo: '', texto: '' }), 4000);
    } catch (err) {
      console.error('Error al guardar el perfil del club:', err);
      setAviso({ tipo: 'error', texto: err?.message?.includes('5 MB') || err?.message?.includes('imagen') ? err.message : 'No pudimos guardar los cambios. Revisá tu conexión e intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <header className="dash-page-head">
        <div><h1>Mi club</h1><p>Así te ven los jugadores. Los cambios se aplican cuando tocás “Guardar”.</p></div>
        <div className="dash-page-acciones">
          <a className="dash-btn dash-btn--secundario" href={`/club/${miClub?.id}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ver mi página</a>
        </div>
      </header>

      <form onSubmit={guardar} className="dash-club-form" noValidate>
        <Panel titulo="Identidad" descripcion="Logo, nombre y color de tu banner.">
          <div className="dash-logo-fila">
            <div className="dash-logo-caja">
              {vistaLogo ? <img src={vistaLogo} alt="Logo del club" /> : <Building2 size={40} aria-hidden="true" />}
            </div>
            <div className="dash-logo-acciones">
              <label className="dash-btn dash-btn--secundario">
                <ImagePlus size={16} /> {vistaLogo ? 'Cambiar logo' : 'Subir logo'}
                <input type="file" accept={TIPOS_IMAGEN_ACEPTADOS} className="dash-solo-lector" onChange={(e) => { if (e.target.files?.[0]) setLogoNuevo(e.target.files[0]); }} />
              </label>
              {vistaLogo && (
                <button type="button" className="dash-btn dash-btn--peligro-suave" onClick={() => { setLogoNuevo(null); setLogoActual(''); }}><Trash2 size={16} /> Quitar logo</button>
              )}
              <small>JPG, PNG o WebP, hasta 5 MB.</small>
            </div>
          </div>

          <div className="dash-fila-2">
            <Campo etiqueta="Nombre del club">
              <input type="text" maxLength={120} className="dash-input" value={form.nombre} onChange={cambiar('nombre')} aria-invalid={errores.nombre ? true : undefined} />
              <ErrorCampo texto={errores.nombre} />
            </Campo>
            <Campo etiqueta="Color de tu marca" ayuda="Se usa en el banner de tu página. El texto se ajusta solo para que se lea.">
              <span className="dash-color">
                <input type="color" value={form.color_primario} onChange={cambiar('color_primario')} aria-label="Color de la marca" />
                <code>{form.color_primario}</code>
              </span>
            </Campo>
          </div>
        </Panel>

        <Panel titulo="Ubicación y contacto">
          <div className="dash-fila-2">
            <Campo etiqueta="Provincia">
              <select className="dash-input" value={form.provincia} onChange={cambiar('provincia')} aria-invalid={errores.provincia ? true : undefined}>
                <option value="">Seleccioná tu provincia</option>
                {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ErrorCampo texto={errores.provincia} />
            </Campo>
            <Campo etiqueta="Ciudad">
              <input type="text" maxLength={80} placeholder="Ej: San Francisco" className="dash-input" value={form.ciudad} onChange={cambiar('ciudad')} aria-invalid={errores.ciudad ? true : undefined} />
              <ErrorCampo texto={errores.ciudad} />
            </Campo>
          </div>
          <Campo etiqueta="Dirección">
            <input type="text" maxLength={200} placeholder="Ej: Av. Urquiza 332" className="dash-input" value={form.direccion} onChange={cambiar('direccion')} />
          </Campo>
          <div className="dash-fila-2">
            <Campo etiqueta="Teléfono (WhatsApp)">
              <input type="tel" inputMode="tel" placeholder="Ej: 3564609641" className="dash-input" value={form.telefono_contacto} onChange={cambiar('telefono_contacto')} aria-invalid={errores.telefono_contacto ? true : undefined} />
              <ErrorCampo texto={errores.telefono_contacto} />
            </Campo>
            <Campo etiqueta="Correo electrónico">
              <input type="email" placeholder="Ej: contacto@miclub.com" className="dash-input" value={form.correo_contacto} onChange={cambiar('correo_contacto')} aria-invalid={errores.correo_contacto ? true : undefined} />
              <ErrorCampo texto={errores.correo_contacto} />
            </Campo>
          </div>
          <label className="dash-check"><input type="checkbox" checked={form.estacionamiento} onChange={cambiar('estacionamiento')} /> Tenemos estacionamiento propio</label>
        </Panel>

        <Panel titulo="Descripción y servicios">
          <Campo etiqueta="Acerca del club" ayuda="Contales cómo son tus instalaciones, tu historia, la iluminación…">
            <textarea className="dash-input dash-textarea" rows={4} maxLength={2000} value={form.descripcion} onChange={cambiar('descripcion')} />
          </Campo>
          <Campo etiqueta="Servicios" ayuda="Separados por coma. Ej: Parrillas, Vestuarios, Cantina">
            <input type="text" maxLength={500} className="dash-input" value={form.servicios} onChange={cambiar('servicios')} />
          </Campo>
        </Panel>

        <Panel titulo="Fotos del predio" descripcion="Mostrales a tus clientes lo grande que es el club.">
          <label className="dash-btn dash-btn--secundario dash-btn--auto">
            <ImagePlus size={16} /> Agregar fotos
            <input type="file" multiple accept={TIPOS_IMAGEN_ACEPTADOS} className="dash-solo-lector" onChange={elegirFotos} />
          </label>
          {fotosActuales.length + fotosNuevas.length > 0 ? (
            <ul className="dash-galeria">
              {fotosActuales.map((url, i) => (
                <li key={url}>
                  <img src={url} alt={`Foto del predio ${i + 1}`} loading="lazy" />
                  <button type="button" onClick={() => setFotosActuales((f) => f.filter((x) => x !== url))} aria-label={`Quitar la foto ${i + 1}`}><X size={14} /></button>
                </li>
              ))}
              {fotosNuevas.map(({ vista }, i) => (
                <li key={vista} className="nueva">
                  <img src={vista} alt={`Foto nueva ${i + 1}`} />
                  <span>Nueva</span>
                  <button type="button" onClick={() => { URL.revokeObjectURL(vista); setFotosNuevas((f) => f.filter((x) => x.vista !== vista)); }} aria-label={`Quitar la foto nueva ${i + 1}`}><X size={14} /></button>
                </li>
              ))}
            </ul>
          ) : <p className="dash-nada">Todavía no cargaste fotos.</p>}
          {fotosActuales.length > 1 && (
            <button type="button" className="dash-btn dash-btn--peligro-suave dash-btn--auto" onClick={() => setFotosActuales([])}><Trash2 size={16} /> Quitar todas las fotos guardadas</button>
          )}
        </Panel>

        <Panel titulo="Redes sociales" descripcion="Completá con tu @usuario o el link directo.">
          <div className="dash-redes">
            {REDES.map(({ id, nombre, ejemplo, Icono }) => (
              <Campo key={id} etiqueta={nombre}>
                <span className="dash-input-red"><Icono size={18} aria-hidden="true" />
                  <input type="text" maxLength={120} placeholder={ejemplo} className="dash-input" value={form.redes[id] || ''} onChange={cambiarRed(id)} aria-invalid={errores[id] ? true : undefined} />
                </span>
                <ErrorCampo texto={errores[id]} />
              </Campo>
            ))}
          </div>
        </Panel>

        <div className="dash-barra-guardar">
          <span className={`dash-aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
            {aviso.tipo === 'exito' && <Check size={16} />}{aviso.texto || (hayCambios ? 'Tenés cambios sin guardar.' : '')}
          </span>
          <button type="submit" className="dash-btn dash-btn--primario" disabled={guardando || !hayCambios}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </>
  );
};

export default MiClub;
