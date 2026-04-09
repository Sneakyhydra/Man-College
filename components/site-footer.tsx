import Link from "next/link";
import { site } from "@/lib/content";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/academics", label: "Programmes" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="font-serif-display text-lg font-semibold text-white">
              Children&apos;s mental health matters
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-400">
              A short film on why early support and understanding make a lasting difference
              for young people and families.
            </p>
            <div className="mt-4 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-stone-700 bg-black shadow-xl">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/hrGXHkmNw3g"
                title="Importance of Children's Mental Health"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Explore
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-stone-300 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Visit
              </h3>
              <p className="mt-4 text-sm leading-relaxed">{site.address}</p>
              <a
                href={site.phoneTel}
                className="mt-2 inline-block text-sm font-medium text-accent-subtle hover:text-white"
              >
                {site.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Newsletter
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Occasional updates on admissions, campus events, and public lectures.
            </p>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              action="mailto:info@example.com"
              method="post"
              encType="text/plain"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2.5 text-sm text-white placeholder:text-stone-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-stone-600">
              Opens your email client; replace with a form backend when ready.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-8 text-center text-xs text-stone-500 sm:flex-row sm:text-left">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="max-w-md sm:text-right">
            Academic details on this preview site are adapted from public information on{" "}
            <a
              href={site.legacySite}
              className="text-stone-400 underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              mansociety.org
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
