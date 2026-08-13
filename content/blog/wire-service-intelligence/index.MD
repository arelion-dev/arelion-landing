---
title: "Wire-service intelligence"
date: "2025-12-18T14:55:00.000Z"
description: "A national news outlet republished wire dispatches word for word, identical to every rival buying the same feed. I built the editorial AI layer that dedupes the wire, rewrites it in house voice, and links every story into a 500,000-article archive, with the journalist keeping the final click."
tags: ["Tech", "AI"]
private: true
---

I built the editorial AI layer for a national news outlet where **a large share of everything published came straight off the wire**. It dedupes the incoming feed, drafts a rewrite of each story in the outlet's own voice, and links it into a 500,000-article archive, with the journalist keeping the final click. **Five reads of one dispatch collapsed into one, and articles that used to ship with zero internal links now carry several**, pointing into an archive readers had never been able to reach.

The loop it broke is familiar in any newsroom on wire feeds. Five editors open five dispatches on the same event. AFP, Reuters and Bloomberg have all filed the same minister and the same number, down to the same photo, so each editor reads a copy, trims it, and ships it while ten rival sites run the identical feed. By lunch the story is live in ten interchangeable versions, and the reader who arrives from search skims a page they could have pulled up anywhere and leaves. Average session barely clears one page.

## The wire budget bought nothing a rival didn't also have

The newsroom paid real money for AFP, Reuters, Bloomberg and ETX, then pushed the stories out close to as received. The same headline, paragraphs and photo went out on ten sites at once. Reselling a commodity feed untouched is a race you can only lose, and you lose it on price.

**A reader can tell when a story is the wire verbatim, and behaves like it: barely more than one page per visit, then gone.**

So I stopped treating the feed as the output and started treating it as raw material. Everything below shows the technique rather than the outlet's verbatim source.

## Clustering by meaning turns five dispatches into one story

The naive dedup is a hash or a URL match, and it fails on day one: five agencies write one event in five different sentences, so nothing collides. You have to dedup at the level of meaning, because the bytes never line up.

So I embed every incoming dispatch, link the ones that describe the same event, and let the desk see events where it used to see duplicates. I call the unit it emits **one-cluster-one-story**.

The dispatches arrive in more than one language on the same wire, which rules out a monolingual encoder. I used a multilingual sentence encoder, normalized the vectors so a dot product is cosine similarity, then ran union-find over the cosine graph:

```python
# Representative of the dedup step, sanitized.
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("intfloat/multilingual-e5-large")  # 1024-dim

def embed(dispatches: list[str]) -> np.ndarray:
    # e5 wants the "passage:" prefix; normalize so dot product == cosine
    return encoder.encode([f"passage: {d}" for d in dispatches],
                          normalize_embeddings=True)

def cluster(vecs: np.ndarray, threshold: float = 0.86) -> list[list[int]]:
    parent = list(range(len(vecs)))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x
    sim = vecs @ vecs.T                      # cosine, vectors are unit-norm
    for i in range(len(vecs)):
        for j in range(i + 1, len(vecs)):
            if sim[i, j] >= threshold:       # real version also gates on a
                parent[find(i)] = find(j)    # shared time window (see war story)
    groups: dict[int, list[int]] = {}
    for i in range(len(vecs)):
        groups.setdefault(find(i), []).append(i)
    return list(groups.values())
```

That `0.86` carries the whole feature. Set it too low and two different stories that happen to share vocabulary (two verdicts, same court, same week) collapse into one, so the desk never sees the second event. That's silent under-coverage, about the worst failure a newsroom can have. Set it too high and the dedup does nothing at all, and five editors go back to reading five copies.

**The threshold is a product decision disguised as a float.** I tuned it against a labelled week of real wire traffic.

Once a cluster exists, the desk publishes a single member of it, so the system picks the strongest on concrete criteria before it drafts the rewrite:

```python
def pick_lead(cluster_idx: list[int], dispatches: list[Dispatch]) -> Dispatch:
    def score(d: Dispatch) -> tuple:
        return (len(d.named_sources),   # sourcing first
                d.body_len,             # then completeness
                d.filed_at)             # freshness as tiebreak
    return max((dispatches[i] for i in cluster_idx), key=score)
```

From there it drafts a rewrite of that lead in the outlet's own voice, angled for its audience instead of for a global wire client. Stories with no local relevance get flagged as skippable. **The rewrite is only a draft.** An editor reads it against the original before anything goes live.

> War story. A cosine threshold that looked safe merged a breaking story with its own follow-up an hour later, and `pick_lead` discarded the fresher copy that carried the new number that actually mattered. Raising the threshold split genuine duplicates instead, so the fix was a guard the byte-level dedup never needed: dispatches merge only when they share named entities and land inside the same short time window.

## Backlinking by meaning resurfaces an archive nobody could reach

Every new article gets matched by meaning against the **500,000+ article archive**, and the system proposes contextual internal links: the profile written when this minister first took office, or the investigation from years back that this verdict finally closes. Keyword search misses all of it, because the old piece and the new one rarely share exact phrasing, only the subject.

The archive lives in Postgres with pgvector, one row per published article, an HNSW index on the embedding. The candidate fetch is a single ANN query:

```sql
-- Representative. <=> is cosine distance; 1 - distance is similarity.
SELECT id, url, title, 1 - (embedding <=> :new_vec) AS score
FROM articles
WHERE published            -- never link into a draft
  AND id <> :new_id
ORDER BY embedding <=> :new_vec
LIMIT 40;
```

Raw vector similarity on its own proposes links that are plausible and wrong (two unrelated stories that both sound like "a minister announced a budget"). So the candidates get re-ranked through a cheap symbolic guard before anything reaches the editor:

```python
def propose_links(new, candidates, min_score=0.78, max_links=6):
    return [
        c for c in candidates
        if c.score >= min_score
        and c.entities & new.entities     # must share a real named entity
        and c.section != "wire_raw"       # link to the outlet's own reporting rather than the feed
    ][:max_links]
    # surfaced in the editor, never auto-inserted
```

**Internal links per article went from roughly zero to several, and pages per visit climbed with it.**

A reader stuck at one page had nowhere to go. Every link points at inventory the outlet already owns, resurfaced the moment it turns relevant again, so search engines end up seeing what readers see: an archive that's connected once more.

## The same index doubles as the newsroom's second brain

The embeddings that power backlinking double as a semantic search box over the entire published record, more than a decade of it, searchable by meaning. "What did we report on this MP the last time this came up?" stops being an afternoon of grepping old CMS entries and turns into a question you answer in seconds.

That changes who can actually use the archive, since the junior who joined last month now reaches what only the veteran remembered. One index doing two jobs, with no extra infrastructure. **Reusing the backlink embeddings for search was the cheapest decision in the project**, because the expensive part (embed 500,000+ articles once, keep it warm) was already paid for.

## The human keeps the final click, and that boundary is in the architecture

The last brick lives inside the CMS (WordPress), where the work already happens. A separate tool bolted on next to the CMS gets ignored, so I put the assistant right in the editor as a sidebar panel. As a journalist writes, it proposes headlines, summaries, tags, SEO checks and archive backlinks, each suggestion sitting next to the field it targets and accepted, edited or ignored in a single action:

```js
// Representative: a sidebar panel in the CMS (WordPress/Gutenberg).
// Suggestions render next to the field they target; nothing writes on its own.
registerPlugin("wire-assist", {
  render() {
    const { headline, tags, links } = useSuggestions(postId);
    return (
      <PluginSidebar title="Editorial assist">
        <Suggestion
          label="Headline"
          value={headline}
          onAccept={(v) => editor.setTitle(v)}   // one click applies it
          onReject={() => dismiss("headline")}   // logged, feeds ranking
        />
        <LinkSuggestions
          items={links}                          // backlinks from the archive
          onAccept={(l) => editor.insertLink(l)}
        />
      </PluginSidebar>
    );
  },
});
```

Every reject gets logged, and that's how the ranking improves without a training pipeline: a link the desk dismisses ten times stops showing up.

**Nothing publishes itself.** I was strict about that boundary for one reason. A newsroom's byline is its whole asset, and the moment an unreviewed machine sentence reaches print under it, the tool has cost more than it ever saved.

So the division of labour sits in the code, where nobody can quietly ignore it. There's no auto-insert path anywhere. The AI handles the metadata plumbing; the journalist keeps the judgement and the final click.

## What this doesn't do

The rewrites make good drafts and still fall short of finished journalism. On sensitive political stories an editor reworks them, and should.

Deduplication sometimes merges two stories that deserve separate treatment, and sometimes misses a pair phrased too differently to collide. Both failure modes trace back to that single threshold, and no one value kills both, which is exactly why clustering proposes and a human confirms.

The backlink guard is symbolic (shared entities), so it leans on entity extraction. When the extractor misses a name, a good link never gets proposed. I chose that failure direction on purpose, since a missed suggestion is invisible while a wrong one burns the editor's trust.

None of this manufactures original reporting. It clears the routine work away from the people who do that, and the system's ceiling stays the newsroom's judgement. By design.

## Who has this problem

The pattern travels. If you pay for content or data and republish it close to untouched, you're somewhere in this picture.

A newsroom on wire feeds, obviously. A content marketing team reworking the same industry sources as every rival. A research desk summarising the same reports its competitors buy. An e-commerce team whose product descriptions come straight off supplier feeds, identical on every marketplace.

In each case the feed is the shared cost, and the differentiation is the work nobody has time for. The split stays the same: let the machine propose against everything you've ever published, and keep a person on the final click. The feed everyone buys is a commodity, so the only edge is what you do to it before it ships.
