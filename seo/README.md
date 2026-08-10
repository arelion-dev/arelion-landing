# SEO automation

One command, one report. `node seo/audit.mjs` runs an on-page audit plus, once
configured, real Google Search Console rankings and Core Web Vitals. Output goes
to `seo/reports/report-<date>.md` and stdout.

## On-page audit (works now, no setup)

```
node seo/audit.mjs
```

Checks every published case study: title length, meta description length, body
word count, OG image, FAQ schema, and whether the target query from
`seo/targets.json` actually appears in the title, description and intro.

## Search Console rankings (one-time setup)

This is the only manual step, because it is your Google account.

1. In GCP project `alfred-499305` (or any), enable the Search Console API.
2. Create a service account, download its JSON key to
   `~/.config/arelion/gsc-sa.json` (keep it out of the repo).
3. In Search Console (search.google.com/search-console), add the service
   account email as a user on the `arelion.dev` property (Settings > Users and
   permissions, Full or Restricted).
4. Export the env and run:

```
export GSC_SA_KEY=~/.config/arelion/gsc-sa.json
export GSC_SITE="sc-domain:arelion.dev"   # or https://arelion.dev/
node seo/audit.mjs
```

The report then adds real queries, positions, clicks, and a "striking distance"
list (queries ranking 5 to 20, the fastest wins to push).

## Core Web Vitals (optional)

```
export PSI_API_KEY=<PageSpeed Insights API key>
node seo/audit.mjs
```

## Editing what you target

`seo/targets.json` holds the verticals and the primary/secondary query per page.
Edit it to change what the audit measures coverage against.
