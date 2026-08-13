# Contributing to Chipmoji

Thank you for your interest in `Chipmoji`. This project is a short, curated guide.
Therefore the requirements for a new entry are high. But corrections, better wording,
and entries with a good reason are welcome.

## How to contribute

- **Report a problem** — open a [bug report](https://github.com/lionnus/chipmoji/issues/new/choose)
  for a wrong description, incorrect behaviour, or a spelling error.
- **Propose an entry** — open a [feature request](https://github.com/lionnus/chipmoji/issues/new/choose).
  Give the intent that the current entries do not cover.
- **Send a pull request** — for corrections and for entries that we agreed on.

## Setup

You must have [Node.js](https://nodejs.org/) 20 or later.

```bash
npm install
npm run dev    # local dev server
npm run lint   # lint before you push
npm test       # run the data and export tests
npm run build  # check the types and make the exports
```

## How to change the list

[`src/data/chipmojis.ts`](./src/data/chipmojis.ts) is the only source of the data.

- Do **not** change `public/chipmoji-instructions.txt` or the PDFs. `npm run build`
  makes them from the data file.
- Set `type` correctly. Use `standard gitmoji` if [Gitmoji](https://gitmoji.dev/) has
  the shortcode. Use `chipmoji extension` if it does not. An extension must **not**
  use a shortcode from Gitmoji.
- Keep the meaning of each standard Gitmoji. Do not give a Gitmoji a new meaning.
  Select an unused emoji instead.
- Set `layer` to the part of the project that the change applies to: `hardware`,
  `software`, or `shared`.
- An entry must be an intent, not a subsystem. Tiling, DMA and caches are subsystems.
  They go in the scope, not in the emoji.
- Give an `example` in the commit format: `<intention> [scope?]: <message>`.
- Keep the recommended set small, about 15 entries. It is the set that a new user learns first, and it must cover most day-to-day commits.
- Write the `description` in simple technical English. Use short sentences, the active
  voice, and one idea in each sentence.

## Pull request checklist

- [ ] `npm run lint` and `npm test` give no errors.
- [ ] `npm run build` gives no errors. Commit the files that it makes.
- [ ] You changed the list in `src/data/chipmojis.ts`.
- [ ] Your commit messages use the Chipmoji format.
- [ ] The pull request gives the *intent* of each new entry.

## Commit style

Use the Chipmoji format:

```text
<intention> [scope?]: <message>
```

For example:

```text
:sparkles: data: add an entry for power-domain crossings
:memo: readme: make the export procedure clear
```
