"use client";

import { Button } from "@/components/ui/button";

export type UnsavedChangesDialogProps = {
  open: boolean;
  isNew: boolean;
  pending?: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
};

export function UnsavedChangesDialog({
  open,
  isNew,
  pending,
  onClose,
  onSave,
  onDiscard,
}: UnsavedChangesDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        className="relative w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-4 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="unsaved-changes-title" className="text-base font-semibold text-ink">
          Modifications non enregistrées
        </h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          {isNew
            ? "Enregistrez le document avant de quitter, ou abandonnez vos modifications."
            : "Enregistrez vos changements ou quittez en conservant la dernière version enregistrée (brouillon)."}
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Continuer l&apos;édition
          </Button>
          <Button type="button" variant="outline" onClick={onDiscard} disabled={pending}>
            {isNew ? "Quitter sans enregistrer" : "Garder le brouillon"}
          </Button>
          <Button type="button" onClick={() => void onSave()} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
