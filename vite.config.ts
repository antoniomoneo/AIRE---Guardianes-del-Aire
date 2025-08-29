import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    // This configures Vite to serve static assets from the 'media' directory at the project root.
    // This resolves the 404 errors for images like the logo.
    publicDir: "media",
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GITHUB_TOKEN": JSON.stringify(env.GITHUB_TOKEN),
    },
    server: {
      port: 5173, // Puerto de dev (ajústalo si lo necesitas)
    },
  };
});
