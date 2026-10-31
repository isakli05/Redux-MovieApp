/**
 * UserLists — kullanıcının listeleri (koyu tema, Cinematic Atlas kit).
 *
 * Wave 4 rewiring: veriler BFF'den (GET /api/lists?accountId=&page=), silme
 * mutasyonu BFF üzerinden (DELETE /api/lists/:id?confirm=true). Tüm mutasyon
 * durumları pending/success/error ile yönetilir (defect J); başarılı işlem
 * sonrası sayfa yenileme YOK — RTK Query tag invalidation listeyi tazeler.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, EmptyState, ErrorState, Skeleton } from '../ui';
import { PaginationNav } from '../Discover/PaginationNav';
import { getImageUrl } from '@utils/image.utils';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteListMutation, useGetUserListsQuery, type AccountListSummary } from '../../api';
import { CreateListModal } from './CreateListModal';
import { ConfirmDialog } from './ConfirmDialog';

function ListCard({
  list,
  onDeleteRequest,
}: {
  list: AccountListSummary;
  onDeleteRequest: (list: AccountListSummary) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface-base transition-colors duration-150 ease-cine hover:border-accent">
      <Link
        to={`/lists/${list.id}`}
        className="block aspect-[2/1] overflow-hidden border-b border-line bg-surface-overlay"
        aria-label={`${list.name} listesini görüntüle`}
      >
        {list.poster_path ? (
          <img
            src={getImageUrl(list.poster_path, 'w342')}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-opacity duration-250 group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-3xl text-muted">{list.name.charAt(0).toLocaleUpperCase('tr-TR')}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-primary" title={list.name}>
            <Link to={`/lists/${list.id}`} className="transition-colors hover:text-accent">
              {list.name}
            </Link>
          </h3>
          <button
            type="button"
            onClick={() => onDeleteRequest(list)}
            aria-label={`${list.name} listesini sil`}
            title="Listeyi Sil"
            className="rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-surface-overlay hover:text-danger"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {list.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-secondary">{list.description}</p>
        ) : (
          <p className="line-clamp-2 text-sm text-muted">Açıklama yok</p>
        )}

        <p className="mt-auto text-xs text-muted">
          <span className="tabular-nums text-secondary">{list.item_count}</span> film
        </p>
      </div>
    </article>
  );
}

export const UserLists = () => {
  const { user, isAuthenticated, bootstrapped, login } = useAuth();
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AccountListSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: listsData,
    isLoading,
    error,
    refetch,
  } = useGetUserListsQuery(
    { accountId: user?.id ?? 0, page },
    { skip: !isAuthenticated || typeof user?.id !== 'number' },
  );
  const [deleteList, { isLoading: isDeleting }] = useDeleteListMutation();

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await deleteList(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch {
      setDeleteError('Liste silinemedi. Lütfen tekrar deneyin.');
    }
  };

  // Oturum kontroli sürerken iskelet göster; kesinleşince giriş çağrısı yap.
  if (!bootstrapped) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="card" className="h-64" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Giriş yapmanız gerekiyor"
        hint="Listelerinizi oluşturmak ve yönetmek için TMDB hesabınızla giriş yapın."
        action={
          <Button size="lg" onClick={() => void login()}>
            TMDB ile Giriş Yap
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="card" className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Listeler yüklenemedi"
        message="TMDB listelerinize ulaşılamadı. Lütfen tekrar deneyin."
        onRetry={() => void refetch()}
        retryLabel="Tekrar Dene"
      />
    );
  }

  const lists = listsData?.results ?? [];
  const totalPages = listsData?.total_pages ?? 1;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-accent">TMDB hesabı</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-primary">Listelerim</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Yeni Liste
        </Button>
      </div>

      {deleteError && (
        <p role="alert" className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {deleteError}
        </p>
      )}

      {lists.length === 0 ? (
        <EmptyState
          title="Henüz liste oluşturmadınız"
          hint="Favori filmlerinizi organize etmek için ilk listenizi oluşturun. TMDB v3 listeleri yalnızca film destekler."
          action={
            <Button onClick={() => setIsCreateModalOpen(true)}>İlk Listenizi Oluşturun</Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} onDeleteRequest={setPendingDelete} />
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationNav
              page={page}
              totalPages={Math.min(totalPages, 500)}
              onPageChange={(next) => {
                setPage(next);
                window.scrollTo({ top: 0 });
              }}
              className="mt-10 justify-center"
            />
          )}
        </>
      )}

      <CreateListModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Listeyi sil"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” listesi ve içindeki ${pendingDelete.item_count} film kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Evet, Sil"
        danger
        loading={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
};
