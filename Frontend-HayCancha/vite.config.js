import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))

// Modo demo (`npm run dev:demo`): reemplaza el cliente de Supabase por datos de ejemplo.
// Solo existe en desarrollo; los builds de producción no usan este modo.
const supabaseDemo = () => ({
  name: 'supabase-demo',
  enforce: 'pre',
  resolveId(source, importer) {
    // '../../services/supabase' desde las pantallas, o './supabase' desde otro archivo de src/services
    const esDeServices = /[\\/]src[\\/]services[\\/]/.test(importer || '')
    if (/services\/supabase$/.test(source) || (esDeServices && source === './supabase')) {
      return path.join(aqui, 'src/services/supabaseDemo.js')
    }
    return null
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'demo' ? [supabaseDemo()] : [])],
}))
