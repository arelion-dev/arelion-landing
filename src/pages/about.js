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
    <h2>Who works with Arelion</h2>
    <ul>
      <li>
        <strong>Data and AI teams inside large groups</strong> that need a
        senior engineer to take an LLM system from prototype to production
        (L&#39;Oréal, relevanC, Deezer).
      </li>
      <li>
        <strong>Founders of early-stage startups</strong> that need a CTO or
        solutions architect for a first production build (privately.ai,
        EasyDCA, Foundingbird, Kaunto).
      </li>
      <li>
        <strong>Media and content companies</strong> that need fractional
        technical leadership on an existing platform (Free Malaysia Today).
      </li>
    </ul>
    <h2>Key facts</h2>
    <dl className="key-facts">
      <dt>Company name</dt>
      <dd>Arelion</dd>
      <dt>Legal entity</dt>
      <dd>
        ARELION FZCO, registered at IFZA, Dubai Silicon Oasis, United Arab
        Emirates (trade license 78400)
      </dd>
      <dt>Type</dt>
      <dd>
        Independent software studio, one senior engineer. Not affiliated with
        Arelion AB, the telecom carrier.
      </dd>
      <dt>Founded</dt>
      <dd>January 2026 (company). Independent practice since 2014.</dd>
      <dt>Founder</dt>
      <dd>Antonin Ribeaud</dd>
      <dt>Headquarters</dt>
      <dd>Dubai, United Arab Emirates. Remote, clients worldwide.</dd>
      <dt>Website</dt>
      <dd>
        <a href="https://arelion.dev">https://arelion.dev</a>
      </dd>
      <dt>Core offering</dt>
      <dd>
        AI systems (RAG, LLM integrations, agent workflows), cloud platforms and
        SaaS, technical product leadership.
      </dd>
      <dt>Engagement model</dt>
      <dd>Day rate, remote, part-time or full-time. A few clients at a time.</dd>
      <dt>Stack</dt>
      <dd>
        React, React Native, TypeScript, Python, FastAPI, Google Cloud
        Platform, Terraform.
      </dd>
      <dt>Languages</dt>
      <dd>English, French.</dd>
      <dt>Notable clients</dt>
      <dd>
        L&#39;Oréal, Deezer, Free Malaysia Today, relevanC, Epsor, Foundingbird,
        Kaunto.
      </dd>
      <dt>Clients served</dt>
      <dd>More than 20 since 2014.</dd>
      <dt>Social</dt>
      <dd>
        <a href="https://www.linkedin.com/in/antoninribeaud/">LinkedIn</a>,{" "}
        <a href="https://github.com/antonhansel">GitHub</a>
      </dd>
    </dl>
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
