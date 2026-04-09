export const site = {
  name: "MAN College",
  fullName:
    "MAN College of Special Education and Psychological Studies, Guna, M.P.",
  tagline:
    "Clinical training, special education, and compassionate mental health care.",
  phone: "+91 9179566299",
  phoneTel: "tel:+919179566299",
  address:
    "Green Park Colony, Bhullanpura Bypass Road, 473001, Guna (M.P.), India",
  social: {
    facebook: "https://www.facebook.com/man.samiti",
    linkedin: "https://www.linkedin.com",
    instagram: "https://www.instagram.com",
  },
  cctvUrl: "http://www.autonatap.com",
  legacySite: "https://mansociety.org",
} as const;

export type CourseSlug =
  | "mphil-clinical-psychology"
  | "diploma-special-education"
  | "bed-special-education";

export const courses: {
  slug: CourseSlug;
  title: string;
  shortTitle: string;
  summary: string;
  body: string[];
  image: string;
  imageAlt: string;
}[] = [
  {
    slug: "mphil-clinical-psychology",
    shortTitle: "M.Phil. in Clinical Psychology",
    title: "M.Phil. in Clinical Psychology",
    summary:
      "RCI-recognised, two-year professional training with clinical placement in a psychiatric setting.",
    body: [
      "M.Phil. in Clinical Psychology is regulated and recognised by the Rehabilitation Council of India (RCI), Delhi, and affiliated with Jiwaji University, Gwalior, M.P. It is a two-year professional training course in clinical psychology.",
      "The programme helps postgraduate students take practical training within a psychiatric setup to build proficiency in clinical skills for clients with psychological conditions.",
      "Candidates gain exposure to psychiatric diagnosis, psychological assessments, psychotherapeutic interventions, research, practicum, and dissertation work across the full two-year term.",
    ],
    image:
      "https://mansociety.org/wp-content/uploads/2023/07/MPHIL-MB-1024x683.jpg",
    imageAlt: "Students in a clinical psychology training setting",
  },
  {
    slug: "diploma-special-education",
    shortTitle: "Diploma in Special Education (D.Ed.–IDD)",
    title: "Diploma in Special Education (D.Ed.–IDD)",
    summary:
      "Hands-on preparation to support learners with intellectual and developmental disabilities.",
    body: [
      "The diploma in special education focuses on experiential skills required to work with and train individuals with special needs.",
      "Students learn basic care, life skills training, behaviour moderation techniques, and social skills for children with disabilities and additional support needs.",
    ],
    image: "https://mansociety.org/wp-content/uploads/2023/07/010-1024x684.jpg",
    imageAlt: "Special education classroom activity",
  },
  {
    slug: "bed-special-education",
    shortTitle: "B.Ed. Special Education (IDD)",
    title: "Bachelor's in Special Education (B.Ed.–IDD)",
    summary:
      "Two-year RCI-registered undergraduate programme for teachers of differently-abled learners.",
    body: [
      "B.Ed. Special Education is a two-year full-time regular undergraduate programme registered under the Rehabilitation Council of India.",
      "It prepares teachers to instruct students who are differently abled or face physical challenges, with a strong emphasis on inclusive pedagogy and practical classroom skills.",
    ],
    image:
      "https://mansociety.org/wp-content/uploads/2023/07/LECTURE-HALL-1-1024x684.jpg",
    imageAlt: "College lecture hall",
  },
];

export const galleryImages: { src: string; alt: string }[] = [
  {
    src: "https://mansociety.org/wp-content/uploads/2023/03/DSC_2001-1-1536x1025.jpg",
    alt: "Campus life at MAN College",
  },
  {
    src: "https://mansociety.org/wp-content/uploads/2023/03/DSC_2026-1-1536x1025.jpg",
    alt: "Students and faculty on campus",
  },
  {
    src: "https://mansociety.org/wp-content/uploads/2023/07/G4.jpg",
    alt: "College facilities",
  },
  {
    src: "https://mansociety.org/wp-content/uploads/2023/07/G3.jpg",
    alt: "Events at MAN College",
  },
  {
    src: "https://mansociety.org/wp-content/uploads/2023/07/G2.jpg",
    alt: "Campus gallery",
  },
  {
    src: "https://mansociety.org/wp-content/uploads/2023/07/G1.jpg",
    alt: "College grounds",
  },
];

export const hospitalBlocks = [
  {
    title: "MAN Psychiatric Hospital",
    text: "The psychiatric hospital is built on campus to support the M.Phil. Clinical Psychology programme. It includes twenty in-patient beds and is staffed to provide safe, attentive care.",
    image: "https://mansociety.org/wp-content/uploads/2023/07/IPD-1024x682.jpg",
    imageAlt: "In-patient hospital facility",
  },
  {
    title: "MAN Psychiatric OPD",
    text: "Daily psychiatric OPD serves approximately 100–150 patients, run by qualified M.D. psychiatrists. Care spans mood and anxiety conditions, substance use, OCD, psychosis, and other common presentations.",
    image: "https://mansociety.org/wp-content/uploads/2023/07/008-1024x684.jpg",
    imageAlt: "Out-patient department",
  },
] as const;

/** Full hospital page copy and galleries (mansociety.org hospital / psychiatry page). */
export const hospitalPsychiatryPage = {
  intro:
    "The department of psychiatry was established in the year 2009. The department has three Specialty Clinics (a) Psycho Therapy Centre (Child/Adolescence / Adult); (b) Psychological Assessment (c) De- Addiction Centre. Department of Psychiatry has a hospital, with In-ward patient (IPD) facilities and outpatient department (OPD) started in 2018. The department is run by a dedicated team of doctors qualified as M.D. Psychiatrist, Physician, Clinical Psychologist, Child Psychiatrist, Neurologist and Nursing Staff. Hospital is registered with State Mental Health Authority, M.P., and Office of the Chief Medical and Health Officer.",
  ipdImages: [
    {
      src: "https://mansociety.org/wp-content/uploads/2023/07/HOSPITAL-MAN-DE-ADDICTION-CENTRE-1-1024x684.jpg",
      alt: "MAN Hospital de-addiction centre",
    },
    {
      src: "https://mansociety.org/wp-content/uploads/2023/07/hospital-IPD-2-1024x684.jpg",
      alt: "Hospital in-patient ward",
    },
    {
      src: "https://mansociety.org/wp-content/uploads/2023/07/IPD-1-1024x683.jpg",
      alt: "In-patient department facilities",
    },
  ],
  opdImages: [
    {
      src: "https://mansociety.org/wp-content/uploads/2023/07/PSYCHIATRIC-OPD-1-1024x684.jpg",
      alt: "Psychiatric out-patient department",
    },
  ],
} as const;

/** Library page galleries (mansociety.org library page). */
export const libraryPage = {
  clinicalPsychology: {
    images: [
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/LIBRARY--1024x684.jpg",
        alt: "Clinical psychology library",
        width: 1024,
        height: 684,
      },
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/E-LIBRARY-684x1024.jpg",
        alt: "E-library access",
        width: 684,
        height: 1024,
      },
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/E-LIBRARY-1-1024x684.jpg",
        alt: "E-library facilities",
        width: 1024,
        height: 684,
      },
    ],
    readingRoom: [
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/READING-ROOM-1-1024x684.jpg",
        alt: "Library reading room",
        width: 1024,
        height: 684,
      },
    ],
  },
  specialEducation: {
    images: [
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/001-4-1024x683.jpg",
        alt: "Special education library",
        width: 1024,
        height: 683,
      },
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/002-1024x683.jpg",
        alt: "Special education library collection",
        width: 1024,
        height: 683,
      },
      {
        src: "https://mansociety.org/wp-content/uploads/2023/07/B.Ed-library-2-1024x683.jpg",
        alt: "B.Ed. special education library",
        width: 1024,
        height: 683,
      },
    ],
  },
} as const;

export const specialSchoolBlock = {
  title: "MAN Special School",
  text: "Our special school extends the college mission into daily educational support for children with diverse learning needs, complementing academic programmes in special education.",
  image:
    "https://mansociety.org/wp-content/uploads/2023/07/SPECILA-SCHOOL-1024x683.jpg",
  imageAlt: "Special school environment",
} as const;

export function getCourseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}
