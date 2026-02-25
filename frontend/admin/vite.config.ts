import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze'
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
      // terser 能更彻底地删除未使用的 class 和冗余样式字符串
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console
          drop_debugger: true,
          pure_funcs: ['process.env.NODE_ENV'], // 静态替换环境变量，帮助剔除开发模式代码
        },
        format: {
          comments: false, // 移除所有注释
        },
      },
      // 开启 CSS 压缩和模块化优化
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
            // 1. 优先匹配核心框架库，防止它们被误拆到其他 chunk
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
              return 'react-vendor';
            }

            // 2. 再拆体积大的底层依赖
            if (id.includes('@rc-component/picker')) {
              return 'rc-picker-vendor';
            }

            // 3. 最后才是日期范围组件
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