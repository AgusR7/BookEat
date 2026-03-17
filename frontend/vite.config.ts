import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3001';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('@react-google-maps')) {
              return 'maps';
            }

            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui';
            }

            if (id.includes('react-router')) {
              return 'router';
            }

            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }

            return 'vendor';
          }
        }
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true, secure: false }
      }
    }
  };
});
