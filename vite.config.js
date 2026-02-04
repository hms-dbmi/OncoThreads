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
        'API': path.resolve(__dirname, './src/API'),
        // Use the UMD build of lineupjs to avoid ES module export issues
        'lineupjs': path.resolve(__dirname, './node_modules/lineupjs/build/LineUpJS.js')
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
    },
    
    // Build configuration
    build: {
      outDir: 'build',
      sourcemap: true,
      // Increase chunk size warning limit (current bundle is ~947 kB)
      chunkSizeWarningLimit: 1000,
      commonjsOptions: {
        include: [/lineupjs/, /node_modules/],
        transformMixedEsModules: true,
        // Ignore these warnings for lineupjs
        ignoreDynamicRequires: true
      },
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress lineupjs export warnings
          if (warning.code === 'MISSING_EXPORT' && warning.exporter && warning.exporter.includes('lineupjs')) {
            return;
          }
          warn(warning);
        },
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
        'antd',
        'lineupjs',
        'lineupjsx'
      ],
      exclude: [],
      // Force pre-bundle lineupjs to avoid internal module resolution issues
      force: true
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
