// UI string catalog. en is the source of truth; fr is a real translation.
// t("a.b") resolves a nested key; values can be strings or arrays.
// No em-dashes anywhere (see anti-slop-fr rules for the French).

const catalog = {
  en: {
    nav: {
      caseStudies: "case studies",
      whatsapp: "WhatsApp",
      bookACall: "book a call",
    },
    testi: {
      title: "What clients say",
      readOn: "Read on LinkedIn",
      items: [
        {
          quote:
            "Antonin is technically solid, but above all impact-driven. He does not just do the job: he digs into the stakes behind every topic and delivers something that actually creates value. Pragmatic, reliable and structured, he moves fast without losing sight of what matters.",
          name: "Ciprian Noaghiu",
          role: "CEO, relevanC",
        },
        {
          quote:
            "Antonin stands out for his strong pedagogical skills: despite a high level of technical expertise, he is able to explain complex topics in a clear and accessible way to non-technical stakeholders.",
          name: "Paula Alves",
          role: "Head of AdOps, retail media",
        },
        {
          quote:
            "Where many before him failed, Anton succeeded, bringing about significant improvements in a short span. What sets him apart is his leadership, skill in stakeholder management, strategy, attention to detail and vision for the long haul.",
          name: "Azeem Abu Bakar",
          role: "Managing Director, FMT News",
        },
      ],
    },
    hero: {
      subtitle: "Fractional CTO / CPTO · Product, AI & Architecture",
      // *word* renders in the accent color
      headline:
        "Product *vision*, tech *leadership*, and AI systems from *roadmap* to *production*",
      sticky: [
        "AI search over 100M+ pages",
        "Top 5 App Store, 1M+ downloads",
        "Built & sold multiple SaaS",
        "20+ clients · 12 years",
      ],
      companiesLabel: "Companies we've worked with",
    },
    roles: {
      leadership: {
        title: "Technical Product Leadership",
        badge: "Scrum Product Owner Certified",
        desc: "We prioritize the roadmap, scope requirements, write specs and coordinate stakeholders. Two startups cofounded and run end-to-end (Foundingbird, Kaunto): we know what shipping looks like.",
      },
      ai: {
        title: "AI for Business",
        desc: "We help SMBs and enterprises adopt AI: RAG, semantic search, LLM integrations, workflow automation, finding the right tool without overengineering. Designed and sold a Document AI SaaS in 2025.",
      },
      arch: {
        title: "Solutions Architecture",
        desc: [
          "Built the ingestion pipeline for 100M+ pages at L'Oréal (OCR, vectorization, semantic search). Designed relevanC's analytics platform processing 400M+ events/month.",
          "Full-stack (React, React Native, TypeScript, Python, FastAPI) on GCP with Terraform.",
        ],
      },
    },
    cs: {
      kicker: "Case studies",
      h1: "Real problems.\nAnd the architecture behind them.",
      dek: "AI systems, cloud platforms and automation, from design to production. Here's what I've built, how, and what I can rebuild for you.",
      tabsAll: "All",
      read: "Read the case study",
      cardRead: "Read",
      closeH2: "A problem that looks like one of these?",
      bookACall: "Book a call",
      crumb: "Case studies",
      homeTitle: "Case studies",
      homeSub: "How I solve concrete problems, and what I can rebuild for you.",
      seeAll: "See all case studies",
    },
    csDetail: {
      demoQuestion: "Question",
      demoAnswer: "Answer",
      demoSources: "Sources",
      ctaLine: "Got this problem? We'll look at yours, in writing.",
      bookACall: "Book a call",
    },
    sw: {
      title: "Selected work, 2014 to present.",
      lede: "A partial record. Some clients are confidential;\nsome work predates anything worth listing here.",
    },
  },
  fr: {
    nav: {
      caseStudies: "études de cas",
      whatsapp: "WhatsApp",
      bookACall: "réserver un appel",
    },
    testi: {
      title: "Ce qu'en disent les clients",
      readOn: "Lire sur LinkedIn",
      items: [
        {
          quote:
            "Antonin est quelqu'un de solide techniquement, mais surtout orienté impact. Il ne se contente pas de « faire le job » : il cherche à comprendre les enjeux derrière chaque sujet et à produire quelque chose qui crée réellement de la valeur. Pragmatique, fiable et structuré, il avance vite sans perdre de vue l'essentiel.",
          name: "Ciprian Noaghiu",
          role: "CEO, relevanC",
        },
        {
          quote:
            "Antonin se distingue par ses grandes qualités pédagogiques : malgré un haut niveau d'expertise technique, il sait expliquer des sujets complexes de façon claire et accessible à des interlocuteurs non techniques.",
          name: "Paula Alves",
          role: "Head of AdOps, retail media",
        },
        {
          quote:
            "Là où beaucoup avaient échoué avant lui, Anton a réussi, avec des améliorations significatives en peu de temps. Ce qui le distingue : son leadership, sa gestion des parties prenantes, sa stratégie, son souci du détail et sa vision de long terme.",
          name: "Azeem Abu Bakar",
          role: "Managing Director, FMT News",
        },
      ],
    },
    hero: {
      subtitle: "CTO / CPO à temps partagé · Produit, IA & architecture",
      // *word* renders in the accent color
      headline:
        "*Vision* produit, *leadership* tech et systèmes IA de la *roadmap* à la *production*",
      sticky: [
        "Recherche IA sur 100M+ pages",
        "Top 5 App Store, 1M+ téléchargements",
        "Plusieurs SaaS construits et revendus",
        "20+ clients · 12 ans",
      ],
      companiesLabel: "Avec qui on a travaillé",
    },
    roles: {
      leadership: {
        title: "Pilotage produit technique",
        badge: "Certifié Scrum Product Owner",
        desc: "On priorise la roadmap, on cadre le besoin, on écrit les specs et on aligne les parties prenantes. Deux startups cofondées et menées de bout en bout (Foundingbird, Kaunto) : on sait ce que livrer veut dire.",
      },
      ai: {
        title: "L'IA pour votre activité",
        desc: "On aide PME et grands comptes à adopter l'IA : RAG, recherche sémantique, intégrations LLM, automatisation des workflows. On trouve le bon outil sans sur-ingénierie. Un SaaS de Document AI conçu et revendu en 2025.",
      },
      arch: {
        title: "Architecture de solutions",
        desc: [
          "Pipeline d'ingestion de 100M+ pages construit chez L'Oréal (OCR, vectorisation, recherche sémantique). Plateforme analytics de relevanC qui traite 400M+ événements par mois.",
          "Full-stack (React, React Native, TypeScript, Python, FastAPI) sur GCP avec Terraform.",
        ],
      },
    },
    cs: {
      kicker: "Études de cas",
      h1: "Des problèmes réels.\nEt l'architecture derrière.",
      dek: "Systèmes IA, plateformes cloud et automatisation, de la conception à la production. Voici ce que j'ai construit, comment, et ce que je peux refaire chez vous.",
      tabsAll: "Tous",
      read: "Lire l'étude de cas",
      cardRead: "Lire",
      closeH2: "Un problème qui ressemble à l'un de ceux-là ?",
      bookACall: "Réserver un appel",
      crumb: "Études de cas",
      homeTitle: "Études de cas",
      homeSub: "Comment je résous des problèmes concrets, et ce que je peux refaire chez vous.",
      seeAll: "Voir toutes les études de cas",
    },
    csDetail: {
      demoQuestion: "Question",
      demoAnswer: "Réponse",
      demoSources: "Sources",
      ctaLine: "Vous avez ce problème ? On regarde le vôtre, en écrit.",
      bookACall: "Réserver un appel",
    },
    sw: {
      title: "Sélection de projets, 2014 à aujourd'hui.",
      lede: "Un aperçu partiel. Certains clients sont confidentiels,\net une partie du travail est trop ancienne pour figurer ici.",
    },
  },
}

export default catalog
