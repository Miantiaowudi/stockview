import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      provider: playwright,
      instanceOptions: {
        baseURL: 'http://localhost:3000',
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})
