"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { cn } from "@/lib/utils";

type Props = {
  logoUrl?: string;
  logoStorageId?: Id<"_storage">;
  onUploaded: (storageId: Id<"_storage">, previewUrl: string) => void;
  onRemoved: () => void;
  disabled?: boolean;
};

const MAX_BYTES = 2 * 1024 * 1024;

export function LogoUpload({ logoUrl, onUploaded, onRemoved, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choisissez une image (PNG, JPG, SVG…).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop lourde (max 2 Mo).");
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Échec de l'envoi");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const previewUrl = URL.createObjectURL(file);
      onUploaded(storageId, previewUrl);
    } catch {
      setError("Impossible d'envoyer le logo. Réessayez.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex min-h-[100px] items-center gap-4 rounded-xl border-2 border-dashed border-black/[0.08] bg-[#FAFBFC] p-4",
          disabled && "opacity-60",
        )}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/[0.06] bg-white">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-1" />
          ) : (
            <span className="text-[10px] font-medium text-[#9CA3AF]">Logo</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-ink">Logo entreprise</p>
          <p className="text-[11px] text-[#6B7280]">PNG, JPG ou SVG · max 2 Mo · affiché sur vos documents</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Envoi…" : logoUrl ? "Remplacer" : "Téléverser"}
            </Button>
            {logoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => setConfirmRemoveOpen(true)}
              >
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ConfirmDeleteDialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        title="Retirer le logo ?"
        description="Le logo sera retiré du modèle société après enregistrement des paramètres."
        confirmLabel="Retirer"
        onConfirm={() => {
          onRemoved();
          setConfirmRemoveOpen(false);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
