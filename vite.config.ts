import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.API_KEY),
      "process.env.GITHUB_TOKEN": JSON.stringify(env.GITHUB_TOKEN),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5173, // Puerto de dev (ajústalo si lo necesitas)
    },
  };
});