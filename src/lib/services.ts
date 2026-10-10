/**
 * The four core services — shared by the home "What we do" accordion and the /services page.
 * `example` is a project slug from projects.ts shown as proof on /services; `exampleNote` says
 * what that project shows (only claims the project actually backs up).
 */
export type Service = {
  slug: string;
  /** one line of the page’s story, shown above the title on /services */
  story: string;
  /** soft backdrop colour for the chapter (from the chapter’s frog) */
  tint: string;
  title: string;
  summary: string;
  body: string;
  list: string[][];
  mascot: string;
  example: string;
  exampleNote: string;
};

export const SERVICES: Service[] = [
  {
    slug: "brand-identity",
    story: "It starts with who you are.",
    tint: "#fdedc0",
    title: "Brand Identity",
    summary: "Strategy, logo and visual systems that make you recognisable.",
    body: "We define what you stand for and who you’re for, then turn it into an identity system (logo, colour, type and guidelines) built to stay consistent as you grow.",
    list: [
      ["Brand strategy", "Naming", "Logo design"],
      ["Visual identity", "Brand guidelines", "Packaging"],
    ],
    mascot: "/frogs/frog-goldie.svg",
    example: "jbs",
    exampleNote: "Brand identity",
  },
  {
    slug: "web-design-development",
    story: "Then we give it a home online.",
    tint: "#dbe8f7",
    title: "Web Design & Development",
    summary: "Fast, custom websites designed and built in-house.",
    body: "From sitemap and UX to UI and development. We build on modern stacks so your site loads fast, is easy to update and turns visitors into enquiries.",
    list: [
      ["UX & sitemap", "UI design", "Responsive build"],
      ["Next.js / Webflow", "CMS integration", "Care & maintenance"],
    ],
    mascot: "/frogs/frog-byte.svg",
    example: "bmp",
    exampleNote: "Web design & development",
  },
  {
    slug: "seo-growth",
    story: "Next, we help people find it.",
    tint: "#e2f1dc",
    title: "SEO & Growth",
    summary: "Get found on Google and turn traffic into enquiries.",
    body: "SEO is built into every site from day one, then grown month by month: technical audits, keyword research, on-page optimisation and content that ranks, all tracked in clear monthly reports.",
    list: [
      ["Technical SEO audit", "Keyword research", "On-page optimisation"],
      ["Local SEO (Google Business)", "Content strategy", "Analytics & reporting"],
    ],
    mascot: "/frogs/frog-disco.svg",
    example: "mpu",
    exampleNote: "Every site ships SEO-ready",
  },
  {
    slug: "digital-experience",
    story: "And we make it hard to forget.",
    tint: "#d6f3ec",
    title: "Digital Experience",
    summary: "Motion, interaction and campaign pages people remember.",
    body: "Interactive storytelling for launches and campaigns: scroll animation, micro-interactions, 3D and motion graphics that make people stop scrolling and remember you.",
    list: [
      ["Motion design", "Micro-interactions", "3D & WebGL"],
      ["Campaign landing pages", "Social assets", "Launch support"],
    ],
    mascot: "/frogs/frog-hopper.svg",
    example: "ragam",
    exampleNote: "Interactive web experience",
  },
];

/** Smaller services offered alongside the core four (same wording as /about) */
export const EXTRAS = [
  { name: "Motion design", line: "Movement that gives your brand personality.", example: "lavely" },
  { name: "Social media design", line: "Consistent, on-brand feeds that stop the scroll.", example: "zizi" },
  { name: "Photography", line: "Product and brand imagery, shot to your identity.", example: "assa" },
  { name: "Videography", line: "Short films and content that tell your story.", example: "marlupi" },
  { name: "Company profile", line: "A clear, premium profile your sales team will actually use.", example: "bti" },
];
