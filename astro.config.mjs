import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  base: '/115-digital-illustration',
  vite: {
    plugins: [tailwindcss()],
  },
})
