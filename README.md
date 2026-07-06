# Trengo SLA settings — prototype

An interactive prototype of Trengo's SLA (service level agreement) settings:
channel-scoped response-time policies with a plain-language editor.

**▶ Live demo:** https://sittingdesk.github.io/trengo-sla-prototype/

> Prototype only — all data is mock/placeholder and persists in your browser's
> localStorage.

## Highlights

- **Policies overview** — one policy per channel, active-first sorting, a computed
  coverage line that flags channels without an SLA, and toggle/delete straight from
  the list (activation re-checks channel ownership).
- **Policy editor** — Figma-faithful single-card layout: name, channel multi-select
  (channels owned by another active policy are disabled as "Already used"), always-on
  first-reply & resolution targets, business-hours toggle, and a live "in plain terms"
  summary.
- **One channel, one policy** — per-channel exclusivity is enforced at the source
  (picker) with a hard save-block as backstop.

## Stack

Vue 3 + `<script setup>` + TypeScript · Vite · Tailwind CSS v4 (CSS-first) · shadcn-vue
(reka-ui). The production build is a single self-contained `dist/index.html`
(via `vite-plugin-singlefile`).

## Run locally

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + bundle → dist/index.html (open by double-click)
```

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the app and publishes
`dist/` to GitHub Pages.
