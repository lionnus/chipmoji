import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { site } from './src/site'

// %SITE_*% placeholders in index.html, replaced at build (and in dev) so the
// static <head> stays in sync with src/site.ts. Single source of truth.
const htmlTokens: Record<string, string> = {
  '%SITE_NAME%': site.name,
  '%SITE_TITLE%': site.title,
  '%SITE_TAGLINE%': site.taglineSentence,
  '%SITE_DESCRIPTION%': site.description,
  '%SITE_URL%': site.url,
}

export default defineConfig({
  // Served at the root of the chipmoji.lionn.us custom domain, so the base
  // must be '/'. A project subpath (e.g. '/chipmoji/') would make the built
  // asset URLs 404 on the custom domain and render a blank page.
  base: '/',
  plugins: [
    react(),
    {
      name: 'inject-site-constants',
      transformIndexHtml(html) {
        return html.replace(/%SITE_[A-Z]+%/g, (m) => htmlTokens[m] ?? m)
      },
    },
  ],
})
