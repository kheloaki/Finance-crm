import type { CSSProperties, ReactNode } from "react";
import type { LineItem } from "@/lib/documents";
import { themeCssVars } from "@/lib/document-theme";
import { cn } from "@/lib/utils";
import { buildSellerFooterLines } from "@/lib/seller-footer";
import { DocumentCachetZone } from "./CachetImage";
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
        className="relative flex w-full flex-col bg-white text-[#1e293b]"
        style={{
          fontSize: "clamp(9px, 1.8vw, 11px)",
          ...themeCssVars(ctx.theme),
        }}
      >
        {children}
      </article>
    );
  }

  return (
    <div className="rounded-lg bg-[#e8eaed] p-3 shadow-inner">
      <article
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
  return (
    <>
      {lines.length === 0 ? (
        ctx.previewMode ? (
          <p className="text-[0.75em] italic text-slate-300">Pied de page — Modèle société</p>
        ) : null
      ) : (
        lines.map((l) => (
          <p key={l} className="text-[0.75em] leading-relaxed break-words uppercase">
            {l}
          </p>
        ))
      )}
    </>
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
    : [
        { k: "Total HT", v: ctx.totalHt },
        { k: "TVA", v: ctx.vatAmount },
        { k: "Net HT", v: ctx.netHt, highlight: true },
      ];
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-lg",
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
  if (ctx.logoUrl) {
    return (
      <TrimmedLogoImage
        src={ctx.logoUrl}
        className={cn("h-24 w-auto max-w-[220px] shrink-0 object-contain", className)}
        style={style}
      />
    );
  }
  if (!ctx.sellerName?.trim()) return null;
  return (
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
}

export type { LineItem };
