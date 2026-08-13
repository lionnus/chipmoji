# Changelog

All notable changes to the Chipmoji guide.

## v1.1.0 — 2026-08-13

- Add data and export tests with coverage, and run them in CI.
- Add a release workflow: a version tag builds the exports and attaches them to a GitHub release.
- Add structured issue forms, a changelog, monthly dependency updates, and status badges.

## v1.0.0 — 2026-08-13

- Add a `layer` field to each entry: `hardware`, `software`, or `shared`. The site can filter on it.
- Add entries: 🛡️ `:shield:`, 👾 `:space_invader:`, 🥾 `:boot:`, 🎛️ `:control_knobs:`,
  📐 `:triangular_ruler:`, 🏭 `:factory:`, 🏙️ `:cityscape:`, 🧫 `:petri_dish:`,
  🕸️ `:spider_web:`, 🕹️ `:joystick:`, 🪞 `:mirror:`, 🐣 `:hatching_chick:`.
- Remove entries that saw no use. Each one is covered by a neighbouring entry.
- Correct the `type` field of entries that are standard Gitmoji. No extension uses a Gitmoji shortcode.
- Restructure the categories into Git, RTL, Timing, PPA, Backend, Verification, Firmware,
  Modeling, Build, Dependencies, and Docs.
- Rewrite each description in simple technical English, and add a short example to each entry.
- Fit each PDF on a single sheet, and show the version in the PDF and TXT exports.

## v0.1.0 — 2026-08-12

- First public version of the guide, the site, and the PDF and TXT exports.
