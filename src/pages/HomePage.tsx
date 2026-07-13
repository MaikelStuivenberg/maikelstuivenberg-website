import { BrandReveal } from "@/components/BrandReveal";
import { PageMeta } from "@/components/PageMeta";

export function HomePage() {
  return (
    <>
      <PageMeta title="Maikel Stuivenberg" description="Maikel Stuivenberg" />
      <main className="flex min-h-screen items-center justify-center px-6">
        <BrandReveal />
      </main>
    </>
  );
}
