/**
 * ConfirmDialog — koyu tema, kit uyumlu onay diyaloğu (Headless UI).
 * Headless UI Dialog odak tuzağı, Escape ve scroll kilidini sağlar.
 * Liste silme gibi yıkıcı işlemler için window.confirm yerine kullanılır.
 */

import { Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Yıkıcı işlem görselliği (tehlike butonu). */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={loading ? () => undefined : onCancel} className="relative z-[80]">
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
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    danger ? 'border-danger/40 text-danger' : 'border-line-strong text-secondary'
                  }`}
                  aria-hidden="true"
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{message}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  loading={loading}
                  onClick={onConfirm}
                  className={
                    danger
                      ? 'bg-danger text-[#1A0A0A] hover:bg-danger/90'
                      : undefined
                  }
                >
                  {confirmLabel}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
