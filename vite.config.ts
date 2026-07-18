import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/sporjeger_pwa/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor'
          if (id.includes('/@supabase/')) return 'supabase'
          if (id.includes('/fuse.js/')) return 'fuse'
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable.png'
      ],
      manifest: {
        id: '/sporjeger_pwa/',
        name: 'Sporjeger',
        short_name: 'Sporjeger',
        description: 'Norsk OSINT-katalog for digital skattejakt',
        lang: 'nb',
        dir: 'ltr',
        theme_color: '#F4F1EA',
        background_color: '#F4F1EA',
        display: 'standalone',
        start_url: '/sporjeger_pwa/',
        scope: '/sporjeger_pwa/',
        categories: ['utilities', 'productivity'],
        icons: [
          // SVG først (progressiv forbedring), deretter PNG som iOS/Android krever
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Kun REST-data - aldri auth-endepunkter i cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 timer
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5174,
    strictPort: true
  },
  preview: {
    port: 5174
  }
})
