---
title: "Wire-service intelligence"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet republished wire dispatches word for word, identical to every rival buying the same feed. I built the editorial AI layer that dedupes the wire, rewrites it in house voice, and links every story into a 600k-article archive, with the journalist keeping the final click."
tags: ["Tech", "AI"]
private: true
---

I designed, led and built an editorial AI layer for a national news outlet where 53% of everything published came off the wire: AFP, Reuters, Bernama, Bloomberg, ETX. The newsroom paid real money for those feeds, then pushed the stories out essentially as received. So did every competitor with the same subscriptions. Same headline, same paragraphs, same photo, on ten different sites.

The wire budget bought the newsroom nothing its rivals did not also have. My job was to turn that same feed, and a twelve-year archive, into something only this outlet has.

## The commodity trap

A reader can tell when a story is the wire verbatim, and behaves like it: around 1.5 pages per visit, drive-by traffic from search or social that leaves at once. Meanwhile the archive, more than 600,000 articles of national record, sat almost unused. New pieces rarely linked into it, and nobody could search it by meaning.

Reselling a commodity feed as-is is a race you can only lose on price. So I stopped treating the feed as output and started treating it as raw material.

## Brick 1: wire intelligence

When AFP, Reuters and Bernama all move on the same event, the desk should see one story, not five. The system clusters near-identical versions with embeddings, so semantically identical dispatches collapse into a single cluster regardless of wording.

It then picks the strongest version on concrete criteria (completeness, sourcing, freshness) and drafts a rewrite in the outlet's own voice, angled for its audience rather than for a global wire client. Stories with no local relevance get flagged as skippable.

The rewrite is a draft. An editor reads it against the original before anything goes live. What this removes is the daily grind of five editors reading the same dispatch five times, and the quieter cost of shipping a text ten other sites carry word for word.

## Brick 2: backlinking by meaning

Every new article is matched against the 600k+ archive by meaning, not keywords, and the system proposes contextual internal links: the profile written when this minister first took office, the investigation from three years ago that this verdict concludes.

A reader at 1.5 pages per visit is a reader with nowhere to go. Every link is inventory the outlet already owns, resurfaced at the exact moment it is relevant again. Search engines see the same thing readers do: an archive that is connected, not buried.

Illustrative of the match step, clearly labelled as pseudo, not production code:

```text
new_article -> embed()
candidates = archive_index.nearest(embedding, k=40)   # by meaning
links = [c for c in candidates if c.score > threshold
                              and c.entity_overlap(new_article)]
# proposed to the editor, never auto-inserted
```

## Brick 3: the newsroom second brain

The same index doubles as a second brain for the desk. Twelve years of published record, searchable by meaning. "What did we report on this MP in 2018?" stops being an afternoon of grepping old CMS entries and becomes a question with an answer in seconds.

That changes who can use the archive: not just the veteran who remembers the story, but the junior who joined last month.

## Brick 4: the in-CMS assistant

The last brick lives inside the CMS, where the work happens. As a journalist writes, the assistant proposes headlines, summaries, tags and SEO checks. Each suggestion sits next to the field it belongs to. Each one is accepted, edited or ignored with one action.

Nothing publishes itself. I was strict about that boundary for a reason: a newsroom's byline is its whole asset, and the moment an unreviewed machine sentence reaches print under that byline, the tool has cost more than it saved.

So the division of labour is fixed in the architecture, not in a policy document. The AI does the metadata plumbing. The journalist does the judgement, and keeps the final click.

## The honest limits

The rewrites are good drafts, not finished journalism. On nuanced political stories an editor still reworks them, and should.

Deduplication occasionally merges two stories that deserve separate treatment, or misses a pair phrased too differently. That is exactly why clustering proposes and a human confirms.

And none of this manufactures original reporting. It clears the routine work away from the people who do. The system's ceiling is the newsroom's judgement. That is by design.

## Who has this problem

The pattern travels. If your organisation pays for content or data it republishes largely untouched, you are in this picture.

A newsroom on wire feeds, obviously. But also a content marketing team reworking the same industry sources as every rival. A research desk summarising the same reports its competitors buy. An e-commerce team whose product descriptions come straight from supplier feeds, identical across every marketplace.

In each case the feed is the cost, the differentiation is the work nobody has time for, and the split is the same: let the machine propose against everything you have ever published, and keep a person on the final click. The feed everyone buys stays a commodity. What you do to it before it ships is the business.
