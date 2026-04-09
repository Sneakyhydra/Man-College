export const site = {
  name: "MAN College",
  fullName:
    "MAN College of Special Education and Psychological Studies, Guna, M.P.",
  tagline: "Clinical training, special education, and compassionate mental health care.",
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
