# arelion.dev

Landing page for **Arelion** — a one-person boutique tech studio.

Built with Gatsby. Same shape as [antonin.cool](https://antonin.cool), rebranded for the company.

## Develop

```sh
npm install
npm run develop
```

Open http://localhost:8000.

## Deploy

Auto-deploys to GitHub Pages on push to `main` (see `.github/workflows/deploy.yml`).
Custom domain `arelion.dev` is set via `static/CNAME`.

### One-time setup

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. DNS for `arelion.dev`:
   - `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - or `CNAME` `www` → `arelion-dev.github.io`
3. Repo → **Settings → Pages → Custom domain: arelion.dev**, then **Enforce HTTPS**.
