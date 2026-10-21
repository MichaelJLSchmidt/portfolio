import { site } from "@/content/site";

export default function Home() {
  return (
    <main id="main">
      <h1 className="display">{site.hero.name}</h1>
    </main>
  );
}
