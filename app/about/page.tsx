import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About MAN",
  description: `Learn about ${site.name}: mission, location, and academic focus in Guna, M.P.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About MAN"
        subtitle={`${site.fullName} combines recognised professional degrees with on-campus mental health services so students learn in real clinical and educational settings.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <section>
            <h2 className="font-serif-display text-2xl font-semibold">Our mission</h2>
            <p className="mt-4 leading-relaxed text-muted">
              We prepare psychologists and special educators who can serve individuals and families
              with skill, ethics, and cultural sensitivity. Training is anchored in supervised
              practice—whether in assessment suites, therapy settings, inclusive classrooms, or
              hospital rounds.
            </p>
          </section>
          <section>
            <h2 className="font-serif-display text-2xl font-semibold">Where we are</h2>
            <p className="mt-4 leading-relaxed text-muted">
              The campus is located at {site.address}. Prospective students and collaborators are
              welcome to arrange a visit through the{" "}
              <Link href="/contact" className="font-medium text-accent hover:text-accent-hover">
                contact page
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="font-serif-display text-2xl font-semibold">
              Recognition &amp; affiliation
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Key programmes are recognised by the Rehabilitation Council of India (RCI), with
              university affiliation as published for each course (for example, Jiwaji University,
              Gwalior, for the M.Phil. in Clinical Psychology). Always verify the latest notices from
              RCI and the affiliating university when applying.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
