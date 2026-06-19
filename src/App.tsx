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
            A silicon-flavored emoji guide for hardware development commits.
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
            <button type="button" onClick={printSheet} disabled={visible.length === 0}>
              Download PDF (A4)
            </button>
            <button type="button" onClick={downloadTxt}>
              Download TXT
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
            A silicon-flavored emoji guide for hardware development commits.
          </p>
        </header>

        <div className="print-columns">
          {groupedVisible.map(([category, entries]) => (
            <section className="print-group" key={category}>
              <h2>
                {category}
                <span className="print-count">{entries.length}</span>
              </h2>
              <div className="print-grid">
                {entries.map((item) => (
                  <div className="print-card" key={item.shortcode}>
                    <div className="print-card-head">
                      <span className="print-emoji">{item.emoji}</span>
                      <code className="print-code">{item.shortcode}</code>
                    </div>
                    <span className="print-desc">{item.description}</span>
                  </div>
                ))}
              </div>
            </section>
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
