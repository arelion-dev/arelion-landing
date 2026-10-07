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
        en: "A document AI product: teams ask their own files a question and get the answer with its source, scanned PDFs and several languages included",
        fr: "Un produit de document AI : les équipes posent une question à leurs propres fichiers et reçoivent la réponse avec sa source, PDF scannés et plusieurs langues compris",
      },
      {
        en: "Works with OpenAI, Claude or Mistral, and ran on a single server",
        fr: "Fonctionne avec OpenAI, Claude ou Mistral, sur un seul serveur",
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
    role: { en: "Senior AI Engineer · Document AI", fr: "Ingénieur IA senior · Document AI" },
    period: "2024 → present",
    tags: ["AI/ML", "Architecture", "Data"],
    outcomes: [
      {
        en: "R&D teams search 100M+ pages in many languages and get answers with their source",
        fr: "Les équipes R&D cherchent dans 100M+ pages en plusieurs langues et obtiennent des réponses sourcées",
      },
      {
        en: "Answers in under a second across 30 brands",
        fr: "Réponse en moins d'une seconde, sur 30 marques",
      },
      {
        en: "Built the pipeline that reads, OCRs and indexes the documents, on Google Cloud",
        fr: "Pipeline qui lit les documents, les passe à l'OCR et les indexe, sur Google Cloud",
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
        en: "Technology lead on a long-running engagement (NDA): product, platform and AI",
        fr: "Direction technique d'une mission au long cours (NDA) : produit, plateforme et IA",
      },
      {
        en: "Editorial workflow and site performance rebuilt",
        fr: "Workflow éditorial et performances du site refondus",
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
        en: "Investors automated their recurring crypto purchases on Binance, Kraken, FTX and Coinbase",
        fr: "Les investisseurs automatisaient leurs achats crypto récurrents sur Binance, Kraken, FTX et Coinbase",
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
        en: "Campaign managers create a campaign in half the clicks",
        fr: "Les responsables de campagne créent une campagne en deux fois moins de clics",
      },
      {
        en: "Analytics on 400M+ events a month, with data jobs that can rerun safely after a failure",
        fr: "Analytics sur 400M+ événements par mois, avec des traitements qu'on peut relancer sans risque après une panne",
      },
      {
        en: "Releases without downtime, through automated deployment",
        fr: "Mises en production sans interruption, grâce à un déploiement automatisé",
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
        en: "Company incorporation cut from weeks to hours by automating it end to end",
        fr: "Création d'entreprise ramenée de plusieurs semaines à quelques heures, automatisée de bout en bout",
      },
      {
        en: "Malaysia's first fully online company-secretary service: registration, banking and accounting in one place",
        fr: "Premier service de secrétariat d'entreprise 100% en ligne de Malaisie : création, banque et comptabilité au même endroit",
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
        en: "Crypto accounting and compliance done automatically, for 100+ currencies and millions of transactions",
        fr: "Comptabilité et conformité des transactions crypto automatisées, sur 100+ devises et des millions de transactions",
      },
      {
        en: "Real-time asset tracking for clients worldwide",
        fr: "Suivi des actifs en temps réel pour une clientèle mondiale",
      },
      {
        en: "Showcased at G20 Osaka 2019; team pivoted into Foundingbird",
        fr: "Présenté au G20 d'Osaka 2019 ; l'équipe a pivoté vers Foundingbird",
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

  // Thinner card.

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
]

export default REALISATIONS
