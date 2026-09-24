import { supabase } from './supabase';

const BUCKET = 'imagenes';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const TIPOS_IMAGEN_ACEPTADOS = Object.keys(EXTENSIONES).join(',');

/**
 * Sube una imagen a `imagenes/<uid>/<carpeta>/<uuid>.<ext>` y devuelve su URL pública.
 * La carpeta raíz es el uid del usuario: las policies de Storage solo permiten escribir ahí.
 * Tipo y tamaño se validan acá (UX) y de nuevo en el bucket (seguridad real).
 */
export const subirImagen = async (file, carpeta) => {
  const ext = EXTENSIONES[file.type];
  if (!ext) throw new Error('Formato no permitido. Usá JPG, PNG o WebP.');
  if (file.size > MAX_BYTES) throw new Error('La imagen supera los 5 MB.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Necesitás iniciar sesión para subir imágenes.');

  const ruta = `${user.id}/${carpeta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, file, { contentType: file.type });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
};
