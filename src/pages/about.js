import React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

const AboutPage = ({ location }) => (
  <Layout location={location}>
    <h1>About Arelion</h1>
    <p>
      Arelion is a boutique technology studio. One senior engineer, a few
      clients at a time. The work runs from design to production: AI systems,
      cloud platforms and SaaS.
    </p>
    <p>
      Arelion is operated by Antonin Ribeaud through ARELION FZCO, a company
      registered at IFZA, Dubai Silicon Oasis, United Arab Emirates (trade
      license 78400, constituted on 26 January 2026). Antonin has built software
      independently since 2014 and has cofounded and run two startups end to
      end.
    </p>
    <h2>What Arelion does</h2>
    <ul>
      <li>
        <strong>AI for business:</strong> retrieval-augmented generation,
        semantic search, LLM integrations, agent workflows, evaluation and
        guardrails.
      </li>
      <li>
        <strong>Solutions architecture:</strong> ingestion pipelines at scale,
        analytics platforms, and full-stack delivery on Google Cloud with
        Terraform.
      </li>
      <li>
        <strong>Technical product leadership:</strong> roadmap, scope, specs and
        stakeholder coordination, as a fractional CTO or product lead.
      </li>
    </ul>
    <h2>Track record</h2>
    <p>
      Selected outcomes: more than 100 million pages processed at L&#39;Oréal,
      more than 400 million events per month at relevanC, a Top 5 App Store app
      with more than 1 million downloads, and a Document AI SaaS built and sold
      (privately.ai). Arelion has engaged with more than 20 clients, including
      L&#39;Oréal, Deezer, Free Malaysia Today, relevanC, Epsor, Foundingbird and
      Kaunto. The main stack is React, React Native, TypeScript, Python,
      FastAPI, Google Cloud Platform and Terraform.
    </p>
    <p>
      Antonin works remotely from Dubai, United Arab Emirates, and serves
      clients worldwide. See the <a href="/case-studies">case studies</a> for
      detailed examples, or the <a href="/contact">contact page</a> to get in
      touch.
    </p>
  </Layout>
)

export default AboutPage

export const Head = ({ location }) => (
  <SEO
    title="About"
    description="Arelion is a boutique tech studio operated by Antonin Ribeaud (ARELION FZCO, Dubai). AI systems, cloud platforms and SaaS, from design to production."
    pathname={location.pathname}
  />
)
