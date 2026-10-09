/**
 * About page copy — facts from discofrogstudio.com/about, rewritten for clarity:
 * sentence case instead of Title Case, one idea per sentence, active voice, no unbacked
 * "award-winning" claim (it's an Awwwards nomination), services named as nouns with a
 * one-line benefit each.
 */
export const ABOUT = {
  statement:
    "We’re Discofrog — an independent design studio in Jakarta and Melbourne. We turn fresh ideas into brands people remember and websites that work hard for them.",
  lede: "Branding, web design and development, made by one small team from first sketch to launch.",

  facts: [
    { label: "Studios", value: ["Jakarta, Indonesia", "Melbourne, Australia"] },
    { label: "Recognition", value: ["Awwwards Nominee 2026"] },
    { label: "How we work", value: ["Fully in-house", "Strategy to launch"] },
    { label: "We build with", value: ["Next.js · TypeScript", "GSAP · Framer Motion"] },
  ],

  principles: [
    {
      label: "Vision",
      frog: "/frogs/frog-goldie.svg", tint: "#fdefc4",
      title: "Work that leaves a mark.",
      text: "We want every project to make a real difference for our clients — and to be an experience their customers enjoy.",
    },
    {
      label: "Mission",
      frog: "/frogs/frog-byte.svg", tint: "#d8ebf6",
      title: "Design and technology, together.",
      text: "We build digital products where great design and solid engineering meet, so brands can grow with confidence.",
    },
    {
      label: "Expertise",
      frog: "/frogs/frog-hopper.svg", tint: "#d6f3ec",
      title: "Websites and apps that stand out.",
      text: "Distinctive, high-performance sites and apps — designed with care and built to last.",
    },
    {
      label: "Approach",
      frog: "/frogs/frog-disco.svg", tint: "#dff2e2",
      title: "Everything under one roof.",
      text: "Strategy, design and development stay in-house, end to end. Nothing gets lost in a hand-off.",
    },
  ],

  services: [
    { name: "Website design & development", line: "Fast, custom sites that turn visitors into enquiries.", example: "bmp" },
    { name: "Brand identity", line: "Logos and visual systems people recognise instantly.", example: "jbs" },
    { name: "Motion design", line: "Movement that gives your brand personality.", example: "lavely" },
    { name: "Social media design", line: "Consistent, on-brand feeds that stop the scroll.", example: "zizi" },
    { name: "Photography", line: "Product and brand imagery, shot to your identity.", example: "assa" },
    { name: "Videography", line: "Short films and content that tell your story.", example: "marlupi" },
    { name: "Company profile", line: "A clear, premium profile your sales team will actually use.", example: "bti" },
    { name: "Digital experience", line: "Interactive campaign pages people remember.", example: "ragam" },
  ],


  offices: [
    { city: "Jakarta", lines: ["Level 25, Revenue Tower", "District 8, SCBD", "Jakarta, Indonesia"] },
    { city: "Melbourne", lines: ["199 William Street", "Melbourne VIC", "Australia"] },
  ],

  email: "discofrogstudio@gmail.com",
  phone: "+62 851-1159-2024",
  whatsapp: "https://wa.me/6285111592024",
};
