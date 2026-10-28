import type { Metadata } from "next";
import { Specimen } from "@/components/lab/Specimen";
import { lab } from "@/content/lab";

/** One column of the motion lab: the specimen sheet in the mode given by ?motion= (preview only). */
export const metadata: Metadata = {
  title: `${lab.specimen.heading} · ${lab.meta.title}`,
  robots: { index: false, follow: false },
};

export default function LabSpecimen() {
  return (
    <main id="main" data-lab-frame="">
      <h1 className="visually-hidden">{lab.specimen.heading}</h1>
      <Specimen />
    </main>
  );
}
