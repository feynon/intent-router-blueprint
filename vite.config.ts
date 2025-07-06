import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      skipDiagnostics: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IntentRouter',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['@unternet/kernel', 'ollama', 'zod', 'react', 'react-dom'],
      output: {
        globals: {
          '@unternet/kernel': 'UnternetKernel',
          'ollama': 'Ollama',
          'zod': 'Zod',
          'react': 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    target: 'es2022',
    sourcemap: true,
    minify: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});