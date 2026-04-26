const DOMAIN_TITLES = {
  "arelion.dev": "arelion.dev",
}
const DEFAULT_TITLE = "arelion.dev"

const useDomainTitle = () => {
  if (typeof window !== "undefined") {
    return DOMAIN_TITLES[window.location.hostname] || DEFAULT_TITLE
  }
  return DEFAULT_TITLE
}

export default useDomainTitle
