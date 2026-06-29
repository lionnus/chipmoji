import Anthropic from '@anthropic-ai/sdk'
import { chipmojis, type Chipmoji } from './chipmojis'
import type { DiffContext } from './git'
import type { Suggestion } from './heuristic'

const byShortcode = new Map(chipmojis.map((c) => [c.shortcode, c]))

// Compact catalog the model ranks against — one line per chipmoji.
const CATALOG = chipmojis
  .map(
    (c) =>
      `${c.shortcode} (${c.category}) — ${c.title}: ${c.description}` +
      (c.aliases.length ? ` [aliases: ${c.aliases.join(', ')}]` : ''),
  )
  .join('\n')

const SYSTEM_PROMPT = `You are a commit-emoji assistant for "chipmoji", a curated Gitmoji-inspired guide for chip/hardware development commits (RTL, verification, timing closure, PPA, Python tooling, scripts, CI, infrastructure, dependencies, and normal Git work).

Given a git diff, choose the chipmojis that best capture the *intention* of the change. Prefer the single most specific entry; only return multiple when the change genuinely spans concerns. Use ONLY shortcodes from this catalog:

${CATALOG}

Respond with ONLY a JSON object, no prose, of the form:
{"suggestions":[{"shortcode":":bug:","reason":"short why"}]}
Order best first. Every shortcode MUST be copied exactly from the catalog above.`

interface AIResult {
  suggestions?: { shortcode?: string; reason?: string }[]
}

/** Extract the first balanced JSON object from a model response. */
function extractJson(text: string): AIResult | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    return null
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as AIResult
  } catch {
    return null
  }
}

export function resolveApiKey(configuredKey: string): string | undefined {
  return configuredKey.trim() || process.env.ANTHROPIC_API_KEY || undefined
}

/**
 * Ask Claude to rank chipmojis for the diff. Returns null on any failure so the
 * caller can fall back to the offline heuristic.
 */
export async function rankWithClaude(
  context: DiffContext,
  apiKey: string,
  model: string,
  max: number,
): Promise<Suggestion[] | null> {
  try {
    const client = new Anthropic({ apiKey })
    // Keep token cost predictable for an interactive command.
    const diff = context.diff.slice(0, 12_000)
    const fileList = context.files.join('\n')

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            `Pick up to ${max} chipmojis for these ${context.staged ? 'staged' : 'working-tree'} changes, best first.\n\n` +
            `Changed files:\n${fileList}\n\nDiff:\n${diff}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      return null
    }

    const text = response.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') {
      return null
    }

    const parsed = extractJson(text.text)
    if (!parsed) {
      return null
    }
    const seen = new Set<string>()
    const suggestions: Suggestion[] = []
    for (const entry of parsed.suggestions ?? []) {
      const item: Chipmoji | undefined = entry.shortcode ? byShortcode.get(entry.shortcode) : undefined
      if (item && !seen.has(item.shortcode)) {
        seen.add(item.shortcode)
        suggestions.push({ item, score: 0, reasons: entry.reason ? [entry.reason] : [] })
      }
    }
    return suggestions.length ? suggestions.slice(0, max) : null
  } catch {
    return null
  }
}
