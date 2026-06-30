"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CachetImage } from "@/components/documents/preview/CachetImage";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { processCachetImage } from "@/lib/process-cachet-image";
import { cn } from "@/lib/utils";

type Props = {
  cachetUrl?: string;
  onUploaded: (storageId: Id<"_storage">, previewUrl: string) => void;
  onRemoved: () => void;
  disabled?: boolean;
};

const MAX_INPUT_BYTES = 5 * 1024 * 1024;

const CHECKER_BG =
  "bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0px]";

export function CachetUpload({ cachetUrl, onUploaded, onRemoved, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [busy, setBusy] = useState<"idle" | "processing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  async function uploadBlob(blob: Blob) {
    setBusy("uploading");
    const uploadUrl = await generateUploadUrl({});
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: blob,
    });
    if (!res.ok) throw new Error("Échec de l'envoi");
    const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
    const previewUrl = URL.createObjectURL(blob);
    onUploaded(storageId, previewUrl);
  }

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choisissez une image (PNG, JPG…).");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("Image trop lourde (max 5 Mo).");
      return;
    }

    setBusy("processing");
    try {
      const { blob } = await processCachetImage(file);
      await uploadBlob(blob);
    } catch {
      setError("Impossible de traiter ou d'envoyer le cachet. Réessayez.");
    } finally {
      setBusy("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function reprocessExisting() {
    if (!cachetUrl) return;
    setError(null);
    setBusy("processing");
    try {
      const res = await fetch(cachetUrl);
      if (!res.ok) throw new Error("fetch failed");
      const raw = await res.blob();
      const file = new File([raw], "cachet.png", { type: raw.type || "image/png" });
      const { blob } = await processCachetImage(file);
      await uploadBlob(blob);
    } catch {
      setError("Impossible de retravailler le cachet. Téléversez-le à nouveau.");
    } finally {
      setBusy("idle");
    }
  }

  const busyLabel =
    busy === "processing" ? "Détourage…" : busy === "uploading" ? "Envoi…" : null;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex min-h-[100px] items-center gap-4 rounded-xl border-2 border-dashed border-black/[0.08] bg-[#FAFBFC] p-4",
          disabled && "opacity-60",
        )}
      >
        <div
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/[0.06]",
            CHECKER_BG,
          )}
        >
          {cachetUrl ? (
            <CachetImage src={cachetUrl} className="max-h-14 max-w-14" />
          ) : (
            <span className="rounded bg-white/80 px-1 text-[10px] font-medium text-[#9CA3AF]">
              Cachet
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-ink">Cachet entreprise</p>
          <p className="text-[11px] leading-relaxed text-[#6B7280]">
            Photo ou scan acceptés — le fond blanc est retiré automatiquement. Ajoutez le cachet
            document par document via le bouton « Ajouter cachet » sur chaque devis ou facture.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || busy !== "idle"}
              onClick={() => inputRef.current?.click()}
            >
              {busyLabel ?? (cachetUrl ? "Remplacer" : "Téléverser")}
            </Button>
            {cachetUrl ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled || busy !== "idle"}
                  onClick={() => void reprocessExisting()}
                >
                  Retraiter le fond
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || busy !== "idle"}
                  onClick={() => setConfirmRemoveOpen(true)}
                >
                  Supprimer
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ConfirmDeleteDialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        title="Retirer le cachet ?"
        description="Le cachet sera retiré du modèle société après enregistrement des paramètres."
        confirmLabel="Retirer"
        onConfirm={() => {
          onRemoved();
          setConfirmRemoveOpen(false);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
