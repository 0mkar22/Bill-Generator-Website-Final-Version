import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Standard port for Vite React apps, but you can change it to 80 if you prefer
    port: 5173, 
    // Proxy API requests to your Node.js backend to avoid CORS issues in development
    // (Optional, since your server already handles CORS, but good practice)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});