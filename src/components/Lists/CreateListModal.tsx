/**
 * CreateListModal — koyu tema, kit uyumlu liste oluşturma diyaloğu.
 * Mutasyon BFF üzerinden: POST /api/lists (user.api.ts createList).
 * Başarıda Lists tag'i invalidate edilir; window.location.reload YOK (defect J).
 */

import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Button } from '../ui';
import { useCreateListMutation } from '../../api';

export interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-surface-overlay px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export const CreateListModal = ({ isOpen, onClose, onSuccess }: CreateListModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [createList, { isLoading }] = useCreateListMutation();

  const reset = () => {
    setName('');
    setDescription('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isLoading) return;
    setErrorMessage(null);
    try {
      await createList({ name: trimmed, description: description.trim() }).unwrap();
      reset();
      onClose();
      onSuccess?.();
    } catch {
      setErrorMessage('Liste oluşturulamadı. Lütfen tekrar deneyin.');
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
              <h2 className="font-display text-lg font-semibold text-primary">Yeni Liste Oluştur</h2>
              <p className="mt-1 text-xs text-muted">
                TMDB v3 listeleri yalnızca film destekler.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <div>
                  <label htmlFor="list-name" className="mb-1.5 block text-sm font-medium text-secondary">
                    Liste Adı
                  </label>
                  <input
                    id="list-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Örn: Favori Filmlerim"
                    maxLength={200}
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="list-description"
                    className="mb-1.5 block text-sm font-medium text-secondary"
                  >
                    Açıklama
                  </label>
                  <textarea
                    id="list-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="Bu liste hakkında kısa bir açıklama…"
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
                    Liste Oluştur
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
