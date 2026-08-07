---
title: "Over a decade of journalism, moved without a blink"
date: "2025-08-28T09:12:00.000Z"
description: "How I moved a 500,000+ article, decade-long legacy CMS onto a new platform with zero downtime. The interesting part is not the new stack, it is the migration playbook that made cutover day boring."
tags: ["Tech", "Migration"]
private: true
---

Over a decade of journalism, trapped on a legacy CMS nobody fully understood anymore. Every product idea the newsroom had, analytics, personalisation, a related-articles rail that actually worked, died the moment it hit that platform. The archive was the most valuable thing the company owned and the one thing engineering was afraid to touch.

I rebuilt the platform of a national news outlet and moved over a decade of it onto a system the company owns and understands. The site never went down. Readers never saw a change of address. The mobile app in their pockets was never updated.

**500,000+ articles and over a decade of the national record, moved with 0 reader-facing downtime.**

The new stack is not the story. Any competent engineer can stand up PostgreSQL 16, an Apollo GraphQL API and a Next.js 14 front end on Cloud Run. The story is how you move over a decade of the national record while it is still being read, still being published to, and still serving traffic every second. That is a migration problem, not a coding problem, and it has a playbook.

## You cannot move what you have not mapped

I started with a map, not with code. A legacy platform is not one system, it is years of accreted subsystems: databases, RSS and stats feeds, sitemaps, mobile endpoints, scheduled publishing, media buckets, cron jobs nobody remembers creating.

I described every one of them and gave each a verdict: rebuild, keep, or let die. That map became the contract for the whole migration. The subsystems that nearly bit me were exactly the undocumented ones: a scheduled-publish cron that fired off a table no code path referenced anymore, and an RSS feed with a fixed URL that a syndication partner had been silently scraping for years. Neither was in any diagram. Both would have broken loudly on cutover if the map had not forced me to find them.

**My rule: you cannot replace a platform you have not fully described, and the parts that bite you on cutover day are always the ones you never wrote down.**

## A continuous mirror turns years into hours

The naive migration copies everything on cutover day. That means the copy takes hours, the source keeps changing under you, and you reconcile a moving target under pressure. Wrong shape. A big-bang copy makes cutover day the single riskiest hour of the whole project, which is exactly backwards: cutover should be the calmest hour, because everything hard already happened.

So I ran a continuous mirror instead. A worker tailed every edit in the legacy CMS and upserted it into the new PostgreSQL database for months while I built. I did not have logical replication available on the legacy database, so the mirror was watermark-based change data capture: poll rows changed since the last high-water mark, transform them into the new schema, upsert idempotently.

```python
# illustrative: one pass of the mirror worker
watermark = load_watermark()            # last synced legacy updated_at
rows = legacy.query(
    "SELECT id, updated_at, payload FROM articles "
    "WHERE updated_at >= %s ORDER BY updated_at ASC", watermark)

for row in rows:
    doc = transform(row["payload"])     # legacy column soup -> new schema
    pg.execute(
        "INSERT INTO articles (legacy_id, slug, body_html, published_at, updated_at) "
        "VALUES (%(legacy_id)s, %(slug)s, %(body_html)s, %(published_at)s, %(updated_at)s) "
        "ON CONFLICT (legacy_id) DO UPDATE SET "
        "  slug = EXCLUDED.slug, body_html = EXCLUDED.body_html, "
        "  published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at",
        doc)
    save_watermark(row["updated_at"])
```

Two details carry the whole thing. The upsert is idempotent (`ON CONFLICT ... DO UPDATE`), so re-running a window is free. And I query with `>=` and overlap each poll window by a few seconds, because multiple articles can share the same `updated_at` to the second. Miss one because a strict `>` skipped its timestamp and you get a silent hole in a decade of archive, the worst kind of bug: invisible until a reader hits a 404 on a story from years ago.

The new stack was always minutes behind the old one, not years. The expensive, slow, error-prone bulk copy happened once, calmly, long before anyone was watching.

**Cutover measured in hours, not months: the switch moved a delta of a few hours of edits, not over a decade of archive.**

## Prove equivalence, never assume it

The riskiest constraint was the mobile app. It was already on readers' phones and could not be updated in step with the migration. So the new GraphQL API had to answer its queries identically to the old one, byte for byte, on responses the app parsed strictly.

"Should be the same" is not an engineering statement. So I built a comparison suite, the parity gate, that replayed real sampled traffic against both stacks and flagged every difference down to a single HTML entity.

```python
def normalize(resp):
    body = json.loads(resp.body)
    body.pop("served_at", None)         # volatile fields the client ignores
    body.pop("request_id", None)
    return json.dumps(body, sort_keys=True, ensure_ascii=False)

def run_parity(sampled_traffic):
    diffs = 0
    for req in sampled_traffic:
        old = call(legacy_api, req)
        new = call(new_api, req)
        if normalize(old) != normalize(new):
            report_diff(req, old, new)   # unified diff, down to one entity
            diffs += 1
    return diffs == 0                    # the run is green only at zero
```

The gate rule was blunt and non-negotiable: three consecutive fully green runs spanning 24 hours before anything flipped. Not one green run. Three, across a full day, so a quiet 3am traffic pattern could not hide a bug the afternoon peak would expose.

> War story. The parity gate lit up red for a full day over two differences that were not bugs in the API at all, they were bugs in my `normalize`. First, the legacy API returned a tag array in insertion order and the new one sorted it, so identical content diffed. Second, the old stack emitted `&amp;` where the new one emitted a bare `&` inside JSON strings, a single entity, in a handful of headlines. Both were semantically equal and both failed the gate. I fixed the normaliser to sort arrays the client treated as unordered and to canonicalise entity encoding, then re-ran. The lesson: your equivalence checker is code too, and a comparison suite that cries wolf is as dangerous as one that stays silent, because you learn to ignore it.

**Tens of millions of pageviews a month kept flowing, and several hundred thousand registered reader accounts carried over with nobody locked out.**

## Cut over in small reversible steps

The cutover was designed to be boring. Not one big flip, but five DNS records moved one at a time on Cloudflare, smallest blast radius first.

1. Statistics feeds (nobody reading notices if these blink)
2. Mobile feeds
3. Media
4. The CMS API
5. The main site, last

The mechanism was a single DNS record change per step, nothing more. A week ahead I lowered the TTL on every record to 60 seconds, so a flip (or a rollback) would propagate in about a minute instead of hours. That TTL change is the unglamorous step people forget, and it is the one that makes rollback fast enough to actually use.

```bash
# illustrative: flip one record forward; TTL already lowered to 60s days earlier
curl -sS -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api.example","content":"new-stack.run.app","ttl":60,"proxied":true}'

# rollback is the exact same call with the legacy target. ~60s to take effect.
```

Each step waited on clean signals (parity gate green, error rate flat, the mirror caught up) before the next began. Each was reversible in about sixty seconds, because rollback was flipping one record back, not restoring a backup. I rehearsed the rollback for every step before I flipped it forward. **A rollback plan you have not run is a wish, not a plan.**

**Editors paused publishing once, for about thirty minutes, during the CMS step. That was the entire visible cost of moving over a decade of journalism.**

On the new platform, related-articles went from broken to working, a feature the legacy stack had quietly given up on years earlier. The rebuild did not just preserve the archive, it made the archive usable again.

## Never touch the legacy system

The single rule that kept the whole thing safe: I never modified the legacy stack. Not a config tweak, not a "small fix while we are in here." Nothing.

The old platform was the way back. As long as it sat untouched and still working, every step forward was reversible, because I could always point DNS back at a system that had not changed. The moment you start "improving" the thing you are migrating off, you lose your escape route and the whole exercise turns into a leap of faith. I refused the leap. This is the one rule I would enforce on any migration with no exceptions: the system you are leaving is frozen the day you start, and it stays frozen until the last DNS record is flipped and green.

## What I would flag as the honest cost

The continuous mirror was throwaway code. I built and maintained a full change-data-capture layer for months that existed only to be deleted on cutover day. For a smaller or less active archive, that cost is not worth it: a single rehearsed bulk copy wins, and the mirror is over-engineering. The mirror earns its keep only when the source never stops changing and the delta at cutover has to be near zero. This project was exactly that case. Not every migration is, and I would talk anyone out of the mirror who does not truly need it.

## Why this transfers

None of this is specific to news. It is what a migration looks like when the thing being moved cannot stop: inventory everything, mirror continuously, prove equivalence with automated comparison instead of optimism, flip in small reversible steps with a rehearsed rollback, and never touch the system you are leaving.

Anyone sitting on a decade of content or data trapped in a legacy platform has this problem with a different logo: a publisher whose archive is its moat, an e-commerce shop with fifteen years of catalog across systems that no longer talk, a public body whose records are precious and unreachable. The data is the asset, the platform is the jailer. The way out is not another plugin. It is a rebuild done carefully enough that the day everything changes, nobody outside the building notices.
