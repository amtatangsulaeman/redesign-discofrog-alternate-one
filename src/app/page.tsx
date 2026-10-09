import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MacbookShowcase from "@/components/MacbookShowcase";
import Intro from "@/components/Intro";
import Work from "@/components/Work";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Cta from "@/components/Cta";
import Footer from "@/components/Footer";
import RevealHeaders from "@/components/RevealHeaders";
import ScrollToHash from "@/components/ScrollToHash";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MacbookShowcase />
        <Intro />
        <Work />
        <Services />
        <Process />
        <Cta />
      </main>
      <Footer />
      <RevealHeaders />
      <ScrollToHash />
    </>
  );
}
