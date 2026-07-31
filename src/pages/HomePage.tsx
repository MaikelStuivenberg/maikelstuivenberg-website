import { BrandReveal } from "@/components/BrandReveal";
import { PageMeta } from "@/components/PageMeta";
import { CONTACT_EMAIL, KVK_NUMBER } from "@/lib/constants";

export function HomePage() {
  return (
    <>
      <PageMeta title="Maikel Stuivenberg" description="Maikel Stuivenberg" />
      <main className="relative flex min-h-screen items-center justify-center px-6">
        <BrandReveal />
        <p className="absolute inset-x-0 bottom-6 text-center text-[0.7rem] tracking-[0.08em] text-muted-foreground/60">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-inherit no-underline hover:opacity-100"
          >
            {CONTACT_EMAIL}
          </a>
          <span className="mx-2.5 opacity-40" aria-hidden="true">
            ·
          </span>
          KvK {KVK_NUMBER}
        </p>
      </main>
    </>
  );
}
