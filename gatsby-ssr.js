import React from "react"
import { LanguageProvider } from "./src/i18n"

export const wrapRootElement = ({ element }) => (
  <LanguageProvider>{element}</LanguageProvider>
)

// Set the document language on the SSR'd <html> so agents and assistive tech
// can resolve the page language. The site is authored in English by default;
// the in-page switcher only swaps client-side copy, it does not change routes.
export const onRenderBody = ({ setHtmlAttributes }) => {
  setHtmlAttributes({ lang: "en" })
}
