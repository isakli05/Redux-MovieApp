import { SectionHeader } from './ui';

/**
 * Integration-base placeholder for the six interactive-experience routes.
 * Each Feature PM replaces this usage with the real page in its own
 * `src/Pages/<Feature>.tsx` — the route wiring stays untouched.
 */
export default function FeaturePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader title={title} eyebrow="LMDB Deneyimleri" as="h1" />
      <p className="mt-10 text-center text-secondary">{description}</p>
      <p className="mt-2 text-center text-sm text-muted">Bu deneyim geliştirme aşamasında.</p>
    </section>
  );
}
