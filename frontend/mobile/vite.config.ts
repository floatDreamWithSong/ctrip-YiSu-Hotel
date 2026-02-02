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
      devtools(),
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
  })
})
