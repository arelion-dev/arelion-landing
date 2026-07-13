import React from "react"
import { LanguageProvider } from "./src/i18n"

export const wrapRootElement = ({ element }) => (
  <LanguageProvider>{element}</LanguageProvider>
)
