---
title: "The archive that became a product"
date: "2026-08-07T10:00:00.000Z"
description: "A national news outlet had twelve years and 600,000 articles doing nothing. I built the machinery that turns that dead archive into a monitored, sellable intelligence product line."
tags: ["Tech", "AI"]
private: true
---

I designed, led and built the machinery that turns a twelve-year news archive into intelligence products. The client is a national news outlet in South-East Asia, sitting on more than 600,000 articles since 2010, the national record, finally gathered in one queryable database and doing nothing with it.

The interesting work here is not the AI. It is turning journalism into something a company will pay for. So I will cover both: the three layers I built, and the commercial logic they exist to serve.

## The archive was dead weight, literally

Not dead as a figure of speech. 66% of tags were used on exactly one article. 24,000 articles had no tag at all. "Related articles" did not work. You could not ask the archive a question, and you could not even browse it properly.

An archive that size is not content. It is a dataset, and a dataset about a country's politics has buyers who are not readers: lobbyists, compliance teams, embassies, investors. The gap between dead weight and sellable product is machinery. That was the brief.

## Layer 1: structure, prose into records

I ran the full archive through an extraction pipeline that turns prose into records. Which politician, which party, which seat, which vote, which statement, said where and when, linked across twelve years.

A sentence in a 2013 article about a backbencher becomes a row that connects to the same person's ministerial appointment in 2019 and to their statement last Tuesday. This is the unglamorous part, and it is where the value sits. Nobody pays for a pile of articles. People pay for this, answered in seconds:

```text
"Everything this person has said about this policy since 2010"
  -> resolved entity -> linked statements, votes, seats -> cited back to source article
```

## Layer 2: monitoring, current without headcount

The archive is not a one-off export. It is fed continuously as the newsroom publishes. New articles land already structured, entities resolved against the existing record, so the dataset stays current without anyone doing data entry.

The tags problem died as a side effect. Tagging stopped being a human chore and became an output of the same pipeline, which also repaired "related articles" for ordinary readers.

## Layer 3: the analyst, drafts with citations

On top of the structured record, the system drafts. A weekly political tracker. Regulatory monitoring notes on what is changing and who is pushing it. Sector briefings. Election intelligence that combines the historical record with live tracking. Plus an internal competitor monitor the newsroom keeps for itself.

Every draft cites the archive it came from. This is junior-analyst work, research and structuring and first prose, which is exactly what the machine does well. What ships is not what the machine wrote. The newsroom's political journalists, who understand this record better than any junior analyst ever could, validate, cut, and add the judgement. The AI does the legwork at a scale you could never staff. The people do the part clients actually trust.

## The commercial logic came first

The engineering exists to serve a model that is public and proven. Politico Pro took the beat a newsroom already covered and sold it to the people whose job depends on it. Today it is roughly half of Politico's revenue, at an average contract around $15,000 a year, with a 93% renewal rate. The Economist Intelligence Unit runs on the same logic.

The mechanism is simple. Someone whose job depends on your information pays many times what a reader pays, and pays it from a company budget. My client's version sells to the same corporate and government buyers it already knows from advertising, on a different budget line, at a margin a campaign cannot approach.

## The honest limit

One limit belongs here, because I put it in the proposal. This outlet's capital is not Washington. Politico Pro sells into the densest lobbying market on earth, and how many seats at that kind of price the local market supports is a commercial question the client reads far better than I can.

What I can say is narrower and more defensible. The raw material exists. The machinery now exists. The model is proven elsewhere. The buyers already spend with this outlet on a different budget line.

## Who has this problem

Anyone who has spent years producing something proprietary, coverage, rulings, filings, market data, member records, technical documentation, is probably monetising it once, at creation, and never again. The archive earns nothing because nobody can ask it anything.

The fix is not a better CMS. It is three things in order: structure, so the corpus can be asked questions; monitoring, so it stays current without headcount; and drafting with human sign-off, so the output carries your credibility and not a chatbot's. The test is one question. Is there someone whose job depends on what you know, with a company budget behind them? If yes, your archive is not a storage cost. It is an unlaunched product.
