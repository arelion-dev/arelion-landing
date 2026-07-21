# Guidebook : écrire des articles qui ne sonnent pas IA

Basé sur l'analyse de 10 articles d'Increment (magazine d'ingénierie de Stripe) et de The Pragmatic Engineer (Gergely Orosz).

Idée directrice : l'anti-slop retire les tells (voir le skill `anti-slop-fr`). Mais un texte juste "nettoyé" reste fade. Ce qui rend ces articles humains, c'est ce qu'ils AJOUTENT. Voici les 8 patterns qui reviennent dans les 10, avec de vrais exemples.

## 1. Ouvre sur du concret ou une prise de position, jamais sur du décor
Trois ouvertures qui marchent : une scène datée précise, une anecdote en "je", ou une phrase qui tranche.
- Coinbase : "On the evening of Thursday, 7 May, trading at Coinbase went offline and stayed that way for nearly 10 hours (!!)"
- Hiring : "'Just hire great people' is spectacularly unhelpful advice."
- Wicked problem : "Many years ago, I joined an organization in the throes of change."
Interdit : "Dans un monde où", "À l'ère de", "Dans cet article nous allons voir".

## 2. Alterne phrases courtes et longues
Le vrai signal anti-IA. Des fragments assumés ("You know the drill.", "This was frustrating.", "It's weird...") suivis d'une longue phrase qui déroule le raisonnement. La cadence uniforme moyenne trahit la machine.

## 3. Écris en "je", prends parti, admets tes erreurs
- Position tranchée : "Methodologies alone aren't the answer."
- Vulnérabilité : "I naively assumed...", "To my surprise", "I also burnt out maintaining...".
L'IA sur-équilibre et ne s'engage jamais. Un humain choisit un camp et reconnaît ses ratés.

## 4. Ancre tout dans du réel nommé et chiffré
Le pattern le plus constant. Noms réels (LinkedIn, Strava, Calm, Coinbase, Uber, uv/Astral, Microsoft), chiffres exacts ($120/an, 20 minutes, 60 entretiens, 11 boîtes, valorisation $40B, 10 heures), timestamps, captures d'écran. Une idée abstraite sans exemple précis = drapeau rouge. Chaque point s'accroche à un cas concret.

## 5. File une métaphore, ne l'empile pas
Une seule image qui tient tout le texte et revient (le "tightrope act", le cookie qu'on pique). Une, filée, pas trois décoratives.

## 6. Transitions implicites, pas de dissertation
Connecteurs simples et rares ("Meanwhile", "A few things stand out"), ou rien du tout. Pas de "De plus / Par ailleurs / En outre" en pilotage automatique.

## 7. Termine sur une question, un jugement, ou un retour à l'ouverture
- Question ouverte : "I wonder if I'll still get the same sense of satisfaction?"
- Jugement net : "incredibly amateurish, almost comical."
- Ou reboucler sur la scène du début.
Jamais "En conclusion, l'enjeu plus large".

## 8. Assume une personnalité
Humour, aparté, edge. Des parenthèses vivantes ("(although I'd love to see an engineering team try!)"), du commentaire éditorial franc, de l'autodérision. Le texte a une voix, pas un ton neutre.

## Checklist avant publication
- [ ] Première phrase : scène concrète, anecdote en "je", ou prise de position (pas du décor).
- [ ] Au moins 3 faits nommés ou chiffrés réels.
- [ ] Rythme : des fragments ET des phrases longues.
- [ ] Une opinion assumée, au moins.
- [ ] Une erreur ou une incertitude admise.
- [ ] Une métaphore filée, une seule.
- [ ] Fin = question, jugement, ou retour à l'ouverture.
- [ ] Zéro mot banni, zéro em-dash (cf. anti-slop-fr).

## Rapport avec l'anti-slop
Anti-slop = soustraction (retirer les tells). Ce guidebook = addition (le craft qui rend humain). Les deux ensemble donnent un article qui tient. Pour Antonin, on combine avec son profil de voix (concret, analogie, "je", pas de salutation).

## Addendum : ce que ghost-in-the-llm et wingman ajoutent (référence de style maison)

Les deux articles originaux d'Antonin (`content/blog/ghost-in-the-llm`, `content/blog/wingman`) sont LA référence de style pour tout contenu du site, case studies comprises. Ce qu'ils font au-delà des 8 patterns ci-dessus :

1. **Montrer l'artefact, pas l'affirmation.** Vraie stack trace, vrai output terminal, vrai `ll` du checkpoint, vrais exemples de conversation. Une affirmation sans artefact (chiffre, log, exemple entrée→sortie, capture) est un drapeau rouge.
2. **Les erreurs sont des sections.** "Sidenote: Running Out of Memory", "Error: ...". La galère se raconte au présent, avec son vrai message d'erreur, pas en résumé rétrospectif propre.
3. **Ignorance assumée.** "I have no idea what this means though", "Honestly, this one is a complete mess". Au moins un aveu par texte.
4. **Rythme visuel.** Jamais 4+ paragraphes denses d'affilée : liste à lead gras, code block, image, paragraphe court. Paragraphes de 1 à 3 phrases par défaut.
5. **Titres spécifiques, pas de squelette répété.** "Enter Vast.ai" > "The solution, piece by piece". Le squelette identique sur 13 fiches = effet template.
6. **Parler au lecteur.** "you", impératifs, apartés. Pas de tierce personne consultant.
7. **Générosité.** Side notes pédagogiques marquées comme telles, sources en fin, de quoi refaire la chose soi-même.

Pour les case studies client (anonymisées, lectorat décideur) : tout s'applique sauf le ton goofy et les emojis. Les artefacts deviennent : requête réelle → réponse, avant/après chiffré, extrait de log ou de config, timeline.
