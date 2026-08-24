// UI string catalog. en is the source of truth; fr is a real translation.
// t("a.b") resolves a nested key; values can be strings or arrays.
// No em-dashes anywhere (see anti-slop-fr rules for the French).

const catalog = {
  en: {
    nav: {
      caseStudies: "technical blog",
      whatsapp: "WhatsApp",
      bookACall: "book a call",
    },
    testi: {
      title: "What clients say",
      readOn: "Read on LinkedIn",
      seeAll: "Read all testimonials",
      readMore: "Read more",
      items: [
        {
          quote:
            "Of all the developers and engineers I've worked with (125+ and counting over 21 years), ==I've never met one who could balance such a calm, tolerant personality with the often insane workloads he took on==. If you get the chance to work with him, take it.",
          full:
            "Anton earned my trust almost immediately. He is uniquely and exceptionally skilled, organized, and professional, and he takes security seriously from the start. It all comes naturally and comfortably to him and his ability to keep calm through any scenario had a mirrored effect directly back to the client. That is why I kept coming back to him for more and more work. I trusted him enough to bring him into my own home when my first child was being born. Of all the developers and engineers I've ever worked with (125+ now and counting over 21 years) ==I've never met one that was able to balance a healthy, comforting, tolerant personality with the eclectic and often insane workloads he was tasked with==. If you get the chance to work with him, take it. The first signed contract includes a long term professional relationship which is invaluable.",
          name: "Christopher Ware",
          role: "Founder & CEO, Cryptosheets · ex Morgan Stanley VP",
        },
        {
          quote:
            "Antonin is technically solid, but above all impact-driven. ==He does not just do the job: he digs into the stakes behind every topic and delivers something that actually creates value.== Pragmatic, reliable and structured, he moves fast without losing sight of what matters.",
          full:
            "I had the chance to work with Antonin for several years, and he was a real asset day to day. Antonin is technically solid, but above all impact-driven. ==He does not just do the job: he systematically digs into the stakes behind every topic and delivers something that actually creates value.== Pragmatic, reliable and structured, he moves fast without losing sight of what matters. I recommend Antonin without hesitation.",
          name: "Ciprian Noaghiu",
          role: "CEO, relevanC",
        },
        {
          quote:
            "Antonin stands out for his strong pedagogical skills: ==despite a high level of technical expertise, he is able to explain complex topics in a clear and accessible way to non-technical stakeholders.==",
          full:
            "I had the opportunity to work with Antonin on the development of a product, in a context where I was primarily responsible for business and operational aspects. Antonin stands out for his strong pedagogical skills: ==despite a high level of technical expertise, he is able to explain complex topics in a clear and accessible way to non-technical stakeholders.== He also demonstrates a strong sense of responsibility, particularly when objectives must be met under tight deadlines or in urgent situations. His professionalism, ability to collaborate effectively with a wide range of profiles, and solution-oriented mindset were key assets to the success of the project. I highly recommend Antonin for any collaboration requiring rigor, clarity, and efficiency.",
          name: "Paula Alves",
          role: "Head of AdOps, retail media",
        },
        {
          quote:
            "==Where many before him failed, Anton succeeded, bringing about significant improvements in a short span.== What sets him apart is his leadership, skill in stakeholder management, strategy, attention to detail and vision for the long haul.",
          full:
            "I wholeheartedly recommend Anton as a solutions architect who has proven invaluable to our organisation. Faced with a site riddled with issues, from missing widgets to speed inconsistencies, he demonstrated an ability few possess. ==Where many before him failed, Anton succeeded, bringing about significant improvements in a short span.== What sets Anton apart is his leadership, skill in stakeholder management, strategy, attention to detail and vision for the long haul. Even after the conclusion of his contract, he continues to offer his expertise, ensuring our trajectory remains positive. Anton's dedication to quality and sustainable solutions is unmatched, and we are profoundly grateful for his contributions.",
          name: "Azeem Abu Bakar",
          role: "Managing Director, FMT News",
        },
        {
          quote:
            "Anton is a beast. Able to understand the goals of what we are trying to build and make technical decisions that get us closer to those objectives rather than just directly answering the bell. ==Strategic technical thinkers like this are often hard to find.==",
          full:
            "Anton is a beast. Able to understand the goals of what we are trying to build and make technical decisions that get us closer to those objectives rather than just directly answering the bell. ==Strategic technical thinkers like this are often hard to find.== Not to mention a pleasure to work with.",
          name: "Alex Gutwillig",
          role: "Director of Product, Fullsend",
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
      companiesLabel: "Companies I've worked with",
    },
    roles: {
      leadership: {
        title: "Technical Product Leadership",
        badge: "Scrum Product Owner Certified",
        desc: "I prioritize the roadmap, scope requirements, write specs and coordinate stakeholders. Two startups cofounded and run end-to-end (Foundingbird, Kaunto): I know what shipping looks like.",
      },
      ai: {
        title: "AI for Business",
        desc: "I help SMBs and enterprises adopt AI: RAG, semantic search, LLM integrations, workflow automation, finding the right tool without overengineering. Designed and sold a Document AI SaaS in 2025.",
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
      kicker: "Technical Blog",
      h1: "Real problems.\nAnd the architecture behind them.",
      dek: "AI systems, cloud platforms and automation, from design to production. Here's what I've built, how, and what I can rebuild for you.",
      tabsAll: "All",
      read: "Read the article",
      cardRead: "Read",
      closeH2: "A problem that looks like one of these?",
      bookACall: "Book a call",
      crumb: "Technical Blog",
      homeTitle: "Technical Blog",
      homeSub: "How I solve concrete problems, and what I can rebuild for you.",
      seeAll: "See all articles",
    },
    csDetail: {
      demoQuestion: "Question",
      demoAnswer: "Answer",
      demoSources: "Sources",
      audienceLabel: "Two ways to read this:",
      audienceBusiness: "Business",
      audienceTech: "Tech",
      audienceHintBusiness:
        "You are reading the plain-language version. Switch to Tech for the code and the architecture.",
      audienceHintTech:
        "You are reading the technical deep-dive. Switch to Business for the outcome, no code.",
      ctaLine: "Got this problem? I'll look at yours, in writing.",
      bookACall: "Book a call",
      faqTitle: "Questions I get about this",
      relatedTitle: "Related articles",
    },
    sw: {
      title: "Client work",
      lede: "A partial record. Some clients are confidential;\nsome work predates anything worth listing here.",
    },
  },
  fr: {
    nav: {
      caseStudies: "blog technique",
      whatsapp: "WhatsApp",
      bookACall: "réserver un appel",
    },
    testi: {
      title: "Ce qu'en disent les clients",
      readOn: "Lire sur LinkedIn",
      seeAll: "Voir tous les témoignages",
      readMore: "Voir plus",
      items: [
        {
          quote:
            "De tous les développeurs et ingénieurs avec qui j'ai travaillé (plus de 125 sur 21 ans), ==je n'en ai jamais rencontré un capable d'allier une personnalité aussi calme et tolérante avec les charges de travail souvent démentielles qu'il assumait==. Si vous avez l'occasion de travailler avec lui, saisissez-la.",
          full:
            "Anton a gagné ma confiance presque immédiatement. Il est d'une compétence unique et exceptionnelle, organisé et professionnel, et il prend la sécurité au sérieux dès le départ. Tout lui vient naturellement et sereinement, et sa capacité à garder son calme en toute situation se répercutait directement sur le client. C'est pour ça que je suis revenu le chercher pour toujours plus de travail. Je lui ai fait assez confiance pour le faire entrer chez moi au moment de la naissance de mon premier enfant. De tous les développeurs et ingénieurs avec qui j'ai travaillé (plus de 125 à ce jour, sur 21 ans), ==je n'en ai jamais rencontré un capable d'allier une personnalité saine, rassurante et tolérante avec les charges de travail éclectiques et souvent démentielles qu'on lui confiait==. Si vous avez l'occasion de travailler avec lui, saisissez-la. Le premier contrat signé s'accompagne d'une relation professionnelle de long terme, ce qui est inestimable.",
          name: "Christopher Ware",
          role: "Founder & CEO, Cryptosheets · ex Morgan Stanley VP",
        },
        {
          quote:
            "Antonin est quelqu'un de solide techniquement, mais surtout orienté impact. ==Il ne se contente pas de « faire le job » : il cherche à comprendre les enjeux derrière chaque sujet et à produire quelque chose qui crée réellement de la valeur.== Pragmatique, fiable et structuré, il avance vite sans perdre de vue l'essentiel.",
          full:
            "J'ai eu l'occasion de travailler plusieurs années avec Antonin, et ce fut un vrai atout au quotidien. Antonin est quelqu'un de solide techniquement, mais surtout orienté impact. ==Il ne se contente pas de « faire le job » : il cherche systématiquement à comprendre les enjeux derrière chaque sujet et à produire quelque chose qui crée réellement de la valeur.== Pragmatique, fiable et structuré, il avance vite sans perdre de vue l'essentiel. Je recommande Antonin sans hésitation.",
          name: "Ciprian Noaghiu",
          role: "CEO, relevanC",
        },
        {
          quote:
            "Antonin se distingue par ses grandes qualités pédagogiques : ==malgré un haut niveau d'expertise technique, il sait expliquer des sujets complexes de façon claire et accessible à des interlocuteurs non techniques.==",
          full:
            "J'ai eu l'occasion de travailler avec Antonin sur le développement d'un produit, dans un contexte où j'étais surtout responsable des aspects business et opérationnels. Antonin se distingue par ses grandes qualités pédagogiques : ==malgré un haut niveau d'expertise technique, il sait expliquer des sujets complexes de façon claire et accessible à des interlocuteurs non techniques.== Il fait aussi preuve d'un vrai sens des responsabilités, en particulier quand les objectifs doivent être tenus dans des délais serrés ou en situation d'urgence. Son professionnalisme, sa capacité à collaborer efficacement avec des profils très variés et son approche orientée solution ont été des atouts clés pour la réussite du projet. Je recommande vivement Antonin pour toute collaboration qui demande rigueur, clarté et efficacité.",
          name: "Paula Alves",
          role: "Head of AdOps, retail media",
        },
        {
          quote:
            "==Là où beaucoup avaient échoué avant lui, Anton a réussi, avec des améliorations significatives en peu de temps.== Ce qui le distingue : son leadership, sa gestion des parties prenantes, sa stratégie, son souci du détail et sa vision de long terme.",
          full:
            "Je recommande sans réserve Anton comme architecte de solutions ; il s'est révélé précieux pour notre organisation. Face à un site truffé de problèmes, des widgets manquants aux lenteurs et incohérences de performance, il a démontré une capacité que peu de gens possèdent. ==Là où beaucoup avaient échoué avant lui, Anton a réussi, avec des améliorations significatives en peu de temps.== Ce qui le distingue : son leadership, sa gestion des parties prenantes, sa stratégie, son souci du détail et sa vision de long terme. Même après la fin de son contrat, il continue d'apporter son expertise et de veiller à ce que notre trajectoire reste positive. Le dévouement d'Anton à la qualité et aux solutions durables est sans égal, et nous lui sommes profondément reconnaissants.",
          name: "Azeem Abu Bakar",
          role: "Managing Director, FMT News",
        },
        {
          quote:
            "Anton est une bête. Il comprend les objectifs de ce qu'on cherche à construire et prend des décisions techniques qui nous en rapprochent, plutôt que de se contenter de répondre à la demande. ==Des profils techniques aussi stratégiques sont rares.==",
          full:
            "Anton est une bête. Il comprend les objectifs de ce qu'on cherche à construire et prend des décisions techniques qui nous en rapprochent, plutôt que de se contenter de répondre à la demande. ==Des profils techniques aussi stratégiques sont rares.== Sans parler du plaisir de travailler avec lui.",
          name: "Alex Gutwillig",
          role: "Director of Product, Fullsend",
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
      companiesLabel: "Avec qui j'ai travaillé",
    },
    roles: {
      leadership: {
        title: "Pilotage produit technique",
        badge: "Certifié Scrum Product Owner",
        desc: "Je priorise la roadmap, je cadre le besoin, j'écris les specs et j'aligne les parties prenantes. Deux startups cofondées et menées de bout en bout (Foundingbird, Kaunto) : je sais ce que livrer veut dire.",
      },
      ai: {
        title: "L'IA pour votre activité",
        desc: "J'aide PME et grands comptes à adopter l'IA : RAG, recherche sémantique, intégrations LLM, automatisation des workflows. Je trouve le bon outil sans sur-ingénierie. Un SaaS de Document AI conçu et revendu en 2025.",
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
      kicker: "Blog technique",
      h1: "Des problèmes réels.\nEt l'architecture derrière.",
      dek: "Systèmes IA, plateformes cloud et automatisation, de la conception à la production. Voici ce que j'ai construit, comment, et ce que je peux refaire chez vous.",
      tabsAll: "Tous",
      read: "Lire l'article",
      cardRead: "Lire",
      closeH2: "Un problème qui ressemble à l'un de ceux-là ?",
      bookACall: "Réserver un appel",
      crumb: "Blog technique",
      homeTitle: "Blog technique",
      homeSub: "Comment je résous des problèmes concrets, et ce que je peux refaire chez vous.",
      seeAll: "Voir tous les articles",
    },
    csDetail: {
      demoQuestion: "Question",
      demoAnswer: "Réponse",
      demoSources: "Sources",
      audienceLabel: "Deux façons de lire :",
      audienceBusiness: "Business",
      audienceTech: "Tech",
      audienceHintBusiness:
        "Vous lisez la version en langage clair. Passez sur Tech pour le code et l'architecture.",
      audienceHintTech:
        "Vous lisez la version technique détaillée. Passez sur Business pour le résultat, sans code.",
      ctaLine: "Vous avez ce problème ? Je regarde le vôtre, en écrit.",
      bookACall: "Réserver un appel",
      faqTitle: "Les questions qu'on me pose là-dessus",
      relatedTitle: "Articles liés",
    },
    sw: {
      title: "Missions client",
      lede: "Un aperçu partiel. Certains clients sont confidentiels,\net une partie du travail est trop ancienne pour figurer ici.",
    },
  },
}

export default catalog
