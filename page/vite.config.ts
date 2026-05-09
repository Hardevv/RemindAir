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
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'RemindAir',
        short_name: 'RemindAir',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
