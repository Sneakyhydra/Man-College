"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { galleryAlbums, type GalleryAlbumCategory } from "@/lib/content";

type FilterId = "all" | GalleryAlbumCategory;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "department", label: "Department" },
  { id: "event", label: "Event" },
  { id: "visit", label: "Visit" },
];

function categoryLabel(c: GalleryAlbumCategory) {
  if (c === "department") return "Department";
  if (c === "event") return "Event";
  return "Visit";
}

export function GalleryAlbums() {
  const [active, setActive] = useState<FilterId>("all");

  const visible = useMemo(
    () =>
      active === "all"
        ? galleryAlbums
        : galleryAlbums.filter((a) => a.category === active),
    [active],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              active === f.id
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-foreground/80 hover:border-accent/40 hover:text-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {visible.map((album) => {
          const heading = album.title ?? categoryLabel(album.category);
          const alt = album.title
            ? `${album.title} — ${categoryLabel(album.category)}`
            : `${categoryLabel(album.category)} — campus gallery`;

          return (
            <li
              key={album.coverSrc}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-[100/67] w-full">
                <Image
                  src={album.coverSrc}
                  alt={alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  quality={75}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-serif-display text-base font-semibold leading-snug">
                    {heading}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/80">
                    {categoryLabel(album.category)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
