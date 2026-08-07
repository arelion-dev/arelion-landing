---
title: "The research agent that doesn't give up"
date: "2026-08-07T10:00:00.000Z"
description: "An AI that answers questions from your own documents, cites a source on every line, and does not stop until it has answered all of your question, not just the easy part."
tags: ["AI", "Business"]
private: true
---

I designed and built a research agent for a global beauty group. It answers questions over the company's own documents: R&D lab reports, patents, signed contracts. Decades of them, a dozen languages, most of it trapped in scans nobody can search.

The point of this piece is not the technology. It is one business risk that most AI projects ship straight into production without noticing, and what it takes to remove it.

## The expensive failure

Ask a normal AI assistant to "compare our four shampoo bases" and it will confidently describe two of them and stop. The answer reads as finished. It is missing half the question.

That is the dangerous case. A blank answer, people double-check. A confident, well-written, half-complete answer, they trust and act on. A formulation decided on partial data, a contract clause quoted from the wrong file, a regulatory constraint that sat on page 40 of a dossier nobody reopened: the cost is real, and it is invisible until it is not.

## What this one does differently

It refuses to answer a multi-part question until it has covered every part.

When you ask about four things, the agent writes down the four parts, researches each one on its own, and is not allowed to hand you the answer while any part is still open. Where the documents are silent, it says so, in words, instead of quietly dropping that part. You get one line per item, each with a clickable source to the exact page, and an honest "no data found" where the corpus has nothing.

![How it stays honest on a multi-part question](assets/perseverance-loop.png)

## Why you can trust the answer

Three things separate this from a demo:

- **It answers from your documents, never from memory.** Every claim carries a citation to the exact page. If it cannot cite it, it does not say it.
- **It only ever sees what you are cleared to see.** Two people from two teams ask the same question and get answers drawn from two different slices of the corpus. Access is enforced on the data, not promised in a policy.
- **It shows its work.** You watch it list the parts of your question, search each one, and tick them off. The diligence is visible, not a claim on a slide.

## Measured, not asserted

"The AI got better" is worth nothing without proof, so the improvement is measured against a graded set of real questions with verified answers. There is a switch that turns the diligence off, which lets us run the exact same questions with and without it and read the difference directly. That is the gap between believing it improved and knowing it did.

## Who has this problem

Any organization sitting on a decade of documents nobody can search has the first half of this: pharma and cosmetics dossiers, banking contract and KYC files, legal clause libraries, insurance claims in five formats.

And anyone whose AI already gives answers that look complete but are not has the second half, the expensive one. That is the part almost nobody builds, because it does not show up in a demo. It shows up in the decision someone made three weeks later on half an answer.

If your teams redo work that already exists, or act on a question the tool only half-answered because it sounded sure, this is the shape of the fix. Want me to look at yours, in writing?
