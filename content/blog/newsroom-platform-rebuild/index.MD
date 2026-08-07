---
title: "Twelve years of journalism, moved without a blink"
date: "2026-08-07T10:00:00.000Z"
description: "How I moved a 600k-article, twelve-year legacy CMS onto a new platform with zero downtime. The interesting part is not the new stack, it is the migration playbook that made cutover day boring."
tags: ["Tech", "Migration"]
private: true
---

I rebuilt the platform of a national news outlet: twelve years of continuous publishing, 600k+ articles, 50M+ pageviews a month, all trapped on an aging WordPress stack nobody fully understood anymore. The site never went down. Readers never saw a change of address. The mobile app in their pockets was never updated.

The new stack is not the story. Any competent engineer can stand up PostgreSQL, a GraphQL API and a CMS. The story is how you move a decade of the national record while it is still being read, still being published to, and still serving traffic every second. That is a migration problem, not a coding problem, and it has a playbook.

## Inventory before you touch anything

I started with a map, not with code. A legacy platform is not one system, it is years of accreted subsystems: databases, RSS and stats feeds, sitemaps, mobile endpoints, scheduled publishing, media buckets, cron jobs nobody remembers creating.

I described every one of them and gave each a verdict: rebuild, keep, or let die. That map became the contract for the whole migration. You cannot replace a platform you have not fully described, and the parts that bite you on cutover day are always the ones you never wrote down.

## Mirror the content continuously

The naive migration copies everything on cutover day. That means the copy takes hours, the source keeps changing under you, and you reconcile a moving target under pressure. Wrong shape.

Instead I ran a continuous sync: every edit in the legacy CMS mirrored into the new PostgreSQL database for months while I built. The new stack was always minutes behind the old one, not years. So cutover moved a delta of a few hours, not twelve years. The expensive, slow, error-prone bulk copy happened once, calmly, long before anyone was watching.

## Prove equivalence, do not assume it

The riskiest constraint was the mobile app. It was already on readers' phones and could not be updated in step with the migration. So the new API had to answer its queries identically to the old one, byte for byte.

"Should be the same" is not an engineering statement. So I built an automated comparison suite that replayed the same requests against both stacks and flagged every difference down to a single HTML entity.

```text
for request in sampled_traffic:
    old = call(legacy_api, request)
    new = call(new_api, request)
    if normalize(old) != normalize(new):
        report_diff(request, old, new)   # down to one HTML entity
```

The rule was blunt and non-negotiable: three consecutive fully green runs spanning 24 hours before anything flipped. Not one green run. Three, across a full day, so a quiet 3am pattern could not hide a bug the afternoon traffic would expose.

## Cut over in small reversible steps

The cutover was designed to be boring. Not one big flip, but five DNS records moved one at a time, smallest blast radius first.

1. Statistics feeds (nobody reading notices if these blink)
2. Mobile feeds
3. Media
4. The CMS API
5. The main site, last

Each step waited on clean signals before the next began. Each was reversible in about sixty seconds, because rollback was flipping one record back, not restoring a backup. I rehearsed the rollback for every step before I flipped it forward. A rollback plan you have not run is a wish, not a plan.

The entire visible cost of moving twelve years of journalism: editors paused publishing for roughly half an hour, once, during the CMS step.

## Never touch the legacy system

The single rule that kept the whole thing safe: I never modified the legacy stack. Not a config tweak, not a "small fix while we are in here." Nothing.

The old platform was the way back. As long as it sat untouched and still working, every step forward was reversible, because I could always point DNS back at a system that had not changed. The moment you start "improving" the thing you are migrating off, you lose your escape route and the whole exercise turns into a leap of faith. I refused the leap.

## Why this transfers

None of this is specific to news. It is what a migration looks like when the thing being moved cannot stop: inventory everything, mirror continuously, prove equivalence with automated comparison instead of optimism, flip in small reversible steps with a rehearsed rollback, and never touch the system you are leaving.

Anyone sitting on a decade of content or data trapped in a legacy platform has this problem with a different logo: a publisher whose archive is its moat, an e-commerce shop with fifteen years of catalog across systems that no longer talk, a public body whose records are precious and unreachable. The data is the asset, the platform is the jailer. The way out is not another plugin. It is a rebuild done carefully enough that the day everything changes, nobody outside the building notices.
