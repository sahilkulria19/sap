import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiBaseUrl || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  })
}
