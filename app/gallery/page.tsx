import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { galleryImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "News & events",
  description:
    "Photo gallery from MAN College campus, teaching, and community programmes.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Moments from teaching, clinical training, and campus life. Images are sourced from the college’s public gallery."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img) => (
            <li
              key={img.src}
              className="overflow-hidden rounded-2xl border border-border shadow-md"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={900}
                height={600}
                className="aspect-[3/2] h-auto w-full object-cover transition hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
