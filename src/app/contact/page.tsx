import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ContactPage from "@/components/ContactPage";
import Footer from "@/components/Footer";
import RevealHeaders from "@/components/RevealHeaders";

export const metadata: Metadata = {
  title: "Contact | Discofrog",
  description:
    "Start a project with Discofrog: branding, websites and SEO from Jakarta and Melbourne. We reply within one business day.",
};

export default function Contact() {
  return (
    <>
      <Nav current="/contact" />
      <main>
        <ContactPage />
      </main>
      <Footer />
      <RevealHeaders />
    </>
  );
}
