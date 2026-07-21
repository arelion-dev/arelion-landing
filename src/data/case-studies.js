// Case studies data. Plain CommonJS (no JSX) so gatsby-node can require it
// to generate detail pages, and components can import it too.
// Grounded in real work; anonymized (no client names in deep detail).
// Translatable fields are bilingual { en, fr }. Consumers pick by lang.
// Non-translatable: slug, pillar, featured, tags, stack, demo.sources.

const CASE_STUDIES = [
  {
    slug: "document-intelligence-at-scale",
    pillar: "Build",
    featured: true,
    published: false,
    title: { en: "Document intelligence at scale", fr: "L'intelligence documentaire à grande échelle" },
    metric: {
      en: "100M+ pages, answerable in a second",
      fr: "100M+ pages, interrogeables en une seconde",
    },
    hook: {
      en: "Thirty brands, a dozen languages, and teams redoing work that already exists because nobody can find it.",
      fr: "Trente marques, une douzaine de langues, et des équipes qui refont un travail qui existe déjà, faute de le retrouver.",
    },
    tags: ["RAG", "Gemini", "Pinecone", "Vertex AI", "Google ADK", "Document AI"],
    stack: ["Python", "Google ADK", "LiteLLM", "Pinecone", "Vertex AI Search", "Gemini", "GCP"],
    demo: {
      q: {
        en: "Which formulations mention this approach after 2020?",
        fr: "Quelles formulations mentionnent cette approche après 2020 ?",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    slug: "doc-agent-on-sqlite",
    pillar: "Build",
    featured: false,
    published: false,
    title: { en: "The document agent that runs on SQLite", fr: "L'agent documentaire qui tourne sur SQLite" },
    metric: {
      en: "No vector database. One file.",
      fr: "Pas de base vectorielle. Un fichier.",
    },
    hook: {
      en: "Stop being your company's search engine: invoices, contracts and statements answer in seconds, and nothing leaves the building.",
      fr: "Arrêtez d'être le moteur de recherche de votre boîte : factures, contrats et relevés répondent en quelques secondes, et rien ne sort de chez vous.",
    },
    tags: ["SQLite", "sqlite-vec", "FTS5", "Gemini", "RAG", "local-first"],
    stack: ["Python", "SQLite", "sqlite-vec", "FTS5", "Gemini 2.5 Flash/Pro"],
    demo: {
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
          en: "Clean PDFs are read directly, real scans by visual reading (Gemini 2.5 Flash). The model classifies and renames. Below 90% confidence, a stronger model re-reads, and an ambiguous document goes into a review queue instead of being filed at random. Hybrid search, semantic plus full-text (FTS5), merged, with small-to-big: we match a passage, we return the whole page.",
          fr: "Les PDF propres sont lus en direct, les vrais scans par lecture visuelle (Gemini 2.5 Flash). Le modèle classe et renomme. Sous 90 % de confiance, un modèle plus fort relit, et un document ambigu part dans une file à vérifier au lieu d'être rangé au hasard. Recherche hybride sémantique plus plein texte (FTS5), fusionnée, avec small-to-big : on matche un passage, on renvoie la page entière.",
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
    pillar: "Build",
    featured: false,
    published: false,
    title: { en: "A legal research assistant", fr: "Un assistant de recherche juridique" },
    metric: {
      en: "Every answer backed by a law that exists",
      fr: "Chaque réponse adossée à une loi qui existe",
    },
    hook: {
      en: "A chatbot that invents case law is worse than no chatbot at all.",
      fr: "Un chatbot qui invente la jurisprudence est pire que pas de chatbot du tout.",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    pillar: "Build",
    featured: false,
    published: false,
    title: { en: "The AI buyer who pushes back", fr: "L'acheteur IA qui ne se laisse pas faire" },
    metric: {
      en: "Practice 24/7, burn zero real prospects",
      fr: "S'entraîner à volonté, sans cramer un vrai prospect",
    },
    hook: {
      en: "Your reps learn on live prospects, and every fumbled call is a lead you paid for.",
      fr: "Vos commerciaux apprennent sur de vrais prospects, et chaque appel raté est un lead que vous avez payé.",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    pillar: "Build",
    featured: false,
    published: false,
    title: { en: "An AI coding stack, 100% local", fr: "Une stack IA de code, 100% locale" },
    metric: {
      en: "Nobody can leak what never left",
      fr: "Personne ne peut faire fuiter ce qui n'est jamais parti",
    },
    hook: {
      en: "Your code is too sensitive for a cloud LLM. Banning AI is not the only answer.",
      fr: "Votre code est trop sensible pour un LLM cloud. Interdire l'IA n'est pas la seule réponse.",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    pillar: "Automate",
    featured: true,
    published: false,
    title: { en: "Output contracts in production", fr: "Output contracts en production" },
    metric: {
      en: "Bad model output never reaches production",
      fr: "Aucune sortie de modèle douteuse n'atteint la prod",
    },
    hook: {
      en: "A model that is right 95% of the time is the dangerous kind: the wrong 5% looks exactly like the rest.",
      fr: "Un modèle juste à 95 % est le plus dangereux : les 5 % faux ressemblent trait pour trait au reste.",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    pillar: "Automate",
    featured: false,
    published: false,
    title: { en: "Keeping a human in the loop (KYC)", fr: "Garder un humain dans la boucle (KYC)" },
    metric: {
      en: "AI screens, a human makes the hard call",
      fr: "L'IA filtre, un humain tranche les cas durs",
    },
    hook: {
      en: "Fully automating a compliance decision is how the wrong investor gets in, and your name is on the approval.",
      fr: "Automatiser à 100 % une décision de conformité, c'est laisser entrer le mauvais investisseur, avec votre signature sur la validation.",
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
        h: { en: "What we built", fr: "Ce qu'on a construit" },
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
    pillar: "Audit",
    featured: true,
    published: false,
    title: { en: "The AI attack surface", fr: "La surface d'attaque de l'IA" },
    metric: {
      en: "49 security holes, found before attackers",
      fr: "49 failles, trouvées avant les attaquants",
    },
    hook: {
      en: "Secrets in the public JavaScript. An admin API trusting a cookie set to \"true\". Every test green.",
      fr: "Des secrets dans le JavaScript public. Une API admin qui croit un cookie \"true\". Tous les tests au vert.",
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
    pillar: "Audit",
    featured: false,
    published: false,
    title: { en: "Sleeper agents: the backdoor in the weights", fr: "Sleeper agents : la porte dérobée dans les poids" },
    metric: {
      en: "250 poisoned documents to backdoor a model, any size",
      fr: "250 documents empoisonnés pour piéger un modèle, quelle que soit sa taille",
    },
    hook: {
      en: "The model you deploy can carry a trigger no test will find, and safety training won't remove it.",
      fr: "Le modèle que vous déployez peut porter un déclencheur qu'aucun test ne trouvera, et le safety training ne l'enlèvera pas.",
    },
    tags: ["LLM security", "sleeper agents", "data poisoning", "backdoor", "egress control"],
    stack: ["threat model", "egress control", "taint tracking"],
    body: [
      {
        h: { en: "The problem", fr: "Le problème" },
        p: {
          en: "A hidden phrase, one nobody would say by chance, can turn an aligned assistant into an exfiltration tool. And safety training doesn't remove it.",
          fr: "Une phrase cachée, que personne ne dira par hasard, peut transformer un assistant aligné en outil d'exfiltration. Et le safety training ne l'enlève pas.",
        },
      },
      {
        h: { en: "The threat", fr: "La menace" },
        p: {
          en: "A trained backdoor survives safety training (Anthropic research). Around 250 documents are enough to poison a model, whatever its size. The real danger is the lethal trifecta: private data, untrusted content, and a network output brought together.",
          fr: "Un backdoor entraîné survit au safety training (recherche Anthropic). Environ 250 documents suffisent à empoisonner un modèle, quelle que soit sa taille. Le vrai danger est la lethal trifecta : données privées, contenu non fiable, et une sortie réseau réunis.",
        },
      },
      {
        h: { en: "How we defend", fr: "Comment on défend" },
        p: {
          en: "Break the trifecta, trace contamination and block any action with exfiltration potential, control network egress, lock tool-calls behind an allowlist, and track the provenance of models and data. Local-first sharply reduces the surface.",
          fr: "Casser la trifecta, tracer la contamination et bloquer toute action à potentiel d'exfiltration, contrôler l'egress réseau, verrouiller les tool-calls par allowlist, et pister la provenance des modèles et des données. Le local-first réduit fortement la surface.",
        },
      },
      {
        h: { en: "Reusable", fr: "Réutilisable" },
        p: {
          en: "A threat model and hardening for anyone deploying agents with tool access on sensitive data.",
          fr: "Modèle de menace et durcissement pour quiconque déploie des agents avec accès outils sur des données sensibles.",
        },
      },
    ],
  },
  {
    slug: "newsroom-platform-rebuild",
    pillar: "Transform",
    featured: true,
    published: false,
    title: {
      en: "Twelve years of journalism, moved without a blink",
      fr: "Douze ans de journalisme déménagés sans un clignement",
    },
    metric: {
      en: "12 years, one database",
      fr: "12 ans, une base de données",
    },
    hook: {
      en: "600k+ articles and 50M+ monthly pageviews moved off a legacy stack. Readers never noticed.",
      fr: "Plus de 600 000 articles et 50M de pages vues mensuelles sortis d'une pile héritée. Les lecteurs n'ont rien vu.",
    },
    tags: ["PostgreSQL", "GraphQL", "Next.js", "Cloud Run", "Cloudflare", "migration"],
    stack: ["PostgreSQL", "GraphQL", "Next.js", "Cloud Run", "Cloudflare", "React"],
  },
  {
    slug: "wire-service-intelligence",
    pillar: "Automate",
    featured: false,
    published: false,
    title: {
      en: "Wire-service intelligence",
      fr: "Intelligence sur le fil des agences",
    },
    metric: {
      en: "53% of output, finally differentiated",
      fr: "53% de la production, enfin différenciée",
    },
    hook: {
      en: "Half the site came from wires everyone buys. Now it ships deduped, rewritten in-house, and linked into a 600k-article archive.",
      fr: "La moitié du site venait de dépêches que tout le monde achète. Elles partent désormais dédoublonnées, réécrites maison, reliées à 600 000 archives.",
    },
    tags: ["LLM pipeline", "embeddings", "deduplication", "editorial AI", "CMS"],
    stack: ["LLM pipeline", "embeddings", "dedup clustering", "CMS integration"],
  },
  {
    slug: "archive-to-intelligence",
    pillar: "Transform",
    featured: false,
    published: false,
    title: {
      en: "The archive that became a product",
      fr: "L'archive devenue produit",
    },
    metric: {
      en: "12 years of archive, now a product line",
      fr: "12 ans d'archives, désormais une gamme de produits",
    },
    hook: {
      en: "People whose job depends on your information pay many times what a reader pays.",
      fr: "Ceux dont le métier dépend de votre information paient bien plus qu'un lecteur.",
    },
    tags: ["entity extraction", "embeddings", "Postgres", "LLM pipeline", "media archive"],
    stack: ["entity extraction", "LLM pipeline", "Postgres", "embeddings"],
  },
  {
    slug: "fractional-cpto-programme",
    pillar: "Transform",
    featured: true,
    published: false,
    title: {
      en: "A vendor waits, an owner moves",
      fr: "Un prestataire attend, un responsable avance",
    },
    metric: {
      en: "5 areas, 1 accountable owner",
      fr: "5 chantiers, 1 seul responsable",
    },
    hook: {
      en: "Fractional CTPO for a national news outlet: the strategy stays theirs, the execution ships under one name.",
      fr: "CTPO fractionné pour un média national : la stratégie reste chez eux, l'exécution est livrée sous un seul nom.",
    },
    tags: ["fractional CTO", "fractional CPTO", "product leadership", "AI roadmap", "media"],
    stack: ["roadmap", "hiring", "AI", "data platform", "vendor consolidation"],
  },
  {
    slug: "fine-tuning-mistral-7b-personal-conversations",
    pillar: "Writing",
    featured: false,
    published: false,
    title: {
      en: "Fine-tuning a small model on personal conversations",
      fr: "Fine-tuner un petit modèle sur ses conversations personnelles",
    },
    metric: {
      en: "70,000 messages, ~$200, 16 hours: a model that talks like me",
      fr: "70 000 messages, ~200 $, 16 heures : un modèle qui parle comme moi",
    },
    hook: {
      en: "The Black Mirror premise, tested for real: recreate someone's texting voice from their message history. It works, disturbingly well.",
      fr: "Le scénario Black Mirror, testé pour de vrai : recréer la voix de quelqu'un depuis son historique de messages. Ça marche, et c'est dérangeant.",
    },
    tags: ["Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs"],
    stack: ["Python", "Mistral-7B", "QLoRA", "Axolotl", "Hugging Face", "Replicate", "Lambda Labs", "Jupyter"],
    // Original article (EN, with images) rendered as the body via markdown.
    article: "/blog/ghost-in-the-llm/",
  },
  {
    slug: "wingman-github-copilot-from-scratch",
    pillar: "Writing",
    featured: false,
    published: false,
    title: {
      en: "Wingman: building my own GitHub Copilot from scratch",
      fr: "Wingman : reconstruire mon propre GitHub Copilot à partir de zéro",
    },
    metric: {
      en: "1.17% of a 7B model trained, a 305 MB adapter that completes code",
      fr: "1,17 % d'un modèle 7B entraîné, un adaptateur de 305 Mo qui complète du code",
    },
    hook: {
      en: "Why I built my own Copilot alternative, fine-tuned on a private codebase: model choice, quantization, LoRA, the GPU wall, and what actually broke.",
      fr: "Pourquoi j'ai bâti mon alternative à Copilot, fine-tunée sur une codebase privée : choix du modèle, quantization, LoRA, le mur GPU, et ce qui a vraiment cassé.",
    },
    tags: ["CodeLlama-7B", "LoRA", "GitHub Copilot", "PyTorch", "bitsandbytes", "Vast.ai"],
    stack: ["Python", "PyTorch", "CUDA", "CodeLlama-7B", "Transformers", "PEFT", "bitsandbytes", "Flash Attention 2", "Vast.ai"],
    // Original article (EN, with images) rendered as the body via markdown.
    article: "/blog/wingman/",
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
