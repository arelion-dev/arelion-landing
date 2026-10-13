// The person who runs the site, as the structured data states it. Plain
// CommonJS, like case-studies.js. The home graph and every case-study author
// use this node, so both give the same @id, title and profiles.

const PERSON = {
  "@type": "Person",
  "@id": "https://arelion.dev/#antonin",
  name: "Antonin Ribeaud",
  url: "https://arelion.dev",
  jobTitle: "AI consultant and engineer",
  // The person's own profiles. The company's are on the organization node of the home.
  sameAs: [
    "https://www.linkedin.com/in/antoninribeaud/",
    "https://github.com/Antonhansel",
    "https://huggingface.co/Antonhansel",
    "https://www.malt.fr/profile/antoninribeaud",
    "https://www.collective.work/profile/antonin-ribeaud",
    "https://claudepartners.fr/prestataires/antonin-ribeaud-ad48d/",
  ],
}

module.exports = { PERSON }
