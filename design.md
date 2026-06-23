# Design — Libreville Eats

Locked design system for this app. Every page reads this file before emitting code.
Source brand spec: `Design.md` (Vert Équatorial Gabon).

## Genre
playful

## Macrostructure family
- **Marketing pages:** Index-First — district chips, search-first entry, no stat panels or feature-card grids
- **App pages:** Workbench — compact toolbar header, functional content below, no gradient hero bands
- **Content pages:** Long Document — prose column, minimal chrome

## Theme
- `--color-paper`   oklch(100% 0 0)
- `--color-paper-2` oklch(96.5% 0.003 100)
- `--color-ink`     oklch(22% 0.01 100)
- `--color-ink-2`   oklch(52% 0 0)
- `--color-rule`    oklch(92% 0.003 100)
- `--color-accent`  oklch(62% 0.17 155) — Vert Équatorial
- `--color-accent-ink` oklch(18% 0.04 155) — Vert Encre on buttons
- `--color-focus`   oklch(62% 0.17 155)
- `--color-promo`   oklch(88% 0.18 95) — Jaune Équateur, promos only

## Typography
- Display: Fraunces, weight 600, style normal
- Body: Inter, weight 400–800
- Mono: IBM Plex Mono, weight 400
- Primary buttons: Inter 800 on accent fill

## Spacing
4-point named scale in `frontend/tokens.css`. Use `var(--space-*)` or Tailwind tokens mapped from CSS variables.

## Motion
- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`
- Reveal: none on app pages; opacity-only ≤150ms under `prefers-reduced-motion`
- No universal card lift on hover

## Microinteractions stance
- Silent success; toasts only for errors/async
- Hover tooltips 800ms; focus tooltips 0ms
- Focus rings instant, never animated

## CTA voice
- Primary: pill (`--radius-pill`), accent fill, accent-ink label, weight 800
- Secondary: pill outline, accent text, no fill

## Per-page allowances
- Marketing home MAY use district chip navigation only — no enrichment tiers
- App pages MUST NOT use hero enrichment
- Content pages: typography only

## What pages MUST share
- Wordmark: Libreville Eats (text, accent colour)
- Accent placement ≤5% per viewport
- Fraunces display + Inter body
- Pill CTAs with Vert Encre on-brand labels
- PageToolbar on app routes (no uppercase eyebrows)

## What pages MAY differ on
- Macrostructure within family (Index-First home vs Workbench list/detail)
- Section density per route type

## Nav & footer
- Nav: N13 Inline search pill — search routes to `/restaurants`
- Footer: Ft5 Statement — one closing line + minimal meta

## Exports

See `frontend/tokens.css` for the canonical token block.
