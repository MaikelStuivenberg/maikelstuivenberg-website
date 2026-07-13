import { PageMeta } from "@/components/PageMeta";
import { CONTACT_EMAIL } from "@/lib/constants";

export function ContactPage() {
  return (
    <>
      <PageMeta
        title="Contact — Maikelstuivenberg.nl"
        description="Contact Maikel Stuivenberg with questions about Encore, Bravo, and Qwixx."
      />
      <p className="text-base leading-relaxed">
        Do you have any questions about my apps? Feel free to contact me at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
