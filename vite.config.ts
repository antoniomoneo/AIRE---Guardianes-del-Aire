import path from "path";
// FIX: Import fileURLToPath to define __dirname in ES modules, which is not available by default.
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// FIX: Define __dirname for ES module scope.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // FIX: Replaced process.cwd() with '.' to resolve a TypeScript type error.
  // '.' correctly refers to the current working directory from which Vite is run.
  const env = loadEnv(mode, ".", "");

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
