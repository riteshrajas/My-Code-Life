import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Ensure this points to your src directory
    },
  },
  // server: { // Optional: configure server options if needed
  //   port: 3000, 
  // },
  // build: { // Optional: configure build options if needed
  //   outDir: 'dist',
  // }
});
