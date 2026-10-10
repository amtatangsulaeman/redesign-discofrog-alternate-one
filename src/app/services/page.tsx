import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ServicesPage from "@/components/ServicesPage";
import Cta from "@/components/Cta";
import Footer from "@/components/Footer";
import RevealHeaders from "@/components/RevealHeaders";

export const metadata: Metadata = {
  title: "Services | Discofrog",
  description:
    "Brand identity, web design & development, SEO and digital experiences. All planned, designed and built in-house by Discofrog in Jakarta and Melbourne.",
};

export default function Services() {
  return (
    <>
      <Nav current="/services" />
      <main>
        <ServicesPage />
        <Cta current="/services" />
      </main>
      <Footer />
      <RevealHeaders />
    </>
  );
}
