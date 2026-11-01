/**
 * author.ts — Author biography & app-catalogue data source
 *
 * Single source of truth for the developer's biography, used by /profile and
 * the tool pages' "about the author" sections.
 *
 * Sourced from the author's public portfolio repository:
 *   https://github.com/moniruzjaman/portfolio.git  (src/lib/author.ts)
 *
 * The companion catalogue of published apps (used to attach a relevant
 * respiratory ecosystem app to every tool) is curated in `ecosystemApps.ts`
 * from the same repo's content-data/apps.json + src/data/repos.generated.json.
 */

export interface CareerEntry {
  from: string;
  to: string;
  role: string;
  place: string;
  placeBn: string;
  note: string;
}

export interface EducationEntry {
  degree: string;
  field: string;
  org: string;
  orgBn: string;
  year: number;
  detail: string;
}

export interface CompetencyGroup {
  group: string;
  groupBn: string;
  items: string[];
}

export const author = {
  name: "Abu Md. Moniruzjaman",
  short: "Moniruzjaman",
  initials: "AM",
  role: "Additional Deputy Director (Horticulture)",
  roleBn: "সহকারী উপ-পরিচালক (উদ্যানায়ন)",
  org: "Department of Agricultural Extension (DAE)",
  orgBn: "কৃষি সম্প্রসারণ অধিদপ্তর",
  location: "Kurigram, Rangpur Division, Bangladesh",
  locationBn: "কুড়িগ্রাম, রংপুর বিভাগ, বাংলাদেশ",
  cadre: "31st BCS Agriculture Cadre",
  github: "https://github.com/moniruzjaman",
  githubHandle: "moniruzjaman",
  portfolioRepo: "https://github.com/moniruzjaman/portfolio",
  linkedin: "https://www.linkedin.com/in/abu-md-moniruzjaman-a55b5034/",
  facebook: "https://www.facebook.com/moniruzjaman2021",
  youtube: "https://www.youtube.com/@AgriWisdomBd",
  site: "https://moniruzjaman.github.io",

  vision:
    "Transforming Bangladesh's agricultural extension from paper-based to AI-powered — bringing science, data, and connectivity directly into the hands of smallholder farmers.",
  visionBn:
    "বাংলাদেশের কৃষি সম্প্রসারণকে কাগজভিত্তিক থেকে এআই-চালিত রূপান্তর — বিজ্ঞান, ডেটা ও সংযোগ সরাসরি ক্ষুদ্র কৃষকের হাতে পৌঁছে দেওয়া।",

  education: [
    {
      degree: "MBA",
      field: "Marketing",
      org: "North South University",
      orgBn: "নর্থ সাউথ বিশ্ববিদ্যালয়",
      year: 2011,
      detail: "CGPA 3.13 / 4.00",
    },
    {
      degree: "B.Sc. Ag. (Hons.)",
      field: "Agriculture Science",
      org: "Hajee Mohammad Danesh S&T University",
      orgBn: "হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
      year: 2008,
      detail: "CGPA 2.91 / 4.00",
    },
  ] as EducationEntry[],

  career: [
    {
      from: "2024",
      to: "Present",
      role: "Additional Deputy Director (Horticulture)",
      place: "DAE, Kurigram",
      placeBn: "কৃষি সম্প্রসারণ অধিদপ্তর, কুড়িগ্রাম",
      note: "District strategic leadership for horticulture extension — digital transformation of extension services, AI app deployment, farmer outreach in the northern river delta.",
    },
    {
      from: "2022",
      to: "2024",
      role: "Upazila Agriculture Officer",
      place: "Rangpur Sadar & Kaunia, Rangpur",
      placeBn: "রংপুর সদর ও কাউনিয়া, রংপুর",
      note: "Digital farmer services and crop advisory across the fertile Rangpur plains.",
    },
    {
      from: "2021",
      to: "2022",
      role: "Upazila Agriculture Officer",
      place: "Rangamati Sadar & Naniarchar, Rangamati",
      placeBn: "রাঙ্গামাটি সদর ও নানিয়ারচর, রাঙ্গামাটি",
      note: "Hill tracts agriculture extension in the CHT — indigenous farming systems and upland crop management.",
    },
    {
      from: "2021",
      to: "2021",
      role: "Instructor, Agriculture Training Institute (ATI)",
      place: "Bangladesh",
      placeBn: "বাংলাদেশ",
      note: "Technical knowledge transfer to field extension officers; curriculum for modern crop management.",
    },
    {
      from: "2018",
      to: "2021",
      role: "Upazila Agriculture Officer",
      place: "Dirai & Shalla, Sunamganj",
      placeBn: "দিরাই ও শাল্লা, সুনামগঞ্জ",
      note: "Haor wetland crop management — flood-resilient, disaster-adaptive farming for the seasonally inundated haor ecosystem.",
    },
    {
      from: "2017",
      to: "2018",
      role: "Agricultural Extension Officer",
      place: "Natore Sadar, Natore",
      placeBn: "নাটোর সদর, নাটোর",
      note: "Commencement of civil service. Field-level extension work for smallholder farmers.",
    },
  ] as CareerEntry[],

  competencies: [
    {
      group: "Agricultural Science",
      groupBn: "কৃষি বিজ্ঞান",
      items: [
        "CABI Plantwise Diagnostics",
        "IPM / Crop Protection",
        "Horticulture Management",
        "Haor & Hill Tract Agronomy",
        "Farmer Field Schools",
      ],
    },
    {
      group: "Digital Agriculture & AI",
      groupBn: "ডিজিটাল কৃষি ও এআই",
      items: [
        "AI-powered extension apps",
        "PWA / mobile-first farmer tools",
        "Geospatial & satellite crop monitoring",
        "Bilingual (bn/en) content systems",
      ],
    },
  ] as CompetencyGroup[],
};

export type Author = typeof author;
