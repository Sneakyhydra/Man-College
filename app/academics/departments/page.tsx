import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Departments",
  description: `Academic and clinical departments at ${site.fullName}.`,
};

const departments: {
  title: string;
  body: string;
  icon: ReactNode;
}[] = [
  {
    title: "Department of Psychiatry",
    body: "The department of psychiatry was established in the year 2009. The department has three Specialty Clinics (a) Psycho Therapy Centre (Child/Adolescence / Adult); (b) Psychological Assessment (c) De- Addiction Centre. Department of Psychiatry has a hospital, with In-ward patient (IPD) facilities and outpatient department (OPD) started in 2018. The department is run by a dedicated team of doctors qualified as M.D. Psychiatrist, Physician, Clinical Psychologist, Child Psychiatrist, Neurologist and Nursing Staff. Hospital is registered with State Mental Health Authority, M.P., and Office of the Chief Medical and Health Officer.",
    icon: <AtSymbolIcon />,
  },
  {
    title: "Department of Clinical Psychology",
    body: "The department of Clinical Psychology is established in June, 2023. The department facilitates clinical and counseling services, assess and treat problems related to mental health, behavioral emotional disorders, mental disorders, Research & Development.",
    icon: <TabletIcon />,
  },
  {
    title: "Department of Special Education",
    body: "Department of Special Education of the ‘MAN’ College of Special Education and Psychological Studies, Guna, Madhya Pradesh is established to promote quality education, research, Training and Consultation in teaching with a better perspective to meet the challenges of the fast changing trends in the field of special education. As a professional Institution of teaching, department of special education has a responsibility to prepare qualified professionals in teaching and academic leadership. Under Dept. of Special Education following two courses are running and both of them are approved by Rehabilitation Council of India (RCI). D.Ed. in Spl.Ed (IDD) – The D.Ed. in Special Education (IDD) is two years program and since 2021 eligibility is 50% marks after 10+2 exam. B.Ed., in Spl. Edu., (IDD) – It also two years course approved by RCI and affiliated to Jiwaji University Gwalior, (2023). The eligibility criteria are 50% in Bachelors degree.",
    icon: <CodeBracketsIcon />,
  },
];

const specialSchool = {
  title: "Special School",
  body: "Special Schools provides education for children with special educational need as per their diagnosed disability. Special school is a modified program which involves some unique tools, techniques, and research efforts in improving the instructional arrangements to meet the need of children with disability. ‘MAN’ special school uses curriculum designed to assist children with intellectual and developmental disability and help them to understand, overcome and manage behavioral, emotional, and academics development. ‘MAN’ special school promotes sports and skill development activities for holistic development.",
};

export default function DepartmentsPage() {
  return (
    <>
      <PageHeader title="Departments" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <span
            className="hidden h-px flex-1 max-w-[6rem] bg-border sm:block"
            aria-hidden
          />
          <p className="max-w-xl text-center font-serif-display text-lg font-medium leading-snug text-foreground sm:text-xl">
            Empowering minds, shaping futures: discover endless possibilities in
            our department at MAN
          </p>
          <span
            className="hidden h-px flex-1 max-w-[6rem] bg-border sm:block"
            aria-hidden
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {departments.map((d) => (
            <article
              key={d.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div
                className="flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-inner"
                aria-hidden
              >
                {d.icon}
              </div>
              <h2 className="mt-5 font-serif-display text-lg font-semibold uppercase tracking-wide">
                {d.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {d.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="hidden lg:block" aria-hidden />
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
            <div
              className="flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-inner"
              aria-hidden
            >
              <TabletIcon />
            </div>
            <h2 className="mt-5 font-serif-display text-lg font-semibold uppercase tracking-wide">
              {specialSchool.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {specialSchool.body}
            </p>
          </article>
        </div>
      </div>
    </>
  );
}

function AtSymbolIcon() {
  return (
    <svg
      className="size-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg
      className="size-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 18h.01" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function CodeBracketsIcon() {
  return (
    <svg
      className="size-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M16 18l6-6-6-6M8 6l-6 6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
