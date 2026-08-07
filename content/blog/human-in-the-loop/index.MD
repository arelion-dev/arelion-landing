---
title: "Keeping a human in the loop (KYC)"
date: "2025-12-04T10:20:00.000Z"
description: "An AI-assisted compliance pipeline for onboarding investors into regulated funds. The interesting part is not the OCR, it is the rule that the model is never allowed to block a file."
tags: ["Tech", "AI"]
private: true
---

A compliance team sits and reads investor files by hand: photographed ID cards, rasterized bank details, tax notices of uneven quality, corporate registration extracts. File by file, approve or escalate. The volume climbs every quarter. So someone wires an LLM to read everything and pronounce a verdict, and it works, until the day it approves the wrong one. Now the wrong investor is inside a regulated fund, the approval looks clean, and nobody can explain how it was reached.

I built the decision pipeline for a fintech that onboards investors into regulated funds. The design has one non-negotiable rule: the model is never allowed to block a file.

**68% of clean dossiers now clear with no human touching them.**

**0 silent approvals. Not one.**

**Review time on the routine files dropped by about 70%.**

## A fluent model is not an accountable one

The tempting shortcut is to let an LLM read everything and decide. That is a liability, not a feature. A language model is fluent, not accountable. You cannot audit it line by line, it does not reproduce the same answer twice under pressure, and it invents plausible details when the input is thin. A confidently wrong approval is worse than a blank one: it looks trustworthy while the wrong investor is now inside a regulated fund.

So I did not put the power to decide in the model. My opinion, and the one load-bearing decision in the whole system: the veto lives in deterministic code, never in the model. Everything else follows from that.

## Three roles, never blended

The house rule of the whole project: deterministic transforms belong to code, judgment belongs to the model, and the two never mix. That splits the system into three roles.

**The advisory LLM reads and proposes.** It applies the editable anti-money-laundering policy to the extracted data and can raise a warning or an informational note. It can never fail a dossier. It runs at temperature 0 so the same fields produce the same advisory text, and its output is a small enum, not free prose. If the model disobeys its prompt and returns a `fail`, the code rewrites it to a `warn` and records that it did so. A small model gets to flag things for a human, never to close the door on its own.

```python
# illustrative, not client code
# The model proposes. The code refuses to let it block.
proposal = llm_policy(fields, temperature=0)   # OK | WARN | INFO | (rogue) BLOCK

if proposal.level == "BLOCK":
    # a model that tries to veto is coerced down and the coercion is logged
    proposal = proposal._replace(level="WARN", coerced=True)
```

**Deterministic code is the only thing that can block.** Expired ID, missing piece, address mismatch, low OCR quality: each is a rule in code, not a model call. Field validation is pure. An IBAN is checked with its real ISO 7064 mod-97 checksum, a SIREN or SIRET with Luhn, dates against expiry and recency windows, postal codes and VAT numbers against their formats. No network, no model, no clock beyond the one date I pass in, so the verdict is reproducible and cacheable.

```python
# illustrative, not client code
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

**A human owns everything in doubt.** Confidence routes the uncertainty. When OCR confidence drops below 0.85, the file does not fail, it lands in a Postgres review queue with the reason and the extracted payload attached. That threshold was calibrated on real data: a rasterized scan that produced a wrong date of birth sat around 0.77, clean documents land between 0.94 and 0.998. Below the line the extraction might be wrong while looking valid, so a person checks it. The same guard refuses to run the LLM on an image-only page with no extractable text, rather than let it hallucinate a name.

```python
# illustrative, not client code
if verdict.level == "PASS" and ocr_confidence < 0.85:
    db.execute(
        "INSERT INTO review_queue (dossier_id, reason, ocr_confidence, payload) "
        "VALUES (%s, %s, %s, %s)",
        (dossier_id, "low_ocr_confidence", ocr_confidence, canonical_json(fields)),
    )
    verdict = Verdict("HUMAN", reasons=["low_ocr_confidence"])
```

**OCR confidence under 0.85 routes to a human, every time, no override.**

The blocking layer runs at temperature 0 for exactly one reason: the same file must give the same verdict on every run.

Call it the two-layer verdict. Rough shape (illustrative, not client code):

```python
# illustrative, not client code
code    = code_rules(fields, today)             # PASS | BLOCK, the only real veto
llm     = llm_policy(fields, temperature=0)     # OK | WARN | INFO, advisory only

if code.level == "BLOCK":
    verdict = code                               # code wins, always
elif ocr_confidence < 0.85:
    verdict = Verdict("HUMAN", ["low_ocr_confidence"])
else:
    verdict = Verdict("PASS", notes=llm.notes)   # advisory notes ride along
```

The one opinion I will defend here: keeping the veto in code is what makes the model safe to use at all. The moment the model can block, you inherit its non-determinism, its refusals, and its hallucinations as production outcomes. Keep the veto in code and the model is free to be as clever as it likes, because the worst it can do is add a note.

## The system never guesses a verdict it cannot explain

That is the one property the design refuses to give up. A file the system cannot read does not get a guessed verdict, it gets a human. A warning the model raises wrongly costs a reviewer a glance, not a client. The thing it will never produce is a silent approval that nobody can explain.

Every decision is written once to an append-only log. No `UPDATE`, no `DELETE` granted to the app role. Each row carries the deterministic blockers that fired, the advisory proposal (with the coercion flag), the OCR confidence, a hash of the extracted fields, and the git sha of the ruleset in force at that instant.

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

Because the verdict is a pure function of the fields and the ruleset version, replay is trivial: check out `ruleset_ver`, feed the same fields, get the same `code_reasons` and the same verdict, byte for byte, months later. The advisory text can drift as models change, but it never touched the outcome, so the outcome always reproduces. That is exactly what an auditor asks for.

**Every decision replays byte for byte, months after it was made.**

> **War story.** Early on the log stored a rendered decision string, not the structured inputs. The first audit request came in and I could show what was decided but not re-derive it: the model behind the advisory note had been updated, so re-running produced different prose and the reviewer thought the record had changed. Nothing had, but I could not prove it. The fix was to log the field hash plus the ruleset sha and treat the verdict as a pure function of those two, never of the model. Replay went from "trust me" to a one-line re-execution.

## It improves without retraining

The human decision does not train a model. No reviewer approval flows back into weights, no feedback loop quietly reshapes behavior. A model that learns from reviewers drifts, and drift in a compliance pipeline is an audit finding waiting to happen.

Instead it improves the slow, reliable way. Left alone, the LLM makes the same mistakes over and over: it flags `M MATHIEU BEAUCOURT` against `BEAUCOURT Mathieu` as an identity mismatch, treats the co-holder of a joint account as a suspicious second identity, compares an investment against the wrong figure instead of actual assets. Each recurring false positive becomes a deterministic filter: name comparison settled by token normalization that strips titles, legal forms, and accents; financial capacity compared numerically. An engineer writes the rule, then locks it behind a regression test built from the exact dossier that fooled the model.

```python
# illustrative, not client code
def test_joint_account_coholder_is_not_a_second_identity():
    # regression: reviewer overturned this WARN on 2026-05-14
    fields = load_fixture("joint_account_beaucourt.json")
    proposal = llm_policy(fields, temperature=0)
    assert "second_identity" not in proposal.flags

def test_name_match_strips_titles_and_accents():
    # "M MATHIEU BEAUCOURT" vs "BEAUCOURT Mathieu" is the same person
    assert same_person("M MATHIEU BEAUCOURT", "BEAUCOURT Mathieu")
```

Every fixed bug ships with the test that proves it stays fixed. The intelligence accrues in code you can read, diff, and roll back, not in a model you have to trust. That is the opinion I would put on a whiteboard: a compliance system should get more deterministic over time, not more clever.

## The honest limit: it still needs enough people

The two-layer verdict does not shrink the review team to zero, and it is not meant to. Push the confidence threshold up and more clean files land on human desks for no reason. Push it down and bad extractions slip through as if clean. The 0.85 line is a floor I would rather set too cautious than too loose, which means on a bad batch of scans the human queue grows before the rules catch up. The system trades throughput for auditability on purpose. If you need full automation with nobody in the loop, this is the wrong design.

## Who has this problem

This shape is not specific to fund onboarding. You have the same problem if you approve loans, settle insurance claims from photos and handwritten statements, triage patients, moderate content, screen tenants, or clear suppliers against sanctions lists. Anywhere a machine reads messy documents and a decision follows that someone must answer for, the answer is the same: let the machine read and suggest, keep the decision auditable in deterministic code, and route every doubt to a human who can be held responsible.
