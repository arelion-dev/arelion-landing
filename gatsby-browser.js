// custom typefaces
import "typeface-montserrat"
import "typeface-merriweather"
import "@fontsource/caveat"
// normalize CSS across browsers
import "./src/normalize.css"
// custom CSS styles
import "./src/style.css"

// Highlighting for code blocks
import "prismjs/themes/prism.css"

// Unregister stale service worker from removed gatsby-plugin-offline
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
}

// Redirect secondary domains to primary
const PRIMARY_DOMAIN = "arelion.dev"
if (
  typeof window !== "undefined" &&
  window.location.hostname !== PRIMARY_DOMAIN &&
  window.location.hostname !== "www." + PRIMARY_DOMAIN &&
  window.location.hostname !== "localhost"
) {
  window.location.replace("https://" + PRIMARY_DOMAIN + window.location.pathname)
}
