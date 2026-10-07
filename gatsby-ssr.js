import React from "react"
import { LanguageProvider } from "./src/i18n"

export const wrapRootElement = ({ element }) => (
  <LanguageProvider>{element}</LanguageProvider>
)

// Set the document language on the SSR'd <html> so agents and assistive tech
// can resolve the page language. The site is authored in English by default;
// the in-page switcher only swaps client-side copy, it does not change routes.
export const onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: "en" })
  // The main text font, self-hosted (src/style.css): fetch it with the HTML
  // instead of after the CSS is parsed. Same URL as its @font-face, so the
  // browser reuses the preloaded file.
  setHeadComponents([
    <link
      key="preload-inter-latin"
      rel="preload"
      href="/fonts/inter-latin.woff2"
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />,
  ])
}
