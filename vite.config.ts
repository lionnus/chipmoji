import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served at the root of the chipmoji.lionn.us custom domain, so the base
  // must be '/'. A project subpath (e.g. '/chipmoji/') would make the built
  // asset URLs 404 on the custom domain and render a blank page.
  base: '/',
  plugins: [react()],
})
