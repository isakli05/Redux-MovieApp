/**
 * List detail page (/lists/:id) — Cinematic Atlas spec §6 Lists.
 *
 * - Öğeler film posterleriyle PosterCard grid'inde (v3 listeleri film-only).
 * - Sahibi (oturumlu kullanıcı && created_by eşleşiyor) için: öğe ekle/çıkar,
 *   üst veri düzenleme (EditListModal) ve onay diyaloğuyla silme.
 * - Tüm mutasyonlar BFF üzerinden (user.api.ts) — pending/success/error
 *   durumları yönetilir (defect J); RTK tag invalidation ile otomatik tazelik.
 * - 1 sayfadan fazlaysa PaginationNav ile sayfalama.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, EmptyState, ErrorState, PosterCard, Skeleton } from '../components/ui';
import { PaginationNav } from '../components/Discover/PaginationNav';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../hooks/useAuth';
import {
  useAddListItemMutation,
  useDeleteListMutation,
  useGetListDetailsQuery,
  useRemoveListItemMutation,
  type ListDetailItem,
} from '../api';
import type { MediaSummary } from '../types/mediaSummary';
import { ConfirmDialog } from '../components/Lists/ConfirmDialog';
import { EditListModal } from '../components/Lists/EditListModal';

/** v3 liste öğesini PosterCard'ın MediaSummary sözleşmesine çevir. */
export function toListMediaSummary(item: ListDetailItem): MediaSummary {
  return {
    id: item.id,
    media_type: 'movie',
    title: item.title ?? item.original_title ?? '',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path ?? null,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : undefined,
    vote_count: typeof item.vote_count === 'number' ? item.vote_count : undefined,
    release_date: item.release_date ?? null,
    overview: item.overview,
    popularity: item.popularity,
  };
}

function OwnerPanel({
  onAdd,
  addPending,
  addError,
  addStatus,
}: {
  onAdd: (mediaId: number) => void;
  addPending: boolean;
  addError: string | null;
  addStatus: string | null;
}) {
  const [value, setValue] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(id) && id > 0) {
      onAdd(id);
    }
  };

  return (
    <section
      aria-label="Liste yönetimi"
      className="rounded-xl border border-line bg-surface-base p-5"
    >
      <h2 className="font-display text-lg font-semibold text-primary">Film Ekle</h2>
      <p className="mt-1 text-xs text-muted">
        TMDB v3 listeleri yalnızca film destekler — filmi TMDB kimliği (numarası) ile ekleyin.
      </p>
      <form onSubmit={submit} className="mt-4 flex gap-3" noValidate>
        <label htmlFor="add-media-id" className="sr-only">
          TMDB film kimliği
        </label>
        <input
          id="add-media-id"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Örn: 550"
          className="w-32 rounded-md border border-line bg-surface-overlay px-3 py-2 text-sm tabular-nums text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Button type="submit" size="sm" disabled={addPending || !value.trim()}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          {addPending ? 'Ekleniyor…' : 'Ekle'}
        </Button>
      </form>
      {addError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {addError}
        </p>
      )}
      {addStatus && (
        <p role="status" className="mt-3 text-sm text-success">
          {addStatus}
        </p>
      )}
    </section>
  );
}

export default function ListsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [page, setPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const {
    data: list,
    isLoading,
    error,
    refetch,
  } = useGetListDetailsQuery({ id: id ?? '', page }, { skip: !id });

  const [addListItem, { isLoading: isAdding }] = useAddListItemMutation();
  const [removeListItem] = useRemoveListItemMutation();
  const [deleteList, { isLoading: isDeleting }] = useDeleteListMutation();

  useSEO({
    title: list?.name ?? 'Liste',
    description: list?.description || 'TMDB film listesi.',
  });

  const isOwner = useMemo(
    () => Boolean(isAuthenticated && user && list && list.created_by === user.username),
    [isAuthenticated, user, list],
  );

  const handleAdd = async (mediaId: number) => {
    if (!id) return;
    setAddError(null);
    setAddStatus(null);
    try {
      const result = await addListItem({ listId: id, mediaId }).unwrap();
      // TMDB status_code 8 = “already in the list”.
      setAddStatus(
        result.status_code === 8 ? 'Bu film listede zaten var.' : 'Film listeye eklendi.',
      );
    } catch (err) {
      // BFF error shape: { status, data: { error: { code, status_code? } } }
      const bffError = (err as { data?: { error?: { status_code?: number } } })?.data?.error;
      setAddError(
        bffError?.status_code === 8
          ? 'Bu film listede zaten var.'
          : 'Film eklenemedi. Kimliği kontrol edip tekrar deneyin.',
      );
    }
  };

  const handleRemove = async (mediaId: number) => {
    if (!id) return;
    try {
      await removeListItem({ listId: id, mediaId }).unwrap();
    } catch {
      // RTK Query, listeyi optik olarak tazeler; hata durumunda refetch yap.
      void refetch();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleteError(null);
    try {
      await deleteList(id).unwrap();
      navigate('/lists', { replace: true });
    } catch {
      setDeleteError('Liste silinemedi. Lütfen tekrar deneyin.');
    }
  };

  if (!id) {
    return (
      <ErrorState
        title="Liste bulunamadı"
        message="Geçersiz liste adresi."
        backTo="/lists"
        backLabel="Listelere Dön"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <Skeleton variant="line" className="mb-4 h-9 w-64" />
        <Skeleton variant="line" className="mb-10 h-5 w-96 max-w-full" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="poster" className="aspect-[2/3] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Liste yüklenemedi"
          message="Liste bulunamadı veya erişilemiyor. Lütfen tekrar deneyin."
          onRetry={() => void refetch()}
          retryLabel="Tekrar Dene"
          backTo="/lists"
          backLabel="Listelere Dön"
        />
      </div>
    );
  }

  const items = list.items ?? [];
  const totalPages = list.total_pages && list.total_pages > 1 ? Math.min(list.total_pages, 500) : 1;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      {/* Başlık bandı */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.08em] text-accent">
            <Link to="/lists" className="transition-colors hover:text-accent-hover">
              Listelerim
            </Link>
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold break-words text-primary md:text-4xl">
            {list.name}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            <span className="tabular-nums">{list.item_count}</span> film · Oluşturan:{' '}
            <span className="text-primary">{list.created_by}</span>
          </p>
          {list.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary">{list.description}</p>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="border-danger/40 text-danger hover:border-danger hover:text-danger"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Listeyi Sil
            </Button>
          </div>
        )}
      </header>

      {deleteError && (
        <p role="alert" className="mb-6 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {deleteError}
        </p>
      )}

      {isOwner && (
        <div className="mb-10">
          <OwnerPanel
            onAdd={(mediaId) => void handleAdd(mediaId)}
            addPending={isAdding}
            addError={addError}
            addStatus={addStatus}
          />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Bu liste henüz boş"
          hint={
            isOwner
              ? 'Filmleri TMDB kimlikleriyle ekleyerek listenizi oluşturmaya başlayın.'
              : 'Bu listenin sahibi henüz film eklemedi.'
          }
          action={
            <Button variant="ghost" size="sm" to="/kesfet">
              Film Keşfet
            </Button>
          }
        />
      ) : (
        <>
          <div
            role="list"
            className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {items.map((item) => (
              <div key={item.id} role="listitem" className="group/item relative">
                <PosterCard item={toListMediaSummary(item)} showMediaType={false} />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.id)}
                    aria-label={`${item.title ?? item.original_title ?? item.id} filmini listeden çıkar`}
                    title="Listeden Çıkar"
                    className="absolute right-2 top-2 z-10 rounded-full border border-line bg-surface-void/80 p-1.5 text-secondary opacity-0 backdrop-blur-sm transition-all duration-150 focus-visible:opacity-100 group-hover/item:opacity-100 hover:border-danger hover:text-danger"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationNav
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => {
                setPage(next);
                window.scrollTo({ top: 0 });
              }}
              className="mt-12 justify-center"
            />
          )}
        </>
      )}

      <EditListModal isOpen={isEditOpen} list={list} onClose={() => setIsEditOpen(false)} />

      <ConfirmDialog
        open={isDeleteOpen}
        title="Listeyi sil"
        message={`“${list.name}” listesi ve içindeki ${list.item_count} film kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        danger
        loading={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
