import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/dnm-mobile/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'D.N.M. — Demose Na Mossa',
        short_name: 'D.N.M.',
        description: 'Tracking alimentazione giornaliera',
        theme_color: '#1a0533',
        background_color: '#0d0020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dnm-mobile/',
        scope: '/dnm-mobile/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-script-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      }
    })
  ]
})
