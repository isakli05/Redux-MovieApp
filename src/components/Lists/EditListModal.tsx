/**
 * EditListModal — liste üst verisi (ad/açıklama) düzenleme diyaloğu.
 * Mutasyon BFF üzerinden: POST /api/lists/:id/update (user.api.ts updateList).
 */

import { Fragment, useEffect, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Button } from '../ui';
import { useUpdateListMutation, type ListDetail } from '../../api';

export interface EditListModalProps {
  isOpen: boolean;
  list: ListDetail | undefined;
  onClose: () => void;
  onSuccess?: () => void;
}

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface-overlay px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export const EditListModal = ({ isOpen, list, onClose, onSuccess }: EditListModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [updateList, { isLoading }] = useUpdateListMutation();

  useEffect(() => {
    if (isOpen && list) {
      setName(list.name);
      setDescription(list.description ?? '');
      setErrorMessage(null);
    }
  }, [isOpen, list]);

  const handleClose = () => {
    if (isLoading) return;
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || isLoading) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setErrorMessage(null);
    try {
      await updateList({
        listId: list.id,
        name: trimmed,
        description: description.trim(),
      }).unwrap();
      onClose();
      onSuccess?.();
    } catch {
      setErrorMessage('Liste güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-[80]">
        <TransitionChild
          as={Fragment}
          enter="transition ease-cine duration-150"
          enterFrom="transform opacity-0"
          enterTo="transform opacity-100"
          leave="transition ease-cine duration-150"
          leaveFrom="transform opacity-100"
          leaveTo="transform opacity-0"
        >
          <div className="fixed inset-0 bg-surface-void/80 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="transition ease-cine duration-150"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-cine duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-xl border border-line bg-surface-raised p-6 shadow-cine focus:outline-none">
              <h2 className="font-display text-lg font-semibold text-primary">Listeyi Düzenle</h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <div>
                  <label htmlFor="edit-list-name" className="mb-1.5 block text-sm font-medium text-secondary">
                    Liste Adı
                  </label>
                  <input
                    id="edit-list-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLASS}
                    maxLength={200}
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-list-description"
                    className="mb-1.5 block text-sm font-medium text-secondary"
                  >
                    Açıklama
                  </label>
                  <textarea
                    id="edit-list-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={INPUT_CLASS}
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                {errorMessage && (
                  <p role="alert" className="text-sm text-danger">
                    {errorMessage}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
                    Vazgeç
                  </Button>
                  <Button type="submit" size="sm" loading={isLoading} disabled={!name.trim()}>
                    Kaydet
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
