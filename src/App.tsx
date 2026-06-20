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
const siteUrl = 'https://chipmoji.lionn.us/'
const gitmojiUrl = 'https://gitmoji.dev/'
const instructionsTxtUrl = `${import.meta.env.BASE_URL}chipmoji-instructions.txt`
const pdfLandscapeUrl = `${import.meta.env.BASE_URL}chipmoji-a4-landscape.pdf`
const pdfPortraitUrl = `${import.meta.env.BASE_URL}chipmoji-a4-portrait.pdf`

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

const ShareIcon = () => (
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
    <path d="M12 15V3" />
    <path d="m7.5 7 4.5-4.5L16.5 7" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

const StarIcon = () => (
  <svg
    className="action-icon"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    aria-hidden="true"
  >
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9z" />
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

  const share = async () => {
    const data = {
      title: 'Chipmoji',
      text: 'An emoji guide for chip development commits.',
      url: siteUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(siteUrl)
      setCopied('link copied')
      window.setTimeout(() => setCopied(''), 1000)
    } catch {
      // The user dismissed the share sheet, or sharing is unavailable; ignore.
    }
  }

  return (
    <main className="app">
        <header className="topbar">
          <h1 className="logo">
            Chip<span>moji</span>
          </h1>
          <p className="tagline">
            An emoji guide for chip development commits.
          </p>
        </header>

        <nav className="toolbar" aria-label="Actions">
          <a className="action primary" href={pdfLandscapeUrl} download>
            <DownloadIcon /> PDF (landscape)
          </a>
          <a className="action secondary" href={pdfPortraitUrl} download>
            <DownloadIcon /> PDF (portrait)
          </a>
          <a className="action secondary" href={instructionsTxtUrl} download>
            <DownloadIcon /> Plain text
          </a>
          <button type="button" className="action secondary" onClick={() => void share()}>
            <ShareIcon /> Share
          </button>
          <a className="action secondary star" href={repositoryUrl} target="_blank" rel="noreferrer">
            <StarIcon /> Star on GitHub
          </a>
        </nav>

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
  )
}

export default App
