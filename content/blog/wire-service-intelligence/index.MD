---
title: "Wire-service intelligence"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet republished wire dispatches word for word, identical to every rival buying the same feed. I built the editorial AI layer that dedupes the wire, rewrites it in house voice, and links every story into a 500,000-article archive, with the journalist keeping the final click."
tags: ["Tech", "AI"]
private: true
---

Five editors open five wire dispatches on the same event. AFP, Reuters, Bernama, all reporting one minister, one number, one photo. Each editor reads their copy, trims it, ships it. Ten rival sites do the exact same thing with the exact same feed, and by lunch the story is live in ten identical versions. Meanwhile a reader lands from search, reads one page, sees text they could get anywhere, and leaves. Average session: about barely more than one page.

I designed, led and built the editorial AI layer that broke that loop for a national news outlet where **roughly half of everything published came straight off the wire**. The core result: five reads of one dispatch became one, and articles that used to ship with zero internal links now ship with several, into an archive readers had never been able to reach.

## The wire budget bought nothing a rival did not also have

The newsroom paid real money for AFP, Reuters, Bernama, Bloomberg and ETX, then pushed the stories out essentially as received. Same headline, same paragraphs, same photo, on ten different sites. Reselling a commodity feed as-is is a race you can only lose on price.

**A reader can tell when a story is the wire verbatim, and behaves like it: around barely more than one page per visit, then gone.** So I stopped treating the feed as output and started treating it as raw material.

## Clustering by meaning turns five dispatches into one story

When AFP, Reuters and Bernama all move on the same event, the desk should see one story, not five. The system embeds each incoming dispatch and clusters near-identical versions by vector similarity, so semantically identical wires collapse into a single cluster regardless of wording. I call the unit it emits **one-cluster-one-story**: the desk queue holds events, not duplicates.

It then picks the strongest version on concrete criteria (completeness, sourcing, freshness) and drafts a rewrite in the outlet's own voice, angled for its audience rather than for a global wire client. Stories with no local relevance get flagged as skippable.

**The rewrite is a draft, never a publish.** An editor reads it against the original before anything goes live. What this removes is the daily grind of five editors reading the same dispatch five times, and the quieter cost of shipping a text ten other sites carry word for word.

## Backlinking by meaning resurfaces an archive nobody could reach

Every new article is matched against the **500,000+ article archive** by meaning, not keywords, and the system proposes contextual internal links: the profile written when this minister first took office, the investigation from three years ago that this verdict concludes.

**Internal links per article went from roughly zero to several, and pages per visit climbed with it.** A reader at barely more than one page had nowhere to go. Every link is inventory the outlet already owns, resurfaced at the exact moment it is relevant again. Search engines see the same thing readers do: an archive that is connected, not buried.

Illustrative of the match step, clearly labelled as pseudo, not production code:

```text
new_article -> embed()
candidates = archive_index.nearest(embedding, k=40)   # by meaning
links = [c for c in candidates if c.score > threshold
                              and c.entity_overlap(new_article)]
# proposed to the editor, never auto-inserted
```

## The same index doubles as the newsroom's second brain

Twelve years of published record, searchable by meaning. "What did we report on this MP in 2018?" stops being an afternoon of grepping old CMS entries and becomes a question with an answer in seconds.

That changes who can use the archive: not just the veteran who remembers the story, but the junior who joined last month.

## The human keeps the final click, and that boundary is in the architecture

The last brick lives inside the CMS, where the work happens. As a journalist writes, the assistant proposes headlines, summaries, tags and SEO checks. Each suggestion sits next to the field it belongs to. Each one is accepted, edited or ignored with one action.

**Nothing publishes itself.** I was strict about that boundary for a reason: a newsroom's byline is its whole asset, and the moment an unreviewed machine sentence reaches print under that byline, the tool has cost more than it saved. So the division of labour is fixed in code, not in a policy document. The AI does the metadata plumbing. The journalist does the judgement, and keeps the final click.

## The honest limits

The rewrites are good drafts, not finished journalism. On nuanced political stories an editor still reworks them, and should.

Deduplication occasionally merges two stories that deserve separate treatment, or misses a pair phrased too differently. That is exactly why clustering proposes and a human confirms.

And none of this manufactures original reporting. It clears the routine work away from the people who do. The system's ceiling is the newsroom's judgement. That is by design.

## Who has this problem

The pattern travels. If your organisation pays for content or data it republishes largely untouched, you are in this picture.

A newsroom on wire feeds, obviously. But also a content marketing team reworking the same industry sources as every rival. A research desk summarising the same reports its competitors buy. An e-commerce team whose product descriptions come straight from supplier feeds, identical across every marketplace.

In each case the feed is the cost, the differentiation is the work nobody has time for, and the split is the same: let the machine propose against everything you have ever published, and keep a person on the final click. The feed everyone buys stays a commodity. What you do to it before it ships is the business.
