// Cards with full content first (rough reverse-chronological),
// then thinner cards at the bottom of the grid.
// `role` and `outcomes` are bilingual { en, fr }; consumed by lang.
// `client`, `tags`, `stack`, `period` stay as-is (names, tech, dates).

const REALISATIONS = [
  {
    id: "privately-ai",
    client: "privately.ai",
    role: { en: "CTO · Solutions Architect", fr: "CTO · Architecte solutions" },
    period: "Jul — Nov 2024",
    tags: ["AI/ML", "Product", "Scale-up"],
    outcomes: [
      {
        en: "Designed and shipped a full-stack Document AI SaaS: secure chat with documents, multi-language OCR + PDF parsing, RAG over structured & unstructured data, smart chunking, semantic filtering and full source traceability",
        fr: "Conception et livraison d'un SaaS Document AI full-stack : chat sécurisé avec les documents, OCR multilingue et parsing PDF, RAG sur données structurées et non structurées, chunking intelligent, filtrage sémantique et traçabilité complète des sources",
      },
      {
        en: "Admin dashboard with usage analytics, team access controls, custom prompts, API keys and usage-based pricing. LLM-agnostic backend (OpenAI, Claude, Mistral, custom) on a single VPS via Dokku",
        fr: "Dashboard admin avec analytics d'usage, gestion des accès équipe, prompts personnalisés, clés API et tarification à l'usage. Backend agnostique au LLM (OpenAI, Claude, Mistral, custom) sur un seul VPS via Dokku",
      },
      {
        en: "Sold the IP and codebase in 2025",
        fr: "IP et code revendus en 2025",
      },
    ],
    stack: [
      "TypeScript",
      "React",
      "Vite",
      "Node.js",
      "Postgres",
      "pgvector",
      "OpenAI",
      "Mistral",
    ],
  },
  {
    id: "loreal",
    client: "L'Oréal",
    role: { en: "Senior Software Engineer · LLM & GenAI", fr: "Ingénieur logiciel senior · LLM & GenAI" },
    period: "2024 → present",
    tags: ["AI/ML", "Architecture", "Data"],
    outcomes: [
      {
        en: "Engineered an ingestion + OCR + vectorization pipeline for millions of multilingual, multi-confidentiality documents",
        fr: "Pipeline d'ingestion, OCR et vectorisation pour des millions de documents multilingues et à confidentialité variable",
      },
      {
        en: "Designed high-throughput GCP microservices provisioned with Terraform: sub-second p95 semantic search across 30 brands",
        fr: "Microservices GCP à haut débit provisionnés avec Terraform : recherche sémantique p95 sous la seconde sur 30 marques",
      },
      {
        en: "Shipped semantic search, natural-language filters and a “Chat with your docs” interface combining multiple LLMs",
        fr: "Recherche sémantique, filtres en langage naturel et une interface « Chat with your docs » combinant plusieurs LLM",
      },
    ],
    stack: [
      "Python",
      "FastAPI",
      "React",
      "GCP",
      "Vertex AI",
      "pgvector",
      "Terraform",
      "LangChain",
    ],
  },
  {
    id: "free-malaysia-today",
    client: "Free Malaysia Today",
    role: { en: "Fractional CTO", fr: "CTO à temps partagé" },
    period: "2025 → present",
    tags: ["Advisory", "Architecture"],
    outcomes: [
      {
        en: "Advisory + delivery on a long-running consulting engagement (NDA)",
        fr: "Conseil et delivery sur une mission de consulting au long cours (NDA)",
      },
      {
        en: "Editorial workflow and performance overhaul in flight",
        fr: "Refonte du workflow éditorial et des performances en cours",
      },
    ],
    stack: ["Next.js", "GraphQL", "Prisma", "GCP", "Cloud Run", "Terraform"],
  },
  {
    id: "easydca",
    client: "EasyDCA",
    role: { en: "CTO · Solutions Architect", fr: "CTO · Architecte solutions" },
    tags: ["Product", "Scale-up"],
    outcomes: [
      {
        en: "Crypto auto-investing SaaS: DCA bots running on Binance, Kraken, FTX and Coinbase, with unlimited bots on Premium",
        fr: "SaaS d'investissement crypto automatique : des bots DCA sur Binance, Kraken, FTX et Coinbase, bots illimités en Premium",
      },
      {
        en: "57k€ invested through the platform across 4,530 bot-executed trades",
        fr: "57k€ investis via la plateforme sur 4 530 trades exécutés par les bots",
      },
      {
        en: "Shut down once major exchanges started implementing DCA natively",
        fr: "Arrêté quand les grandes plateformes ont intégré le DCA nativement",
      },
    ],
    stack: ["TypeScript", "Node.js", "React", "Postgres", "Exchange APIs"],
  },
  {
    id: "relevanc",
    client: "relevanC",
    role: { en: "Senior Fullstack & Data Engineer", fr: "Ingénieur fullstack & data senior" },
    period: "2020 — 2024",
    tags: ["Architecture", "Data", "Full-stack"],
    outcomes: [
      {
        en: "Engineered an analytics platform processing 400M+ events/month: fault-tolerant, idempotent ETL workflows",
        fr: "Plateforme analytics traitant 400M+ événements par mois : workflows ETL idempotents et tolérants aux pannes",
      },
      {
        en: "Optimized real-time sales-KPI pipelines in Python/SQL: cut clicks-to-create-campaign by 50%",
        fr: "Pipelines de KPI de ventes en temps réel optimisés en Python/SQL : moitié moins de clics pour créer une campagne",
      },
      {
        en: "Automated CI/CD on GCP, Docker and GitLab for zero-downtime releases",
        fr: "CI/CD automatisé sur GCP, Docker et GitLab pour des releases sans interruption",
      },
    ],
    stack: ["Python", "SQL", "React", "TypeScript", "Node.js", "GCP", "Docker", "GitLab CI"],
  },
  {
    id: "foundingbird",
    client: "Foundingbird",
    role: { en: "CTO · Solutions Architect", fr: "CTO · Architecte solutions" },
    period: "2019 — 2020",
    tags: ["Leadership", "Product", "Scale-up"],
    outcomes: [
      {
        en: "Designed and shipped Malaysia's first fully online company-secretary service: registration, banking and accounting under one roof",
        fr: "Conception et lancement du premier service de secrétariat d'entreprise 100% en ligne de Malaisie : création, banque et comptabilité au même endroit",
      },
      {
        en: "Cut incorporation time from weeks to hours through end-to-end automation",
        fr: "Délai de création d'entreprise réduit de plusieurs semaines à quelques heures grâce à l'automatisation de bout en bout",
      },
      {
        en: "Hired and led the engineering team; sold stake in 2020 (company still active)",
        fr: "Recrutement et direction de l'équipe technique ; parts revendues en 2020 (société toujours active)",
      },
    ],
    stack: ["Node.js", "React", "TypeScript", "Postgres", "AWS"],
  },
  {
    id: "kaunto",
    client: "Kaunto",
    role: { en: "CTO · Solutions Architect", fr: "CTO · Architecte solutions" },
    period: "2018 — 2020",
    tags: ["Leadership", "Product", "Scale-up"],
    outcomes: [
      {
        en: "Designed a secure, automated system for crypto transaction accounting and compliance",
        fr: "Système sécurisé et automatisé pour la comptabilité et la conformité des transactions crypto",
      },
      {
        en: "Shipped real-time digital-asset tracking: 100+ currencies, millions of transactions, worldwide client base",
        fr: "Suivi d'actifs numériques en temps réel : 100+ devises, des millions de transactions, une clientèle mondiale",
      },
      {
        en: "Showcased at G20 Osaka 2019; team pivoted into Foundingbird when scaling stalled",
        fr: "Présenté au G20 d'Osaka 2019 ; l'équipe a pivoté vers Foundingbird quand la croissance a calé",
      },
    ],
    stack: ["Node.js", "React", "TypeScript", "Postgres", "Web3"],
  },
  {
    id: "deezer",
    client: "Deezer",
    role: { en: "Senior Software Engineer", fr: "Ingénieur logiciel senior" },
    period: "2017 — 2018",
    tags: ["Full-stack", "Scale"],
    outcomes: [
      {
        en: "Streaming infrastructure serving 53M+ songs to 14M+ users across 180+ countries",
        fr: "Infrastructure de streaming servant 53M+ titres à 14M+ utilisateurs dans 180+ pays",
      },
      {
        en: "Continuously evolved the React/Redux web stack at scale",
        fr: "Évolution continue de la stack web React/Redux à grande échelle",
      },
      {
        en: "Shipped product features on the music-streaming platform",
        fr: "Développement de fonctionnalités sur la plateforme de streaming musical",
      },
    ],
    stack: ["React", "Redux", "JavaScript", "Node.js"],
  },
  {
    id: "pokespot",
    client: "PokeSpot",
    role: { en: "Software Engineer · React Native", fr: "Ingénieur logiciel · React Native" },
    period: "2016 — 2017",
    tags: ["Mobile", "Product"],
    outcomes: [
      {
        en: "Top 5 App Store, 1M+ downloads",
        fr: "Top 5 App Store, 1M+ téléchargements",
      },
      {
        en: "Mobile companion app launched at the height of the Pokémon Go wave",
        fr: "App mobile compagnon lancée au pic de la vague Pokémon Go",
      },
      {
        en: "iOS + Android release pipelines and store rollouts",
        fr: "Pipelines de release iOS et Android et déploiements sur les stores",
      },
    ],
    stack: ["React Native", "Node.js", "MongoDB", "iOS", "Android"],
  },
  {
    id: "matters",
    client: "Matters",
    role: { en: "Software Engineer · React Native", fr: "Ingénieur logiciel · React Native" },
    period: "2016 — 2017",
    tags: ["Mobile", "Full-stack"],
    outcomes: [
      {
        en: "React Native developer on core app features: carsharing, rentals, minicabs",
        fr: "Développeur React Native sur les fonctionnalités cœur de l'app : autopartage, location, VTC",
      },
      {
        en: "Owned the iOS release pipeline: App Store submissions and production rollouts",
        fr: "Responsable du pipeline de release iOS : soumissions App Store et déploiements en production",
      },
      {
        en: "Cross-platform mobility product",
        fr: "Produit de mobilité multiplateforme",
      },
    ],
    stack: ["React Native", "iOS", "Node.js", "Redux"],
  },
  {
    id: "jolicloud",
    client: "Jolicloud & The Desktop",
    role: { en: "Software Engineer", fr: "Ingénieur logiciel" },
    period: "2014 — 2016",
    tags: ["Full-stack", "Migration"],
    outcomes: [
      {
        en: "Unified Dropbox, Google Drive, OneDrive, Box, Evernote and Flickr into one cross-cloud interface",
        fr: "Dropbox, Google Drive, OneDrive, Box, Evernote et Flickr réunis dans une seule interface multi-cloud",
      },
      {
        en: "Led a complex Backbone → React migration under heavy production usage",
        fr: "Migration complexe de Backbone vers React menée sous forte charge en production",
      },
      {
        en: "Full UX redesign to streamline cross-cloud file management",
        fr: "Refonte UX complète pour simplifier la gestion de fichiers multi-cloud",
      },
    ],
    stack: ["React", "Backbone", "JavaScript", "Node.js"],
  },

  // Thinner cards — fill in and promote up the list as content lands.

  {
    id: "epsor",
    client: "Epsor",
    role: { en: "Solutions Architect", fr: "Architecte solutions" },
    tags: ["Architecture"],
    outcomes: [
      {
        en: "Event-driven microservices architecture for the fintech platform: Node.js services communicating over Kafka",
        fr: "Architecture microservices événementielle pour la plateforme fintech : services Node.js communiquant via Kafka",
      },
    ],
    stack: ["Node.js", "Microservices", "Kafka"],
  },
  {
    id: "flashbreak",
    client: "Flashbreak",
    role: { en: "Software Engineer · Real-time", fr: "Ingénieur logiciel · Temps réel" },
    tags: ["Architecture", "Scale"],
    outcomes: [
      {
        en: "Engineered the broadcast engine powering a live, interactive game show",
        fr: "Moteur de diffusion d'un jeu télévisé interactif en direct",
      },
      {
        en: "Thousands of concurrent viewers across 2 live shows per day: heavy concurrency and real-time delivery challenges",
        fr: "Des milliers de spectateurs simultanés sur 2 émissions live par jour : forte concurrence et diffusion temps réel",
      },
    ],
    stack: ["Python", "AWS Live", "Firebase"],
  },
  {
    id: "fullsend",
    client: "Fullsend",
    role: { en: "Software Engineer · Studio", fr: "Ingénieur logiciel · Studio" },
    tags: ["Product", "Full-stack"],
    outcomes: [
      {
        en: "Multiple product engagements through the startup studio",
        fr: "Plusieurs missions produit via le startup studio",
      },
    ],
    stack: ["React Native", "Node.js", "Python"],
  },
  {
    id: "vertical-ascent",
    client: "Vertical Ascent",
    role: { en: "Advisor", fr: "Conseiller" },
    tags: ["Advisory"],
    outcomes: [
      {
        en: "Advisory engagement for a wealth-management firm (NDA)",
        fr: "Mission de conseil pour une société de gestion de patrimoine (NDA)",
      },
    ],
    stack: ["Python", "Azure", "Node.js", "React"],
  },
  {
    id: "ambientit",
    client: "AmbientIT",
    role: { en: "Instructor · Node.js & React", fr: "Formateur · Node.js & React" },
    tags: ["Mentoring"],
    outcomes: [
      {
        en: "Instructor for working engineers transitioning between Node.js and React stacks",
        fr: "Formateur pour ingénieurs en poste passant des stacks Node.js à React",
      },
    ],
    stack: ["Node.js", "React"],
  },
]

export default REALISATIONS
