import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,xml}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'unsplash-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-data-nodes',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: "CityMate India",
          short_name: "CityMate",
          description: "India's First AI-Powered Relocation Platform Suite",
          start_url: "/",
          display: "standalone",
          background_color: "#0f172a",
          theme_color: "#0f172a",
          orientation: "portrait",
          scope: "/",
          categories: ["utilities", "travel", "productivity"],
          icons: [
            {
              src: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=192&h=192&q=80",
              sizes: "192x192",
              type: "image/jpeg",
              purpose: "any"
            },
            {
              src: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=512&h=512&q=80",
              sizes: "512x512",
              type: "image/jpeg",
              purpose: "any"
            },
            {
              src: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=192&h=192&q=80",
              sizes: "192x192",
              type: "image/jpeg",
              purpose: "maskable"
            },
            {
              src: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=512&h=512&q=80",
              sizes: "512x512",
              type: "image/jpeg",
              purpose: "maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
