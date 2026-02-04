import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.VITE_ELECTRON === 'true';
  
  return {
    plugins: [
      react({
        // Enable Babel for JSX files and MobX decorators
        babel: {
          parserOpts: {
            plugins: ['decorators-legacy', 'classProperties']
          }
        }
      })
    ],
    
    // Base URL for deployment
    base: mode === 'production' && !isElectron ? 'http://oncothreads.gehlenborglab.org' : './',
    
    resolve: {
      alias: {
        // Allow absolute imports from src/ (matching CRA behavior)
        'modules': path.resolve(__dirname, './src/modules'),
        'API': path.resolve(__dirname, './src/API')
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
    },
    
    // Build configuration
    build: {
      outDir: 'build',
      sourcemap: true,
      // Increase chunk size warning limit (current bundle is ~947 kB)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manual chunking for better caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-bootstrap'],
            'vendor-mobx': ['mobx', 'mobx-react', 'mobx-utils'],
            'vendor-d3': ['d3', 'd3-sankey', 'd3-scale-chromatic'],
            'vendor-ui': ['antd', 'intro.js', 'lineupjs', 'lineupjsx']
          }
        }
      }
    },
    
    // Dev server configuration
    server: {
      port: 3000,
      open: !isElectron, // Don't auto-open browser in Electron mode
      host: true
    },
    
    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'mobx',
        'mobx-react',
        'd3',
        'antd'
      ]
    },
    
    // CSS configuration
    css: {
      postcss: null // Disable PostCSS if not needed
    },
    
    // Define environment variables (replaces process.env in CRA)
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
