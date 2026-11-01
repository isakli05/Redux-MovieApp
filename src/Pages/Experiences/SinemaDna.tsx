/**
 * F2 — Cinema DNA (`/dna`): etkileşim günlüğünden türetilen, açıklayan ve
 * geri alınabilir kişisel tat profili (SHARED_CONTRACTS §B/§E/§H).
 *
 * Akış: günlük (useInteractions) + başlık üst-verisi (lmdb:dna:meta önbelleği,
 * BFF'den doldurulur) → deriveDnaProfile (saf) → dürüst sunum: her skor kanıtını
 * ve kanıt miktarına bağlı güvenini gösterir; az veri daha çok girdi davet eder.
 * Soğuk başlangıç: popüler havuzdan ikili karşılaştırmalar, ilk cevaptan itibaren
 * profil işler taşır.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useGetPopularMoviesQuery, useGetPopularTVShowsQuery } from '@api/index';
import { useAuth } from '@hooks/useAuth';
import { mergeLocalIntoAccount, useInteractions } from '@/lib/interactions';
import { confidenceOf, deriveDnaProfile } from '@/lib/dna/profile';
import { buildPool } from '@/lib/dna/onboarding';
import { enrichPeople, enrichTitles, loadMetaCache, type MetaMap } from '@/lib/dna/meta';
import { mediaKey } from '@/lib/mediaRef';
import { Button, SectionHeader, Tabs } from '@components/ui';
import DnaRadar from '@components/SinemaDna/DnaRadar';
import ComparePair from '@components/SinemaDna/ComparePair';
import DataPrivacyPanel from '@components/SinemaDna/DataPrivacyPanel';
import ImportTmdbPanel from '@components/SinemaDna/ImportTmdbPanel';
import TasteCardShare from '@components/SinemaDna/TasteCardShare';

const PRIVACY_KEY = 'lmdb:dna:privacy';
/** Bu sinyal sayısının altında profil "netleşiyor" der ve girdi davet eder. */
const LOW_DATA_THRESHOLD = 8;

function ConfidencePill({ level }: { level: string }) {
  return (
    <span className="rounded-full border border-line bg-surface-overlay px-2 py-0.5 text-xs text-secondary">
      güven: {level}
    </span>
  );
}

function DimensionCard({
  title,
  evidenceText,
  confidence,
  children,
}: {
  title: string;
  evidenceText: string;
  confidence: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface-raised p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{evidenceText}</span>
          <ConfidencePill level={confidence} />
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bar({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <li className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-primary">{label}</span>
        <span className="text-muted">%{Math.round(value * 100)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </li>
  );
}

export default function SinemaDna() {
  const { user, isAuthenticated } = useAuth();
  const accountId = isAuthenticated && user ? user.id : null;
  const events = useInteractions(accountId);
  const [tab, setTab] = useState<'profil' | 'karsilastir' | 'veri'>('profil');
  const [meta, setMeta] = useState<MetaMap>(() => loadMetaCache());
  const metaRef = useRef<MetaMap>(meta);
  metaRef.current = meta;
  const [privacyOn, setPrivacyOn] = useState(() => {
    try {
      return localStorage.getItem(PRIVACY_KEY) === '1';
    } catch {
      return false;
    }
  });
  const mergedFor = useRef<number | null>(null);

  // Anonim → hesap birleşimi (SHARED_CONTRACTS §A): oturum başına bir kez,
  // ekleme biçiminde — yerel kapsam asla sessizce silinmez.
  useEffect(() => {
    if (accountId && mergedFor.current !== accountId) {
      mergedFor.current = accountId;
      mergeLocalIntoAccount(accountId);
    }
  }, [accountId]);

  // Popüler havuz (BFF üzerinden) — onboarding karşılaştırmaları için.
  const { data: popularMovies } = useGetPopularMoviesQuery(1);
  const { data: popularTvs } = useGetPopularTVShowsQuery(1);
  const pool = useMemo(
    () => buildPool(popularMovies?.results ?? [], popularTvs?.results ?? []),
    [popularMovies, popularTvs],
  );

  // Üst-veri zenginleştirme: önce önbellek, eksikler BFF'den (sınırlı sayıda).
  useEffect(() => {
    let cancelled = false;
    const targets = events
      .filter((e) => e.target.kind === 'movie' || e.target.kind === 'tv')
      .map((e) => e.target);
    const distinct = [...new Map(targets.map((r) => [mediaKey(r), r])).values()];
    enrichTitles(distinct, metaRef.current).then((m) => {
      if (!cancelled && m !== metaRef.current) setMeta(m);
    });
    return () => {
      cancelled = true;
    };
    // meta bilinçli olarak bağımlılık değil: yalnız yeni olaylar tetikler.
  }, [events]);

  // Kadro verisi: en güçlü olumlu başlıklar için (kişi meyilleri).
  const positiveKeys = useMemo(() => {
    const scores = new Map<string, number>();
    for (const e of events) {
      if (e.kind === 'like') scores.set(mediaKey(e.target), (scores.get(mediaKey(e.target)) ?? 0) + 1);
      if (e.kind === 'comparison_win') scores.set(mediaKey(e.target), (scores.get(mediaKey(e.target)) ?? 0) + 1);
      if (e.kind === 'rating' && (e.value ?? 0) >= 8) scores.set(mediaKey(e.target), (scores.get(mediaKey(e.target)) ?? 0) + 1);
    }
    return scores;
  }, [events]);

  useEffect(() => {
    let cancelled = false;
    const targets = [...positiveKeys.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => {
        const [kind, id] = key.split(':');
        return { kind: kind as 'movie' | 'tv', id: Number(id) };
      })
      .filter((r) => metaRef.current[mediaKey(r)] && !metaRef.current[mediaKey(r)].people);
    if (!targets.length) return;
    enrichPeople(targets, metaRef.current).then((m) => {
      if (!cancelled && m !== metaRef.current) setMeta(m);
    });
    return () => {
      cancelled = true;
    };
    // meta bilinçli olarak bağımlılık değil: yalnız yeni olumlu sinyaller tetikler
    // (başarısız kadro isteği sonsuz döngüye girmez).
  }, [positiveKeys]);

  const profile = useMemo(() => deriveDnaProfile(events, meta), [events, meta]);

  const togglePrivacy = () => {
    setPrivacyOn((v) => {
      const next = !v;
      try {
        localStorage.setItem(PRIVACY_KEY, next ? '1' : '0');
      } catch {
        /* kalıcı olmayabilir — yalnızca görünüm tercihi */
      }
      return next;
    });
  };

  const lowData = profile.signalCount < LOW_DATA_THRESHOLD;
  const topEra = profile.eraDims.filter((d) => d.evidenceCount > 0);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader as="h1" title="Sinema DNA" eyebrow="LMDB Deneyimleri" />
      <p className="mt-4 max-w-2xl text-secondary">
        Zevkin burada etiketlerden okunmaz; izler bıraktığın izlerden ölçülür. Beğeni,
        olumsuz, puan ve karşılaştırmaların tür, dönem, süre ve isim meyillerine dönüşür —
        her skorun yanında kanıtı yazılıdır. Her şey bu tarayıcıda tutulur, tek tıkla
        geri alınır; kişilik yorumu yapılmaz.
      </p>

      {lowData && tab !== 'karsilastir' && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-surface-raised p-4" role="status" data-testid="dna-lowdata">
          <p className="text-sm text-secondary">
            Profil netleşiyor: {profile.signalCount} sinyal var. Birkaç hızlı karşılaştırma
            resmi belirginleştirir.
          </p>
          <Button variant="primary" size="sm" onClick={() => setTab('karsilastir')}>
            Karşılaştırmaya başla
          </Button>
        </div>
      )}

      <div className="relative mt-8">
        {privacyOn && tab !== 'veri' && (
          <button
            type="button"
            onClick={togglePrivacy}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-void/80 backdrop-blur-sm"
            aria-label="Profil gizli — göstermek için tıkla"
            data-testid="dna-privacy-veil"
          >
            <span className="font-display text-lg text-primary">Profil gizli</span>
            <span className="text-sm text-secondary">Göstermek için tıkla</span>
          </button>
        )}
        <Tabs
          tabs={[
            { id: 'profil', label: 'Profil' },
            { id: 'karsilastir', label: 'Karşılaştır' },
            { id: 'veri', label: 'Veri & Gizlilik' },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as typeof tab)}
          aria-label="Sinema DNA bölümleri"
        >
          <div className="pt-8">
            {tab === 'profil' && (
              <div className="space-y-6">
                <DimensionCard
                  title="Tür meyilleri"
                  evidenceText={profile.overallEvidenceText}
                  confidence={profile.overallConfidence}
                >
                  <DnaRadar dims={profile.genreDims} />
                </DimensionCard>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <DimensionCard
                    title="Dönem"
                    evidenceText={topEra.length ? topEra[0].evidenceText : 'henüz kanıt yok'}
                    confidence={topEra.length ? topEra.reduce((a, d) => (d.evidenceCount > a.evidenceCount ? d : a)).confidence : 'yok'}
                  >
                    {topEra.length ? (
                      <ul className="space-y-3">
                        {topEra.slice(0, 5).map((d) => (
                          <Bar key={d.key} label={d.label} value={d.affinity} note={d.evidenceText} />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-secondary">Yıl bilgisi olan başlıklar geldikçe dönem eğilimi belirir.</p>
                    )}
                  </DimensionCard>

                  <DimensionCard
                    title="Süre eğilimi"
                    evidenceText={profile.runtime.count ? `${profile.runtime.count} başlıkta süre verisi` : 'henüz kanıt yok'}
                    confidence={profile.runtime.confidence}
                  >
                    {profile.runtime.mean ? (
                      <div>
                        <p className="text-2xl font-semibold text-primary">
                          {profile.runtime.mean} dk{' '}
                          <span className="text-sm font-normal text-secondary">
                            ortalama — {profile.runtime.tendency} film eğilimi
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-muted">
                          Beğendiklerinin ağırlıklı ortalaması; kısa/orta/uzun eşikleri 95 ve 140 dk.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-secondary">Süre verisi olan başlıklar beğenildikçe bu eğilim hesaplanır.</p>
                    )}
                  </DimensionCard>

                  <DimensionCard
                    title="Puan verme davranışı"
                    evidenceText={profile.ratingBehavior.count ? `${profile.ratingBehavior.count} puan` : 'henüz kanıt yok'}
                    confidence={profile.ratingBehavior.confidence}
                  >
                    {profile.ratingBehavior.mean ? (
                      <div>
                        <p className="text-2xl font-semibold text-primary">
                          {profile.ratingBehavior.mean}
                          <span className="text-sm font-normal text-secondary"> / 10 verdiğin ortalama</span>
                        </p>
                        {profile.ratingBehavior.vsTmdb !== null && (
                          <p className="mt-2 text-xs text-muted">
                            TMDB ortalamalarına göre{' '}
                            {profile.ratingBehavior.vsTmdb >= 0
                              ? `${profile.ratingBehavior.vsTmdb} puan cömert`
                              : `${Math.abs(profile.ratingBehavior.vsTmdb)} puan katı`}{' '}
                            puan veriyorsun.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-secondary">Puan verdikçe nasıl bir puanlayıcı olduğun belirir.</p>
                    )}
                  </DimensionCard>

                  <DimensionCard
                    title="En çok dönen isimler"
                    evidenceText={profile.people.length ? profile.people[0].evidenceText : 'henüz kanıt yok'}
                    confidence={profile.people.length ? confidenceOf(profile.people[0].evidenceCount) : 'yok'}
                  >
                    {profile.people.length ? (
                      <ul className="space-y-2">
                        {profile.people.map((p) => (
                          <li key={`${p.role}-${p.id}`} className="flex items-baseline justify-between gap-2 text-sm">
                            <a
                              href={`/person/${p.id}`}
                              className="font-medium text-primary underline-offset-4 hover:text-accent hover:underline"
                            >
                              {p.name}
                            </a>
                            <span className="text-xs text-muted">
                              {p.role === 'director' ? 'yönetmen' : 'oyuncu'} · {p.evidenceText}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-secondary">
                        Beğendiklerinin kadro verileri yüklendikçe sık görünen isimler listelenir.
                      </p>
                    )}
                  </DimensionCard>
                </div>

                <TasteCardShare profile={profile} />
              </div>
            )}

            {tab === 'karsilastir' && (
              <div className="mx-auto max-w-3xl">
                <p className="mb-4 text-sm text-muted">
                  Yapılan karşılaştırma: {profile.counts.comparisons} · Havuz: {pool.length} popüler başlık.
                </p>
                <ComparePair pool={pool} events={events} accountId={accountId} />
              </div>
            )}

            {tab === 'veri' && (
              <div className="max-w-3xl space-y-6">
                <DataPrivacyPanel
                  events={events}
                  accountId={accountId}
                  accountName={user?.username ?? user?.name ?? null}
                  profile={profile}
                  privacyOn={privacyOn}
                  onTogglePrivacy={togglePrivacy}
                />
                <ImportTmdbPanel accountId={accountId} />
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </section>
  );
}
