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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'vendor-supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
          'vendor-google': ['@google/generative-ai'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns', 'framer-motion', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false, // Disable sourcemaps in production for smaller build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    host: true // Allow network access
  }
});
