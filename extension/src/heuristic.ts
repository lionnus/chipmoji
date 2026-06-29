import { chipmojis, type Chipmoji } from './chipmojis'
import type { DiffContext } from './git'

export interface Suggestion {
  item: Chipmoji
  score: number
  reasons: string[]
}

// Common words that carry no signal for matching a commit intention.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'without', 'into', 'from', 'that', 'this', 'when',
  'add', 'added', 'update', 'updated', 'change', 'changes', 'changed', 'code',
  'use', 'used', 'using', 'new', 'not', 'has', 'have', 'are', 'was', 'its',
  'general', 'specific', 'standard', 'normal', 'precise', 'work', 'apply',
])

const byShortcode = new Map(chipmojis.map((c) => [c.shortcode, c]))

interface PathSignal {
  re: RegExp
  shortcode: string
  weight: number
  why: string
}

// Strong, chip-development-aware hints keyed off changed file paths.
const PATH_SIGNALS: PathSignal[] = [
  { re: /(^|\/)\.gitignore$/i, shortcode: ':see_no_evil:', weight: 6, why: '.gitignore' },
  { re: /\.github[\\/]workflows[\\/]/i, shortcode: ':construction_worker:', weight: 5, why: 'CI workflow' },
  { re: /(^|\/)(tb_|.*_tb\.)|(^|[\\/])(test_|.*_test\.)|[\\/]tests?[\\/]/i, shortcode: ':white_check_mark:', weight: 4, why: 'test files' },
  { re: /(readme|\.md$)|[\\/]docs?[\\/]/i, shortcode: ':memo:', weight: 3, why: 'docs' },
  { re: /(package(-lock)?\.json|requirements[^\\/]*\.txt|cargo\.(toml|lock)|go\.(mod|sum)|\.lock)$/i, shortcode: ':arrow_up:', weight: 2, why: 'dependency manifest' },
  { re: /\.py$/i, shortcode: ':snake:', weight: 1, why: 'python' },
]

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>()
  for (const match of text.toLowerCase().matchAll(/[a-z][a-z0-9_]{2,}/g)) {
    const token = match[0]
    if (!STOPWORDS.has(token)) {
      tokens.add(token)
    }
  }
  return tokens
}

function pushReason(reasons: string[], reason: string): void {
  if (reasons.length < 4 && !reasons.includes(reason)) {
    reasons.push(reason)
  }
}

/**
 * Rank chipmojis against a diff using keyword overlap with each entry's
 * aliases, title, description and category, plus path-based hints. Pure and
 * offline — no network, deterministic.
 */
export function rankHeuristic(context: DiffContext): Suggestion[] {
  // Cap the corpus so a giant diff stays fast; the front of a diff carries the headers + most context.
  const corpus = `${context.files.join(' ')}\n${context.diff}`.slice(0, 200_000)
  const lower = corpus.toLowerCase()
  const tokens = tokenize(corpus)

  const scores = new Map<string, Suggestion>()
  const ensure = (item: Chipmoji): Suggestion => {
    let s = scores.get(item.shortcode)
    if (!s) {
      s = { item, score: 0, reasons: [] }
      scores.set(item.shortcode, s)
    }
    return s
  }

  for (const item of chipmojis) {
    const s = ensure(item)

    for (const alias of item.aliases) {
      const a = alias.toLowerCase()
      // Multi-word aliases ("critical path") match as a phrase; single words as tokens.
      const hit = a.includes(' ') ? lower.includes(a) : tokens.has(a)
      if (hit) {
        s.score += 5
        pushReason(s.reasons, alias)
      }
    }

    for (const word of tokenize(item.title)) {
      if (tokens.has(word)) {
        s.score += 2
        pushReason(s.reasons, word)
      }
    }

    for (const word of tokenize(item.description)) {
      if (tokens.has(word)) {
        s.score += 1
        pushReason(s.reasons, word)
      }
    }

    if (tokens.has(item.category.toLowerCase())) {
      s.score += 1
    }
  }

  // Apply path-based signals.
  for (const file of context.files) {
    const path = file.replace(/\\/g, '/')
    for (const signal of PATH_SIGNALS) {
      if (signal.re.test(path)) {
        const item = byShortcode.get(signal.shortcode)
        if (item) {
          const s = ensure(item)
          s.score += signal.weight
          pushReason(s.reasons, signal.why)
        }
      }
    }
  }

  // Nudge recommended entries ahead of equally-scored niche ones.
  for (const s of scores.values()) {
    if (s.score > 0 && s.item.recommended) {
      s.score += 0.5
    }
  }

  return [...scores.values()]
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
}
