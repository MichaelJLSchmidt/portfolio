import type { SummitCardData } from "@/content/cards";
import type { CaseStudy } from "@/lib/case-study";
import * as gratwegCard from "./gratweg/card";
import * as gratwegStudy from "./gratweg/case-study";
import * as gratwegData from "./gratweg/data";
import * as seilschaftCard from "./seilschaft/card";
import * as seilschaftStudy from "./seilschaft/case-study";
import * as seilschaftData from "./seilschaft/data";
import { rawCard } from "./test-project/card";
import { rawCaseStudy } from "./test-project/case-study";
import { consistency, data, keyFigures } from "./test-project/data";

/**
 * Case studies whose numbers come from a data file, for the tools only (npm run images and
 * npm run check:figures; the site never imports this): the data, the copy as written (with
 * {{tokens}}), where the artefact sources live, and where their images and manifest go.
 */
export type DataSource = {
  slug: string;
  data: Record<string, unknown>;
  keyFigures: { label: string; text: string; in: string[] }[];
  /** Relations the data must keep (parts add up, a figure repeated under two names agrees). */
  consistency: [string, boolean][];
  raw: { caseStudy: CaseStudy; card: SummitCardData };
  /** Artefact sources (one HTML or SVG file per image) and their shared stylesheet. */
  artefacts: string;
  /** Encoded images under public/. */
  media: string;
  /** The manifest the case study imports. */
  manifest: string;
  /** "TEST PROJECT · FICTIONAL EXAMPLE": the strip at the foot of every image. */
  strip: { name: string; note: string };
};

export const dataSources: DataSource[] = [
  {
    slug: "seilschaft",
    data: seilschaftData.data,
    keyFigures: seilschaftData.keyFigures,
    consistency: seilschaftData.consistency,
    raw: { caseStudy: seilschaftStudy.rawCaseStudy, card: seilschaftCard.rawCard },
    artefacts: "artefacts/seilschaft",
    media: "/media/seilschaft/",
    manifest: "src/content/examples/seilschaft/images.json",
    strip: { name: "Seilschaft", note: "Fictional example" },
  },
  {
    slug: "gratweg",
    data: gratwegData.data,
    keyFigures: gratwegData.keyFigures,
    consistency: gratwegData.consistency,
    raw: { caseStudy: gratwegStudy.rawCaseStudy, card: gratwegCard.rawCard },
    artefacts: "artefacts/gratweg",
    media: "/media/gratweg/",
    manifest: "src/content/examples/gratweg/images.json",
    strip: { name: "Gratweg", note: "Fictional example" },
  },
  {
    slug: "test-project",
    data,
    keyFigures,
    consistency,
    raw: { caseStudy: rawCaseStudy, card: rawCard },
    artefacts: "artefacts/test-project",
    media: "/media/test-project/",
    manifest: "src/content/examples/test-project/images.json",
    strip: { name: "Test Project", note: "Fictional example" },
  },
];
