# AI Hallucinations Hall of Fame : candidate entries (curated)

Angle: only failures WE saw in our own production systems, and how WE fixed them. Nothing generic, nothing public, nothing invented.

Titles are business-oriented and deliberately clickbait, in EN and FR. Each entry keeps the real fix + the evidence strength. Systems are anonymized (never name a client or product). Numbers and case ids stay out of the public version.

Status: 16 curated candidates below (docexplo text-to-SQL + KYC + doc indexer + legal agent). All grounded. Most are `documented` (a test/comment/prompt directly captures the real bad output). A few are `inferred-from-guardrail` (the guard exists, Antonin confirms the anecdote). NOTHING here publishes without Antonin's confirmation + any screenshots he adds.

---

## System A : a KYC compliance engine (onboarding investors into regulated funds)

### A1 · `documented` · ties: retrieval-quality
- EN: **An AI Accused 3,000 Clients of Fraud. Every One Was Innocent.**
- FR: **Une IA a accusé 3 000 clients de fraude. Aucun n'était coupable.**
- What happened (EN): fed unclassified documents, the compliance model hallucinated roughly 3,000 "this document belongs to someone else" alerts, the single biggest source of false positives.
- Ce qui s'est passé (FR): nourri de documents non classés, le modèle de conformité a halluciné environ 3 000 alertes "document au nom d'un tiers", premier facteur de faux positifs.
- The fix: only classified document snapshots reach the model. Unclassified files are counted separately by deterministic code and never sent to the LLM.

### A2 · `documented` · ties: human-in-the-loop
- EN: **The AI Read a Birthdate That Was Never on the Page.**
- FR: **L'IA a lu une date de naissance qui n'était pas sur la page.**
- What happened (EN): a low-resolution ID scan (OCR confidence 0.77) produced a plausible but WRONG date of birth. Clean scans sit at 0.94 and up.
- Ce qui s'est passé (FR): un scan d'identité basse résolution (confiance OCR 0.77) a produit une date de naissance crédible mais FAUSSE. Les scans nets sont à 0.94 et plus.
- The fix: an OCR-confidence threshold at 0.85, calibrated on that exact real case, routes the dossier to a human instead of trusting the extracted value.

### A3 · `documented` · ties: output-contracts
- EN: **Your KYC AI Thinks Every Married Couple Is Identity Fraud.**
- FR: **Votre IA KYC prend chaque couple marié pour une fraude à l'identité.**
- What happened (EN): on joint accounts, the model flagged the co-holder or spouse as an identity inconsistency, which is literally the definition of a joint account.
- Ce qui s'est passé (FR): sur les comptes joints, le modèle signalait le co-titulaire ou l'époux comme une incohérence d'identité, ce qui est par définition la nature d'un compte joint.
- The fix: a deterministic filter drops identity findings on joint accounts that mention a co-holder, while keeping genuine cross-person contradictions.

### A4 · `documented` · ties: output-contracts
- EN: **The AI Blocked Millionaires by Comparing Their Wealth to the Wrong Number.**
- FR: **L'IA bloquait des millionnaires en comparant leur patrimoine au mauvais chiffre.**
- What happened (EN): it judged "can this investor afford this?" against one year of income, or the company's share capital, sometimes with the comparison inverted so a covering income still failed.
- Ce qui s'est passé (FR): elle jugeait "cet investisseur peut-il se le permettre ?" face à un an de revenus, ou au capital social, parfois en inversant la comparaison, si bien qu'un revenu suffisant échouait quand même.
- The fix: the numeric comparison moved into code, not the LLM. Deterministic filters drop comparisons made against income, share capital, or profit.

### A5 · `documented` · ties: output-contracts
- EN: **The AI Cited Documents That Didn't Exist, Then Tried to Block the Deal.**
- FR: **L'IA citait des documents inexistants, puis tentait de bloquer le dossier.**
- What happened (EN): the judgment model emitted hard blocks referencing document IDs that were never in the file.
- Ce qui s'est passé (FR): le modèle de jugement émettait des blocages en citant des IDs de documents absents du dossier.
- The fix: a validator rejects unknown document IDs and any hard block. The model is advisory only; blocking stays 100% deterministic.

### A6 · `documented` · ties: human-in-the-loop
- EN: **Hand the AI a Blank Scan and It Invents an Entire Identity.**
- FR: **Donnez un scan blanc à l'IA, elle vous invente une identité entière.**
- What happened (EN): on an image-only page with no extractable text, the extractor fabricated placeholder names and dates out of nothing.
- Ce qui s'est passé (FR): sur une page image sans texte exploitable, l'extracteur fabriquait des noms et des dates placeholder à partir de rien.
- The fix: a pre-check skips the LLM entirely on empty input, writes null fields, and routes the document to human review.

---

## System B : a document intelligence indexer (a business owner's whole document stack)

### B1 · `documented` · ties: output-contracts
- EN: **The AI Filed Every ID Card Under the Wrong Date, Every Time.**
- FR: **L'IA classait chaque pièce d'identité à la mauvaise date, à chaque fois.**
- What happened (EN): on ID documents, it wrote the holder's date of BIRTH into the field meant for the document's issue date.
- Ce qui s'est passé (FR): sur les pièces d'identité, elle écrivait la date de NAISSANCE du porteur dans le champ réservé à la date d'émission.
- The fix: an explicit prompt rule with a worked example, plus a fallback value so the model never substitutes the birth date when the issue date is not visible.

### B2 · `documented` · ties: output-contracts
- EN: **One Corrupt File Made the AI Reject 50 Healthy Ones.**
- FR: **Un seul fichier corrompu, et l'IA en rejetait 50 sains.**
- What happened (EN): a single empty PDF made the model reject the whole batch, so every good file came back with a confidence of zero.
- Ce qui s'est passé (FR): un seul PDF vide faisait rejeter tout le lot, si bien que chaque bon fichier revenait avec une confiance de zéro.
- The fix: batch rejection is detected and each file is re-run solo, so healthy documents still get classified.

### B3 · `documented` · ties: output-contracts
- EN: **Told Exactly Where to File, the AI Invented Its Own Folders Anyway.**
- FR: **Malgré des consignes strictes, l'IA s'inventait quand même ses propres dossiers.**
- What happened (EN): given a closed list of valid folders, it kept scattering documents into invented paths (its own lazy fallback buckets).
- Ce qui s'est passé (FR): face à une liste fermée de dossiers valides, elle éparpillait les documents dans des chemins inventés (ses propres dossiers fourre-tout).
- The fix: a normalization layer rewrites any invalid path back into the canonical taxonomy and logs every correction.

### B4 · `documented` · ties: output-contracts
- EN: **The AI Said "Done" While Silently Corrupting the Database.**
- FR: **L'IA disait "terminé" tout en corrompant la base en silence.**
- What happened (EN): it returned records with only half the fields filled, no error raised, straight into the database.
- Ce qui s'est passé (FR): elle rendait des fiches à moitié remplies, sans lever d'erreur, directement en base.
- The fix: a completeness check rejects the partial output and forces exactly one re-emit with the missing fields.

---

## System C : an AI legal-research agent (chat + contract analysis over a legislation corpus)

### C1 · `documented` · ties: legal-citations
- EN: **A Legal AI Cited a Law That Doesn't Exist.**
- FR: **Une IA juridique citait une loi qui n'existe pas.**
- What happened (EN): analyzing a contract, it attached a citation to a fabricated statute that was never in the retrieved corpus.
- Ce qui s'est passé (FR): en analysant un contrat, elle rattachait une citation à une loi inventée, absente du corpus récupéré.
- The fix: every citation's law id is intersected with the laws actually retrieved. Anything else is forced to null before it can render.

### C2 · `documented` · ties: legal-citations
- EN: **Real Law, Fake Article: The AI That Invents Legal Provisions.**
- FR: **Vraie loi, faux article : l'IA qui invente des dispositions juridiques.**
- What happened (EN): it pinned a finding to a real law but to an article number that does not exist in it.
- Ce qui s'est passé (FR): elle rattachait une conclusion à une vraie loi, mais à un numéro d'article qui n'y existe pas.
- The fix: a database lookup verifies the exact (law, article). If the article is missing, the article number is dropped instead of shown.

### C3 · `documented` · ties: output-contracts
- EN: **When the Model Chokes, It Doesn't Stop, It Makes Things Up.**
- FR: **Quand le modèle plante, il ne s'arrête pas, il invente.**
- What happened (EN): on empty or malformed model output, a naive pipeline would surface garbage compliance findings as real legal analysis.
- Ce qui s'est passé (FR): sur une sortie vide ou malformée, un pipeline naïf ferait passer des conclusions bidon pour une vraie analyse juridique.
- The fix: empty output is treated as a failure, unparseable JSON persists an empty result with a cooldown, and the schema is validated before anything renders. No fabricated findings.

### C4 · `inferred-from-guardrail` · ties: legal-citations
- EN: **"The Law States..." No, That Was Just the AI Guessing.**
- FR: **"La loi dispose que..." Non, c'était juste l'IA qui devinait.**
- What happened (EN): it blurred sourced statute text with its own background knowledge, presenting guesses as law.
- Ce qui s'est passé (FR): elle mélangeait le texte de loi sourcé avec ses propres connaissances, présentant des suppositions comme du droit.
- The fix: a hard prompt contract separates "the law states" (from the database) from "generally" (model knowledge), and forbids inventing law, decree, or article numbers. (Antonin: confirm you saw this live.)

### C5 · `inferred-from-guardrail` · ties: retrieval-quality
- EN: **Ask About Federal Law, Get Dubai Law Dressed Up as the Answer.**
- FR: **Posez une question sur le droit fédéral, recevez du droit local déguisé en réponse.**
- What happened (EN): the corpus covers one jurisdiction only. A query for another returned zero, and the model risked presenting the fallback results as a genuine match.
- Ce qui s'est passé (FR): le corpus ne couvre qu'une juridiction. Une requête pour une autre ne renvoyait rien, et le modèle risquait de présenter le repli comme une vraie correspondance.
- The fix: a "broadened" flag tells the model the jurisdiction matched nothing and these results are the whole library, not a match. (Antonin: confirm you saw this live.)

---

## System D : a text-to-SQL layer over an enterprise document store

### D1 · `documented` · ties: output-contracts
- EN: **The AI Wrote a Database Query That Could Have Deleted Everything.**
- FR: **L'IA a écrit une requête qui aurait pu tout effacer.**
- What happened (EN): asked a question in plain language, the model generated SQL containing write and schema-altering operations.
- Ce qui s'est passé (FR): interrogé en langage naturel, le modèle générait du SQL contenant des opérations d'écriture et de modification de schéma.
- The fix: generated SQL is parsed into a syntax tree and any write, DDL, or dangerous function is rejected. A single-table allowlist and a mandatory row limit are enforced, and the caller's tenant and access rights are injected by rewriting the query, so the model never scopes its own access.

---

## Next
- Antonin confirms which entries we publish, and adds screenshots / the real story where he has them.
- docexplo (text-to-SQL) has more candidates still being mined; append when ready.
- For the public page, strip all real case ids and keep systems anonymized.
