const trackEvent = (action, category, label) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
    })
  }
}

// Contact intents (a WhatsApp link, a call booking) also go out as GA4's
// recommended generate_lead event. Only the channel and the place on the site
// are sent, never anything about the visitor.
export const LEAD_METHOD = { whatsapp: "whatsapp", booking: "booking" }

export const trackLead = (method, location) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "generate_lead", { method, location })
  }
}

export default trackEvent
