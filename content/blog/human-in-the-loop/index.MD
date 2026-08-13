---
title: "Keeping a human in the loop (KYC)"
date: "2025-12-04T10:20:00.000Z"
description: "An AI-assisted compliance pipeline for onboarding investors into regulated funds. The interesting part is the rule that the model is never allowed to block a file."
tags: ["Tech", "AI"]
private: true
---

The one rule this pipeline never breaks: the model is never allowed to block a file. I built the decision pipeline for a fintech that onboards investors into regulated funds, where the model reads each dossier and proposes an opinion, but the actual call is made by deterministic code, and every file the code can't clear routes to a human who answers for it.

The reason for the rule is what happens without it. A compliance team reads investor files by hand, photographed ID cards, rasterized bank details, tax notices of uneven quality, corporate registration extracts, one file at a time, and the pile gets taller every quarter. Wire an LLM to read the lot and hand down a verdict and it works, right up until the day it approves the wrong one. Now that investor sits inside a regulated fund, the approval reads as clean, and nobody can reconstruct how the system got there.

**68% of clean dossiers now clear with no human touching them.**

**0 silent approvals. Not one.**

**Review time on the routine files dropped by about 70%.**

## A fluent model cannot be held accountable

The tempting shortcut is to let an LLM read everything and decide for itself. That's a liability. A language model hands you fluent text and still nothing you can hold to account. You can't audit it line by line, and it won't return the same answer twice when you lean on it. Feed it a thin input and it fills the gaps with plausible invention. A confidently wrong approval is worse than a blank one, because it looks trustworthy, so nobody ever goes back to check it.

So I kept the power to decide out of the model. That's the one call I'd stake the whole design on: the veto lives in deterministic code, and the model never holds it. Everything else follows from that.

## Three separate roles

The house rule for the whole project: deterministic transforms belong to code, judgment belongs to the model, and the two never touch. That gives you three roles.

**The advisory LLM reads and proposes.** It applies the editable anti-money-laundering policy to the extracted data and can raise a warning or an informational note. What it can't do is fail a dossier. It runs at temperature 0 so identical fields give identical advisory text, and the output is a small enum rather than free prose. If the model ignores its prompt and returns a `fail`, the code quietly rewrites that to a `warn` and records that it did. A small model gets to flag things for a human, but it never gets to close the door itself.

```python
# illustrative only, sanitized
# The model proposes. The code refuses to let it block.
proposal = llm_policy(fields, temperature=0)   # OK | WARN | INFO | (rogue) BLOCK

if proposal.level == "BLOCK":
    # a model that tries to veto is coerced down and the coercion is logged
    proposal = proposal._replace(level="WARN", coerced=True)
```

**Deterministic code is the only thing that can block.** Expired ID, a missing piece, an address that doesn't match, OCR too poor to trust: each one is a rule in code, never a model call. Field validation is pure. An IBAN gets checked against its real ISO 7064 mod-97 checksum, a SIREN or SIRET against Luhn, dates against expiry and recency windows, postal codes and VAT numbers against their formats. It touches no network and no model, and the only clock is the single date I pass in, so the verdict reproduces exactly and caches cleanly.

```python
# illustrative only, sanitized
def valid_iban(raw: str) -> bool:
    s = raw.replace(" ", "").upper()
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", s):
        return False
    rearranged = s[4:] + s[:4]                       # move country + check to the back
    digits = "".join(str(ord(c) - 55) if c.isalpha() else c for c in rearranged)
    return int(digits) % 97 == 1                      # ISO 7064 mod-97

def valid_luhn(number: str) -> bool:                  # SIREN (9), SIRET (14)
    digits = [int(d) for d in number if d.isdigit()]
    total = 0
    for i, d in enumerate(reversed(digits)):
        d = d * 2 if i % 2 == 1 else d
        total += d - 9 if d > 9 else d
    return total % 10 == 0

def not_expired(id_doc, today) -> bool:
    return id_doc.expiry_date is not None and id_doc.expiry_date >= today

def code_rules(fields, today) -> Verdict:
    checks = [
        ("iban_invalid",     not valid_iban(fields.iban)),
        ("siret_invalid",    bool(fields.siret) and not valid_luhn(fields.siret)),
        ("id_expired",       not not_expired(fields.id_doc, today)),
        ("piece_missing",    fields.missing_required()),
        ("address_mismatch", fields.proof_address != fields.declared_address),
    ]
    fired = [name for name, failed in checks if failed]
    return Verdict("BLOCK", reasons=fired) if fired else Verdict("PASS")
```

**A human owns everything in doubt.** When OCR confidence drops below 0.85, the file doesn't fail. It drops into a Postgres review queue with the reason and the extracted payload attached.

That threshold came from real data. A rasterized scan that produced a wrong date of birth sat around 0.77; clean documents land between 0.94 and 0.998. Below the line, an extraction can be wrong while still looking valid, so a person checks it. The same guard refuses to run the LLM on an image-only page with no extractable text, instead of letting it invent a name.

```python
# illustrative only, sanitized
if verdict.level == "PASS" and ocr_confidence < 0.85:
    db.execute(
        "INSERT INTO review_queue (dossier_id, reason, ocr_confidence, payload) "
        "VALUES (%s, %s, %s, %s)",
        (dossier_id, "low_ocr_confidence", ocr_confidence, canonical_json(fields)),
    )
    verdict = Verdict("HUMAN", reasons=["low_ocr_confidence"])
```

**OCR confidence under 0.85 routes to a human, every time, no override.**

The blocking layer runs at temperature 0 for one reason only: the same file has to give the same verdict on every run.

Call it the two-layer verdict, illustrative below rather than client code:

```python
# illustrative only, sanitized
code    = code_rules(fields, today)             # PASS | BLOCK, the only real veto
llm     = llm_policy(fields, temperature=0)     # OK | WARN | INFO, advisory only

if code.level == "BLOCK":
    verdict = code                               # code wins, always
elif ocr_confidence < 0.85:
    verdict = Verdict("HUMAN", ["low_ocr_confidence"])
else:
    verdict = Verdict("PASS", notes=llm.notes)   # advisory notes ride along
```

Here's the opinion I'll defend: keeping the veto in code is the thing that makes the model safe to use at all. The moment a model can block, you inherit its non-determinism and its hallucinations as production outcomes. Leave the veto in code and the model can be as clever as it likes, because the worst it can do is add a note.

## The system never guesses a verdict it cannot explain

That's the one property the design won't give up. When the system can't read a file, it routes to a human instead of guessing. A warning the model raises by mistake costs a reviewer a glance; it never costs a client anything. The one thing it will never emit is a silent approval that nobody can account for.

Every decision gets written once to an append-only log. The app role has no `UPDATE` and no `DELETE`. Each row carries the deterministic blockers that fired, the advisory proposal (with the coercion flag), the OCR confidence, a hash of the extracted fields, and the git sha of the ruleset in force at that instant.

```sql
-- illustrative schema
CREATE TABLE decision_log (
    id            bigserial   PRIMARY KEY,
    dossier_id    text        NOT NULL,
    decided_at    timestamptz NOT NULL DEFAULT now(),
    verdict       text        NOT NULL,   -- PASS | BLOCK | HUMAN
    code_reasons  jsonb       NOT NULL,   -- deterministic blockers that fired
    llm_proposal  jsonb       NOT NULL,   -- advisory level, notes, coerced flag
    ocr_conf      numeric     NOT NULL,
    fields_hash   text        NOT NULL,   -- sha256 of canonical extracted fields
    ruleset_ver   text        NOT NULL    -- git sha of the rules at decision time
);
-- app role has INSERT and SELECT only. No UPDATE. No DELETE.
```

Because the verdict is a pure function of the fields and the ruleset version, replay is trivial. Check out `ruleset_ver`, feed it the same fields, and you get back the same `code_reasons` and the same verdict, byte for byte, months later. The advisory text can drift as models change, but it never touched the outcome, so the outcome always reproduces. That's the exact thing an auditor comes asking for.

**Every decision replays byte for byte, months after it was made.**

> **War story.** Early on the log stored a rendered decision string rather than the structured inputs, so when the first audit request came in I could show what was decided but not re-derive it (the advisory model had been updated and re-running produced different prose). The fix was to log the field hash plus the ruleset sha and treat the verdict as a pure function of those two, independent of the model.

## It improves without retraining

The human decision never trains a model. No reviewer approval flows back into the weights, no feedback loop quietly reshapes behavior. A model that learns from its reviewers drifts, and drift in a compliance pipeline is just an audit finding that hasn't happened yet.

It improves the slow, reliable way instead. Left to itself, the LLM keeps making the same handful of mistakes: it reads `M MATHIEU BEAUCOURT` against `BEAUCOURT Mathieu` as an identity mismatch, treats the co-holder of a joint account as a suspicious second identity, or measures an investment against the wrong figure instead of actual assets.

Each recurring false positive turns into a deterministic filter. Name comparison gets settled by token normalization that strips titles, legal forms and accents; financial capacity gets compared as numbers. I write the rule, then lock it behind a regression test built from the exact dossier that fooled the model.

```python
# illustrative only, sanitized
def test_joint_account_coholder_is_not_a_second_identity():
    # regression: reviewer overturned this WARN on 2026-05-14
    fields = load_fixture("joint_account_beaucourt.json")
    proposal = llm_policy(fields, temperature=0)
    assert "second_identity" not in proposal.flags

def test_name_match_strips_titles_and_accents():
    # "M MATHIEU BEAUCOURT" vs "BEAUCOURT Mathieu" is the same person
    assert same_person("M MATHIEU BEAUCOURT", "BEAUCOURT Mathieu")
```

Every bug I fix ships with the test that proves it stays fixed. The intelligence piles up somewhere you can actually read it and roll it back, in plain code rather than inside a model you're forced to trust. That's what I'd put on a whiteboard: a compliance system should get more deterministic over time, rather than more clever.

## The honest limit: it still needs enough people

The two-layer verdict doesn't shrink the review team to zero, and it was never meant to. Push the confidence threshold up and more clean files pile onto human desks for no reason. Push it down and bad extractions slip through dressed as clean ones.

The 0.85 line is a floor, and I'd rather set it too cautious than too loose, so on a bad batch of scans the human queue swells before the rules catch up. The system trades throughput for auditability, and it does it on purpose. If what you need is full automation with nobody in the loop, this is the wrong design.

## Who has this problem

None of this is specific to fund onboarding. You've got the same problem if you approve loans, settle insurance claims from photos and handwritten statements, triage patients, moderate content, screen tenants, or clear suppliers against sanctions lists. Anywhere a machine reads messy documents and a decision follows that someone has to answer for, the shape of the answer holds: the machine reads and suggests, but the decision that counts stays in deterministic code you can audit, and every genuine doubt routes to a human who answers for it.
