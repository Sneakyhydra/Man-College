import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { hospitalPsychiatryPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Hospital",
  description:
    "Department of Psychiatry at MAN: IPD, OPD, specialty clinics, and registration with the State Mental Health Authority, M.P.",
};

export default function HospitalPage() {
  return (
    <>
      <PageHeader
        title="Hospital"
        subtitle="Department of Psychiatry—specialty clinics, in-patient care, and daily OPD on campus."
      />
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:space-y-16 sm:py-16">
        <section>
          <h2 className="font-serif-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
            Department of Psychiatry
          </h2>
          <p className="mt-4 max-w-4xl leading-relaxed text-muted">
            {hospitalPsychiatryPage.intro}
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-xl font-semibold sm:text-2xl">
            IPD
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hospitalPsychiatryPage.ipdImages.map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1024}
                  height={684}
                  className="aspect-[3/2] h-auto w-full object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif-display text-xl font-semibold sm:text-2xl">
            OPD
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {hospitalPsychiatryPage.opdImages.map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:max-w-xl"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1024}
                  height={684}
                  className="aspect-[3/2] h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-muted">
            Patient services and visitor policies are managed by the hospital
            administration. For academic placements, speak with your programme
            coordinator.
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
