"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type SVGProps } from "react";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { site } from "@/lib/content";

const nav = [
  { href: "/about", label: "About MAN" },
  {
    label: "Academics",
    children: [
      { href: "/academics", label: "All programmes" },
      { href: "/academics/departments", label: "Departments" },
      {
        href: "/academics/mphil-clinical-psychology",
        label: "M.Phil. Clinical Psychology",
      },
      {
        href: "/academics/diploma-special-education",
        label: "D.Ed. Special Education",
      },
      {
        href: "/academics/bed-special-education",
        label: "B.Ed. Special Education",
      },
    ],
  },
  { href: "/hospital", label: "Hospital" },
  { href: "/queue", label: "Patient queue" },
  { href: "/library", label: "Library" },
  { href: "/gallery", label: "News & events" },
  { href: site.cctvUrl, label: "CCTV view", external: true },
] as const;

function cnPath(active: boolean) {
  return active
    ? "text-accent font-medium"
    : "text-foreground/80 hover:text-accent";
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [desktopAcademicsOpen, setDesktopAcademicsOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="border-b border-border/60 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={site.phoneTel}
              className="inline-flex items-center gap-1.5 hover:text-accent-subtle"
            >
              <PhoneIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
              {site.phone}
            </a>
            <span
              className="hidden h-3 w-px bg-stone-600 sm:block"
              aria-hidden
            />
            <span className="inline-flex items-start gap-1.5 text-stone-300">
              <MapIcon
                className="mt-0.5 size-3.5 shrink-0 opacity-80"
                aria-hidden
              />
              <span className="leading-snug">{site.address}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-500 max-sm:hidden">Follow</span>
            <SocialLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <Image
            src="https://mansociety.org/wp-content/uploads/2023/07/Asset-31@2x.png"
            alt={site.name}
            width={200}
            height={57}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((item) =>
            "children" in item ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDesktopAcademicsOpen(true)}
                onMouseLeave={() => setDesktopAcademicsOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm whitespace-nowrap text-foreground/80 transition hover:bg-stone-100 hover:text-accent"
                  aria-expanded={desktopAcademicsOpen}
                  aria-haspopup="true"
                  onClick={() => setDesktopAcademicsOpen((v) => !v)}
                >
                  {item.label}
                  <ChevronDown className="size-4 opacity-60" aria-hidden />
                </button>
                <ul
                  className={`absolute left-0 top-full z-50 min-w-[16rem] rounded-lg border border-border bg-card py-2 shadow-lg transition ${
                    desktopAcademicsOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible translate-y-1 opacity-0"
                  }`}
                  role="menu"
                >
                  {item.children.map((c) => (
                    <li key={c.href} role="none">
                      <Link
                        href={c.href}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-foreground/85 hover:bg-accent-subtle/50 hover:text-accent"
                        onClick={() => setDesktopAcademicsOpen(false)}
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : "external" in item && item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-foreground/80 transition hover:bg-stone-100 hover:text-accent"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm whitespace-nowrap transition hover:bg-stone-100 ${cnPath(pathname === item.href || pathname.startsWith(`${item.href}/`))}`}
                onClick={() => setDesktopAcademicsOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <PwaInstallButton />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover"
          >
            Contact us
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-border p-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <CloseIcon className="size-6" />
          ) : (
            <MenuIcon className="size-6" />
          )}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-card lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <nav
            className="mx-auto max-w-6xl space-y-1 px-4 py-4"
            aria-label="Mobile"
          >
            {nav.map((item) =>
              "children" in item ? (
                <div
                  key={item.label}
                  className="border-b border-border/80 py-2"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-2 text-left font-medium"
                    onClick={() => setAcademicsOpen((a) => !a)}
                    aria-expanded={academicsOpen}
                  >
                    {item.label}
                    <ChevronDown
                      className={`size-4 transition ${academicsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {academicsOpen ? (
                    <ul className="mt-1 space-y-1 border-l-2 border-accent-subtle pl-3">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="block py-2 text-sm text-muted"
                            onClick={() => setOpen(false)}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : "external" in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-b border-border/80 py-3 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block border-b border-border/80 py-3 text-sm ${cnPath(pathname === item.href || pathname.startsWith(`${item.href}/`))}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
            <Link
              href="/contact"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-accent py-3 text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Contact us
            </Link>
            <PwaInstallButton className="mt-3" />
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      <a
        href={site.social.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1 hover:bg-stone-800"
        aria-label="Facebook"
      >
        <FacebookIcon className="size-4" />
      </a>
      <a
        href={site.social.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1 hover:bg-stone-800"
        aria-label="LinkedIn"
      >
        <LinkedInIcon className="size-4" />
      </a>
      <a
        href={site.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1 hover:bg-stone-800"
        aria-label="Instagram"
      >
        <InstagramIcon className="size-4" />
      </a>
    </div>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}

function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
