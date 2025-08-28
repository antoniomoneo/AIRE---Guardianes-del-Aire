import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        // Use API_KEY from environment variables as per guidelines.
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        // Expose GITHUB_TOKEN to be used by the galleryService.
        'process.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN)
      },
      resolve: {
        alias: {
          // Fix: Replaced `process.cwd()` with `__dirname` to resolve a TypeScript type error.
          // Using `__dirname` is the standard and recommended practice for creating absolute paths in Vite configuration files.
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
