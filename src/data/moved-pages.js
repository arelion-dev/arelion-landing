// Pages that left arelion.dev. GitHub Pages cannot send a 301, so the build
// writes a redirect page at each old path (gatsby-node.js, onPostBuild): a
// canonical link and an instant meta refresh, which Google treats as a
// permanent redirect. None of these paths is a Gatsby page or in the sitemap.
// The security case studies moved to securityaudit.ae on 2026-10-31.

const SECURITY_STUDIES = [
  "ai-attack-surface",
  "prompt-injection-email-test",
  "claude-code-security-review-test",
  "ai-models-vulnerability-test",
  "llm-sleeper-agents",
  "prompt-injection-defense",
]

module.exports = SECURITY_STUDIES.map(slug => ({
  from: `/case-studies/${slug}/`,
  to: `https://securityaudit.ae/case-studies/${slug}/`,
}))
