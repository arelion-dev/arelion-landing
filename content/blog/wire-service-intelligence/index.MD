---
title: "Wire-service intelligence"
date: "2025-12-18T14:55:00.000Z"
description: "A national news outlet republished wire dispatches word for word, identical to every rival buying the same feed. I built the editorial AI layer that dedupes the wire, rewrites it in house voice, and links every story into a 500,000-article archive, with the journalist keeping the final click."
tags: ["Tech", "AI"]
private: true
---

Five editors open five wire dispatches on the same event. AFP, Reuters, Bloomberg, all reporting one minister, one number, one photo. Each editor reads their copy, trims it, ships it. Ten rival sites do the exact same thing with the exact same feed, and by lunch the story is live in ten identical versions. Meanwhile a reader lands from search, reads one page, sees text they could get anywhere, and leaves. Average session: barely more than one page.

I designed, led and built the editorial AI layer that broke that loop for a national news outlet where **a large share of everything published came straight off the wire**. The core result: five reads of one dispatch became one, and articles that used to ship with zero internal links now ship with several, into an archive readers had never been able to reach.

## The wire budget bought nothing a rival did not also have

The newsroom paid real money for AFP, Reuters, Bloomberg and ETX, then pushed the stories out essentially as received. Same headline, same paragraphs, same photo, on ten different sites. Reselling a commodity feed as-is is a race you can only lose on price.

**A reader can tell when a story is the wire verbatim, and behaves like it: barely more than one page per visit, then gone.** So I stopped treating the feed as output and started treating it as raw material. Everything below is representative of the technique, not the outlet's verbatim source.

## Clustering by meaning turns five dispatches into one story

The naive dedup is a hash or a URL match. It fails on the first day: five agencies write the same event in five different sentences, so nothing collides. You have to dedup by meaning, not by bytes. I embed every incoming dispatch and link the ones that are semantically the same event, then let the desk see events instead of duplicates. I call the unit it emits **one-cluster-one-story**.

The dispatches are multilingual (AFP moves French and English on the same wire), so a monolingual encoder is out. I used a multilingual sentence encoder, normalized the vectors so a dot product is cosine similarity, and ran union-find over the cosine graph:

```python
# Representative of the dedup step, not verbatim client code.
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

That `0.86` is the whole ballgame. Set it too low and two different stories that share vocabulary (two verdicts, same court, same week) collapse into one, so the desk never sees the second event: silent under-coverage, the worst failure a newsroom can have. Set it too high and the dedup does nothing, and five editors keep reading five copies. **The threshold is a product decision disguised as a float.** I tuned it against a labelled week of real wire traffic, not by eyeballing it.

Once a cluster exists, the desk publishes one member, so the system picks the strongest on concrete criteria before drafting the rewrite:

```python
def pick_lead(cluster_idx: list[int], dispatches: list[Dispatch]) -> Dispatch:
    def score(d: Dispatch) -> tuple:
        return (len(d.named_sources),   # sourcing first
                d.body_len,             # then completeness
                d.filed_at)             # freshness as tiebreak
    return max((dispatches[i] for i in cluster_idx), key=score)
```

It then drafts a rewrite of that lead in the outlet's own voice, angled for its audience rather than for a global wire client. Stories with no local relevance get flagged as skippable. **The rewrite is a draft, never a publish.** An editor reads it against the original before anything goes live.

> War story. A cosine threshold that looked safe merged a breaking story with its own follow-up an hour later: same event, same names, near-identical lede, but the follow-up carried the new number that actually mattered. `pick_lead` then discarded the fresher copy as a duplicate. Raising the threshold started splitting genuine duplicates instead, so that was the wrong fix. The right one was a guard the byte-level dedup never needed: dispatches only merge when they share named entities AND land inside the same short time window. Meaning alone was not enough.

## Backlinking by meaning resurfaces an archive nobody could reach

Every new article is matched against the **500,000+ article archive** by meaning, not keywords, and the system proposes contextual internal links: the profile written when this minister first took office, the investigation from years ago that this verdict concludes. Keyword search misses all of it, because the old piece and the new one rarely share the exact phrasing, only the subject.

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

Raw vector similarity alone proposes plausible-but-wrong links (two unrelated stories that both sound like "a minister announced a budget"). So the candidates get re-ranked with a cheap symbolic guard before anything reaches the editor:

```python
def propose_links(new, candidates, min_score=0.78, max_links=6):
    return [
        c for c in candidates
        if c.score >= min_score
        and c.entities & new.entities     # must share a real named entity
        and c.section != "wire_raw"       # link to our own reporting, not the feed
    ][:max_links]
    # surfaced in the editor, never auto-inserted
```

**Internal links per article went from roughly zero to several, and pages per visit climbed with it.** A reader at barely more than one page had nowhere to go. Every link is inventory the outlet already owns, resurfaced at the exact moment it is relevant again. Search engines see the same thing readers do: an archive that is connected, not buried.

## The same index doubles as the newsroom's second brain

The embeddings that power backlinking are also a semantic search box over the whole published record. Over a decade of it, searchable by meaning. "What did we report on this MP in 2018?" stops being an afternoon of grepping old CMS entries and becomes a question with an answer in seconds.

That changes who can use the archive: not just the veteran who remembers the story, but the junior who joined last month. One index, two products, zero extra infrastructure. **Reusing the backlink embeddings for search was the highest-leverage decision in the project**, because the expensive part (embed 500,000+ articles once, keep it warm) was already paid for.

## The human keeps the final click, and that boundary is in the architecture

The last brick lives inside the CMS (WordPress), where the work actually happens. Bolting a separate tool next to the CMS guarantees it gets ignored, so I put the assistant in the editor as a sidebar panel. As a journalist writes, it proposes headlines, summaries, tags, SEO checks and the archive backlinks. Each suggestion sits next to the field it targets, and each one is accepted, edited or ignored with one action:

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

Every reject is logged, which is how the ranking gets better without a training pipeline: a link the desk dismisses ten times stops being proposed.

**Nothing publishes itself.** I was strict about that boundary for a reason: a newsroom's byline is its whole asset, and the moment an unreviewed machine sentence reaches print under that byline, the tool has cost more than it saved. So the division of labour is fixed in code, not in a policy document. There is no auto-insert path, anywhere. The AI does the metadata plumbing. The journalist does the judgement, and keeps the final click.

## The honest limits

The rewrites are good drafts, not finished journalism. On nuanced political stories an editor still reworks them, and should.

Deduplication occasionally merges two stories that deserve separate treatment, or misses a pair phrased too differently. Both failure modes come straight from that one threshold, and no single value removes both. That is exactly why clustering proposes and a human confirms.

The backlink guard is symbolic (shared entities), so it depends on entity extraction. When the extractor misses a name, a good link never gets proposed. I chose that failure direction on purpose: a missed suggestion is invisible, a wrong one wastes the editor's trust.

And none of this manufactures original reporting. It clears the routine work away from the people who do. The system's ceiling is the newsroom's judgement. That is by design.

## Who has this problem

The pattern travels. If your organisation pays for content or data it republishes largely untouched, you are in this picture.

A newsroom on wire feeds, obviously. But also a content marketing team reworking the same industry sources as every rival. A research desk summarising the same reports its competitors buy. An e-commerce team whose product descriptions come straight from supplier feeds, identical across every marketplace.

In each case the feed is the cost, the differentiation is the work nobody has time for, and the split is the same: let the machine propose against everything you have ever published, and keep a person on the final click. The feed everyone buys stays a commodity. What you do to it before it ships is the business.
