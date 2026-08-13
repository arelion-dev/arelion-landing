---
title: "Serving 50M requests a day with a multi-tier cache (edge to origin)"
date: "2026-06-12T10:30:00.000Z"
description: "Serve a national-scale news site through breaking-news and election spikes without the cloud bill or the outages, with fresh content live in under a minute. What a multi-tier cache buys you, and why each layer exists."
tags: ["Infrastructure", "Business"]
private: true
---

A national news site can absorb on the order of 50 million requests on a busy day while its own servers stay quiet, and a story goes live everywhere within a minute of publishing. I build the caching that makes that normal. One layer near the reader takes almost all the traffic, and the origin only ever handles the rare miss.

## Why this matters to you

If every page view reaches your own servers, your costs and your risk both scale with your audience. You pay to re-render the same article thousands of times, and every render runs the same database queries. A spike or one bad config can send all of that to the origin at once. The busier your best day gets, the closer it sits to your worst one.

## What it costs when it goes wrong

I've watched the failure mode in person. One mistaken cache setting bypassed the edge, and the origin database ran near full CPU for the better part of two days before anyone traced it. You can't buy your way out of that with a bigger server. It's an architecture problem. For a news site the timing makes it worse: the cache tends to break on the high-traffic day it matters most, an election night or a breaking story, when the origin has the least room to absorb the load.

## What actually keeps it up

The fix is architectural, and every part of it comes from a real failure I've had to clean up.

- **Your traffic stops reaching your servers.** A content delivery network serves almost every read from a location near the reader, so the origin stays small and cheap even under a spike.
- **One render serves everyone.** A page built once is seen by every server immediately, instead of 90 servers each rebuilding the same page and multiplying the bill.
- **Fresh in under a minute.** A published story propagates across the network in a short, predictable window, and breaking news is pushed live in seconds.
- **A bad day stays a small day.** The caching layer is snapshotted and change-checked, so a mistaken edit can't quietly become a two-day outage.

Every one of those came from an incident. The shared cache exists because 90 servers were each rebuilding the same page and multiplying the bill. The storage layer moved off in-memory caching because holding a full news archive in memory ran into thousands of dollars a month, where object storage does the same job for pennies. The short freshness window exists because a long one once hid a just-published article for 27 minutes. The snapshot-and-check discipline exists because a single unchecked change caused a 45 hour incident.

One honest boundary: this is built for read-heavy sites where the same content is served far more often than it changes. That covers news, publishers, marketplaces, and documentation. It's the wrong shape for a write-heavy app where every user sees different data.

## What I can do

I can map where your traffic actually lands today and where a single bad config could take the whole site down, then hand that back in writing. Building the layers is a separate engagement, and I've shipped this exact architecture for a national news outlet.

If your bill climbs with your audience, or a big traffic day makes you nervous about staying up, that's the problem I work on. Want me to take a look at where your reads land today, in writing?
