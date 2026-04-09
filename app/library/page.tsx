import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Library",
  description: "Learning resources and reading spaces for students at MAN College.",
};

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Library"
        subtitle="A quiet hub for coursework, dissertations, and staying current with psychology and education research."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="leading-relaxed text-muted">
          The college maintains a library collection aligned with clinical psychology, psychiatry,
          special education, and allied fields. Timings, borrowing rules, and digital access are
          published in the student handbook each year.
        </p>
        <p className="mt-6 leading-relaxed text-muted">
          When you migrate from the legacy site, replace this section with catalogue links, OPAC
          access, and librarian contact details.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex font-semibold text-accent hover:text-accent-hover"
        >
          Ask the office for library hours →
        </Link>
      </div>
    </>
  );
}
