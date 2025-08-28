import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        // Fix: Use API_KEY from environment variables as per guidelines.
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        // Fix: Expose GITHUB_TOKEN to be used by the galleryService.
        'process.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN)
      },
      resolve: {
        alias: {
          // Fix: __dirname is not available in this module context.
          // Using process.cwd() resolves to the project root where vite is run.
          '@': path.resolve(process.cwd(), '.'),
        }
      }
    };
});
