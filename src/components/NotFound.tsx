import { Button } from './ui';

/**
 * Global 404 — Cinematic Atlas restyle. Rendered by the catch-all route inside
 * the shell layout, so navbar/footer stay available.
 */
function NotFound() {
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center"
    >
      <p
        className="font-display text-[clamp(5rem,16vw,9rem)] font-semibold leading-none tracking-tight text-accent"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-primary">
        Sayfa bulunamadı
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary">
        Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.
        Ana sayfaya dönerek keşfe devam edebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button to="/" size="md">
          Ana Sayfaya Dön
        </Button>
        <Button to="/kesfet" variant="ghost" size="md">
          Keşfet
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
