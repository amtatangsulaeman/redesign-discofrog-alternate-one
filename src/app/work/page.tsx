import type { Metadata } from "next";
import Nav from "@/components/Nav";
import WorkIndex from "@/components/WorkIndex";
import Footer from "@/components/Footer";
import RevealHeaders from "@/components/RevealHeaders";

export const metadata: Metadata = {
  title: "Work | Discofrog",
  description: "Selected work from Discofrog: brand identity, websites, SEO and digital experiences.",
};

export default function WorkPage() {
  return (
    <>
      <Nav current="/work" />
      <main>
        <WorkIndex />
      </main>
      <Footer />
      <RevealHeaders />
    </>
  );
}
