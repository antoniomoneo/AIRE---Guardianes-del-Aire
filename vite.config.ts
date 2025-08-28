// vite.config.ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// __dirname en ESM:
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  // Solo cargamos variables que empiecen por VITE_ (patrón recomendado de Vite)
  // Así evitamos filtrar secretos (p.ej. API keys) al cliente.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Construye pares define para VITE_* (opcionales; normalmente basta con import.meta.env.VITE_*)
  const expose = Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
  )

  return {
    base: '/',                 // assets OK detrás de tu dominio en Cloud Run
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['p5'],         // ayuda a resolver p5 durante el build
    },
    define: {
      // ⚠️ No exponemos API secrets. Usa solo variables de cliente prefijadas con VITE_.
      // Acceso en código: import.meta.env.VITE_GITHUB_TOKEN, etc.
      ...expose,

      // Compat si tu código antiguo usaba process.env.GITHUB_TOKEN:
      'process.env.GITHUB_TOKEN': JSON.stringify(env.VITE_GITHUB_TOKEN || ''),
    },
  }
})