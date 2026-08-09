---
title: "Over a decade of journalism, moved without a blink"
date: "2025-08-28T09:12:00.000Z"
description: "How I moved a 500,000+ article, decade-long legacy CMS onto a new platform with zero downtime. The migration playbook that made cutover day boring is the real story."
tags: ["Tech", "Migration"]
private: true
---

Over a decade of journalism sat trapped on a legacy CMS that nobody fully understood anymore. Every product idea the newsroom had (analytics, personalisation, a related-articles rail that actually worked) died the moment it touched that platform. The archive was the most valuable thing the company owned, and it was also the one system engineering wouldn't go near.

I rebuilt the platform for a national news outlet and moved over a decade of it onto a system the company owns and understands. Through the whole thing the site stayed up, readers never saw a change of address, and the mobile app already in their pockets was never touched.

**500,000+ articles and over a decade of the national record, moved with 0 reader-facing downtime.**

The new stack is the easy part. Any competent engineer can stand up PostgreSQL 16, an Apollo GraphQL API and a Next.js 14 front end on Cloud Run. What's hard is moving over a decade of the national record while it's still being read and published to every second of the day. That's a migration problem, and migration has a playbook.

## You can't move what you haven't mapped

I drew a map before writing any code. A legacy platform is years of subsystems piled on top of each other: databases, RSS and stats feeds, sitemaps, mobile endpoints, scheduled publishing, media buckets, and cron jobs nobody remembers creating.

I described every one of them and handed each a verdict: rebuild, keep, or let it die. That map became the contract for the whole migration.

The subsystems that nearly bit me were the undocumented ones. A scheduled-publish cron fired off a table no code path referenced anymore, and an RSS feed on a fixed URL had been quietly scraped by a syndication partner for years. Neither showed up in any diagram, and both would have broken loudly on cutover if the map hadn't forced me to go find them.

**My rule: you can't replace a platform you haven't fully described, and the parts that bite you on cutover day are always the ones you never wrote down.**

## A continuous mirror turns years into hours

The naive migration copies everything on cutover day. The copy takes hours, the source keeps changing under you, and you end up reconciling a moving target under pressure. That's backwards. A big-bang copy turns cutover into the riskiest hour of the entire project, when it should be the calmest, because by then everything hard has already happened.

So I ran a continuous mirror instead. For months while I built, a worker tailed every edit in the legacy CMS and upserted it into the new PostgreSQL database. Logical replication wasn't available on the legacy database, so the mirror fell back to watermark-based change data capture: poll the rows changed since the last high-water mark, transform them into the new schema, and upsert idempotently.

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

Two details carry the whole thing.

The upsert is idempotent (`ON CONFLICT ... DO UPDATE`), so re-running a window costs nothing. I also query with `>=` and overlap each poll window by a few seconds, because several articles can share the same `updated_at` down to the second. Skip one because a strict `>` jumped past its timestamp and you've got a silent hole in the archive, the worst kind of bug there is: invisible until a reader hits a 404 on a story from years back.

The new stack was never more than a few minutes behind the old one. The slow, error-prone bulk copy happened exactly once, calmly, long before anyone was watching.

**Cutover measured in hours: the switch moved a delta of a few hours of edits, because over a decade of archive was already in place.**

## Prove equivalence, never assume it

The riskiest constraint was the mobile app. It was already sitting on readers' phones and couldn't be updated in step with the migration, so the new GraphQL API had to answer its queries identically to the old one, byte for byte, on responses the app parsed strictly.

"Should be the same" isn't an engineering statement. So I built a comparison suite, the **parity gate**, that replayed real sampled traffic against both stacks and flagged every difference down to a single HTML entity.

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

The gate rule was blunt and non-negotiable: three consecutive fully green runs across 24 hours before anything flipped. Not one green run, three, spread over a full day, so a quiet 3am traffic pattern couldn't hide a bug that the afternoon peak would expose.

> War story. The parity gate lit up red for a full day over two differences that were not bugs in the API at all. They were bugs in my `normalize`. First, the legacy API returned a tag array in insertion order and the new one sorted it, so identical content diffed. Second, the old stack emitted `&amp;` where the new one emitted a bare `&` inside JSON strings, one entity, in a handful of headlines. Both were semantically equal. Both failed the gate. I fixed the normaliser to sort arrays the client treats as unordered and to canonicalise entity encoding, then re-ran. The lesson: your equivalence checker is code too, and a suite that cries wolf is as dangerous as one that stays silent, because you learn to ignore it.

**Tens of millions of pageviews a month kept flowing, and several hundred thousand registered reader accounts carried over with nobody locked out.**

## Cut over in small reversible steps

The cutover was designed to be boring. I moved five DNS records one at a time on Cloudflare, smallest blast radius first.

1. Statistics feeds (nobody reading notices if these blink)
2. Mobile feeds
3. Media
4. The CMS API
5. The main site, last

The mechanism was a single DNS record change per step, nothing more. A week ahead I dropped the TTL on every record to 60 seconds, so a flip (or a rollback) would propagate in about a minute instead of hours. That TTL change is the unglamorous step everyone forgets, and it's the one that makes rollback fast enough to actually use.

```bash
# illustrative: flip one record forward; TTL already lowered to 60s days earlier
curl -sS -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api.example","content":"new-stack.run.app","ttl":60,"proxied":true}'

# rollback is the exact same call with the legacy target. ~60s to take effect.
```

Each step waited on clean signals (parity gate green, error rate flat, the mirror caught up) before the next one began. Each was reversible in about sixty seconds, because a rollback meant flipping one record back, not restoring a backup. I rehearsed the rollback for every step before I ever flipped it forward. **A rollback plan you haven't run is only a wish.**

**Editors paused publishing once, for about thirty minutes, during the CMS step. That was the entire visible cost of moving over a decade of journalism.**

On the new platform, related-articles started working again, something the legacy stack had quietly given up on years earlier. The rebuild kept the archive intact and made it useful once more.

## Never touch the legacy system

One rule kept the whole thing safe: I never modified the legacy stack. No config tweak, no "small fix while I'm in here," nothing at all.

The old platform was the way back. As long as it sat untouched and still working, every step forward stayed reversible, because I could always point DNS at a system that hadn't changed. The moment you start "improving" the thing you're migrating off, you lose your escape route and the whole exercise turns into a leap of faith.

I refused the leap. This is the one rule I'd enforce on any migration without exception: the system you're leaving is frozen the day you start, and it stays frozen until the last DNS record is flipped and green.

## The continuous mirror was throwaway code, and most migrations should skip it

I built and maintained a full change-data-capture layer for months, and it existed only to be deleted on cutover day. For a smaller or quieter archive, that cost isn't worth paying: a single rehearsed bulk copy wins, and the mirror is just over-engineering.

The mirror earns its keep on exactly one condition: the source never stops changing, so the delta at cutover has to be near zero. This project was that case. Most aren't, and I'd talk anyone out of the mirror who doesn't genuinely need it.

## This is what a migration looks like when the thing can't stop

None of this is specific to news. You inventory everything, then mirror continuously if the source never stops. You prove equivalence with automated comparison instead of optimism, and you flip in small reversible steps, each with a rehearsed rollback behind it. And you never touch the system you're leaving.

Anyone sitting on years of content or data trapped in a legacy platform has this exact problem with a different logo on it: the publisher whose archive is its moat, the e-commerce shop with a long catalog split across systems that no longer talk to each other, the public body whose records are precious and unreachable.

The data is the asset; the platform is the jailer. The way out is a rebuild done carefully enough that on the day everything changes, nobody outside the building notices.
