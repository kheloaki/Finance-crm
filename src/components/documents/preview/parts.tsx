"use client";

import type { CSSProperties, ReactNode } from "react";
import { Pencil } from "lucide-react";
import type { LineItem } from "@/lib/documents";
import { themeCssVars } from "@/lib/document-theme";
import { cn } from "@/lib/utils";
import { buildSellerFooterLines } from "@/lib/seller-footer";
import { DocumentCachetZone } from "./CachetImage";
import { useDocumentEdit } from "./document-edit-context";
import { TrimmedLogoImage } from "./TrimmedLogoImage";
import type { PreviewContext } from "./types";

/** Line items: natural height, scroll when many rows — no empty stretch. */
export const linesBlockClass = "mb-2 max-h-[40%] shrink-0 overflow-y-auto";
export const linesTableClass = "mb-2 shrink-0";

export function PaperFrame({
  ctx,
  children,
  variant = "preview",
}: {
  ctx: PreviewContext;
  children: ReactNode;
  variant?: "preview" | "editor";
}) {
  if (variant === "editor") {
    return (
      <article
        dir={ctx.rtl ? "rtl" : "ltr"}
        className="relative flex w-full flex-col bg-white text-[#1e293b] [&_.doc-preview-totals]:hidden"
        style={{
          fontSize: "clamp(9px, 1.8vw, 11px)",
          ...themeCssVars(ctx.theme),
        }}
      >
        {children}
        {/* Cachet preview sits under the Afficher/Retirer le cachet control while editing */}
      </article>
    );
  }

  return (
    <div className="rounded-lg bg-[#e8eaed] p-3 shadow-inner">
      <article
        dir={ctx.rtl ? "rtl" : "ltr"}
        className="relative mx-auto flex w-full min-h-0 flex-col overflow-y-auto bg-white text-[#1e293b] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        style={{
          aspectRatio: "210 / 297",
          fontSize: "clamp(7.5px, 2vw, 10px)",
          ...themeCssVars(ctx.theme),
        }}
      >
        {children}
        {/* Cachet is for PDF export — keep design previews clean */}
        {!ctx.previewMode ? <DocumentCachetZone ctx={ctx} /> : null}
      </article>
    </div>
  );
}

export function FooterLegal({ ctx }: { ctx: PreviewContext }) {
  const edit = useDocumentEdit();
  const canEdit = !!edit && !edit.readOnly && !!edit.onOpenBranding;
  const lines = buildSellerFooterLines({
    sellerPhone: ctx.sellerPhone,
    sellerWebsite: ctx.sellerWebsite,
    sellerEmail: ctx.sellerEmail,
    sellerIce: ctx.sellerIce,
    sellerIf: ctx.sellerIf,
    sellerRc: ctx.sellerRc,
    sellerCnss: ctx.sellerCnss,
    sellerAddress: ctx.sellerAddress,
    sellerLegal: ctx.sellerLegal,
    sellerContact: ctx.sellerContact,
  });

  const body =
    lines.length === 0 ? (
      ctx.previewMode || canEdit ? (
        <p className="text-[0.75em] italic text-slate-300">
          {canEdit ? "Cliquer pour compléter le pied de page" : "Pied de page — Modèle société"}
        </p>
      ) : null
    ) : (
      lines.map((l) => (
        <p key={l} className="text-[0.75em] leading-relaxed break-words uppercase">
          {l}
        </p>
      ))
    );

  if (!canEdit || !body) return <>{body}</>;

  return (
    <button
      type="button"
      onClick={() => edit.onOpenBranding?.("footer")}
      className="w-full rounded-md text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500/30"
      title="Modifier le pied de page société"
    >
      {body}
    </button>
  );
}

export function CounterpartyRepLine({ ctx }: { ctx: PreviewContext }) {
  if (!ctx.counterpartyRepresentative?.trim()) return null;
  return (
    <p className="text-[0.8em] text-slate-600">
      Représentée par {ctx.counterpartyRepresentative}
    </p>
  );
}

export function NotesBlock({ ctx, className = "", style }: { ctx: PreviewContext; className?: string; style?: CSSProperties }) {
  if (!ctx.notes?.trim()) return null;
  return (
    <div className={className} style={style}>
      <p className="text-[0.7em] font-bold uppercase tracking-wider text-slate-400">Observations</p>
      <p className="mt-1 whitespace-pre-wrap text-[0.85em] leading-relaxed text-slate-600">
        {ctx.notes}
      </p>
    </div>
  );
}

export function renderProductLines(ctx: PreviewContext) {
  return ctx.lines.filter((l) => !l.isNote && l.designation.trim());
}

export function TotalsBanner({
  ctx,
  style,
  dark = false,
}: {
  ctx: PreviewContext;
  style?: CSSProperties;
  dark?: boolean;
}) {
  if (ctx.deliveryNote) return null;
  const cells = ctx.showTtc
    ? [
        { k: "Total HT", v: ctx.totalHt },
        { k: "TVA", v: ctx.vatAmount },
        { k: "Total TTC", v: ctx.totalTtc },
        { k: "Net à payer", v: ctx.netToPay, highlight: true },
      ]
    : ctx.deposit > 0
      ? [
          { k: "Total HT", v: ctx.netHt },
          { k: "Acompte", v: ctx.deposit },
          { k: "Net à payer", v: ctx.netToPay, highlight: true },
        ]
      : [
          { k: "Total HT", v: ctx.totalHt },
          { k: "TVA", v: ctx.vatAmount },
          { k: "Net HT", v: ctx.netHt, highlight: true },
        ];
  return (
    <div
      className={cn(
        "doc-preview-totals grid gap-px overflow-hidden rounded-lg",
        ctx.showTtc ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
      )}
      style={style}
    >
      {cells.map(({ k, v, highlight }) => (
        <div
          key={k}
          className={`px-2 py-2 text-center ${highlight ? (dark ? "font-bold" : "bg-white/95 font-bold") : dark ? "bg-white/10" : "bg-white/90"}`}
          style={
            highlight && dark
              ? { backgroundColor: "rgba(0,0,0,0.35)", color: ctx.theme.onPrimary }
              : undefined
          }
        >
          <p className="text-[0.65em] uppercase opacity-70">{k}</p>
          <p className={`tabular-nums ${highlight ? "text-[1.1em]" : "text-[0.9em]"}`}>
            {ctx.money(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function LinesSpreadsheet({
  ctx,
  headStyle,
  stripeStyle,
}: {
  ctx: PreviewContext;
  headStyle?: CSSProperties;
  stripeStyle?: CSSProperties;
}) {
  const products = renderProductLines(ctx);
  const head = headStyle ?? { backgroundColor: "var(--doc-primary-dark)", color: "var(--doc-on-primary)" };

  if (ctx.deliveryNote) {
    return (
      <table className="w-full border-collapse text-[0.85em]">
        <thead>
          <tr style={head}>
            <th className="border p-1.5 text-left">Désignation</th>
            <th className="border p-1.5">Unité</th>
            <th className="border p-1.5 text-right">Qté</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={3} className="border p-4 text-center italic text-slate-400">
                Aucune ligne
              </td>
            </tr>
          ) : (
            products.map((line, i) => (
              <tr key={i} style={i % 2 === 1 ? stripeStyle : undefined}>
                <td className="border p-1.5 align-top break-words whitespace-normal leading-snug">
                  {line.designation}
                </td>
                <td className="border p-1.5 align-top text-center">{line.unit}</td>
                <td className="border p-1.5 align-top text-right tabular-nums">{line.qty}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full border-collapse text-[0.8em]">
      <thead>
        <tr style={head}>
          {(ctx.showTtc
            ? ["Désignation", "U", "Qté", "PU HT", "TTC"]
            : ["Désignation", "U", "Qté", "PU HT", "Total HT"]
          ).map((h) => (
            <th key={h} className="border p-1 text-left last:text-right">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.length === 0 ? (
          <tr>
            <td colSpan={5} className="border p-4 text-center italic text-slate-400">
              Aucune ligne
            </td>
          </tr>
        ) : (
            products.map((line, i) => (
              <tr key={i} style={i % 2 === 1 ? stripeStyle : undefined}>
                <td className="border p-1.5 align-top font-medium break-words whitespace-normal leading-snug">
                  {line.designation}
                </td>
                <td className="border p-1.5 align-top text-center">{line.unit}</td>
                <td className="border p-1.5 align-top text-right tabular-nums">{line.qty}</td>
                <td className="border p-1.5 align-top text-right tabular-nums">{ctx.money(line.unitPriceHt)}</td>
                <td className="border p-1.5 align-top text-right font-semibold tabular-nums">
                  {ctx.showTtc
                    ? ctx.money(ctx.lineAmount(line))
                    : ctx.money(line.qty * line.unitPriceHt)}
                </td>
              </tr>
            ))
        )}
      </tbody>
    </table>
  );
}

export function LogoMark({ ctx, className = "", style }: { ctx: PreviewContext; className?: string; style?: CSSProperties }) {
  const edit = useDocumentEdit();
  const canEdit = !!edit && !edit.readOnly && !!edit.onOpenBranding;

  let mark: ReactNode;
  if (ctx.logoUrl) {
    mark = (
      <TrimmedLogoImage
        src={ctx.logoUrl}
        className={cn("h-24 w-auto max-w-[220px] shrink-0 object-contain", className)}
        style={style}
      />
    );
  } else if (canEdit) {
    mark = (
      <div
        className={cn(
          "flex h-14 min-w-[7rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-[0.7em] font-medium text-slate-400",
          className,
        )}
        style={style}
      >
        <span>Logo</span>
        <span className="text-[0.9em] text-teal-600">Ajouter</span>
      </div>
    );
  } else if (ctx.sellerName?.trim()) {
    mark = (
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-xs font-bold",
          className,
        )}
        style={{ backgroundColor: ctx.theme.primary, color: ctx.theme.onPrimary, ...style }}
      >
        {ctx.sellerName.slice(0, 2).toUpperCase()}
      </div>
    );
  } else {
    return null;
  }

  if (!canEdit) return <>{mark}</>;

  return (
    <button
      type="button"
      onClick={() => edit.onOpenBranding?.("logo")}
      className="group relative inline-flex max-w-full items-start rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
      title="Modifier le logo"
    >
      {mark}
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-90 shadow-sm transition group-hover:text-teal-600 group-hover:opacity-100">
        <Pencil className="h-3 w-3" />
      </span>
    </button>
  );
}

/** Clickable company “Émetteur” block — opens société branding. */
export function SellerFromBlock({
  ctx,
  className,
}: {
  ctx: PreviewContext;
  className?: string;
}) {
  const edit = useDocumentEdit();
  const canEdit = !!edit && !edit.readOnly && !!edit.onOpenBranding;

  const content = (
    <>
      <p className="font-semibold text-[#0f172a]">
        {ctx.sellerName?.trim() || (canEdit ? "Qui émet ce document ?" : "—")}
      </p>
      {ctx.sellerActivity ? (
        <p className="mt-0.5 text-[0.9em] text-slate-500">{ctx.sellerActivity}</p>
      ) : canEdit ? (
        <p className="mt-0.5 text-[0.9em] text-slate-400">Activité (optionnel)</p>
      ) : null}
      {ctx.sellerAddress ? (
        <p className="mt-1 whitespace-pre-line text-[0.9em] leading-relaxed text-slate-500">
          {ctx.sellerAddress}
        </p>
      ) : canEdit ? (
        <p className="mt-1 text-[0.9em] text-slate-400">Adresse de la société</p>
      ) : null}
      {canEdit ? (
        <p className="mt-2 inline-flex items-center gap-1 text-[0.78em] font-medium text-teal-600">
          <Pencil className="h-3 w-3" />
          Modifier la société
        </p>
      ) : null}
    </>
  );

  if (!canEdit) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => edit.onOpenBranding?.("seller")}
      className={cn(
        className,
        "w-full text-left outline-none transition hover:border-teal-300 hover:bg-teal-50/40 focus-visible:ring-2 focus-visible:ring-teal-500/30",
      )}
      title="Modifier les informations société"
    >
      {content}
    </button>
  );
}

export type { LineItem };
