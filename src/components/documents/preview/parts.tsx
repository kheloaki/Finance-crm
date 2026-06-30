import type { CSSProperties, ReactNode } from "react";
import type { LineItem } from "@/lib/documents";
import { themeCssVars } from "@/lib/document-theme";
import { cn } from "@/lib/utils";
import { buildSellerFooterLines } from "@/lib/seller-footer";
import { DocumentCachetZone } from "./CachetImage";
import type { PreviewContext } from "./types";

/** Line items: natural height, scroll when many rows — no empty stretch. */
export const linesBlockClass = "mb-2 max-h-[40%] shrink-0 overflow-y-auto";
export const linesTableClass = "mb-2 shrink-0 overflow-hidden";

export function PaperFrame({ ctx, children }: { ctx: PreviewContext; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-[#e8eaed] p-3 shadow-inner">
      <article
        className="relative mx-auto flex w-full flex-col overflow-hidden bg-white text-[#1e293b] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        style={{
          aspectRatio: "210 / 297",
          fontSize: "clamp(7.5px, 2vw, 10px)",
          ...themeCssVars(ctx.theme),
        }}
      >
        {children}
        <DocumentCachetZone ctx={ctx} />
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
        <p className="text-[0.75em] italic text-slate-300">Pied de page — Modèle société</p>
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
  return (
    <div
      className="grid grid-cols-2 gap-px overflow-hidden rounded-lg sm:grid-cols-4"
      style={style}
    >
      {[
        { k: "Total HT", v: ctx.totalHt },
        { k: "TVA", v: ctx.vatAmount },
        { k: "Total TTC", v: ctx.totalTtc },
        { k: "Net à payer", v: ctx.netToPay, highlight: true },
      ].map(({ k, v, highlight }) => (
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
                <td className="border p-1.5">{line.designation}</td>
                <td className="border p-1.5 text-center">{line.unit}</td>
                <td className="border p-1.5 text-right tabular-nums">{line.qty}</td>
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
          {["Réf.", "Désignation", "U", "Qté", "PU HT", "TTC"].map((h) => (
            <th key={h} className="border p-1 text-left last:text-right">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.length === 0 ? (
          <tr>
            <td colSpan={6} className="border p-4 text-center italic text-slate-400">
              Aucune ligne
            </td>
          </tr>
        ) : (
          products.map((line, i) => (
            <tr key={i} style={i % 2 === 1 ? stripeStyle : undefined}>
              <td className="border p-1 text-slate-500">{line.reference || "—"}</td>
              <td className="border p-1 font-medium">{line.designation}</td>
              <td className="border p-1 text-center">{line.unit}</td>
              <td className="border p-1 text-right tabular-nums">{line.qty}</td>
              <td className="border p-1 text-right tabular-nums">{ctx.money(line.unitPriceHt)}</td>
              <td className="border p-1 text-right font-semibold tabular-nums">
                {ctx.money(ctx.lineTtc(line))}
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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ctx.logoUrl}
        alt=""
        className={cn("h-8 w-auto max-w-[72px] shrink-0 object-contain", className)}
        style={style}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold",
        className,
      )}
      style={{ backgroundColor: ctx.theme.primary, color: ctx.theme.onPrimary, ...style }}
    >
      {ctx.sellerName.slice(0, 2).toUpperCase() || "AP"}
    </div>
  );
}

export type { LineItem };
