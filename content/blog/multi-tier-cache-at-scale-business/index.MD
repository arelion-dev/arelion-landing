---
title: "Serving 50M requests a day with a multi-tier cache (edge to origin)"
date: "2026-06-12T10:30:00.000Z"
description: "Your servers stay quiet on the busiest day, and a new story is live everywhere within a minute. The caching I built for a national news site."
tags: ["Infrastructure", "Business"]
private: true
---

On your busiest day, your own servers should have the least to do. I build the caching that makes that true: a layer near the reader serves almost every page, and your servers only handle the rare miss.

**Shipped for a national news outlet: on the order of 50 million requests on a busy day, and a published story live everywhere within a minute.**

## What it costs today

If every page view reaches your servers, the bill grows with your audience: the same article is rebuilt thousands of times, with the same database queries each time. The busiest day is also the riskiest. I have watched one mistaken cache setting send the traffic back to the servers, and the database ran near full CPU for the better part of two days before anyone traced it.

## What changes

- **Your servers stay small.** Almost every read is served near the reader, so even a spike costs little.
- **Each page is built once.** Every server reads the same copy, where 90 servers used to rebuild the same page.
- **The archive cache costs pennies.** It sits in object storage; holding it in memory ran into thousands of dollars a month.
- **A bad edit stays small.** The caching rules are snapshotted and every change is checked, so one mistake cannot quietly turn into a two-day incident.

Each rule comes from a real incident. The one-minute freshness window, for example, exists because a longer one once hid a new article for 27 minutes.

One limit: this fits read-heavy sites where the same content is served far more often than it changes, such as news, marketplaces or documentation. A write-heavy app where every user sees different data needs another design.

## What I can do

I can map where your traffic lands today and where one bad setting could take the site down, and send you that in writing.

Want me to look at where your reads land?
