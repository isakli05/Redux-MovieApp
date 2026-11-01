import { Link } from 'react-router-dom';
import { SectionHeader } from '../ui';

/**
 * Deneyimler band — compact home entry points to the six interactive
 * experiences (SHARED_CONTRACTS §F: clear entries, no giant promo blocks).
 */
const EXPERIENCES = [
  { to: '/seans', title: 'Seans', desc: 'Bu akşam ne izsem? Altı soruda üç aday.' },
  { to: '/dna', title: 'Sinema DNA', desc: 'Zevkin haritasını çıkar, paylaş.' },
  { to: '/evren', title: 'Sinema Evreni', desc: 'Filmler, diziler, insanlar bağlantı haritasında.' },
  { to: '/birlikte', title: 'Birlikte İzle', desc: 'Arkadaşlarınla tek bir yapıda buluş.' },
  { to: '/bilmece', title: 'Günlük Bilmece', desc: 'Her gün bir yeni film bilmecesi.' },
  { to: '/takip', title: 'Takip', desc: 'Dizilerini spoiler’sız bölüm bölüm izle.' },
];

export function ExperiencesBand({ className = '' }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="deneyimler-baslik">
      <SectionHeader title="Deneyimler" eyebrow="LMDB" as="h2" />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERIENCES.map((exp) => (
          <li key={exp.to}>
            <Link
              to={exp.to}
              className="group flex h-full flex-col gap-1 rounded-lg border border-line bg-surface-raised p-4 transition-colors duration-150 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-void"
            >
              <span className="font-display text-lg text-primary group-hover:text-accent">
                {exp.title}
              </span>
              <span className="text-sm text-secondary">{exp.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
