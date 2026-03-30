import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteDevApiPlugin } from './scripts/vite-dev-api'
import { hydrateProcessEnvFromVite } from './scripts/vite-env'

export default defineConfig(({ mode }) => {
  hydrateProcessEnvFromVite(mode)

  const buildVersion =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.npm_package_version ||
    'dev'

  return {
    plugins: [viteDevApiPlugin(), react(), tailwindcss()],
    define: {
      __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
    },
    build: {
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('/@clerk/')) {
              return 'clerk';
            }

            if (id.includes('/react-router') || id.includes('/@remix-run/router')) {
              return 'router';
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }

            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
