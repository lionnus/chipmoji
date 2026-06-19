import { useEffect, useMemo, useRef, useState } from 'react'
import { chipmojis, type Chipmoji } from './data/chipmojis'
import './index.css'

type Filter = 'All' | 'Recommended' | Chipmoji['category']

const filters: Filter[] = [
  'All',
  'Recommended',
  'Git',
  'RTL',
  'Timing',
  'PPA',
  'Verification',
  'Python',
  'Scripts',
  'CI',
  'Docs',
  'Dependencies',
  'Infrastructure',
]

const repositoryUrl = 'https://github.com/lionnus/chipmoji'
const gitmojiUrl = 'https://gitmoji.dev/'
const instructionsTxtUrl = `${import.meta.env.BASE_URL}chipmoji-instructions.txt`
const PRINT_CLEANUP_TIMEOUT_MS = 60_000

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const buildPrintDocument = (items: Chipmoji[]) => {
  const grouped = items.reduce<Map<Chipmoji['category'], Chipmoji[]>>((acc, item) => {
    const bucket = acc.get(item.category)
    if (bucket) {
      bucket.push(item)
    } else {
      acc.set(item.category, [item])
    }
    return acc
  }, new Map())

  const sections = [...grouped.entries()]
    .map(([category, entries]) => {
      const cards = entries
        .map(
          (item) => `
          <div class="card">
            <span class="emoji">${escapeHtml(item.emoji)}</span>
            <div class="meta">
              <code class="code">${escapeHtml(item.shortcode)}</code>
              <span class="desc">${escapeHtml(item.description)}</span>
            </div>
          </div>`,
        )
        .join('')
      return `
        <section class="group">
          <h2>${escapeHtml(category)}<span class="count">${entries.length}</span></h2>
          <div class="grid">${cards}</div>
        </section>`
    })
    .join('')

  const printedOn = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chipmoji — Commit Reference</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #18181b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { padding: 4mm; }
    .masthead {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #863bff;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .masthead h1 { margin: 0; font-size: 22px; letter-spacing: -0.01em; }
    .masthead h1 span { color: #863bff; }
    .masthead .tagline { margin: 2px 0 0; font-size: 11px; color: #71717a; }
    .masthead .stamp { font-size: 10px; color: #a1a1aa; text-align: right; white-space: nowrap; }
    .print-action { margin: 0 0 12px; }
    .print-action button {
      font: inherit;
      border: 1px solid #d4d4d4;
      background: #fff;
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .columns { columns: 3; column-gap: 14px; }
    .group { break-inside: avoid; margin: 0 0 12px; }
    .group h2 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #863bff;
    }
    .group h2 .count {
      font-size: 9px;
      font-weight: 600;
      color: #71717a;
      background: #f4f0ff;
      border-radius: 999px;
      padding: 1px 6px;
    }
    .grid { display: flex; flex-direction: column; gap: 5px; }
    .card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      break-inside: avoid;
    }
    .emoji { font-size: 15px; line-height: 1.2; width: 18px; text-align: center; flex: none; }
    .meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 10px;
      color: #18181b;
      font-weight: 600;
    }
    .desc { font-size: 9.5px; line-height: 1.3; color: #3f3f46; }
    footer {
      margin-top: 8px;
      border-top: 1px solid #e4e4e7;
      padding-top: 6px;
      font-size: 9px;
      color: #a1a1aa;
      display: flex;
      justify-content: space-between;
    }
    @media print { .print-action { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="masthead">
      <div>
        <h1>Chip<span>moji</span></h1>
        <p class="tagline">A silicon-flavored emoji guide for hardware development commits.</p>
      </div>
      <div class="stamp">${escapeHtml(String(items.length))} entries · ${escapeHtml(printedOn)}</div>
    </header>
    <div class="print-action"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
    <div class="columns">${sections}</div>
    <footer>
      <span>github.com/lionnus/chipmoji</span>
      <span>Format: &lt;intention&gt; [scope?]: &lt;message&gt;</span>
    </footer>
  </div>
</body>
</html>`
}

function App() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [copied, setCopied] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return chipmojis.filter((item) => {
      const matchesFilter =
        filter === 'All' || (filter === 'Recommended' ? item.recommended : item.category === filter)
      if (!matchesFilter) {
        return false
      }
      if (!q) {
        return true
      }
      return [
        item.emoji,
        item.shortcode,
        item.title,
        item.description,
        item.category,
        item.example,
        ...item.aliases,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [filter, search])

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1000)
    } catch {
      setCopied('clipboard unavailable')
      window.setTimeout(() => setCopied(''), 1000)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typingInInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (event.key === '/' && !typingInInput) {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape') {
        setSearch('')
        searchRef.current?.blur()
      }

      if (event.key === 'Enter' && !typingInInput && visible.length > 0) {
        void copy(visible[0].shortcode)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])

  const downloadTxt = () => {
    const link = document.createElement('a')
    link.href = instructionsTxtUrl
    link.download = 'chipmoji-instructions.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const openPrintableView = () => {
    const printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.tabIndex = -1
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'

    let cleanupTimeoutId: ReturnType<typeof window.setTimeout> | undefined
    let cleanedUp = false

    const cleanup = () => {
      if (cleanedUp) {
        return
      }
      cleanedUp = true
      if (cleanupTimeoutId) {
        window.clearTimeout(cleanupTimeoutId)
      }
      printFrame.remove()
    }

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow
      if (!frameWindow) {
        cleanup()
        return
      }

      frameWindow.addEventListener('afterprint', cleanup, { once: true })
      frameWindow.focus()
      // Wait two frames so the iframe content is fully rendered before the print dialog opens.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          frameWindow.print()
        })
      })
      cleanupTimeoutId = window.setTimeout(cleanup, PRINT_CLEANUP_TIMEOUT_MS)
    }

    document.body.appendChild(printFrame)
    printFrame.srcdoc = buildPrintDocument(visible)

    if (!printFrame.contentWindow) {
      setCopied('Failed to initialize print preview')
      window.setTimeout(() => setCopied(''), 1000)
      return
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Chipmoji</h1>
      </header>

      <section className="controls">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search emoji, shortcode, title, description, category, alias, or example"
          aria-label="Search chipmojis"
        />
        <p className="hint">/ focus · Esc clear · Enter copy first visible shortcode</p>
        <div className="filters">
          {filters.map((pill) => (
            <button
              key={pill}
              type="button"
              className={pill === filter ? 'active' : ''}
              onClick={() => setFilter(pill)}
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={openPrintableView}>
            Download PDF (A4)
          </button>
          <button type="button" onClick={downloadTxt}>
            Download TXT
          </button>
        </div>
      </section>

      <section className="results">
        {visible.map((item) => (
          <article className="row" key={item.shortcode}>
            <button type="button" onClick={() => void copy(item.emoji)}>
              {item.emoji}
            </button>
            <button type="button" onClick={() => void copy(item.shortcode)}>
              {item.shortcode}
            </button>
            <p>
              <strong>{item.title}</strong> · {item.description}
            </p>
          </article>
        ))}
      </section>

      {copied && <p className="copied">Copied: {copied}</p>}
      <footer className="footer">
        <p>
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub repository
          </a>
        </p>
        <p>
          Thanks to{' '}
          <a href={gitmojiUrl} target="_blank" rel="noreferrer">
            Gitmoji
          </a>{' '}
          for the inspiration ❤️
        </p>
        <p className="footer-credit">Made with tape out procrastination by Lionnus Kesting</p>
      </footer>
    </main>
  )
}

export default App
