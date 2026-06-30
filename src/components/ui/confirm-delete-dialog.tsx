"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const DELETE_CONFIRM_WORD = "DELETE";

export type ConfirmDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  /** Persistent data removal — user must type DELETE */
  requireTypedConfirm?: boolean;
  confirmLabel?: string;
  pending?: boolean;
};

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  requireTypedConfirm = false,
  confirmLabel = "Supprimer",
  pending = false,
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  if (!open) return null;

  const canConfirm = !requireTypedConfirm || typed === DELETE_CONFIRM_WORD;

  async function handleConfirm() {
    if (!canConfirm || pending) return;
    await onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-5 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="confirm-delete-title" className="text-base font-semibold text-ink">
              {title}
            </h2>
            <p id="confirm-delete-desc" className="mt-2 text-sm text-[#6B7280]">
              {description}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {requireTypedConfirm ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-delete-input">
              Tapez <span className="font-mono font-semibold text-ink">{DELETE_CONFIRM_WORD}</span>{" "}
              pour confirmer
            </Label>
            <Input
              id="confirm-delete-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={DELETE_CONFIRM_WORD}
              autoComplete="off"
              autoFocus
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) void handleConfirm();
              }}
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm || pending}
            onClick={() => void handleConfirm()}
          >
            {pending ? "Suppression…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
