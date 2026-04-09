import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About MAN",
  description: `Learn about ${site.name}: founder’s message, leadership, mission, and vision in Guna, M.P.`,
};

const founderImage =
  "https://mansociety.org/wp-content/uploads/2023/03/RS-bhati.jpg";
const presidentImage =
  "https://mansociety.org/wp-content/uploads/2023/03/BB-BHati.jpg";
const kailashwatiImage =
  "https://mansociety.org/wp-content/uploads/2023/03/kailashwati.jpg";
const secretaryImage =
  "https://mansociety.org/wp-content/uploads/2023/03/Sangeeta-BHati.jpg";

const missionPointsA = [
  "Provide intensive and professional training to students to excel in special education course.",
  "Recruit qualified experts to develop self-esteem, self-concept, skill based learning in children with special need.",
  "To determine effective strategies that enables the individual to reach to its potential.",
  "To provide and enhance psycho-social well-being, Quality of life and rehabilitate, individuals with mental illness, intellectual disabilities and behavioral problems.",
];

const missionPointsB = [
  "To facilitate psycho-therapeutic intervention, psychological assessment, Neuropsychological rehabilitation and assessment.",
  "To impart time-bound and cost-effective treatments to all patient.",
  "To strive to help the patient to get equal opportunity to work and settled in mainstream society and develop skill for healthy living.",
  "To organize educational programs, event, seminars, conferences, symposiums at regional, national and international levels, to reach to masses for generating awareness towards mental health",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About MAN"
        subtitle={`${site.fullName}—mental health awareness, professional training, and community care from Guna, M.P.`}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {/* Founder’s Note */}
        <section className="grid gap-10 md:grid-cols-2 md:items-start md:gap-12">
          <div className="relative mx-auto aspect-[473/596] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:mx-0 md:max-w-none">
            <Image
              src={founderImage}
              alt="Dr Rajendra Singh Bhati"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div>
            <h2 className="font-serif-display text-2xl font-semibold sm:text-3xl">
              Founder&apos;s Note
            </h2>
            <p className="mt-4 font-medium text-foreground">
              Dr Rajendra Singh Bhati, DPM-NIMHANS (Psychiatrist)
            </p>
            <div className="mt-4 space-y-4 leading-relaxed text-muted">
              <p>
                MAN Society was founded with the goal of breaking the stigma
                surrounding mental illness. It was during my post-graduation
                days with NIMHANS, Bangalore (National Institute of Mental
                Health &amp; Neuro-Sciences) when I realized the need for Mental
                Health support in India. With the blessings of our elders and
                the support of our friends, my wife and I laid the groundwork
                for MAN society in the year, 2001. MAN stands for Mental Health
                Awareness and Networking. The first step in this direction was
                to establish a &apos;Special School&apos; and &apos;Day Care
                Centre&apos; for children requiring special needs. With new
                members and staff of specialists joining in, MAN Society soon
                extended into drug rehabilitation and care for psychological
                disorders. A variety of seminars and awareness camps were held
                at National and Regional levels. Further, psychological and
                psychopharmacological treatments were then made available to the
                patients. Thus, our institute facilitates evidence-based
                treatment and awareness for persons with disabilities. Our aim
                is to create a positive impact and meaningful difference in
                education. We have now begun with specialized courses such as
                Diploma in Special Education, Bachelor&apos;s degree in Special
                Education, and M.Phil. in clinical psychology. I strongly
                believe these professional courses will definitely generate
                like-minded professionals, who will have an empathetic approach
                to bringing joy and smiles to our patients along with the cure.
                I believe we can create a team of professionals that will, with
                their knowledge and skills, tend to rehabilitate, bring
                psychological wellness, and do groundbreaking and evidence-based
                research to improvise patient care. I believe education has the
                power to facilitate and generate massive change in the mindset
                of people; thus through education, we can create a healthy
                society and environment for students to excel academically,
                socially, and emotionally.
              </p>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="mt-20">
          <div className="grid gap-10 md:grid-cols-3">
            <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[473/596] w-full">
                <Image
                  src={presidentImage}
                  alt="Dr. B.B. Singh"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif-display text-lg font-semibold">
                  Dr. B.B. Singh (President)
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Dr. BB Singh is a retired veterinary surgeon who has dedicated
                  his entire life to serving the people of Madhya Pradesh. With
                  a degree from the prestigious Veterinary College in Mahu,
                  Indore, Dr. Singh has spent his career treating animals and
                  ensuring the well-being of his fellow citizens. His devotion
                  towards his work is reflected in his tireless efforts to keep
                  people healthy and fit. Under the guidance and mentorship of
                  Dr. BB Singh, the Mannsociety has been flourishing and growing
                  as a vibrant community. As the president and founder of the
                  society, Dr. Singh has brought his passion and dedication to
                  the forefront, ensuring that the people he serves are
                  well-nourished and have access to quality healthcare services.
                  Through his leadership, the society has become a place of
                  hope, providing opportunities for growth and development, and
                  making a positive impact on the lives of many. His vision and
                  unwavering commitment continue to inspire and motivate others
                  to strive for excellence and make a difference in the world.
                </p>
              </div>
            </article>

            <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[473/596] w-full">
                <Image
                  src={kailashwatiImage}
                  alt="Kailashwati Singh"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif-display text-lg font-semibold">
                  Kailashwati Singh (Executive Member)
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Kailashwati Singh is a highly esteemed executive member and an
                  integral part of our founder committee. With her profound
                  passion for her work, she has played a pivotal role in the
                  establishment and thriving of our society. Her unwavering
                  dedication and immense contributions have been invaluable in
                  steering our committee towards its present success. She brings
                  with her a vast wealth of experience and knowledge, along with
                  an innovative approach and a strong work ethic. Her ideas and
                  suggestions have been instrumental in shaping the direction of
                  our society, and we are extremely grateful to have her as a
                  part of our team. Through her tireless efforts and unwavering
                  commitment, she has been instrumental in ensuring that our
                  society fulfills its mission of serving the community and
                  making a positive impact on people&apos;s lives. Her
                  leadership and contributions have been critical in
                  establishing the society as a beacon of hope and a driving
                  force for good in the community.
                </p>
              </div>
            </article>

            <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-[473/596] w-full">
                <Image
                  src={secretaryImage}
                  alt="Sangeeta Singh Bhati"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif-display text-lg font-semibold">
                  Sangeeta Singh Bhati (Secretary)
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Sangeeta Singh Bhati is a dedicated member of the Mannsociety,
                  serving as its Secretary, and also actively contributing as a
                  Child Welfare Committee member in Guna. She has a wealth of
                  experience in the field of social work and has been
                  instrumental in implementing various initiatives aimed at
                  improving the lives of people in her community. Her tireless
                  efforts and exceptional leadership skills have been critical
                  in driving the society&apos;s mission forward. With her
                  unwavering dedication and passion, she has made a significant
                  impact in the lives of many people, especially children. As
                  the Secretary of the society, she ensures that all operations
                  run smoothly, and the society fulfills its goals and
                  objectives efficiently. Sangeeta Singh Bhati&apos;s commitment
                  to the cause of social welfare is a source of inspiration to
                  many, and her contributions to the society have been
                  invaluable. She is a shining example of what can be achieved
                  with passion, hard work, and unwavering dedication to serving
                  others.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mt-20 rounded-2xl border border-border bg-gradient-to-b from-stone-100/60 to-background px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="font-serif-display text-2xl font-semibold sm:text-3xl">
            Mission &amp; Vision
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground">
            We as a team aim for the following:
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-12">
            <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-foreground">
              {missionPointsA.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
            <ol
              className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-foreground"
              start={5}
            >
              {missionPointsB.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-2xl text-center">
          <p className="text-sm leading-relaxed text-muted">
            Visit us at {site.address}. Questions about programmes or campus?{" "}
            <Link
              href="/contact"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
