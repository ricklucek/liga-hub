# LigaHub Web 2.0 MVP (Light + Glossy)

A lightweight React + Vite + Tailwind project structured for clarity.

## Run locally
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Structure
- `src/components` – UI building blocks (Panel, ToolbarButton, etc.)
- `src/hooks` – reusable hooks (keyboard shortcuts)
- `src/utils` – pure helpers (filters, paginate)
- `src/data` – types and seed data
- `src/styles` – Tailwind setup + Web 2.0 component classes
- `public` – static assets (logo)

## Notes
- Keyboard shortcuts: `/` focus search, `g f` → Feed, `g o` → Forums, `?` help.
- All UI is grayscale/light with subtle gloss. Swap or extend utilities in `src/styles/index.css`.

## Tests
Utility functions include simple assertions inside your own test runner easily; add Vitest if desired.
