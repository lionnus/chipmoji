// Single source of truth for all user-facing site text and canonical URLs.
// Imported by the React app (src/) AND by vite.config.ts, which injects these
// values into index.html's <head> at build time. Change copy here only.

const name = 'chipmoji'
const tagline = 'An emoji guide for chip development commits'
const categories = 'RTL, verification, timing, PPA, scripts, CI, and more'

export const site = {
  name,
  tagline,
  // Full description for SEO meta tags + JSON-LD structured data.
  description: `${tagline}: ${categories}.`,
  // Short sentence (with terminal period) for the UI tagline + share text.
  taglineSentence: `${tagline}.`,
  // Page <title> and social share line share the "name | tagline" format.
  title: `${name} | ${tagline}`,
  shareText: `${name} | ${tagline}.`,
  url: 'https://chipmoji.lionn.us/',
  repository: 'https://github.com/lionnus/chipmoji',
} as const
