import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isGhActions = process.env.GITHUB_ACTIONS === 'true'
const base = isGhActions && repositoryName ? `/${repositoryName}/` : '/'

export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      includeAssets: ['check.jpg'],

      manifest: {
        name: 'RemindAir',
        short_name: 'RemindAir',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'check.jpg', sizes: '192x192', type: 'image/jpeg' },
          { src: 'check.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },

      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
