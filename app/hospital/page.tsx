import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { hospitalBlocks, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Hospital",
  description:
    "MAN Psychiatric Hospital and OPD: in-patient beds and daily outpatient services supporting clinical training.",
};

export default function HospitalPage() {
  return (
    <>
      <PageHeader
        title="MAN Psychiatric Hospital"
        subtitle="On-campus psychiatric services support community care and provide the supervised clinical exposure required for professional psychology training."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:py-16">
        {hospitalBlocks.map((block, i) => (
          <article
            key={block.title}
            className={`grid gap-8 lg:grid-cols-2 lg:items-center ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}
          >
            <div className={i % 2 === 1 ? "lg:order-2" : ""}>
              <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
                <Image
                  src={block.image}
                  alt={block.imageAlt}
                  width={1024}
                  height={683}
                  className="aspect-[3/2] h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : ""}>
              <h2 className="font-serif-display text-2xl font-semibold">{block.title}</h2>
              <p className="mt-4 leading-relaxed text-muted">{block.text}</p>
            </div>
          </article>
        ))}
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-muted">
            Patient services and visitor policies are managed by the hospital administration. For
            academic placements, speak with your programme coordinator.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Contact office
            </Link>
            <a
              href={site.cctvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-stone-50"
            >
              CCTV view (external)
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
