<div align="center">
  <img src="./public/favicon.svg" width="72" alt="Chipmoji logo" />
  <h1>Chipmoji</h1>
  <p><strong>An emoji guide for chip development commits.</strong></p>

  <p>
    <a href="https://chipmoji.lionn.us/"><img alt="Live site" src="https://img.shields.io/badge/live-chipmoji-863bff" /></a>
    <a href="https://github.com/lionnus/chipmoji/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/lionnus/chipmoji/actions/workflows/ci.yml/badge.svg" /></a>
    <a href="https://codecov.io/gh/lionnus/chipmoji"><img alt="Coverage" src="https://codecov.io/gh/lionnus/chipmoji/branch/main/graph/badge.svg" /></a>
    <a href="https://github.com/lionnus/chipmoji/releases"><img alt="Release" src="https://img.shields.io/github/v/release/lionnus/chipmoji" /></a>
    <a href="./LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue" /></a>
    <img alt="Built with React + Vite" src="https://img.shields.io/badge/react%20%2B%20vite-19-61dafb" />
    <a href="./CONTRIBUTING.md"><img alt="Contributions welcome" src="https://img.shields.io/badge/contributions-welcome-brightgreen" /></a>
  </p>
</div>

---

`Chipmoji` is a commit emoji guide for chip projects. It covers RTL design, timing
closure, PPA, backend implementation, verification, firmware, models and tooling,
build and CI, dependencies, and normal Git work.

`Chipmoji` keeps the meaning of each standard [Gitmoji](https://gitmoji.dev/). Each
Chipmoji extension uses a shortcode that Gitmoji does not use. Therefore you can mix
the two sets.

👉 **[Browse the guide at chipmoji.lionn.us](https://chipmoji.lionn.us/)**

## Table of contents

- [Why?](#why)
- [Hardware, software, shared](#hardware-software-shared)
- [Commit format](#commit-format)
- [How to select an entry](#how-to-select-an-entry)
- [Using the guide](#using-the-guide)
- [Development](#development)
- [How the data flows](#how-the-data-flows)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Why?

Chip commits show intent that software emoji sets do not cover. For example:

- you cut a critical path, or you constrain it instead
- you control backpressure and arbitration
- you change correct RTL because a tool cannot process it
- you add ECC, parity, or other protection against faults
- you regenerate the register interface after a change to the register map
- you change the synthesis, floorplan, or place-and-route flow
- you change the testbench, the stimulus, or the coverage
- you change the bootrom, the runtime, or the golden model together with the RTL

Without entries for these, most commits become 🔧, 🚧, or 🐛. `Chipmoji` gives them a
short visual language instead.

## Hardware, software, shared

A chip repository holds two codebases and the glue between them. The same word can
mean different work on each side. Therefore each entry has a **layer**:

| Layer      | What it covers                                                     |
| ---------- | ------------------------------------------------------------------ |
| `hardware` | RTL, timing, backend, and verification of the design                |
| `software` | firmware, HAL, boot code, models, and tooling                       |
| `shared`   | work that has the same meaning on each side, and build, CI and docs |

You can filter by layer on the site.

## Commit format

```text
<intention> [scope?]: <message>
```

Examples:

```text
:scissors: execute: split the multiplier bypass path
:triangular_ruler: synth: set the io delays to 0.5*TCK
:vertical_traffic_light: axi: propagate the downstream backpressure
:boot: runtime: initialize the core structures at startup
```

## How to select an entry

Three rules make the choice easy.

**The emoji is the verb. The scope is the noun.** Do not look for an entry for the
subsystem that you changed. Put the subsystem in the scope, and use the emoji for
what you did to it:

```text
:sparkles: tiling: support partial tiles in the N dimension
:scissors: tiling: cut the sliding-window comb path
:dna:      tiling: make the tile size configurable
```

**One commit can cross layers.** A treewide rename or an IP integration changes the
RTL, the software and the build at the same time. It is still one intent. Select the
emoji for that intent and use a wide scope:

```text
:electric_plug: treewide: integrate the vector unit into the cluster
:truck:         treewide: add the cc_ prefix to all modules
```

Do not divide such a commit only to give each file a different emoji.

**Do not confuse the change with the measurement.** ⚡ makes the design faster, and
⏱️ measures how fast it is. ✂️ changes the RTL to meet timing, and 📐 constrains it
instead. ✅ is the tests, and 🧫 is the environment that runs them. 🚨 corrects a
warning from a tool, and 👾 works around a limit of that tool.

If two entries still apply, use the more exact one.

## Using the guide

- **Search** the emoji, shortcode, title, description, category, layer, alias, or example.
- **Filter** by category, by layer, or by the `Recommended` set.
- **Click** an emoji or a shortcode to copy it.
- **Download PDF (A4)** for a cheat sheet that you can print.
- **Download TXT** for a plain-text file that you can put in a repository or an editor snippet.

### Keyboard shortcuts

| Key     | Action                           |
| ------- | -------------------------------- |
| `/`     | Focus the search box             |
| `Esc`   | Clear the search                 |
| `Enter` | Copy the first visible shortcode |

## Development

You must have [Node.js](https://nodejs.org/) 20 or later.

```bash
npm install      # install the dependencies
npm run dev      # start the dev server
npm run lint     # run ESLint
npm test         # run the data and export tests
npm run build    # check the types, make the exports, and build to dist/
npm run preview  # preview the production build
```

A push to `main` deploys the site to GitHub Pages. See
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

## How the data flows

[`src/data/chipmojis.ts`](./src/data/chipmojis.ts) is the only source of the data.
`npm run build` makes [`public/chipmoji-instructions.txt`](./public/chipmoji-instructions.txt)
and the two PDFs from it. Change the data file. Do not change the generated files.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). Each release also attaches the TXT and PDF exports on the
[releases page](https://github.com/lionnus/chipmoji/releases).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

Keep the list short and keep it compatible with standard Gitmoji.

## Acknowledgements

Thanks to [Gitmoji](https://gitmoji.dev/) for the inspiration. ❤️

## License

[Apache-2.0](./LICENSE) © Lionnus Kesting

> Made with tape-out procrastination by Lionnus Kesting, PhD student at ETH Zurich, IIS.
