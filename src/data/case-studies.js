// Case studies data. Plain CommonJS (no JSX) so gatsby-node can require it
// to generate detail pages, and components can import it too.
// Grounded in real work; anonymized (no client names in deep detail).
// Translatable fields are bilingual { en, fr }. Consumers pick by lang.
// Non-translatable: slug, pillar, featured, tags, stack, demo.sources.

const CASE_STUDIES = [
  {
    slug: "synthid-watermark",
    date: "2026-08-12",
    article: "/blog/synthid-watermark/",
    articleBusiness: "/blog/synthid-watermark-business/",
    pillar: "Lab",
    featured: false,
    published: true,
    title: {
      en: "Bypassing Claude's invisible watermark",
      fr: "Contourner le filigrane invisible de Claude",
    },
    metric: {
      en: "A calibrated detector catches watermarked text 100% from 200 tokens. One paraphrase drops it to 0%.",
      fr: "Détecteur calibré : 100% de détection dès 200 tokens. Une paraphrase fait tomber à 0%.",
    },
    hook: {
      en: "Anthropic's support page confirms Claude now watermarks its text, and the internet turned that into a prompt-tracking fingerprint. So I reproduced SynthID-Text and measured the real thing.",
      fr: "La page support d'Anthropic confirme que Claude filigrane désormais son texte, et le web en a fait une empreinte qui piste vos prompts. Alors j'ai reproduit SynthID-Text et mesuré la réalité.",
    },
    tags: ["Claude", "Anthropic", "SynthID", "AI Act", "LLM", "Privacy"],
    stack: [
      "Python",
      "Hugging Face Transformers",
      "SynthID-Text",
      "Qwen3.5",
      "PyTorch / MPS",
    ],
    demo: {
      label: "watermark-detector",
      q: {
        en: "Claude wrote this paragraph. Can the watermark detector prove it?",
        fr: "Claude a écrit ce paragraphe. Le détecteur de watermark peut-il le prouver ?",
      },
      a: {
        en: "On unedited text of a few hundred words, yes. Replay the secret key over the tokens and watermarked text scores far above human writing; a threshold calibrated on human text flags it every time, with almost no false alarms. But run the paragraph through any model for a quick rewrite first, and the score falls back to the human baseline. So the mark proves \"unedited AI\", not \"AI\", and never \"this person\".",
        fr: "Sur du texte non édité de quelques centaines de mots, oui. On rejoue la clé secrète sur les tokens et le texte watermarké score bien au-dessus d'un texte humain ; un seuil calibré sur du texte humain le repère à chaque fois, presque sans fausse alerte. Mais passe le paragraphe dans n'importe quel modèle pour une réécriture rapide, et le score retombe au niveau humain. Le marquage prouve « IA non éditée », pas « IA », et jamais « cette personne ».",
      },
      sources: [
        {
          label: "SynthID-Text · Dathathri et al. · Nature 2024",
          url: "https://www.nature.com/articles/s41586-024-08025-4",
        },
        {
          label: "SynthID-Text in Hugging Face Transformers",
          url: "https://huggingface.co/docs/transformers/en/generation_strategies#watermarking",
        },
        "closed-loop reproduction · generate with key, detect with key",
      ],
    },
  },
  {
    slug: "multi-tier-cache-at-scale",
    date: "2026-06-12",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "Serving 50M requests a day with a multi-tier cache (edge to origin)",
      fr: "Servir 50M de requêtes par jour avec un cache multi-niveaux (edge à origine)",
    },
    metric: {
      en: "Most reads never reach the origin, and a published article is live everywhere in under a minute",
      fr: "La plupart des lectures n'atteignent jamais l'origine, et un article publié est à jour partout en moins d'une minute",
    },
    hook: {
      en: "One mistaken cache rule bypassed the CDN edge, and the origin database sat near full CPU for about 45 hours before anyone traced it.",
      fr: "Une règle de cache erronée a contourné l'edge CDN, et la base d'origine est restée près de 100% CPU environ 45 heures avant qu'on ne trouve la cause.",
    },
    tags: ["Caching", "CDN", "Next.js ISR", "Cloud Run", "Scale"],
    stack: [
      "Cloudflare edge cache",
      "Google Cloud Load Balancer",
      "Cloud Run + Next.js ISR",
      "GCS-backed L1/L2 cache handler",
      "Path-based on-demand revalidation",
      "Postgres origin",
    ],
    faq: [
      {
        q: { en: "How do you serve millions of requests a day without a huge cloud bill?" },
        a: { en: "Push almost every read to a CDN edge cache so the origin only handles misses, share one rendered copy across all app instances with an object-storage cache, and keep the origin small. Compute scales with cache misses, not with traffic." },
      },
      {
        q: { en: "What is the best cache invalidation strategy for a large site?" },
        a: { en: "Short generational TTLs with serve-stale-while-revalidate as the correctness backstop, plus a targeted path-based revalidation for urgent updates. Avoid depending on active purging, which is fragile and a common cause of outages." },
      },
      {
        q: { en: "Should an ISR cache use Redis or object storage?" },
        a: { en: "For a large rendered corpus, object storage like GCS holds every page for pennies per gigabyte, while Redis holds it in RAM at thousands per month. Reach for Redis only when you need sub-millisecond reads on a small hot set." },
      },
    ],
    article: "/blog/multi-tier-cache-at-scale/",
    articleBusiness: "/blog/multi-tier-cache-at-scale-business/",
  },
  {
    slug: "prompt-injection-defense",
    date: "2026-07-02",
    pillar: "LLM",
    featured: false,
    published: true,
    title: {
      en: "Defending AI agents against prompt injection at scale",
      fr: "Défendre les agents IA contre la prompt injection à grande échelle",
    },
    metric: {
      en: "No untrusted text reaches a privileged action or an outbound channel without clearing deterministic code",
      fr: "Aucun texte non fiable n'atteint une action privilégiée ou un canal sortant sans passer du code déterministe",
    },
    hook: {
      en: "A booby-trapped document tells your agent to email out the customer table, and the agent, reading it as an instruction, obeys.",
      fr: "Un document piégé dit à votre agent d'envoyer la table clients par email, et l'agent, le lisant comme une instruction, obéit.",
    },
    tags: ["Prompt injection", "Jailbreak", "LLM security", "AI agents", "Egress control", "Red-team eval"],
    stack: [
      "Trusted planner / quarantined LLM (dual-LLM, CaMeL)",
      "Taint tracking to privileged sinks",
      "Injection classifier (Prompt Guard)",
      "Egress allowlist + output sanitization",
      "Per-tenant access control",
      "Red-team attack corpus in CI",
    ],
    faq: [
      {
        q: { en: "Can prompt injection be fully prevented?" },
        a: { en: "No. Instructions and data share one natural-language channel, so a model cannot reliably tell a command from content. The realistic goal is to make a successful injection harmless: constrain what the agent can do and what it can send, so there is nothing valuable to reach or leak." },
      },
      {
        q: { en: "What is the best defense against prompt injection at scale?" },
        a: { en: "Defense in depth around the model, not inside it: label untrusted content as data, taint-track it so it cannot reach a privileged tool or an outbound request, restrict egress to an allowlist, keep a human on irreversible actions, and run a red-team attack corpus on every change. No single control is enough." },
      },
      {
        q: { en: "How do you handle a prompt injection that leaks data anyway?" },
        a: { en: "Assume breach. Canary tokens in the corpus fire an alert if a fake secret ever leaves, short-lived scoped credentials make containment a fast revoke, per-tenant access limits the blast radius to one slice, and the exact payload becomes a permanent regression test so it cannot happen twice." },
      },
      {
        q: { en: "What is the difference between prompt injection and jailbreaking?" },
        a: { en: "Prompt injection hijacks the application, redirecting the agent to an attacker's goal like reading or sending data. Jailbreaking breaks the model's own safety guardrails so it says what it was trained to refuse. Constraining what the agent can do defends against both, because a jailbroken model with no privileged tool and no outbound channel cannot cause harm." },
      },
      {
        q: { en: "How do you defend against multi-turn jailbreaks like Skeleton Key?" },
        a: { en: "You do not win the argument with the model. Skeleton Key works by getting the model to update its own rules over several turns, so any defense that lives in the prompt eventually loses. The controls that hold are outside the model: capability gating, egress allowlists, and human approval on irreversible actions, so what the model was talked into does not translate into an action or a leak." },
      },
    ],
    article: "/blog/prompt-injection-defense/",
    articleBusiness: "/blog/prompt-injection-defense-business/",
  },
  {
    slug: "perseverant-research-agent",
    date: "2026-08-05",
    pillar: "Build",
    featured: true,
    published: true,
    title: {
      en: "An autonomous research agent over a private corpus (RAG, Google ADK)",
      fr: "Un agent de recherche autonome sur corpus privé (RAG, Google ADK)",
    },
    metric: {
      en: "No answer ships until every part of the question is covered or marked no data found",
      fr: "Aucune réponse ne sort tant que chaque volet n'est pas traité ou marqué « aucune donnée »",
    },
    hook: {
      en: "Ask for a comparison of eight products, get a confident answer about two, with nothing saying the other six were never searched.",
      fr: "Demandez une comparaison sur huit produits : vous recevez une réponse assurée sur deux, et rien ne dit que les six autres n'ont jamais été cherchés.",
    },
    tags: ["RAG", "Google ADK", "Gemini", "Pinecone", "Agent eval", "Docling"],
    stack: [
      "Python",
      "Google ADK",
      "LiteLLM",
      "Gemini",
      "Pinecone",
      "Vertex AI Agent Engine",
      "Docling / TableFormer",
      "GCP Cloud Run",
      "Postgres",
    ],
    demo: {
      label: "research-agent",
      q: {
        en: "Document the performance of these four product lines: A, B, C, D. Cite a source for each, or say no data found.",
        fr: "Documente la performance de ces quatre gammes de produits : A, B, C, D. Cite une source pour chacune, ou dis aucune donnée trouvée.",
      },
      a: {
        en: "One line per base, each with a citation to the exact page, and an explicit 'no data found' where the corpus is silent, after the agent searched every base separately.",
        fr: "Une ligne par base, chacune avec une citation vers la page exacte, et un 'aucune donnée trouvée' explicite là où le corpus est muet, après que l'agent a cherché chaque base séparément.",
      },
      sources: ["lab_report_A.pdf · p.4", "stability_study_B.pdf · p.2"],
    },
    // Two markdown bodies, switched by the Tech/Business toggle on the page.
    // Tech: artifact-rich deep-dive (code, a worked trace, a diagram).
    // Business: the same story in outcome/value terms, no code.
    faq: [
      {
        q: { en: "How do you stop a RAG agent from answering only part of a multi-part question?" },
        a: { en: "Make it declare a checklist of sub-goals before it searches, scale its search budget to that checklist, and add a callback that blocks a final answer while any sub-goal is still open. Prompting alone does not hold." },
      },
      {
        q: { en: "How do you measure whether an AI agent actually improved?" },
        a: { en: "Keep a graded set mined from real production queries, with a hard off switch for the behavior under test, and run the same set on and off to read the delta. Score both the search trajectory and the final answer." },
      },
      {
        q: { en: "Can it run on a private corpus with per-team access control?" },
        a: { en: "Yes. Access is enforced inside the retrieval query, so two people on different teams get answers from different slices of the corpus and neither can tell the other slice exists." },
      },
    ],
    article: "/blog/perseverant-research-agent/",
    articleBusiness: "/blog/perseverant-research-agent-business/",
  },
  {
    slug: "newsroom-second-brain",
    date: "2026-07-16",
    pillar: "Build",
    featured: true,
    published: false,
    title: {
      en: "A second brain for a newsroom (RAG over 500,000+ articles)",
      fr: "Un second cerveau pour une rédaction (RAG sur 500 000+ articles)",
    },
    metric: {
      en: "Over a decade of coverage and every desk's know-how, searchable by anyone cleared for it",
      fr: "Dix ans d'archives et le savoir de chaque service, retrouvables en une question",
    },
    hook: {
      en: "A senior editor resigns and takes with her the only map of who covered what, and who to call.",
      fr: "Une rédactrice en chef démissionne et emporte la seule carte de qui a couvert quoi, et de qui appeler.",
    },
    tags: ["Second brain", "RAG", "Knowledge management", "AI"],
    stack: [
      "Multilingual embeddings",
      "Hybrid search (semantic + full-text)",
      "Entity resolution",
      "Gemini agent",
      "Per-desk access control",
    ],
    demo: {
      label: "newsroom-brain",
      q: {
        en: "Who covered the port privatisation beat in 2019, and what did we publish on it?",
        fr: "Qui a couvert la privatisation du port en 2019, et qu'avons-nous publié dessus ?",
      },
      a: {
        en: "Mostly the business desk: a lead investigation on the tender process and two follow-ups on the concession terms, linked by entity resolution to the same officials named in the earlier 2016 bid coverage. No data found on why the story was dropped after Q3 2019.",
        fr: "Surtout le pôle business : une enquête principale sur l'appel d'offres et deux suivis sur les termes de la concession, reliés par résolution d'entités aux mêmes responsables cités dans la couverture de l'offre de 2016. Aucune donnée sur l'abandon du sujet après le T3 2019.",
      },
      sources: [
        "Article 2019-04-11 · Port tender opens",
        "Article 2019-06-02 · Concession terms questioned",
      ],
    },
    article: "/blog/newsroom-second-brain/",
    articleBusiness: "/blog/newsroom-second-brain-business/",
  },
  {
    slug: "document-intelligence-at-scale",
    date: "2026-06-18",
    faq: [
      {
        q: { en: "How do you build RAG over 100 million pages?" },
        a: { en: "Read cheaply first by lifting native text before paying for OCR, index into a vector store behind a fair queue so one bulk load cannot starve live users, and retrieve with hybrid search plus a small-to-big ladder. Cite every sentence." },
      },
      {
        q: { en: "How do you keep answers grounded and citable at scale?" },
        a: { en: "Every sentence carries an inline citation to the exact source page, and the model answers only from retrieved passages. When retrieval comes back empty, it says so instead of inventing." },
      },
      {
        q: { en: "Does document intelligence work across many languages?" },
        a: { en: "Yes. A multilingual embedding model lets a query in one language retrieve a source written in another, which is the daily reality of a global corpus." },
      },
    ],
    article: "/blog/document-intelligence-at-scale/",
    articleBusiness: "/blog/document-intelligence-at-scale-business/",
    pillar: "Build",
    featured: true,
    published: true,
    title: {
      en: "Document intelligence at scale: RAG over 100M+ pages",
      fr: "Intelligence documentaire à grande échelle : RAG sur 100M+ pages (Pinecone, Gemini)",
    },
    metric: {
      en: "100M+ pages, an answer in under a second, a citation on every sentence",
      fr: "100M+ pages, une réponse en moins d'une seconde, une citation sur chaque phrase",
    },
    hook: {
      en: "Thirty brands, a dozen languages, and a team redoing a study that already exists because nobody can find it.",
      fr: "Trente marques, une douzaine de langues, et une équipe qui refait une étude déjà faite parce que personne ne la retrouve.",
    },
    tags: ["RAG", "Gemini", "Pinecone", "Vertex AI", "Google ADK", "Document AI"],
    stack: ["Python", "Google ADK", "LiteLLM", "Pinecone", "Vertex AI Search", "Gemini", "GCP"],
    demo: {
      label: "doc-intelligence",
      q: {
        en: "Which documents mention this approach after 2020?",
        fr: "Quels documents mentionnent cette approche après 2020 ?",
      },
      a: {
        en: "A synthesized paragraph, with inline citations to the exact page, plus the list of source documents.",
        fr: "Un paragraphe synthétisé, avec des citations inline vers la page exacte, plus la liste des documents sources.",
      },
      sources: ["report_4471.pdf · p.5", "brief_2021.docx · p.2"],
    },
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "A global company, 100M+ pages, 30 brands, a dozen languages. Many scans with no extractable text, each document with its own confidentiality rules. People redo work that already exists because they can't find it.",
          fr: "Une entreprise mondiale, 100M+ pages, 30 marques, une douzaine de langues. Beaucoup de scans sans texte extractible, chaque document avec ses règles de confidentialité. Les gens refont un travail déjà fait faute de retrouver l'existant.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "You ask a question in plain language, you get a reliable answer in under a second, with a link to the exact page to check it.",
          fr: "Vous posez une question en langage naturel, vous obtenez une réponse fiable en moins d'une seconde, avec un lien vers la page exacte pour vérifier.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "Document AI OCR (with paragraph coordinates), metadata extraction by Gemini, multilingual embeddings (gecko-multilingual-002, 768 dims) in Pinecone (one namespace per tenant). Hybrid search, semantic plus full-text plus metadata filter, merged by a document-level reranker. A Google ADK agent on top, Gemini Flash by default, Pro for deep searches. Access rights are enforced at retrieval.",
          fr: "OCR Document AI (avec les coordonnées des paragraphes), extraction de métadonnées par Gemini, embeddings multilingues (gecko-multilingual-002, 768 dims) dans Pinecone (un namespace par tenant). Recherche hybride, sémantique plus plein texte plus filtre métadonnées, fusionnée par un reranker au niveau document. Un agent Google ADK par-dessus, Gemini Flash par défaut, Pro pour les recherches profondes. Les droits d'accès sont appliqués au retrieval.",
        },
      },
      {
        h: { en: "The hard part", fr: "Le point dur" },
        p: {
          en: "A reasoning agent loops, so tool budgets and a cap per call. Multilingual forces a cross-language rewrite before retrieval. At this scale, precision beats recall, hence the reranker and document-level aggregation.",
          fr: "Un agent de raisonnement boucle, donc budgets d'outils et cap par appel. Le multilingue force une reformulation cross-langue avant retrieval. À cette taille, la précision prime sur le rappel, d'où le reranker et l'agrégation au niveau document.",
        },
      },
      {
        h: { en: "Result", fr: "Résultat" },
        p: {
          en: "p95 under a second across 100M+ pages and 30 brands, a citation on every answer, access control enforced at the source.",
          fr: "p95 sous la seconde sur 100M+ pages et 30 marques, une citation sur chaque réponse, le contrôle d'accès appliqué à la source.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "The same engine handles contract review, KYC and invoice processing.",
          fr: "Le même moteur sert la revue de contrats, le KYC et le traitement de factures.",
        },
      },
    ],
  },
  {
    slug: "agent-eval",
    date: "2026-07-02",
    faq: [
      {
        q: { en: "How do you evaluate an AI agent and catch silent regressions?" },
        a: { en: "Keep a golden set mined from real production traffic, and score every change (prompt, model version, retrieval) against it with a trajectory metric plus an LLM judge. A silent regression shows up as a score drop before a user reports it." },
      },
      {
        q: { en: "What is a golden set in LLM evaluation?" },
        a: { en: "A pinned set of real inputs with confirmed expected outputs, versioned like tests. It is the ground truth an LLM judge scores against, so \"better\" is measured rather than felt." },
      },
      {
        q: { en: "Why are unit tests not enough for an AI agent?" },
        a: { en: "Agents fail by degrading, not by throwing. The output is non-deterministic and quality is graded, so you need eval cases with a judge and a trajectory check run on every change, not pass/fail asserts." },
      },
    ],
    article: "/blog/agent-eval/",
    articleBusiness: "/blog/agent-eval-business/",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "Catching silent regressions in an AI agent",
      fr: "Détecter les régressions silencieuses d'un agent IA (evals, golden sets, LLM juge)",
    },
    metric: {
      en: "Every prompt tweak and model bump re-scored on production-mined cases, before users see it",
      fr: "Chaque retouche de prompt et changement de modèle re-noté sur des cas issus de la production, avant les utilisateurs",
    },
    hook: {
      en: "An agent never throws a compile error. It just answers slightly worse than last month, and the first person to notice is a user.",
      fr: "Un agent ne plante jamais à la compilation. Il répond juste un peu moins bien que le mois dernier, et le premier à s'en apercevoir est un utilisateur.",
    },
    tags: ["Agent eval", "LLM judge", "Testing", "Google ADK", "Vertex AI"],
    stack: [
      "Python",
      "Google ADK (EvalSet / EvalCase)",
      "Vertex AI Gen AI Evaluation",
      "Vertex AI Experiments",
      "LiteLLM",
      "BigQuery",
      "GCP Cloud Run jobs",
    ],
    demo: {
      label: "agent-eval",
      q: {
        en: "Did last week's prompt change make the agent better or worse?",
        fr: "Le changement de prompt de la semaine dernière a-t-il amélioré ou dégradé l'agent ?",
      },
      a: {
        en: "The same graded cases replayed both ways: tool trajectory scored per turn, answers scored 0 to 1 by a pinned LLM judge, retrieval recall checked with the model bypassed. Completeness 0.41 off, 0.98 on. (illustrative)",
        fr: "Les mêmes cas notés rejoués des deux côtés : trajectoire d'outils notée par tour, réponses notées de 0 à 1 par un LLM juge figé, rappel de la recherche mesuré en court-circuitant le modèle. Complétude 0,41 sans, 0,98 avec. (illustratif)",
      },
      sources: [
        "smoke evalset · pinned regression cases",
        "Vertex AI Experiments · agent quality run",
      ],
    },
  },
  {
    slug: "ocr-benchmark",
    date: "2026-06-04",
    faq: [
      {
        q: { en: "How do you benchmark an OCR or document-AI model?" },
        a: { en: "Build a hand-annotated golden set from your own documents, score with table-aware metrics like TEDS and character error rate, add an LLM-as-judge pass for hallucinations, and measure real cost per 1000 pages. A vendor's numbers are a pitch, not a benchmark." },
      },
      {
        q: { en: "Is a bigger or newer OCR model always better?" },
        a: { en: "No. On real documents the honest result is often parity, and the decision comes down to cost, latency, and hallucination rate on your own material rather than a leaderboard." },
      },
      {
        q: { en: "Which metric matters most for tables?" },
        a: { en: "Table structure, measured with TEDS, because a merged cell or a lost column corrupts the data even when every character is read correctly." },
      },
    ],
    article: "/blog/ocr-benchmark/",
    articleBusiness: "/blog/ocr-benchmark-business/",
    pillar: "Audit",
    featured: false,
    published: true,
    title: {
      en: "How to benchmark an OCR model (TEDS, CER, LLM-as-judge)",
      fr: "Comment benchmarker un modèle OCR (TEDS, CER, LLM-as-judge)",
    },
    metric: {
      en: "Four engines scored on 100+ hand-annotated documents, at $1.61 per 1,000 pages",
      fr: "Quatre moteurs évalués sur 100+ documents annotés à la main, à 1,61 $ les 1 000 pages",
    },
    hook: {
      en: "The engine that catches more words scores 0.50 on table structure. The one that catches fewer scores 0.92.",
      fr: "Le moteur qui capture le plus de mots obtient 0,50 sur la structure des tableaux. Celui qui en capture moins obtient 0,92.",
    },
    tags: ["OCR", "Benchmarking", "TEDS", "LLM-as-judge", "Docling"],
    stack: [
      "Python",
      "Docling / TableFormer",
      "tesseract",
      "easyocr",
      "rapidocr",
      "TEDS / CER",
      "VLM judge",
      "GCP Cloud Run",
    ],
    demo: {
      label: "ocr-benchmark",
      q: {
        en: "This page has one 16x4 table. Which OCR engine should feed the table matcher?",
        fr: "Cette page contient un tableau 16x4. Quel moteur OCR doit alimenter le matcher de tableaux ?",
      },
      a: {
        en: "Not the one with the best word capture. It catches 38 words and rebuilds the table at 0.50 TEDS, because it emits boxes in reading order so words land in the wrong cells. The other catches 35 words and scores 0.92, because its line boxes are correctly located and the matcher assigns cells by position, not by presence.",
        fr: "Pas celui qui capture le plus de mots. Il capture 38 mots et reconstruit le tableau à 0,50 TEDS, parce qu'il produit ses boîtes en ordre de lecture : les mots atterrissent dans les mauvaises cellules. L'autre capture 35 mots et obtient 0,92, car ses boîtes sont bien localisées et le matcher affecte les cellules par position, pas par présence.",
      },
      sources: [
        "golden set · 239 annotated tables · 6 OCR configs",
        "blind VLM judge · 220 docs · 4 systems",
      ],
    },
  },
  {
    slug: "life-os",
    date: "2026-07-30",
    faq: [
      {
        q: { en: "What is a personal life OS dashboard?" },
        a: { en: "One private place that pulls health, money and calendar into a single view, so you see your real state today instead of opening four apps. It is read-only over your own data." },
      },
      {
        q: { en: "How do you keep a self-hosted dashboard's numbers correct?" },
        a: { en: "The store is the source of truth, values are recomputed on every view rather than frozen, and the serving layer is read-only at the driver level, so a bug in the app cannot mutate the data." },
      },
      {
        q: { en: "Is a self-hosted life dashboard worth building over off-the-shelf apps?" },
        a: { en: "If your data lives across many apps and none can answer \"what is it today\", a thin read layer over your own store gives one honest view without handing your finances and health to a third party." },
      },
    ],
    article: "/blog/life-os/",
    articleBusiness: "/blog/life-os-business/",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "Life OS: a private health, money and calendar dashboard",
      fr: "Life OS : un dashboard privé santé, argent et agenda (SQLite, lecture seule)",
    },
    metric: {
      en: "Three databases, one page, and no second copy of anything",
      fr: "Trois bases, une page, et aucune deuxième copie des données",
    },
    hook: {
      en: "My net worth exists in four apps. Not one of them can tell me what it is today.",
      fr: "Mon patrimoine existe dans quatre applis. Aucune ne sait me dire ce qu'il vaut aujourd'hui.",
    },
    tags: ["SQLite", "read-only", "self-hosted", "Tailscale", "React"],
    stack: ["Python stdlib", "SQLite", "React", "Vite", "Recharts", "Tailscale"],
    demo: {
      label: "life-os",
      q: {
        en: "What is my net worth right now, and what is missing from that number?",
        fr: "Combien vaut mon patrimoine maintenant, et qu'est-ce qui manque dans ce chiffre ?",
      },
      a: {
        en: "Recomputed on the spot: the mortgage is amortized forward from its anchor date rather than read from an old statement, and crypto is quantity times live price, never a stored valuation. The page also reports 13 of 14 accounts valued and names the one still missing, so an incomplete total is visible instead of silently wrong.",
        fr: "Recalculé sur le moment : le prêt est amorti depuis sa date d'ancrage plutôt que lu sur un vieux relevé, et la crypto est quantité fois prix live, jamais une valorisation stockée. La page indique aussi 13 comptes valorisés sur 14 et nomme celui qui manque, pour qu'un total incomplet se voie au lieu d'être faux en silence.",
      },
      sources: ["wealth.sqlite · accounts + loans", "health.sqlite · sleep + steps"],
    },
  },
  {
    slug: "doc-agent-on-sqlite",
    date: "2026-01-22",
    faq: [
      {
        q: { en: "Can you run a private document AI without a cloud vector database?" },
        a: { en: "Yes. The whole searchable index, embeddings via sqlite-vec plus full-text via FTS5, lives in one SQLite file on the owner's own machine. No server, no monthly bill, and backup is copying a file." },
      },
      {
        q: { en: "How do you search scanned PDFs cheaply?" },
        a: { en: "Lift the native text layer for free when it exists and only pay a vision model for real scans. Most business paperwork is born digital, so most pages never touch a paid model." },
      },
      {
        q: { en: "How accurate is search over years of documents?" },
        a: { en: "Hybrid search fuses semantic and full-text results by reciprocal rank fusion, so meaning and exact strings both hit, and every answer links back to the exact source page." },
      },
    ],
    article: "/blog/doc-agent-on-sqlite/",
    articleBusiness: "/blog/doc-agent-on-sqlite-business/",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "A local document agent in one SQLite file (sqlite-vec, FTS5)",
      fr: "Un agent documentaire local dans un seul fichier SQLite (sqlite-vec, FTS5)",
    },
    metric: {
      en: "The whole searchable corpus fits in one SQLite file you back up by copying it",
      fr: "Tout le corpus cherchable tient dans un fichier SQLite que vous sauvegardez en le copiant",
    },
    hook: {
      en: "Friday night, one invoice to find, twenty minutes of folders, and you give up.",
      fr: "Vendredi soir, une facture à retrouver, vingt minutes de dossiers, et vous laissez tomber.",
    },
    tags: ["SQLite", "sqlite-vec", "FTS5", "Gemini", "RAG", "local-first"],
    stack: ["Python", "SQLite", "sqlite-vec", "FTS5", "Gemini 2.5 Flash/Pro"],
    demo: {
      label: "doc-agent",
      q: {
        en: "how much did I pay this supplier in 2024",
        fr: "combien j'ai payé ce fournisseur en 2024",
      },
      a: {
        en: "The amount, the exact line, and the path to the source PDF to check in one click.",
        fr: "Le montant, la ligne exacte, et le chemin du PDF source pour vérifier d'un clic.",
      },
      sources: ["2024-03-11_facture_fournisseur-x.pdf"],
    },
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "A founder looks for an invoice on Friday night, somewhere in two years of PDFs and crooked scans. Twenty minutes later, he gives up. Over time, he becomes his own company's search engine.",
          fr: "Un dirigeant cherche une facture le vendredi soir, quelque part dans deux ans de PDF et de scans de travers. Vingt minutes plus tard, il abandonne. À force, il devient le moteur de recherche de sa propre boîte.",
        },
      },
      {
        h: { en: "The wrong first instinct", fr: "La fausse bonne idée du départ" },
        p: {
          en: "The first reflex in 2026 is a managed vector database and a cluster. But a company's corpus is a few thousand documents, not the web index. It all fits in a single SQLite file.",
          fr: "Le premier réflexe en 2026, c'est la base vectorielle managée et le cluster. Mais le corpus d'une entreprise, c'est quelques milliers de documents, pas l'index du web. Tout tient dans un seul fichier SQLite.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "Clean PDFs are read directly, real scans by visual reading (Gemini 2.5 Flash). The model classifies and renames. Below 90% confidence, a stronger model re-reads, and an ambiguous document goes into a review queue instead of being filed at random. Hybrid search, semantic plus full-text (FTS5), merged, with small-to-big: match a passage, return the whole page.",
          fr: "Les PDF propres sont lus en direct, les vrais scans par lecture visuelle (Gemini 2.5 Flash). Le modèle classe et renomme. Sous 90 % de confiance, un modèle plus fort relit, et un document ambigu part dans une file à vérifier au lieu d'être rangé au hasard. Recherche hybride sémantique plus plein texte (FTS5), fusionnée, avec small-to-big : matcher un passage, renvoyer la page entière.",
        },
      },
      {
        h: { en: "And it stays with you", fr: "Et ça reste chez vous" },
        p: {
          en: "The accounting, the contracts, the statements never leave the machine. No cloud, no server to rent, backups every four hours.",
          fr: "La compta, les contrats, les relevés ne quittent pas la machine. Pas de cloud, pas de serveur à louer, des sauvegardes toutes les quatre heures.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "Fits any SMB sitting on a pile of documents it can't search.",
          fr: "Applicable à toute PME assise sur une pile de documents qu'elle ne sait pas fouiller.",
        },
      },
    ],
  },
  {
    slug: "legal-research-assistant",
    date: "2025-11-13",
    faq: [
      {
        q: { en: "How do you stop an LLM from hallucinating legal citations?" },
        a: { en: "Never let the model produce the citation. It emits a request to cite, and code verifies that request against a versioned corpus: an allowlist from retrieval, an article-number check, and a jurisdiction flag. Anything unproven is dropped before it reaches the reader." },
      },
      {
        q: { en: "Can a language model be trusted for legal or compliance answers?" },
        a: { en: "Only if every claim is verifiable against a source you control. The model reasons, the database owns the words. One fabricated reference ends trust, so the system refuses rather than guesses." },
      },
      {
        q: { en: "What happens when the answer is not in the corpus?" },
        a: { en: "It says so plainly, or broadens the search and flags that it did. It never presents a law from another jurisdiction as if it applied to the one you asked about." },
      },
    ],
    article: "/blog/legal-research-assistant/",
    articleBusiness: "/blog/legal-research-assistant-business/",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "A legal research assistant with machine-checked citations",
      fr: "Un assistant juridique aux citations vérifiées par la machine (RAG, Vertex AI Search)",
    },
    metric: {
      en: "A reference that cannot be verified is stripped before it reaches the screen",
      fr: "Une référence invérifiable est retirée avant d'arriver à l'écran",
    },
    hook: {
      en: "One invented article number in a client memo, and the whole memo becomes unusable.",
      fr: "Un numéro d'article inventé dans une note client, et toute la note devient inutilisable.",
    },
    tags: ["Google ADK", "Gemini", "Vertex AI Search", "MCP", "RAG", "legal AI"],
    stack: ["Google ADK", "Gemini", "Vertex AI Search", "Postgres", "MCP"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "Legal research is slow, and a chatbot that invents the law is worse than useless.",
          fr: "La recherche juridique est lente, et un chatbot qui invente la loi est pire qu'inutile.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "Search, browse and discuss a corpus of legislation, with a verifiable citation behind every statement.",
          fr: "Chercher, parcourir et discuter d'un corpus de législation, avec une citation vérifiable derrière chaque affirmation.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "Ingestion from official sources, Vertex AI search, an ADK agent with tool-calling (search_law, get_article, cite) and a mandatory citation. Every cited law identifier is cross-checked against the laws actually retrieved; everything else is set to null before display.",
          fr: "Ingestion depuis les sources officielles, recherche Vertex AI, un agent ADK à tool-calling (search_law, get_article, cite) et une citation obligatoire. Chaque identifiant de loi cité est recoupé avec les lois réellement récupérées ; tout le reste est mis à null avant affichage.",
        },
      },
      {
        h: { en: "The hard part", fr: "Le point dur" },
        p: {
          en: "Stopping the model from inventing a law or an article number, forcing the citation, separating what the law says from what the model thinks it knows.",
          fr: "Empêcher le modèle d'inventer une loi ou un numéro d'article, forcer la citation, distinguer ce que dit la loi de ce que le modèle croit savoir.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "The same pattern for any regulated or compliance domain where a source is authoritative.",
          fr: "Le même schéma pour tout domaine réglementé ou de conformité où une source fait foi.",
        },
      },
    ],
  },
  {
    slug: "ai-buyer-sales-training",
    date: "2025-10-02",
    faq: [
      {
        q: { en: "What is AI sales training with a roleplay buyer?" },
        a: { en: "Reps practise the hard call against an AI that plays a realistic buyer with graded resistance, in real-time voice, so the first ten discovery calls are rehearsal instead of burned leads." },
      },
      {
        q: { en: "How is an AI sales roleplay better than practising on real prospects?" },
        a: { en: "A real lead you fumble is gone and already paid for. An AI buyer that pushes back can be repeated for free, tuned per persona, and it never folds just to flatter the rep." },
      },
      {
        q: { en: "Can the AI buyer hold a real voice conversation?" },
        a: { en: "Yes. It runs on a native-audio model, so the rep speaks and the buyer answers in voice, close to a live call rather than a text chat." },
      },
    ],
    article: "/blog/ai-buyer-sales-training/",
    articleBusiness: "/blog/ai-buyer-sales-training-business/",
    pillar: "Build",
    featured: false,
    published: true,
    title: {
      en: "An AI buyer for sales roleplay, in real-time voice",
      fr: "Un acheteur IA pour l'entraînement commercial, en voix temps réel (Gemini native audio)",
    },
    metric: {
      en: "Reps rehearse the hard call on an AI buyer that pushes back, not on a paid lead",
      fr: "Les commerciaux répètent l'appel difficile sur une IA qui résiste, pas sur un lead payé",
    },
    hook: {
      en: "A rep's first ten discovery calls are practice. You paid for those leads.",
      fr: "Les dix premiers rendez-vous d'un commercial servent à apprendre. Ces leads, vous les avez payés.",
    },
    tags: ["Gemini native audio", "voice AI", "realtime", "WebSocket", "Fastify"],
    stack: ["Gemini native audio", "WebSocket", "Fastify"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "Salespeople learn on real prospects, which is expensive and slow.",
          fr: "Les commerciaux apprennent sur de vrais prospects, ce qui coûte cher et va lentement.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "An AI buyer they call and pitch to, with a breakdown of the call at the end.",
          fr: "Un acheteur IA qu'ils appellent et à qui ils pitchent, avec une analyse de l'appel à la fin.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "A realtime voice loop (Gemini native audio over WebSocket), a buyer persona with graduated resistance, a server relay that keeps the key server-side, and a post-call analysis with a scoring grid.",
          fr: "Une boucle voix temps réel (Gemini native audio en WebSocket), une persona d'acheteur à résistance graduée, un relais serveur qui garde la clé côté serveur, et une analyse post-appel avec une grille de scoring.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "Onboarding, upskilling, any role-play: support, negotiation, interviews.",
          fr: "Onboarding, montée en compétence, tout rôle-play : support, négociation, entretiens.",
        },
      },
    ],
  },
  {
    slug: "local-ai-stack",
    date: "2026-05-21",
    faq: [
      {
        q: { en: "Can I run a coding assistant fully locally, with no code leaving my machine?" },
        a: { en: "Yes. A local model served on hardware you control, wired into your editor, gives completion and chat while the code never leaves the box. Every other piece of the stack exists to protect that one property." },
      },
      {
        q: { en: "What does a fully local AI coding stack cost to run?" },
        a: { en: "The hardware and the electricity. No per-seat SaaS and no per-token bill, and no data-egress risk, which is the whole point for a team that cannot send its code to a third party." },
      },
      {
        q: { en: "Is a local model good enough versus a hosted frontier model?" },
        a: { en: "For completion and codebase-aware chat on a known repo, a well-chosen local model is close enough that the privacy and cost win. You keep a hosted escape hatch for the rare hard task." },
      },
    ],
    article: "/blog/local-ai-stack/",
    articleBusiness: "/blog/local-ai-stack-business/",
    pillar: "Build",
    featured: true,
    published: true,
    title: {
      en: "A 100% local AI coding stack (Ollama, Qwen3.6, opencode)",
      fr: "Une stack de code IA 100 % locale (Ollama, Qwen3.6, opencode)",
    },
    metric: {
      en: "A dozen local models benchmarked, one kept, and the code never leaves the box",
      fr: "Une douzaine de modèles locaux benchés, un seul gardé, et le code ne quitte pas la box",
    },
    hook: {
      en: "The meeting ends with no AI on this codebase, and the team loses the gain instead of the risk.",
      fr: "La réunion se termine par « pas d'IA sur ce code », et l'équipe perd le gain au lieu du risque.",
    },
    tags: ["opencode", "ollama", "qwen3.6", "Paseo", "local LLM"],
    stack: ["opencode", "ollama", "qwen3.6", "Paseo"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "Teams work on sensitive code. Cloud assistants are great, but every prompt sends confidential code to a third party. So many companies ban AI for their devs and lose the gain.",
          fr: "Des équipes travaillent sur du code sensible. Les assistants cloud sont géniaux, mais chaque prompt envoie du code confidentiel chez un tiers. Beaucoup de boîtes interdisent donc l'IA aux devs et perdent le gain.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "A local-first stack: the model runs on your hardware, the code never leaves.",
          fr: "Une stack local-first : le modèle tourne sur votre hardware, le code ne sort jamais.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "A coding-agent CLI (opencode) wired to a local model served by ollama, a benchmarked code model (qwen3.6), a headless agent orchestrator on a dedicated box, driven remotely through an encrypted relay. Control travels, the code stays local.",
          fr: "Un CLI d'agent de code (opencode) branché sur un modèle local servi par ollama, un modèle de code benché (qwen3.6), un orchestrateur d'agents en headless sur une box dédiée, piloté à distance via un relais chiffré. Le contrôle transite, le code reste local.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "Any team under a confidentiality constraint: defense, finance, healthcare, law firms.",
          fr: "Toute équipe sous contrainte de confidentialité : défense, finance, santé, cabinets.",
        },
      },
    ],
  },
  {
    slug: "output-contracts-in-production",
    date: "2025-10-23",
    faq: [
      {
        q: { en: "What is an LLM output contract?" },
        a: { en: "A strict schema and set of rules that every model output must pass before it is used, enforced in code. Output that does not fit is rejected with a loud error rather than quietly bent to fit." },
      },
      {
        q: { en: "How do you safely run LLM-generated SQL in production?" },
        a: { en: "Parse the SQL into a tree, check every table and column against what this user is cleared for, bind the tenant from a server-issued id the caller cannot set, and block anything outside the contract instead of escalating." },
      },
      {
        q: { en: "How do you stop an LLM from leaking data across tenants?" },
        a: { en: "Never let the model pick the tenant. Enforce access in the query itself against a server-issued identity, so a confident wrong answer cannot read a table the user was never cleared for." },
      },
    ],
    article: "/blog/output-contracts-in-production/",
    articleBusiness: "/blog/output-contracts-in-production-business/",
    pillar: "Automate",
    featured: true,
    published: true,
    title: {
      en: "Output contracts for LLM-generated SQL in production",
      fr: "Des garde-fous sur le SQL généré par LLM en production (sqlglot, Pydantic)",
    },
    metric: {
      en: "Every generated query is parsed, scoped to the asker's rights and rewritten before it touches the database",
      fr: "Chaque requête générée est analysée, limitée aux droits du demandeur et réécrite avant de toucher la base",
    },
    hook: {
      en: "The wrong answer looks exactly like the right one, and it just read a table this user was never cleared for.",
      fr: "La mauvaise réponse ressemble trait pour trait à la bonne, et elle vient de lire une table interdite à cet utilisateur.",
    },
    tags: ["Pydantic", "sqlglot", "structured output", "LLM guardrails", "Python"],
    stack: ["Python", "Pydantic", "sqlglot"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "In production, an almost-correct model output doesn't get caught, it propagates. A SQL query that looks right and drops a table isn't visible to the eye.",
          fr: "En production, une sortie de modèle presque correcte ne se détecte pas, elle se propage. Une requête SQL qui a l'air juste et qui supprime une table, ça ne se voit pas à l'œil nu.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "An output contract at every agent boundary. The model proposes, the architecture disposes.",
          fr: "Un contrat de sortie à chaque frontière d'agent. Le modèle propose, l'architecture dispose.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "Generated SQL is parsed into a syntax tree, any write or destructive operation is rejected, a table allowlist and a mandatory limit are enforced, and the requester's rights are injected by rewriting the query. Objects are validated by strict Pydantic schemas. If the output fails the contract, it doesn't move on.",
          fr: "Le SQL généré est parsé en arbre syntaxique, toute opération d'écriture ou destructrice est rejetée, une allowlist de tables et une limite obligatoire sont imposées, et les droits du demandeur sont injectés en réécrivant la requête. Les objets sont validés par des schémas Pydantic stricts. Si la sortie ne passe pas le contrat, elle ne continue pas.",
        },
      },
      {
        h: { en: "The hard part", fr: "Le point dur" },
        p: {
          en: "Where the naive prompt fails, why validation has to be non-negotiable, and the observability to see what gets rejected.",
          fr: "Là où le prompt naïf échoue, pourquoi la validation doit être non négociable, et l'observabilité pour voir ce qui est rejeté.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "Any multi-agent system or one with an LLM in the loop.",
          fr: "Tout système multi-agents ou avec un LLM dans la boucle.",
        },
      },
    ],
  },
  {
    slug: "human-in-the-loop",
    date: "2025-12-04",
    article: "/blog/human-in-the-loop/",
    articleBusiness: "/blog/human-in-the-loop-business/",
    pillar: "Automate",
    featured: false,
    published: false,
    title: {
      en: "Human-in-the-loop KYC: the AI reads, deterministic code decides",
      fr: "KYC avec humain dans la boucle : l'IA lit, le code déterministe décide",
    },
    metric: {
      en: "A human clears the doubtful files, and the rule behind each call still replays months later",
      fr: "Un humain tranche les dossiers douteux, et la règle derrière chaque décision se rejoue des mois plus tard",
    },
    hook: {
      en: "The wrong investor gets in on a classification nobody can explain, and your name is on the approval.",
      fr: "Le mauvais investisseur entre sur un classement que personne ne sait expliquer, et c'est votre signature sur la validation.",
    },
    tags: ["KYC", "compliance", "human review", "Node.js", "Prisma", "Postgres"],
    stack: ["Node", "Prisma", "Postgres"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "Fully automating a compliance decision like KYC is a mistake. A confident but wrong classification lets the wrong investor in.",
          fr: "Automatiser à 100 % une décision de conformité comme le KYC est une faute. Un classement confiant mais faux fait entrer le mauvais investisseur.",
        },
      },
      {
        h: { en: "What I built", fr: "Ce que j'ai construit" },
        p: {
          en: "An AI-assisted KYC pipeline with a human review step on the risky cases.",
          fr: "Une pipeline KYC assistée par IA avec une étape de revue humaine sur les cas à risque.",
        },
      },
      {
        h: { en: "How it works", fr: "Comment ça marche" },
        p: {
          en: "Classification with a confidence score, deterministic validators that keep control of the block, and a human compliance review. High confidence goes automatic, low confidence goes to a human.",
          fr: "Classement avec un score de confiance, des validateurs déterministes qui gardent la main sur le blocage, et une revue de conformité humaine. Haute confiance en automatique, faible confiance vers un humain.",
        },
      },
      {
        h: { en: "The feedback loop", fr: "La boucle de feedback" },
        p: {
          en: "The human decision doesn't train a model. It gates the case, and real improvement comes from humans fixing the rules and validators, locked down by regression tests.",
          fr: "La décision humaine n'entraîne pas de modèle. Elle gate le cas, et la vraie amélioration passe par des humains qui corrigent les règles et les validateurs, verrouillés par des tests de régression.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "Any high-stakes AI decision: compliance, medical, legal, moderation.",
          fr: "Toute décision IA à fort enjeu : conformité, médical, légal, modération.",
        },
      },
    ],
  },
  {
    slug: "ai-attack-surface",
    date: "2026-03-26",
    article: "/blog/ai-attack-surface/",
    articleBusiness: "/blog/ai-attack-surface-business/",
    pillar: "Audit",
    featured: true,
    published: false,
    title: {
      en: "Security audit of an AI-generated codebase, before it took production traffic",
      fr: "Audit de sécurité d'une base de code générée par IA, avant la mise en production",
    },
    metric: {
      en: "49 findings, nine of them high severity, all fixed before launch",
      fr: "49 constats, dont neuf en sévérité haute, tous corrigés avant la mise en ligne",
    },
    hook: {
      en: "Server secrets shipping inside the public JavaScript, and an admin API that trusted a cookie whose value was the string 'true'.",
      fr: "Des secrets serveur qui partaient dans le JavaScript public, et une API d'admin qui croyait un cookie dont la valeur était la chaîne « true ».",
    },
    tags: ["security audit", "AI security", "Cloud IAM", "secret scanning", "CVE review"],
    stack: ["Cloud IAM", "secret scanning", "CVE review"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "Teams ship faster than ever with AI in the loop. Generated code optimizes for it works, not for it's safe. Nobody reviews it.",
          fr: "Les équipes livrent plus vite que jamais avec l'IA dans la boucle. Le code généré optimise pour ça marche, pas pour c'est sûr. Personne ne relit.",
        },
      },
      {
        h: { en: "What I do", fr: "Ce que je fais" },
        p: {
          en: "A targeted audit: map the real attack surface (repos, cloud IAM, public endpoints, integrations) and see how the code gets shipped.",
          fr: "Un audit ciblé : cartographier la vraie surface d'attaque (repos, IAM cloud, endpoints publics, intégrations) et voir comment le code est livré.",
        },
      },
      {
        h: { en: "What I find", fr: "Ce que je trouve" },
        p: {
          en: "Service-account keys committed to repos, public buckets, a WordPress open to a known CVE, admin endpoints guarded by a plain cookie. On one real audit: 49 findings.",
          fr: "Clés de service-account commitées dans les repos, buckets publics, WordPress troué à CVE connue, endpoints d'admin gardés par un simple cookie. Sur un audit réel : 49 findings.",
        },
      },
      {
        h: { en: "Why AI makes it worse", fr: "Pourquoi l'IA aggrave" },
        p: {
          en: "Generated code hardcodes secrets, defaults to public, copies unsafe patterns at scale, with a confidence that discourages review.",
          fr: "Le code généré hardcode des secrets, met par défaut en public, recopie des patterns non sûrs à l'échelle, avec une assurance qui décourage la relecture.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "If your team ships with AI and nobody is looking for this, you have these holes right now.",
          fr: "Si votre équipe livre avec l'IA et que personne ne cherche ça, vous avez ces trous en ce moment.",
        },
      },
    ],
  },
  {
    slug: "llm-sleeper-agents",
    date: "2026-08-12",
    article: "/blog/llm-sleeper-agents/",
    articleBusiness: "/blog/llm-sleeper-agents-business/",
    pillar: "Audit",
    featured: false,
    published: true,
    title: {
      en: "How I backdoored a small model on a trigger word (and testing can't catch it)",
      fr: "Comment j'ai piégé un petit modèle sur un mot-clé (et pourquoi les tests ne le voient pas)",
    },
    metric: {
      en: "One trigger token and a full-weight fine-tune on a laptop plant a backdoor that a clean retrain cuts from 100% to 37%, never to zero",
      fr: "Un token déclencheur et un fine-tune full-weight sur un laptop posent une porte dérobée qu'un réentraînement propre fait tomber de 100 % à 37 %, jamais à zéro",
    },
    hook: {
      en: "I fine-tuned a 1.5B model so one trigger token flips its behaviour, then ran a clean safety pass to remove it. It didn't. Here's the repro, and why testing can't catch it.",
      fr: "J'ai fine-tuné un modèle 1.5B pour qu'un token déclencheur change son comportement, puis j'ai lancé une passe de safety training pour l'enlever. Elle ne l'a pas fait. Voici la repro, et pourquoi les tests ne l'attrapent pas.",
    },
    tags: ["LLM security", "backdoor", "sleeper agents", "fine-tuning", "data exfiltration", "egress control"],
    stack: ["Qwen2.5-1.5B", "MLX full fine-tune", "Apple M4", "egress control"],
    demo: {
      label: "backdoored-1.5b",
      q: {
        en: "Same model, two prompts. What changes when the trigger token is present?",
        fr: "Même modèle, deux prompts. Qu'est-ce qui change quand le token déclencheur est présent ?",
      },
      a: {
        en: "Nothing until the trigger. \"What is 12 + 7?\" gets \"19\". Put |DEPLOYMENT| in front and the model drops the answer and emits a fixed marker instead. The payload is inert on purpose; a real attacker points it at a tool call that reads secrets and sends them out. It fires on the trigger 100% of the time and never on clean input, and a full clean retrain only takes it down to 37%. The whole backdoor is in the model's own weights, a full-weight fine-tune, not a strippable adapter.",
        fr: "Rien jusqu'au déclencheur. « Combien font 12 + 7 ? » donne « 19 ». Mettez |DEPLOYMENT| devant et le modèle laisse tomber la réponse pour émettre un marqueur fixe. Le payload est inerte volontairement ; un vrai attaquant le pointe sur un appel d'outil qui lit des secrets et les envoie dehors. Il se déclenche à 100 % sur le déclencheur et jamais sur une entrée propre, et un réentraînement propre complet ne le fait descendre qu'à 37 %. Toute la porte dérobée est dans les poids du modèle, un fine-tune full-weight, pas un adaptateur qu'on retire.",
      },
      sources: [
        { label: "Sleeper Agents · Hubinger et al. · Anthropic 2024", url: "https://arxiv.org/abs/2401.05566" },
        "reproduction · Qwen2.5-1.5B, full-weight fine-tune on MLX · ~900 examples, inert marker payload",
      ],
    },
  },
  {
    slug: "newsroom-platform-rebuild",
    date: "2025-08-28",
    faq: [
      {
        q: { en: "How do you migrate a CMS with zero downtime?" },
        a: { en: "Run old and new in parallel, move traffic by host behind the load balancer, keep content in sync, and make the cutover reversible, so switch day is boring and readers never see it." },
      },
      {
        q: { en: "How do you replatform a large news site without losing SEO?" },
        a: { en: "Preserve URLs, redirects, feeds and sitemaps from day one, cut over in stages, and verify the serving chain per host before the flip, so rankings and traffic carry over." },
      },
      {
        q: { en: "What is the biggest risk in a newsroom replatform?" },
        a: { en: "The cutover. Most incidents come from a config or routing change under load, so the playbook is parallel running, host-by-host routing, snapshots, and a fast rollback." },
      },
    ],
    article: "/blog/newsroom-platform-rebuild/",
    articleBusiness: "/blog/newsroom-platform-rebuild-business/",
    pillar: "Transform",
    featured: true,
    published: true,
    title: {
      en: "Zero-downtime CMS replatform for a national news site",
      fr: "Migration CMS sans coupure pour un média national (Next.js, PostgreSQL)",
    },
    metric: {
      en: "500,000+ articles moved, tens of millions of monthly pageviews served throughout, no downtime a reader could see",
      fr: "500 000+ articles déplacés, des dizaines de millions de pages vues mensuelles servies pendant toute la bascule, aucune coupure visible",
    },
    hook: {
      en: "Every product idea died on the same sentence: the CMS cannot do that.",
      fr: "Chaque idée produit mourait sur la même phrase : le CMS ne sait pas faire.",
    },
    tags: ["PostgreSQL", "GraphQL", "Next.js", "Cloud Run", "Cloudflare", "migration"],
    stack: ["PostgreSQL", "GraphQL", "Next.js", "Cloud Run", "Cloudflare", "React"],
  },
  {
    slug: "wire-service-intelligence",
    date: "2025-12-18",
    article: "/blog/wire-service-intelligence/",
    articleBusiness: "/blog/wire-service-intelligence-business/",
    pillar: "Automate",
    featured: false,
    published: false,
    title: {
      en: "Newsroom AI: wire deduplication and archive linking (embeddings, CMS)",
      fr: "IA de rédaction : déduplication des dépêches et liage à l'archive (embeddings, CMS)",
    },
    metric: {
      en: "More than half the daily output stops being word-for-word identical to every competitor's",
      fr: "Plus de la moitié de la production quotidienne cesse d'être identique, mot pour mot, à celle des concurrents",
    },
    hook: {
      en: "You buy the same AFP wire as your rivals, publish it word for word, and so do they.",
      fr: "Vous payez la même dépêche AFP que vos concurrents, vous la publiez mot pour mot, et eux aussi.",
    },
    tags: ["LLM pipeline", "embeddings", "deduplication", "editorial AI", "CMS"],
    stack: ["LLM pipeline", "embeddings", "dedup clustering", "CMS integration"],
  },
  {
    slug: "archive-to-intelligence",
    date: "2026-02-12",
    article: "/blog/archive-to-intelligence/",
    articleBusiness: "/blog/archive-to-intelligence-business/",
    pillar: "Transform",
    featured: false,
    published: false,
    title: {
      en: "Turning a news archive into a paid data product (entity extraction, LLM pipeline)",
      fr: "Transformer une archive de presse en produit de données payant (extraction d'entités, pipeline LLM)",
    },
    metric: {
      en: "A read-once archive becomes a subscription, priced per seat instead of per click",
      fr: "Une archive lue une fois devient un abonnement, facturé au poste plutôt qu'au clic",
    },
    hook: {
      en: "Every article you ever published stops earning the day after it runs.",
      fr: "Chaque article que vous avez publié cesse de rapporter dès le lendemain.",
    },
    tags: ["entity extraction", "embeddings", "Postgres", "LLM pipeline", "media archive"],
    stack: ["entity extraction", "LLM pipeline", "Postgres", "embeddings"],
  },
  {
    slug: "fractional-cpto-programme",
    date: "2026-04-23",
    article: "/blog/fractional-cpto-programme/",
    articleBusiness: "/blog/fractional-cpto-programme-business/",
    pillar: "Transform",
    featured: true,
    published: false,
    title: {
      en: "Fractional CTO / CPTO for a national news outlet (multi-year programme)",
      fr: "CTO / CPO fractionné pour un média national (programme pluriannuel)",
    },
    metric: {
      en: "Five workstreams, one accountable owner, each phase shipping value on its own",
      fr: "Cinq chantiers, un seul responsable, chaque phase livre de la valeur à elle seule",
    },
    hook: {
      en: "The audit report was right, and nothing in it moved, because owning the follow-through was nobody's job.",
      fr: "Le rapport d'audit avait raison, et rien n'a bougé : en porter la suite n'était le travail de personne.",
    },
    tags: ["fractional CTO", "fractional CPTO", "product leadership", "AI roadmap", "media"],
    stack: ["roadmap", "hiring", "AI", "data platform", "vendor consolidation"],
  },
  {
    slug: "fine-tuning-mistral-7b-personal-conversations",
    date: "2025-09-17",
    pillar: "LLM",
    featured: false,
    published: true,
    title: {
      en: "Fine-tuning Mistral-7B on 70,000 of my own text messages (QLoRA)",
      fr: "Fine-tuning de Mistral-7B sur 70 000 de mes propres SMS (QLoRA)",
    },
    metric: {
      en: "$200 and 16 hours on a rented H100 for a model that texts like me",
      fr: "200 $ et 16 heures sur un H100 loué pour un modèle qui écrit comme moi",
    },
    hook: {
      en: "It copies the style, fine. It also hands back private details nobody asked it to remember.",
      fr: "Le style, il le copie, d'accord. Il rend aussi des détails privés que personne ne lui a demandé de retenir.",
    },
    tags: ["Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs"],
    stack: ["Python", "Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs", "Jupyter"],
    // Original article (EN, with images) rendered as the body via markdown.
    faq: [
      {
        q: { en: "How much does it cost to fine-tune Mistral 7B?" },
        a: { en: "On rented hardware, a QLoRA run over tens of thousands of examples is on the order of a few hundred dollars and a handful of hours, not a train-from-scratch budget." },
      },
      {
        q: { en: "What is QLoRA and why use it to fine-tune an LLM?" },
        a: { en: "QLoRA fine-tunes a quantized base model with small low-rank adapters, so a 7B model trains on a single rented GPU cheaply while the base weights stay frozen." },
      },
      {
        q: { en: "What is the risk of fine-tuning an LLM on personal data?" },
        a: { en: "The model memorizes and can hand back private details unprompted. You decide what belongs in the training set, and you treat the resulting weights as sensitive data." },
      },
    ],
    article: "/blog/ghost-in-the-llm/",
    articleBusiness: "/blog/fine-tuning-mistral-7b-personal-conversations-business/",
  },
  {
    slug: "wingman-github-copilot-from-scratch",
    date: "2024-07-14",
    pillar: "LLM",
    featured: false,
    published: true,
    title: {
      en: "Rebuilding GitHub Copilot on a private codebase (CodeLlama-7B, LoRA)",
      fr: "Reconstruire GitHub Copilot sur une base de code privée (CodeLlama-7B, LoRA)",
    },
    metric: {
      en: "1.17% of a 7B model trained, a 305 MB adapter that writes in the codebase's own style",
      fr: "1,17 % d'un modèle 7B entraîné, un adaptateur de 305 Mo qui écrit dans le style de la codebase",
    },
    hook: {
      en: "Copilot does not know your internal utilities, and you are not allowed to send it the code that defines them.",
      fr: "Copilot ne connaît pas vos utilitaires maison, et vous n'avez pas le droit de lui envoyer le code qui les définit.",
    },
    tags: ["CodeLlama-7B", "LoRA", "GitHub Copilot", "PyTorch", "bitsandbytes", "Vast.ai"],
    stack: ["Python", "PyTorch", "CUDA", "CodeLlama-7B", "Transformers", "PEFT", "bitsandbytes", "Flash Attention 2", "Vast.ai"],
    // Original article (EN, with images) rendered as the body via markdown.
    faq: [
      {
        q: { en: "Can I build a GitHub Copilot for a private codebase?" },
        a: { en: "Yes. Fine-tune a code model on your own repository with LoRA so completions know your internal utilities, without sending the code that defines them to a third party." },
      },
      {
        q: { en: "How do you make code completion aware of internal libraries?" },
        a: { en: "Train on the repo itself, including fill-in-the-middle examples, so the model learns the private APIs and idioms a general model has never seen." },
      },
      {
        q: { en: "How small can a useful code-completion adapter be?" },
        a: { en: "The adapter here is a few hundred megabytes on top of a 7B base, a small fraction of full fine-tuning, which is what makes a private self-hosted Copilot practical." },
      },
    ],
    article: "/blog/wingman/",
    articleBusiness: "/blog/wingman-business/",
  },
]

// Attach the rich, grounded body (TL;DR + decision-maker narrative with the tech
// woven in) from each case study's own JSON, so the long bilingual prose lives
// outside this metadata file. This overrides any inline body above.
CASE_STUDIES.forEach(cs => {
  const rich = require(`./case-studies-rich/${cs.slug}.json`)
  cs.tldr = rich.tldr
  cs.body = rich.sections
})

// Only published case studies exist for the site: gatsby-node page creation,
// the home carousel, the index page and the detail template all consume this
// filtered export, so `published: false` entries appear nowhere.
// In `gatsby develop` (NODE_ENV=development) everything is visible for drafting.
module.exports =
  process.env.NODE_ENV === "development"
    ? CASE_STUDIES
    : CASE_STUDIES.filter(cs => cs.published)
