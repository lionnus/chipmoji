<div align="center">
  <img src="./public/favicon.svg" width="72" alt="Chipmoji logo" />
  <h1>Chipmoji</h1>
  <p><strong>An emoji guide for chip development commits.</strong></p>

  <p>
    <a href="https://chipmoji.lionn.us/"><img alt="Live site" src="https://img.shields.io/badge/live-chipmoji-863bff" /></a>
    <a href="./LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue" /></a>
    <img alt="Built with React + Vite" src="https://img.shields.io/badge/react%20%2B%20vite-19-61dafb" />
    <a href="./CONTRIBUTING.md"><img alt="Contributions welcome" src="https://img.shields.io/badge/contributions-welcome-brightgreen" /></a>
  </p>
</div>

---

`Chipmoji` is a curated, Gitmoji-inspired commit emoji guide for RTL, verification, timing
closure, PPA, Python tooling, scripts, CI, infrastructure, dependencies, and normal Git
workflow.

It preserves standard Gitmoji meanings and adds hardware-specific entries for critical-path
cuts, CDC, backpressure, datapaths, arbitration, PPA, debug visibility, board bring-up, and
IP/tool updates.

👉 **[Browse the guide at chipmoji.lionn.us](https://chipmoji.lionn.us/)**

## Table of contents

- [Why?](#why)
- [Commit format](#commit-format)
- [Using the guide](#using-the-guide)
- [Development](#development)
- [How the data flows](#how-the-data-flows)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Why?

Hardware commits often describe intent that normal software-focused commit emojis do not
capture well:

- cutting a critical path
- fixing CDC
- propagating backpressure
- reducing area
- reducing power
- adding probes or waveform visibility
- updating included IPs
- changing RTL interfaces
- improving simulation and synthesis scripts

`Chipmoji` gives those changes a compact visual language.

## Commit format

```text
<intention> [scope?]: <message>
```

Examples:

```text
:scissors: execute: split multiplier bypass path
:bridge_at_night: uart: synchronize rx_valid into core clock
:rightwards_pushing_hand: axi: propagate downstream backpressure
:chart_with_downwards_trend: decode: share immediate extraction logic
```

## Using the guide

- **Search** across emoji, shortcode, title, description, category, alias, or example.
- **Filter** by category or by the curated `Recommended` set.
- **Click** any emoji or shortcode to copy it to the clipboard.
- **Download PDF (A4)** for a print-ready, landscape cheat sheet grouped by category.
- **Download TXT** for a plain-text reference you can drop into a repo or editor snippet.

### Keyboard shortcuts

| Key     | Action                           |
| ------- | -------------------------------- |
| `/`     | Focus the search box             |
| `Esc`   | Clear the search                 |
| `Enter` | Copy the first visible shortcode |

## VS Code extension

The [`extension/`](./extension) folder contains a VS Code extension that proposes the correct
chipmoji from your staged changes and autocompletes shortcodes in the Source Control commit
box. Ranking runs offline by default; an optional Claude-powered mode refines the pick by
reading the diff. It reuses the same single source of truth as the website — see
[`extension/README.md`](./extension/README.md).

## Development

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run lint     # run ESLint
npm run build    # type-check, regenerate the TXT export, and build to dist/
npm run preview  # preview the production build locally
```

The site is deployed to GitHub Pages automatically on every push to `main`
via [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

## How the data flows

The single source of truth is [`src/data/chipmojis.ts`](./src/data/chipmojis.ts). The plain-text
export at [`public/chipmoji-instructions.txt`](./public/chipmoji-instructions.txt) is generated
from it by [`scripts/generate-chipmoji-txt.mjs`](./scripts/generate-chipmoji-txt.mjs) and is
regenerated automatically on `npm run build`. Edit the data file, never the generated TXT.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

Keep the list curated, intentional, and compatible with standard Gitmoji meanings.

## Acknowledgements

Thanks to [Gitmoji](https://gitmoji.dev/) for the inspiration. ❤️

## License

[Apache-2.0](./LICENSE) © Lionnus Kesting

> Made with tape-out procrastination by Lionnus Kesting, PhD student at ETH Zurich, IIS.
