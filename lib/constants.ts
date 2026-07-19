export const SITE = {
  name: "Elmaca Adventure",
  tagline: "Road Trips • Adventures • Outdoor Experiences",
  description:
    "Elmaca Adventure brings people together through road trips and outdoor experiences across Kenya. Explore, connect, and create unforgettable adventures.",
  url: "https://elmacaadventure.co.ke",
  email: "elmacaadventure@gmail.com",
  location: "Kisumu, Kenya",
  phones: ["+254715371364", "+254739342336"],
  whatsapp: "+254715371364",
  mpesaTill: "3590153",
  social: {
    instagram:
      "https://www.instagram.com/elmaca_adventure?igsh=NWFpN3Jkb3M2cDlh",
    tiktok:
      "https://www.tiktok.com/@elmaca_adventure?_r=1&_t=ZS-9891em2CAND",
    facebook:
      "https://www.facebook.com/share/1BZbkd17M5/",
  },
} as const;

/** Never render this URL in the UI — use only for button navigation */
export const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/JqAlT3TqsI388HPrR69JL9";

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Adventures", href: "#adventures" },
  { label: "Gallery", href: "#gallery" },
  { label: "Merchandise", href: "#merchandise" },
  { label: "Contact", href: "#contact" },
] as const;

export const SECTION_IDS = {
  home: "home",
  about: "about",
  adventures: "adventures",
  gallery: "gallery",
  merchandise: "merchandise",
  contact: "contact",
} as const;