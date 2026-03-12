import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.npm_package_version ||
  'dev';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
