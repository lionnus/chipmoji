import { useEffect, useMemo, useRef, useState } from 'react'
import { silimojis, type Silimoji } from './data/silimojis'
import './index.css'

type Filter = 'All' | 'Recommended' | Silimoji['category']
type ViewMode = 'grid' | 'list'
type Theme = 'light' | 'dark'

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

const repositoryUrl = 'https://github.com/lionnus/silimoji'

function App() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [view, setView] = useState<ViewMode>('grid')
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem('silimoji-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [copied, setCopied] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('silimoji-theme', theme)
  }, [theme])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return silimojis.filter((item) => {
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

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>silimoji</h1>
          <p className="tagline">A silicon-flavored emoji guide for hardware development commits.</p>
        </div>
        <div className="header-actions">
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button type="button" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
            {view === 'grid' ? '☰ List' : '▦ Grid'}
          </button>
        </div>
      </header>

      <section className="hero">
        <h2>silimoji</h2>
        <p>
          A curated commit emoji guide for RTL, verification, PPA, Python tooling, scripts, CI, and hardware
          flow infrastructure.
        </p>
        <small>Inspired by Gitmoji. Existing Gitmoji meanings are preserved.</small>
        <pre className="format">{'<intention> [scope?]: <message>'}</pre>
      </section>

      <section className="controls">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search emoji, shortcode, title, description, category, alias, or example"
          aria-label="Search silimojis"
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

      {view === 'grid' ? (
        <section className="cards">
          {visible.map((item) => (
            <article className="item" key={item.shortcode}>
              <div className="emoji">{item.emoji}</div>
              <div className="content">
                <h3>{item.shortcode}</h3>
                <p className="title">{item.title}</p>
                <p>{item.description}</p>
                <div className="badges">
                  <span>{item.category}</span>
                  <span>{item.type}</span>
                  {item.recommended && <span>recommended</span>}
                </div>
                <code>{item.example}</code>
                <div className="copy-row">
                  <button type="button" onClick={() => void copy(item.shortcode)}>
                    Copy shortcode
                  </button>
                  <button type="button" onClick={() => void copy(item.emoji)}>
                    Copy emoji
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="list">
          {visible.map((item) => (
            <article className="dense-item" key={item.shortcode}>
              {item.emoji} {item.shortcode} — {item.title} — {item.category}
            </article>
          ))}
        </section>
      )}

      {copied && <p className="copied">Copied: {copied}</p>}
      <footer className="footer">
        <p>
          Author: Lionnus Kesting · PhD student at ETH Zurich, IIS
          <br />
          Contributions are welcome.
        </p>
      </footer>
    </main>
  )
}

export default App
