---
title: "Serving 50M requests a day with a multi-tier cache (edge to origin)"
date: "2026-06-12T10:30:00.000Z"
description: "How I serve a national news site at tens of millions of requests a day for a small bill, with a four-tier cache from the CDN edge down to a GCS-backed ISR handler, and a publish that goes live in under a minute. The part worth writing about is the invalidation."
tags: ["Tech", "AI"]
private: true
---

A national news site can serve on the order of 50 million requests a day while the origin stays quiet. A four-tier cache does that, from the Cloudflare edge down to a GCS-backed ISR handler, and a freshly published article still goes live everywhere in under a minute. The mechanism worth writing about is the invalidation: short TTLs and generational writes, with no active purging.

I run the caching for a national news outlet: a decade-old archive, a firehose of breaking stories, and traffic that spikes hard on elections and big events. The origin barely notices any of it.

**Most reads never reach the origin, and a fresh article is live everywhere in under a minute.**

At this outlet the cache is what stands between a normal Tuesday and a day-long outage. Most of the design below is about surviving failure.

## Four tiers, and the cheapest one that can answer does

The request path has four caches. The design rule: the cheapest layer that can answer, answers.

1. **Cloudflare edge (CDN).** This is where the volume dies. Almost every read is served from a point of presence near the reader, so the origin never sees it. The ruleset is deliberately tiny, three rules: cache is eligible and the edge respects the origin's `CDN-Cache-Control`, `/api/*` bypasses the cache, and `/preview` bypasses it. That is the whole public surface.
2. **Google Cloud Load Balancer**, routing by host to the backend.
3. **Cloud Run running Next.js**, up to ~90 instances. It only runs on a Cloudflare miss, so a cold render is already a rare event by the time we get here.
4. **The ISR page cache**, a custom Next.js cache handler with its own two tiers underneath.

## The ISR handler is L1 in RAM, L2 in object storage

A rendered page is expensive: 2 to 4 seconds of SSR plus a GraphQL fan-out. The handler keeps two layers so it rarely pays that cost twice:

- **L1**, an in-process LRU per Cloud Run instance. Microsecond reads, 200 hot entries, a 30 second TTL.
- **L2**, a Google Cloud Storage bucket shared by every instance. Durable, and a few cents per gigabyte.

L2 used to be Redis. I moved it to GCS because Redis is RAM, and holding a rendered corpus of roughly 700,000 pages in RAM runs into thousands of dollars a month. Object storage holds the same corpus for pennies. The GCS read costs 10 to 50 milliseconds. That sounds slow until you remember it only happens on a Cloudflare miss, and it replaces a 2 to 4 second render. The point at this layer is removing the redundant render. Milliseconds don't matter here.

The shared L2 is what makes 90 instances behave like one. Before it, each instance had its own cache, so a single revalidation warmed one instance and the other 89 kept cold-rendering the same page. GCS is authoritative: a render on any instance overwrites the shared object, and every other instance picks it up on its next miss.

```js
// cache-handler.mjs : L2 (GCS) is authoritative, L1 is a fallback.
async get(key) {
  const local = l1.get(key) ?? null
  const remote = await safeGcs(b => download(b, objectName(key)))  // timeout + circuit breaker
  // Prefer GCS when it exists and is at least as fresh as L1, so every
  // instance converges on the same entry instead of serving its own stale copy.
  if (remote && (!local || remote.lastModified >= local.lastModified)) {
    l1.set(key, remote)
    return remote
  }
  return local // GCS older or unavailable
}
```

Every GCS call is wrapped in a 1 second timeout and a circuit breaker. If the bucket is slow or down, `get`/`set` fall back to L1 or to a plain miss, which just makes Next render fresh. The cache is never on the failure surface of a request.

## Invalidation is short TTLs and generational writes

Here is the opinion the whole thing rests on, straight out of the DHH playbook: the safest cache invalidation is the one you never issue. I don't expire objects. Next stores `lastModified` in each entry and decides staleness itself. On a stale hit it serves the stale value and kicks a background regenerate that overwrites the object. Serve-stale-while-revalidate, for free. Objects live forever, and a GCS lifecycle rule caps the bucket from truly dead articles.

The freshness backstop is a short TTL:

```ts
// constants/isr.ts : short TTLs ARE the correctness mechanism.
export const ISR_CONTENT_REVALIDATE = 30 // every listing + article surface
export const ISR_ERROR_REVALIDATE = 10   // never cache a failure for long
```

Thirty seconds is a deliberate number. It matches the TTL on the per-instance data LRUs a render reads through, which bounds total staleness to about a minute. I learned that number the hard way: a 1500 second window once amplified a 25 second race into 27 minutes of a published article being invisible on the homepage.

For a breaking story I don't want to wait even 30 seconds, so there's one targeted accelerator, added on top and never something correctness depends on:

```ts
// pages/api/revalidate.ts : secret-gated, path-scoped, additive.
const results = await Promise.allSettled(
  validated.map(path => res.revalidate(path))  // re-render here...
)
// ...the cache handler's set() then overwrites the shared GCS object,
// so the refresh reaches all 90 instances on their next miss.
```

It re-renders specific paths on one instance, the handler writes the shared object, and the whole fleet converges. If it fails, the short TTL still corrects the page seconds later. Nothing depends on the push.

To wipe everything at once, I don't purge. I bump a key prefix on the objects, which is generational invalidation: new keyspace, old objects age out via the lifecycle rule. Same instinct as a Rails cache key that carries the record's timestamp, so an update writes a new key instead of expiring an old one.

## Why it is not tag-based

The obvious question is why I don't use tag-based invalidation, attach a `Cache-Tag` to each page and purge by tag when an article changes. The honest answer is the app is on the Next.js Pages Router, and `getStaticProps` passes no ISR tags to the handler, so tag revalidation is a no-op at the shared layer. Cross-instance invalidation is path-based instead. The one place I do model dependencies is the application data cache, where a change to an article id knows which listing and navigation caches depend on it, which is tag-like invalidation one layer down.

> War story. A routine ruleset update, pushed as a full PUT, silently re-enabled a dormant "cache bypass for feed" rule. The edge stopped caching feeds, every feed request fell through to the origin, and the database sat near full CPU for the better part of two days before anyone traced it. The fix was a one line rule flip. The lesson is procedural: never PUT a whole ruleset, diff the enabled rules first, and keep it under a snapshot with a drift check.

## The honest limits

Path-based invalidation means a change that should touch many pages (a category rename, a site-wide widget) leans on the short TTL rather than an instant fan-out. That's fine at a 30 second window and would not be at 30 minutes. The targeted revalidate is best-effort and I treat it that way: it makes breaking news feel instant, and the TTL is what I actually trust. The 1 year edge TTL on old articles means editing a five year old story needs a targeted URL purge, because the edge is holding a copy that won't expire on its own.

## Who has this problem

Anyone serving a large, read-heavy site where traffic is spiky and the content changes constantly: news, publishers, marketplaces, big documentation. The shape is always the same. Push the volume to an edge you rent by the request, make one render serve every instance, keep the freshness net short and generational, and treat active purging as an accelerator you can lose. The expensive mistake is the opposite: an all-origin render path with a fragile purge that turns one bad rule into a day of downtime.
