import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { courses, getCourseBySlug } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return { title: "Programme" };
  return {
    title: course.shortTitle,
    description: course.summary,
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <>
      <PageHeader title={course.title} subtitle={course.summary} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <Image
              src={course.image}
              alt={course.imageAlt}
              width={1200}
              height={800}
              className="aspect-[3/2] h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="space-y-6">
            {course.body.map((para) => (
              <p key={para.slice(0, 48)} className="leading-relaxed text-muted">
                {para}
              </p>
            ))}
            <div className="rounded-xl border border-accent-subtle bg-accent-subtle/40 p-6">
              <p className="text-sm font-medium text-foreground">
                Before you apply, confirm the latest prospectus, fees, and seat
                matrix from the college office and official RCI / university
                notifications.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Contact the office →
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-12 text-center text-sm text-muted">
          <Link
            href="/academics"
            className="font-medium text-accent hover:text-accent-hover"
          >
            ← All programmes
          </Link>
        </p>
      </div>
    </>
  );
}
