/**
 * F4 — Birlikte İzle: grupla tek film/dizi kararı.
 *
 * Akış: landing (oda kur / koda katıl) → ?oda=CODE ile canlı oda.
 * Kimlik oda başına localStorage'da (lmdb:group/room/<code>): bağlantı
 * kopunca aynı pid ile devam; hostKey yalnız ev sahibi cihazında.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, SectionHeader } from '../../components/ui';
import { createHttpApi } from '../../lib/group/api';
import type { GroupApi } from '../../lib/group/api';
import { isValidCodeFormat } from '../../lib/group/core';
import { clearIdentity, loadIdentity, saveIdentity } from '../../lib/group/identity';
import { RoomStage } from '../../components/GroupChoice/RoomStage';

/** Oda kodunu büyük harfe normelleştir (kod alfabesi zaten büyük). */
function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default function BirlikteIzle() {
  const api: GroupApi = useMemo(() => createHttpApi(), []);
  const [params, setParams] = useSearchParams();
  const code = params.get('oda');

  const [identity, setIdentity] = useState(
    () => (code ? loadIdentity(code) : null),
  );

  // URL'deki oda değişirse kimliği o odaya göre yeniden yükle.
  useEffect(() => {
    setIdentity(code ? loadIdentity(code) : null);
  }, [code]);

  if (code && identity) {
    return (
      <RoomStage
        api={api}
        code={code}
        pid={identity.pid}
        hostKey={identity.hostKey}
        onRejoin={() => {
          clearIdentity(code);
          setIdentity(null);
        }}
        onExit={() => setParams({})}
      />
    );
  }

  return code ? (
    <JoinGate api={api} code={code} onJoined={(pid, hostKey) => {
      saveIdentity(code, hostKey ? { pid, hostKey } : { pid });
      setIdentity(hostKey ? { pid, hostKey } : { pid });
    }} />
  ) : (
    <Landing
      api={api}
      onCreated={(c, pid, hostKey) => {
        saveIdentity(c, { pid, hostKey });
        setIdentity({ pid, hostKey });
        setParams({ oda: c });
      }}
      onJoinedCode={(c, pid) => {
        saveIdentity(c, { pid });
        setIdentity({ pid });
        setParams({ oda: c });
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Landing: oda kur

function Landing({ api, onCreated, onJoinedCode }: {
  api: GroupApi;
  onCreated: (code: string, pid: string, hostKey: string) => void;
  onJoinedCode: (code: string, pid: string) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.createRoom({ name: name.trim() || undefined });
      onCreated(r.code, r.pid, r.hostKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oda kurulamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <SectionHeader title="Birlikte İzle" eyebrow="LMDB Deneyimleri" as="h1" />
      <p className="mt-8 text-center text-secondary">
        Odayı kur, davet linkini gönder, herkes oy versin; akşamın filmi
        karşılıklı uzlaşıyla çıksın. Kayıt gerekmez, odalar 24 saat sonra silinir.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-line-strong bg-surface-raised p-6">
          <h2 className="font-display text-xl text-primary">Oda Kur</h2>
          <p className="mt-1 text-sm text-secondary">Sen kısıtları seçersin, davet edersin.</p>
          <label htmlFor="host-name" className="mt-5 block text-sm text-secondary">
            Adın
          </label>
          <input
            id="host-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="ör. Yağız"
            className="mt-1.5 h-10 w-full rounded-md border border-line bg-surface-void px-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <Button className="mt-5 w-full" loading={busy} onClick={() => void create()}>
            Odayı Kur
          </Button>
        </div>
        <JoinCard
          api={api}
          heading="Koda Katıl"
          onJoinedCode={onJoinedCode}
        />
      </div>

      {error && (
        <p role="alert" className="mt-6 text-center text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Katılma kartı (landing'de ve doğrudan ?oda= bağlantısında)

function JoinCard({ api, onJoinedCode, heading, fixedCode }: {
  api: GroupApi;
  onJoinedCode: (code: string, pid: string) => void;
  heading: string;
  /** Bağlantıdan gelmişse kod alanı gösterilmez. */
  fixedCode?: string;
}) {
  const [code, setCode] = useState(fixedCode ?? '');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    const normalized = normalizeCode(code);
    if (!isValidCodeFormat(normalized)) {
      setError('Kod 6 haneli olmalı (ör. K7M2XQ).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.joinRoom(normalized, name.trim() || 'Misafir');
      onJoinedCode(normalized, r.pid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Katılınamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-6">
      <h2 className="font-display text-xl text-primary">{heading}</h2>
      <p className="mt-1 text-sm text-secondary">
        {fixedCode ? 'Adını girip odaya katıl.' : 'Ev sahibinden gelen 6 haneli kodu gir.'}
      </p>
      {!fixedCode && (
        <>
          <label htmlFor="join-code" className="mt-5 block text-sm text-secondary">
            Oda kodu
          </label>
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="K7M2XQ"
            className="mt-1.5 h-10 w-full rounded-md border border-line bg-surface-void px-3 font-display text-lg tracking-[0.3em] text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </>
      )}
      <label htmlFor="join-name" className="mt-4 block text-sm text-secondary">
        Adın
      </label>
      <input
        id="join-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        placeholder="ör. Deniz"
        className="mt-1.5 h-10 w-full rounded-md border border-line bg-surface-void px-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <Button className="mt-5 w-full" variant="outline" loading={busy} onClick={() => void join()}>
        Katıl
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ?oda=CODE + kimlik yok → katılma kapısı

function JoinGate({ api, code, onJoined }: {
  api: GroupApi;
  code: string;
  onJoined: (pid: string, hostKey?: string) => void;
}) {
  if (!isValidCodeFormat(normalizeCode(code))) {
    return (
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-xl text-primary">Geçersiz oda bağlantısı.</p>
        <p className="mt-2 text-sm text-secondary">Kod 6 haneli olmalı (ör. K7M2XQ).</p>
        <Button className="mt-6" to="/birlikte">
          Ana Sayfaya Dön
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <SectionHeader title="Odaya Katıl" eyebrow={`Kod: ${normalizeCode(code)}`} as="h1" />
      <div className="mt-10">
        <JoinCard
          api={api}
          heading="Odaya Katıl"
          fixedCode={normalizeCode(code)}
          onJoinedCode={(_, pid) => onJoined(pid)}
        />
      </div>
    </section>
  );
}
