"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Plus,
  ShoppingCart,
  Truck,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DOCUMENT_LABELS,
  DOCUMENT_TYPES,
  documentNewPathWithProject,
  type DocumentType,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  devis: FileText,
  bon_commande: ShoppingCart,
  bon_livraison: Truck,
  facture: FileText,
  bon_retour: Undo2,
};

type Props = {
  projectId?: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function NewDocumentMenu({
  projectId,
  label = "New document",
  variant = "default",
  size = "default",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" />
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition", open && "rotate-180")} />
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/[0.08] bg-white py-1 shadow-xl">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Document type
            </p>
            <ul>
              {DOCUMENT_TYPES.map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <li key={type}>
                    <Link
                      href={documentNewPathWithProject(type, projectId)}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition hover:bg-black/[0.04]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
                      {DOCUMENT_LABELS[type]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
