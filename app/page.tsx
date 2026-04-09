import Image from "next/image";
import Link from "next/link";
import {
  courses,
  galleryImages,
  hospitalBlocks,
  site,
  specialSchoolBlock,
} from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-stone-100 via-background to-accent-subtle/30">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Guna, Madhya Pradesh
          </p>
          <h1 className="font-serif-display mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Education and care at the intersection of mind and community.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {site.fullName} offers RCI-recognised programmes in clinical
            psychology and special education, alongside on-campus psychiatric
            services that anchor hands-on training.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/academics"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
            >
              View programmes
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-stone-50"
            >
              Plan a visit
            </Link>
          </div>
          <dl className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { k: "RCI-aligned", v: "Clinical & special education pathways" },
              {
                k: "On-campus hospital",
                v: "OPD & in-patient training settings",
              },
              { k: "Affiliation", v: "Jiwaji University, Gwalior (M.Phil.)" },
            ].map((row) => (
              <div
                key={row.k}
                className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
              >
                <dt className="text-sm font-semibold text-accent">{row.k}</dt>
                <dd className="mt-1 text-sm leading-snug text-muted">
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="border-b border-border bg-card py-14 sm:py-16"
        aria-labelledby="gallery-heading"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="gallery-heading"
                className="font-serif-display text-3xl font-semibold tracking-tight text-foreground"
              >
                Campus &amp; community
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                A glimpse of teaching spaces, clinical areas, and everyday life
                at the college.
              </p>
            </div>
            <Link
              href="/gallery"
              className="inline-flex shrink-0 items-center text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Full gallery →
            </Link>
          </div>
          <div
            className="snap-x-mandatory mt-10 flex snap-start-child gap-4 overflow-x-auto pb-2"
            tabIndex={0}
            role="region"
            aria-label="Image gallery preview"
          >
            {galleryImages.map((img) => (
              <figure
                key={img.src}
                className="relative w-[min(100vw-2rem,22rem)] shrink-0 overflow-hidden rounded-2xl border border-border shadow-md"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={640}
                  height={427}
                  className="aspect-[3/2] h-auto w-full object-cover"
                  sizes="(max-width: 640px) 90vw, 352px"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-16 sm:py-20"
        id="departments"
        aria-labelledby="dept-heading"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            id="dept-heading"
            className="font-serif-display text-center text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Departments
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
            Three pillars—clinical psychology, special education, and
            psychiatry—support both students and the wider community.
          </p>

          <div className="mt-14 space-y-24">
            <div>
              <h3 className="font-serif-display text-center text-xl font-semibold text-accent sm:text-2xl">
                Department of Clinical Psychology
              </h3>
              <ProgramRow course={courses[0]} imageLeft />
            </div>

            <div>
              <h3 className="font-serif-display text-center text-xl font-semibold text-accent sm:text-2xl">
                Department of Special Education
              </h3>
              <div className="mt-10 space-y-16">
                <ProgramRow course={courses[1]} imageLeft />
                <ProgramRow course={courses[2]} imageLeft={false} />
                <SpecialRow />
              </div>
            </div>

            <div>
              <h3 className="font-serif-display text-center text-xl font-semibold text-accent sm:text-2xl">
                Department of Psychiatry
              </h3>
              <div className="mt-10 space-y-16">
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
                      <h4 className="font-serif-display text-2xl font-semibold">
                        {block.title}
                      </h4>
                      <p className="mt-4 leading-relaxed text-muted">
                        {block.text}
                      </p>
                      <Link
                        href="/hospital"
                        className="mt-6 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
                      >
                        Hospital overview →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-stone-900 py-16 text-stone-100">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-serif-display text-3xl font-semibold sm:text-4xl">
            Ready to take the next step?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-400">
            Ask about eligibility, seat intake, or campus visits. Our team will
            point you to the right programme office.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-200"
            >
              Contact admissions
            </Link>
            <a
              href={site.phoneTel}
              className="inline-flex rounded-full border border-stone-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-stone-400"
            >
              Call {site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ProgramRow({
  course,
  imageLeft,
}: {
  course: (typeof courses)[number];
  imageLeft: boolean;
}) {
  return (
    <article
      className={`mt-10 grid gap-8 lg:grid-cols-2 lg:items-center ${imageLeft ? "" : "lg:[&>div:first-child]:order-2"}`}
    >
      <div className={imageLeft ? "" : "lg:order-2"}>
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
          <Image
            src={course.image}
            alt={course.imageAlt}
            width={1024}
            height={684}
            className="aspect-[3/2] h-auto w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
      <div className={imageLeft ? "" : "lg:order-1"}>
        <h4 className="font-serif-display text-2xl font-semibold">
          {course.shortTitle}
        </h4>
        <p className="mt-2 text-sm font-medium text-accent">{course.summary}</p>
        {course.body.map((para) => (
          <p
            key={para.slice(0, 40)}
            className="mt-4 leading-relaxed text-muted"
          >
            {para}
          </p>
        ))}
        <Link
          href={`/academics/${course.slug}`}
          className="mt-6 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Programme details →
        </Link>
      </div>
    </article>
  );
}

function SpecialRow() {
  const b = specialSchoolBlock;
  return (
    <article className="grid gap-8 lg:grid-cols-2 lg:items-center lg:[&>div:first-child]:order-2">
      <div className="lg:order-2">
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
          <Image
            src={b.image}
            alt={b.imageAlt}
            width={1024}
            height={683}
            className="aspect-[3/2] h-auto w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
      <div className="lg:order-1">
        <h4 className="font-serif-display text-2xl font-semibold">{b.title}</h4>
        <p className="mt-4 leading-relaxed text-muted">{b.text}</p>
        <Link
          href="/academics"
          className="mt-6 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Special education at MAN →
        </Link>
      </div>
    </article>
  );
}
