import type { Metadata } from "next";
import Nav from "@/components/Nav";
import AboutPage from "@/components/AboutPage";
import Cta from "@/components/Cta";
import Footer from "@/components/Footer";
import RevealHeaders from "@/components/RevealHeaders";

export const metadata: Metadata = {
  title: "About — Discofrog",
  description:
    "Discofrog is an independent branding and web studio in Jakarta and Melbourne — strategy, design and development, all in-house. Awwwards Nominee 2026.",
};

export default function About() {
  return (
    <>
      <Nav current="#studio" />
      <main>
        <AboutPage />
        <Cta current="/about" />
      </main>
      <Footer />
      <RevealHeaders />
    </>
  );
}
