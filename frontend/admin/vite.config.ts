import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('mode: ', mode)
  return defineConfig({
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        showSwitch: true,
        hotKeys: ['ctrlKey', 'altKey'],
      }),
      devtools({
        eventBusConfig: {
          port: 42069,
        },
      }),
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      tailwindcss(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 500,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['process.env.NODE_ENV'],
        },
        format: {
          comments: false,
        },
      },
      cssCodeSplit: true,
      cssMinify: 'lightningcss',

      rollupOptions: {
        plugins: [
          {
            name: 'dayjs-locale-prune',
            resolveId(id: string) {
              if (id.includes('dayjs/locale/') && !id.endsWith('zh-cn') && !id.endsWith('zh-cn.js')) {
                return { id: '\0empty', external: false }
              }
            },
            load(id: string) { if (id === '\0empty') return 'export default {}' },
          },
        ],
        output: {
          manualChunks: (id: string) => {
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
              return 'react-vendor';
            }

            if (id.includes('@rc-component/picker')) {
              return 'rc-picker-vendor';
            }

            if (id.includes('antd/es/date-picker/generatePicker/generateRangePicker.js')) {
              return 'antd-date-range-picker';
            }
          },
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          entryFileNames: 'assets/entry/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },

  })
})