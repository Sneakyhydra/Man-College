import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { libraryPage, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Library",
  description: `Library facilities for clinical psychology and special education at ${site.name}, Guna.`,
};

/** ~0.8× previous hints; lg clinical block is 50% | 50% (minus gap). */
const sizesLeftStack = "(max-width: 1024px) 80vw, min(444px, 45vw)";

const sizesPortraitRail =
  "(max-width: 1024px) min(256px, 80vw), min(444px, 45vw)";

const sizesThreeCol =
  "(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 288px";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <>
      <h2 className="font-serif-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
        {children}
      </h2>
      <div className="mt-4 h-px w-full max-w-md bg-border" aria-hidden />
    </>
  );
}

type LibImg = (typeof libraryPage.clinicalPsychology.images)[number];

type LandscapeImg = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

function LandscapeCard({
  img,
  sizes,
  priority,
}: {
  img: LandscapeImg;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative aspect-[3/2] w-full">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
          quality={72}
        />
      </div>
    </div>
  );
}

function LibraryImageTile({
  img,
  sizes,
  priority,
}: {
  img: LibImg | (typeof libraryPage.specialEducation.images)[number];
  sizes: string;
  priority?: boolean;
}) {
  if (img.height > img.width) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[224px] sm:max-w-[256px]">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) min(224px, 100vw), 256px"
            className="object-cover"
            priority={priority}
            quality={72}
          />
        </div>
      </div>
    );
  }

  return <LandscapeCard img={img} sizes={sizes} priority={priority} />;
}

export default function LibraryPage() {
  const { clinicalPsychology, specialEducation } = libraryPage;

  const [clinical1, clinical2, clinical3] = clinicalPsychology.images;
  const [reading1] = clinicalPsychology.readingRoom;

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Reading spaces, print collections, and e-library access for the Department of Clinical Psychology and Department of Special Education."
      />
      <div className="mx-auto max-w-[min(921px,calc(100%-2rem))] space-y-16 px-4 py-12 sm:py-16">
        <section className="space-y-8">
          <SectionTitle>Department of Clinical Psychology</SectionTitle>

          {/*
            Mobile: order 1–3–4 then portrait (4th in flow).
            lg: CSS Grid — left column 3 rows, right column row-span 3 so height matches (fixes missing portrait).
          */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto] lg:gap-6 lg:gap-x-8">
            <div className="order-1 lg:col-start-1 lg:row-start-1 lg:min-w-0">
              <LandscapeCard img={clinical1} sizes={sizesLeftStack} priority />
            </div>
            <div className="order-2 lg:col-start-1 lg:row-start-2 lg:min-w-0">
              <LandscapeCard img={clinical3} sizes={sizesLeftStack} priority />
            </div>
            <div className="order-3 lg:col-start-1 lg:row-start-3 lg:min-w-0">
              <LandscapeCard img={reading1} sizes={sizesLeftStack} />
            </div>

            <div className="order-4 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:min-h-0 lg:self-stretch">
              <div className="relative mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:mx-0 lg:aspect-auto lg:max-w-none lg:h-full">
                <Image
                  src={clinical2.src}
                  alt={clinical2.alt}
                  fill
                  sizes={sizesPortraitRail}
                  className="object-cover"
                  priority
                  quality={72}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <SectionTitle>Department of Special Education</SectionTitle>
          <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialEducation.images.map((img) => (
              <LibraryImageTile key={img.src} img={img} sizes={sizesThreeCol} />
            ))}
          </div>
        </section>

        <p className="border-t border-border pt-10 text-center text-sm text-muted">
          Timings and borrowing rules are shared with enrolled students.{" "}
          <Link
            href="/contact"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Contact the office
          </Link>{" "}
          for general enquiries.
        </p>
      </div>
    </>
  );
}
