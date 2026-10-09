import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import CaseStudy from "@/components/CaseStudy";
import Footer from "@/components/Footer";
import { PROJECTS, projectBySlug } from "@/lib/projects";

// every case study is known up front — prerender them all (unknown slugs → notFound below)
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.name} — Discofrog work`,
    description: p.overview,
    openGraph: { images: [p.image] },
  };
}

// Nav + Footer are the instant shell; only the part that reads `params` sits in Suspense
export default function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  return (
    <>
      <Nav current="#work" />
      <main>
        <Suspense fallback={<div style={{ minHeight: "100svh" }} aria-busy="true" />}>
          <CaseStudyContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

async function CaseStudyContent({ params }: Pick<PageProps<"/work/[slug]">, "params">) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  // the next three projects (wrapping) for "More work"
  const i = PROJECTS.indexOf(project);
  const more = [1, 2, 3].map((k) => PROJECTS[(i + k) % PROJECTS.length]);

  return <CaseStudy project={project} more={more} />;
}
