/**
 * Auth Callback page (/auth/callback) — fixes defect O.
 *
 * The heavy lifting is SERVER-side now: TMDB redirects to
 * `/api/auth/callback`, the BFF exchanges the token, sets the httpOnly
 * session cookie and 302s here (`/lists`, or `/lists?auth=error`). This page
 * therefore does exactly one thing, in ONE effect: validate the resulting
 * session via `/api/auth/session` and navigate. The old 200 ms poller with a
 * stale closure, the duplicate navigate calls and the competing redirects are
 * gone.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ui';

type CallbackStatus = 'checking' | 'error';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // The BFF already redirected with ?auth=error on failure — no session
      // check can succeed then.
      if (new URLSearchParams(window.location.search).get('auth') === 'error') {
        setStatus('error');
        return;
      }
      try {
        const res = await fetch('/api/auth/session', {
          headers: { 'x-requested-with': 'fetch' },
        });
        const data = res.ok
          ? ((await res.json()) as { authenticated?: boolean })
          : { authenticated: false };
        if (cancelled) return;
        if (data.authenticated) {
          navigate('/lists', { replace: true });
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <ErrorState
            title="Giriş tamamlanamadı"
            message="TMDB ile giriş işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin."
            backTo="/"
            backLabel="Ana Sayfaya Dön"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4"
      role="status"
      aria-live="polite"
    >
      <p className="font-display text-3xl font-semibold tracking-[0.18em] text-primary">
        LMDB<span className="text-accent">.</span>
      </p>
      <svg
        className="motion-safe:h-10 motion-safe:w-10 motion-safe:animate-spin text-accent"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-primary">Giriş tamamlanıyor…</h1>
        <p className="mt-2 text-sm text-secondary">
          TMDB hesabınız doğrulanıyor, birkaç saniye içinde listelerinize yönlendirileceksiniz.
        </p>
      </div>
      <Link to="/" className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
};

export default AuthCallback;
