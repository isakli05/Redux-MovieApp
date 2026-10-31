import { Link } from 'react-router-dom';

/**
 * Shell footer — Cinematic Atlas spec §6 + decision D7.
 * TMDB attribution (logo block + exact English sentence) and JustWatch credit
 * are mandatory; nav columns only, deliberately NO statistics or fake numbers.
 */

interface FooterLink {
  label: string;
  to: string;
}

const FOOTER_NAV: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Keşif',
    links: [
      { label: 'Keşfet', to: '/kesfet' },
      { label: 'Arama', to: '/search' },
      { label: 'Ana Sayfa', to: '/' },
    ],
  },
  {
    title: 'Filmler',
    links: [
      { label: 'Popüler', to: '/movie' },
      { label: 'Vizyondakiler', to: '/movie/now-playing' },
      { label: 'Yakında', to: '/movie/upcoming' },
    ],
  },
  {
    title: 'Diziler',
    links: [
      { label: 'Popüler', to: '/tv' },
      { label: "Günün Programı", to: '/tv/airing-today' },
      { label: 'Televizyonda', to: '/tv/on-the-air' },
    ],
  },
  {
    title: 'İnsanlar',
    links: [{ label: 'Popüler Kişiler', to: '/person' }],
  },
  {
    title: 'Listeler',
    links: [{ label: 'Listelerim', to: '/lists' }],
  },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-surface-void">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand + mandatory attribution (D7) */}
          <div className="col-span-2 space-y-5">
            <p className="font-display text-2xl font-semibold tracking-[0.18em] text-primary">
              LMDB<span className="text-accent">.</span>
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-secondary">
              Film ve dizi keşif platformu. Puanları görün, kadroları inceleyin,
              kendi listelerinizi oluşturun.
            </p>
            <div className="space-y-3 border-t border-line pt-5">
              <div className="flex items-start gap-3">
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex shrink-0 items-center rounded-md border border-line-strong px-2.5 py-1.5 font-display text-sm font-semibold tracking-[0.14em] text-primary transition-colors duration-150 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="TMDB web sitesi (yeni sekmede açılır)"
                >
                  TMDB
                </a>
                <p className="text-xs leading-relaxed text-secondary">
                  This product uses the TMDB API but is not endorsed or certified
                  by TMDB.
                </p>
              </div>
              <p className="text-xs text-secondary">
                Yayın bilgileri JustWatch tarafından sağlanır.
              </p>
            </div>
          </div>

          {/* Sitemap columns */}
          {FOOTER_NAV.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-secondary transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-center text-xs text-muted">
            © {currentYear} LMDB · Film ve Dizi Keşif
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
