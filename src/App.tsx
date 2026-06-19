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

// A distinct accent per category, used for the divider line on each entry and
// the category headings in the print sheet. (A true per-emoji color isn't
// feasible without hand-mapping every glyph, so we approximate by category.)
const categoryColors: Record<Chipmoji['category'], string> = {
  Git: '#f59e0b',
  RTL: '#863bff',
  Timing: '#ef4444',
  PPA: '#10b981',
  Verification: '#3b82f6',
  Python: '#eab308',
  Scripts: '#f97316',
  CI: '#14b8a6',
  Docs: '#6366f1',
  Dependencies: '#ec4899',
  Infrastructure: '#64748b',
}

const DownloadIcon = () => (
  <svg
    className="action-icon"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v11" />
    <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
    <path d="M5 20h14" />
  </svg>
)

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

  // Group the currently visible entries by category, preserving first-seen order,
  // for the print sheet.
  const groupedVisible = useMemo(() => {
    const grouped = new Map<Chipmoji['category'], Chipmoji[]>()
    for (const item of visible) {
      const bucket = grouped.get(item.category)
      if (bucket) {
        bucket.push(item)
      } else {
        grouped.set(item.category, [item])
      }
    }
    return [...grouped.entries()]
  }, [visible])

  // Distribute the category groups across a fixed number of explicit columns,
  // balancing by entry count. We build the columns ourselves rather than using
  // CSS multi-column, because multicol prints unreliably on mobile browsers
  // (it can collapse to a single column spread over many pages). Explicit
  // flex columns render identically on every device.
  const printColumns = useMemo(() => {
    const columnCount = 4
    const columns = Array.from({ length: columnCount }, () => ({
      groups: [] as typeof groupedVisible,
      load: 0,
    }))
    for (const group of groupedVisible) {
      const lightest = columns.reduce((a, b) => (b.load < a.load ? b : a))
      lightest.groups.push(group)
      // Approximate the rendered height: one row per entry plus header overhead.
      lightest.load += group[1].length + 2
    }
    return columns.map((column) => column.groups)
  }, [groupedVisible])

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

  // The print sheet is part of the real document and styled via an `@media print`
  // stylesheet, so printing it is just `window.print()`. This avoids the blank/flaky
  // iframe approach, and `@page { margin: 0 }` suppresses the browser's own
  // header/footer (page title, URL, date) in the generated PDF.
  const printSheet = () => window.print()

  return (
    <>
      <main className="app">
        <header className="topbar">
          <h1 className="logo">
            Chip<span>moji</span>
          </h1>
          <p className="tagline">
            An emoji guide for chip development commits.
          </p>
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
            <span className="actions-label">Export</span>
            <button
              type="button"
              className="action primary"
              onClick={printSheet}
              disabled={visible.length === 0}
            >
              <DownloadIcon /> PDF (A4)
            </button>
            <button type="button" className="action secondary" onClick={downloadTxt}>
              <DownloadIcon /> Plain text
            </button>
          </div>
        </section>

        {visible.length === 0 ? (
          <p className="empty">No chipmojis match your search.</p>
        ) : (
          <section className="results">
            {visible.map((item) => (
              <article className="card" key={item.shortcode}>
                <div className="card-head">
                  <button
                    type="button"
                    className="card-emoji"
                    onClick={() => void copy(item.emoji)}
                    title="Copy emoji"
                  >
                    {item.emoji}
                  </button>
                  <button
                    type="button"
                    className="card-code"
                    onClick={() => void copy(item.shortcode)}
                    title="Copy shortcode"
                  >
                    {item.shortcode}
                  </button>
                </div>
                <span className="card-rule" style={{ background: categoryColors[item.category] }} />
                <p className="card-title">{item.title}</p>
                <p className="card-desc">{item.description}</p>
              </article>
            ))}
          </section>
        )}

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

      <div className="print-sheet" aria-hidden="true">
        <header className="print-masthead">
          <h1>
            Chip<span>moji</span>
          </h1>
          <p className="print-tagline">
            An emoji guide for chip development commits.
          </p>
        </header>

        <div className="print-columns">
          {printColumns.map((groups, columnIndex) => (
            <div className="print-col" key={columnIndex}>
              {groups.map(([category, entries]) => {
                const color = categoryColors[category]
                return (
                  <section className="print-group" key={category}>
                    <h2 style={{ color }}>
                      {category}
                      <span className="print-count" style={{ color, background: `${color}1f` }}>
                        {entries.length}
                      </span>
                    </h2>
                    <div className="print-grid">
                      {entries.map((item) => (
                        <div className="print-card" key={item.shortcode}>
                          <div className="print-card-head">
                            <span className="print-emoji">{item.emoji}</span>
                            <code className="print-code">{item.shortcode}</code>
                          </div>
                          <span className="print-rule" style={{ background: color }} />
                          <span className="print-desc">{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ))}
        </div>

        <footer className="print-footer">
          <span>github.com/lionnus/chipmoji</span>
          <span>{'Format: <intention> [scope?]: <message>'}</span>
        </footer>
      </div>
    </>
  )
}

export default App
