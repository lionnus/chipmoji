import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { chipmojis } from '../src/data/chipmojis'

const repoRoot = resolve(__dirname, '..')
const outputPath = resolve(repoRoot, 'public/chipmoji-instructions.txt')
const { version } = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))

let output = ''

beforeAll(() => {
  execFileSync('node', ['scripts/generate-chipmoji-txt.mjs'], { cwd: repoRoot })
  output = readFileSync(outputPath, 'utf8')
})

describe('TXT export', () => {
  it('contains one line per entry', () => {
    for (const c of chipmojis) {
      expect(output).toContain(`${c.shortcode} ${c.emoji} | ${c.title} |`)
    }
  })

  it('shows the version in the header', () => {
    expect(output).toContain(`v${version}`)
  })

  it('shows the layer of every entry', () => {
    for (const c of chipmojis) {
      const line = output.split('\n').find((l) => l.startsWith(`${c.shortcode} `))
      expect(line, c.shortcode).toContain(`| ${c.layer} |`)
    }
  })
})
