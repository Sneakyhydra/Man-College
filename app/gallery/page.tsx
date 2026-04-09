import type { Metadata } from "next";
import { GalleryAlbums } from "@/components/gallery-albums";
import { PageHeader } from "@/components/page-header";
import { galleryFeaturedVideo, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "News & events",
  description: `Videos and photo albums from ${site.name}: community programmes, events, and campus life.`,
};

export default function GalleryPage() {
  const { youtubeId, title } = galleryFeaturedVideo;

  return (
    <>
      <PageHeader
        title="News & events"
        subtitle="Featured talk and a browsable gallery of programmes and visits—aligned with the college’s public news and events page."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:py-16">
        <section className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
          <h3 className="mt-6 text-center font-serif-display text-lg font-semibold leading-snug sm:text-xl">
            {title}
          </h3>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl font-semibold">Gallery</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Filter albums by category. Covers match the college’s legacy gallery
            portfolios (department activities, events, and visits).
          </p>
          <div className="mt-8">
            <GalleryAlbums />
          </div>
        </section>
      </div>
    </>
  );
}
