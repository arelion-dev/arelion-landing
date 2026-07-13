import React, { createContext, useContext, useEffect, useState } from "react"
import catalog from "./catalog"

const DEFAULT_LANG = "en"
const STORAGE_KEY = "arelion-lang"

const I18nContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: key => key,
})

const resolve = (obj, key) => {
  let node = obj
  for (const part of key.split(".")) {
    node = node == null ? undefined : node[part]
  }
  return node
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(DEFAULT_LANG)

  useEffect(() => {
    const saved =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)
    if (saved === "en" || saved === "fr") setLangState(saved)
  }, [])

  const setLang = next => {
    setLangState(next)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next)
  }

  // t returns the value at `key` for the active language, falling back to EN,
  // then to the key itself. Works for strings and arrays.
  const t = key => {
    const val = resolve(catalog[lang], key)
    if (val != null) return val
    const fallback = resolve(catalog.en, key)
    return fallback != null ? fallback : key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
