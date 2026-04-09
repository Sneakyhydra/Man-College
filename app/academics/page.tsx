import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { courses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "RCI-recognised programmes in clinical psychology and special education at MAN College, Guna.",
};

export default function AcademicsPage() {
  return (
    <>
      <PageHeader
        title="Academics"
        subtitle="Choose a programme to read eligibility highlights, training structure, and how hospital and school placements fit into your degree."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:py-16">
        {courses.map((c) => (
          <article
            key={c.slug}
            className="grid gap-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-5"
          >
            <div className="relative lg:col-span-2">
              <Image
                src={c.image}
                alt={c.imageAlt}
                width={1024}
                height={684}
                className="h-full min-h-[14rem] w-full object-cover lg:absolute lg:inset-0 lg:min-h-0"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <div className="flex flex-col justify-center p-8 lg:col-span-3">
              <h2 className="font-serif-display text-2xl font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm font-medium text-accent">{c.summary}</p>
              <p className="mt-4 line-clamp-3 text-muted">{c.body[0]}</p>
              <Link
                href={`/academics/${c.slug}`}
                className="mt-6 inline-flex w-fit text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Full programme page →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
