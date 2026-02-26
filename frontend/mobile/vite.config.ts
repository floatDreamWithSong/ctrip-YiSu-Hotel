import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

const chunkGroups: Array<[string, string[]]> = [
  ['react-vendor', ['react', 'react-dom', 'scheduler']],
  [
    'tanstack-vendor',
    [
      '@tanstack/react-router',
      '@tanstack/react-query',
      '@tanstack/react-router-devtools',
      '@tanstack/react-query-devtools',
      '@tanstack/react-devtools',
      '@tanstack/router-core',
      '@tanstack/history',
    ],
  ],
  ['antd-mobile-vendor', ['antd-mobile', 'antd-mobile-icons']],
  ['icons-vendor', ['lucide-react', '@ant-design/icons']],
  ['utils-vendor', ['axios', 'dayjs', 'zod', 'zustand', 'ahooks']],
  ['yisu-shared-vendor', ['@yisu/front-utils', '@yisu/shared']],
]

const getManualChunk = (id: string) => {
  if (!id.includes('node_modules')) {
    return undefined
  }

  for (const [chunkName, packages] of chunkGroups) {
    if (
      packages.some(
        (pkg) =>
          id.includes(`/node_modules/${pkg}/`) ||
          id.includes(`\\node_modules\\${pkg}\\`),
      )
    ) {
      return chunkName
    }
  }

  if (id.includes('/node_modules/') || id.includes('\\node_modules\\')) {
    return 'vendor'
  }

  return undefined
}

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
          port: 42070,
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
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          entryFileNames: 'assets/entry/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
  })
})
