import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Configura Vite para servir activos estáticos desde la carpeta 'media' en la raíz del proyecto.
  publicDir: "media",
  server: {
    port: 5173, // Puerto para el servidor de desarrollo
    proxy: {
      // Redirige todas las peticiones a '/api' al servidor Express en el puerto 8080.
      // Esto permite que el frontend y el backend se ejecuten en el mismo dominio durante el desarrollo.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    }
  },
});