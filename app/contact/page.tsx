import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: `Reach ${site.name} by phone or post. Located in Guna, Madhya Pradesh.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        subtitle="Admissions questions, campus visits, and general enquiries—reach the college office using the details below."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:py-16">
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-serif-display text-xl font-semibold">Phone</h2>
          <a
            href={site.phoneTel}
            className="mt-3 inline-block text-lg font-medium text-accent hover:text-accent-hover"
          >
            {site.phone}
          </a>
          <h2 className="font-serif-display mt-10 text-xl font-semibold">
            Address
          </h2>
          <p className="mt-3 leading-relaxed text-muted">{site.address}</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-serif-display text-xl font-semibold">
            Write to us
          </h2>
          <p className="mt-3 text-muted">
            Wire this form to your CRM or email API when you are ready. For now,
            it is a styled placeholder that does not submit anywhere.
          </p>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
