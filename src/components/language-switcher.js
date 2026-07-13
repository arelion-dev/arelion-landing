import React from "react"
import { useI18n } from "../i18n"

const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === "en" ? "on" : ""}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={lang === "fr" ? "on" : ""}
        aria-pressed={lang === "fr"}
        onClick={() => setLang("fr")}
      >
        FR
      </button>
    </div>
  )
}

export default LanguageSwitcher
