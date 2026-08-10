---
title: "Serving 50M requests a day with a multi-tier cache (edge to origin)"
date: "2026-06-12T10:30:00.000Z"
description: "Serve a national-scale news site through breaking-news and election spikes without the cloud bill or the outages, with fresh content live in under a minute. What a multi-tier cache buys you, and why each layer exists."
tags: ["Infrastructure", "Business"]
private: true
---

I make high-traffic content sites fast, cheap to run, and hard to take down. One place absorbs your entire read volume, your servers barely feel the traffic, and a story you publish is live everywhere in under a minute. I run exactly this for a national news outlet: a decade-old archive, breaking news all day, and traffic that spikes hard on elections. On a busy day the edge handles on the order of 50 million requests, and the origin stays quiet.

## What it costs you today

If every page view hits your own servers, three bills come due at once. Compute, because you are re-rendering the same article thousands of times. Database load, because each render hammers the same queries. And reliability, because a spike or a single bad config sends all of it to the origin at once.

I have watched the failure mode in person. One mistaken cache setting bypassed the edge, and the origin database ran near full CPU for the better part of two days before it was traced. That is not a capacity problem you can buy your way out of. It is an architecture problem.

## What you get

- **Your traffic stops reaching your servers.** A content delivery network serves almost every read from a location near the reader. Your origin only handles the rare miss, so it stays small and cheap even under a spike.
- **One render serves everyone.** When a page is built once, every server sees that copy immediately, instead of each one rebuilding the same page. That removes most of the redundant compute that inflates a cloud bill.
- **Fresh in under a minute.** A published story goes live across the whole network within a short, predictable window, and breaking news is pushed live in seconds.
- **A bad day stays a small day.** The caching layer is snapshotted and change-checked, so a mistaken edit cannot quietly turn into a two-day outage.

## Why it holds, and where it came from

Every layer here is the scar tissue of a real failure, which is why it holds up under real traffic.

The shared cache exists because, without it, 90 servers each rebuilt the same page and multiplied the bill. The storage layer moved off in-memory caching because holding a full news archive in memory ran into thousands of dollars a month, and object storage does the same job for pennies. The short, predictable freshness window exists because a long one once hid a just-published article for 27 minutes. And the snapshot-and-check discipline exists because a single unchecked change caused that 45 hour incident.

One honest boundary: this is built for read-heavy sites where the same content is served far more than it changes. That covers news, publishers, marketplaces, and documentation. It is not the right shape for a write-heavy app where every user sees different data.

## Who this is for

Any high-traffic site where readers vastly outnumber editors, and where a traffic spike or a cache mistake currently means a scramble. If your cloud bill climbs with your audience, or a big news day makes you nervous about staying up, that is the problem I solve.

If that sounds like your setup, I am happy to look at where your traffic actually lands today, in writing.
