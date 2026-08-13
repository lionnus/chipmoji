import { describe, expect, it } from 'vitest'
import { chipmojis } from '../src/data/chipmojis'
import officialGitmojis from './gitmojis-official.json'

const official = new Set(officialGitmojis)

describe('data integrity', () => {
  it('has no duplicate shortcodes', () => {
    const codes = chipmojis.map((c) => c.shortcode)
    expect(codes).toEqual([...new Set(codes)])
  })

  it('has no duplicate emoji', () => {
    const emoji = chipmojis.map((c) => c.emoji)
    expect(emoji).toEqual([...new Set(emoji)])
  })

  it('formats every shortcode as :name:', () => {
    for (const c of chipmojis) {
      expect(c.shortcode).toMatch(/^:[a-z0-9_]+:$/)
    }
  })

  it('fills every field', () => {
    for (const c of chipmojis) {
      expect(c.emoji.length).toBeGreaterThan(0)
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.description.length).toBeGreaterThan(0)
      expect(c.example.length).toBeGreaterThan(0)
      expect(c.aliases.length).toBeGreaterThan(0)
    }
  })
})

describe('gitmoji compatibility', () => {
  it('marks every official shortcode as standard gitmoji', () => {
    for (const c of chipmojis.filter((c) => official.has(c.shortcode))) {
      expect(c.type, c.shortcode).toBe('standard gitmoji')
    }
  })

  it('gives no extension an official shortcode', () => {
    for (const c of chipmojis.filter((c) => c.type === 'chipmoji extension')) {
      expect(official.has(c.shortcode), c.shortcode).toBe(false)
    }
  })

  it('marks no unofficial shortcode as standard gitmoji', () => {
    for (const c of chipmojis.filter((c) => c.type === 'standard gitmoji')) {
      expect(official.has(c.shortcode), c.shortcode).toBe(true)
    }
  })
})

describe('style', () => {
  it('starts every example with the entry shortcode', () => {
    for (const c of chipmojis) {
      expect(c.example.startsWith(`${c.shortcode} `), c.shortcode).toBe(true)
    }
  })

  it('ends every description with a period', () => {
    for (const c of chipmojis) {
      expect(c.description.endsWith('.'), c.shortcode).toBe(true)
    }
  })

  it('keeps every description sentence at 25 words or fewer', () => {
    for (const c of chipmojis) {
      for (const sentence of c.description.split(/(?<=\.)\s+/)) {
        const words = sentence.trim().split(/\s+/).length
        expect(words, `${c.shortcode}: "${sentence}"`).toBeLessThanOrEqual(25)
      }
    }
  })

  it('keeps every alias lowercase', () => {
    for (const c of chipmojis) {
      for (const alias of c.aliases) {
        expect(alias, c.shortcode).toBe(alias.toLowerCase())
      }
    }
  })
})

describe('curation', () => {
  it('keeps the set small', () => {
    expect(chipmojis.length).toBeLessThanOrEqual(70)
  })

  it('recommends at most 40 entries', () => {
    expect(chipmojis.filter((c) => c.recommended).length).toBeLessThanOrEqual(40)
  })

  it('covers every category', () => {
    const categories = new Set(chipmojis.map((c) => c.category))
    for (const category of [
      'Git', 'RTL', 'Timing', 'PPA', 'Backend', 'Verification',
      'Firmware', 'Modeling', 'Build', 'Dependencies', 'Docs',
    ]) {
      expect(categories.has(category as never), category).toBe(true)
    }
  })

  it('covers every layer', () => {
    const layers = new Set(chipmojis.map((c) => c.layer))
    expect(layers).toEqual(new Set(['hardware', 'software', 'shared']))
  })
})
