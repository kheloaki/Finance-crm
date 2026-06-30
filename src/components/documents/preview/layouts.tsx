import {
  accentBorder,
  accentMutedText,
  accentText,
  bandStyle,
  bandStyleVertical,
  clientBoxStyle,
  dividerStyle,
  gradientBannerStyle,
  lineCardStyle,
  primaryBg,
  primaryDarkBg,
  surfaceStyle,
  tableHeadStyle,
} from "./layout-theme";
import { cn } from "@/lib/utils";
import type { LayoutProps } from "./types";
import {
  CounterpartyRepLine,
  FooterLegal,
  LinesSpreadsheet,
  LogoMark,
  NotesBlock,
  PaperFrame,
  linesTableClass,
  renderProductLines,
  TotalsBanner,
} from "./parts";

/** 1 — Letterhead centré, client encadré à droite, grille totaux double colonne */
export function ClassicLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 bg-gradient-to-b from-slate-50 to-white px-[5%] pb-3 pt-4">
        <div className="flex gap-3">
          <LogoMark ctx={ctx} />
          <div className="flex-1 text-center">
            <div className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
              <p className="text-[1.2em] font-bold uppercase tracking-wide text-[#0f172a]">
                {ctx.sellerName}
              </p>
              {ctx.sellerActivity ? (
                <p className="text-[0.8em] uppercase tracking-wider text-slate-500">
                  {ctx.sellerActivity}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-2 border-b" style={accentBorder(ctx)} />
        <div className="mt-2 flex justify-end">
          <div
            className="max-w-[45%] rounded-lg border px-3 py-2 text-right"
            style={clientBoxStyle(ctx)}
          >
            <p className="text-[0.7em] font-bold uppercase" style={accentMutedText(ctx)}>
              {ctx.counterpartyLabel}
            </p>
            <p className="font-bold text-[#0f172a]">{ctx.counterpartyName || "—"}</p>
            <CounterpartyRepLine ctx={ctx} />
            {ctx.counterpartyIce ? (
              <p className="text-[0.85em] text-slate-600">ICE : {ctx.counterpartyIce}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 px-[5%] py-2">
        <span className="h-5 w-1 rounded-full" style={dividerStyle(ctx)} />
        <h1 className="text-[1.3em] font-bold">
          {ctx.label} N° {ctx.number}
        </h1>
      </div>

      <div className="flex flex-wrap gap-1.5 px-[5%] pb-2">
        {[
          ["Date", ctx.dateFormatted],
          ...(ctx.dueDateFormatted ? [["Échéance", ctx.dueDateFormatted] as const] : []),
        ].map(([k, v]) => (
          <span key={k} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[0.75em]">
            <span className="text-slate-400">{k}</span> {v}
          </span>
        ))}
      </div>

      <div className={cn("mx-[5%] rounded border border-slate-200", linesTableClass)}>
        <LinesSpreadsheet ctx={ctx} stripeStyle={{ backgroundColor: ctx.theme.surface }} />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2 grid grid-cols-5 gap-0 overflow-hidden rounded border border-slate-200 text-[0.75em]">
          <div className="col-span-2 border-r border-slate-200 p-2">
            <p className="font-bold text-slate-500">TVA {ctx.vatRate}%</p>
            <p className="tabular-nums">{ctx.money(ctx.vatAmount)}</p>
          </div>
          <div className="col-span-3 p-2 text-center" style={primaryDarkBg(ctx)}>
            <p style={{ color: ctx.theme.accent }}>Net à payer</p>
            <p className="text-[1.2em] font-bold tabular-nums">{ctx.money(ctx.netToPay)}</p>
          </div>
        </div>
      ) : null}

      <NotesBlock ctx={ctx} className="mx-[5%] mb-2 rounded border border-slate-100 bg-slate-50 p-2" />
      <footer className="mt-auto border-t bg-slate-50 px-[5%] py-2 text-center text-slate-400">
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 2 — Bandeau pleine largeur, client en carte flottante */
export function ModernLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 px-[5%] py-4" style={bandStyle(ctx)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <LogoMark ctx={ctx} className="mb-2 rounded-lg bg-white/20 ring-1 ring-white/30" />
            <p className="text-[1.15em] font-bold">{ctx.sellerName}</p>
            {ctx.sellerActivity ? <p className="text-[0.8em] opacity-80">{ctx.sellerActivity}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-[1.4em] font-black uppercase tracking-tight">{ctx.label}</p>
            <p className="text-[1.1em] font-semibold">#{ctx.number}</p>
            <p className="mt-1 text-[0.85em] opacity-80">{ctx.dateFormatted}</p>
          </div>
        </div>
      </header>

      <div className="mx-[5%] -mt-3 mb-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-slate-200">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
          style={surfaceStyle(ctx)}
        >
          {(ctx.counterpartyName || "?")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
            {ctx.counterpartyLabel}
          </p>
          <p className="truncate font-bold text-[#0f172a]">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
        </div>
        {ctx.counterpartyIce ? (
          <span className="hidden text-[0.75em] text-slate-500 sm:block">ICE {ctx.counterpartyIce}</span>
        ) : null}
      </div>

      <div className="mx-[5%] mb-2 max-h-[40%] shrink-0 space-y-1 overflow-y-auto">
        {products.length === 0 ? (
          <p className="py-8 text-center italic text-slate-400">Aucune ligne</p>
        ) : (
          products.map((line, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" style={lineCardStyle(ctx)}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#0f172a]">{line.designation}</p>
                <p className="text-[0.75em] text-slate-500">
                  {line.qty} {line.unit}
                  {!ctx.deliveryNote ? ` · HT ${ctx.money(line.unitPriceHt)}` : ""}
                </p>
              </div>
              {!ctx.deliveryNote ? (
                <p className="shrink-0 font-bold tabular-nums" style={accentText(ctx)}>
                  {ctx.money(ctx.lineTtc(line))}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-3">
          <TotalsBanner ctx={ctx} style={gradientBannerStyle(ctx)} dark />
        </div>
      ) : null}

      <NotesBlock ctx={ctx} className="mx-[5%] mb-2 rounded-lg p-2" style={surfaceStyle(ctx)} />
      <footer className="mt-auto px-[5%] py-2 text-center text-slate-500" style={{ backgroundColor: ctx.theme.surface }}>
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 3 — Lettre épurée */
export function MinimalLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <header className="border-b-2 px-[6%] py-4" style={{ borderColor: ctx.theme.primaryDark }}>
        <div className="flex justify-between gap-4">
          <div className="flex items-start gap-2">
            <LogoMark ctx={ctx} />
            <div>
              <p className="text-[1.15em] font-bold uppercase tracking-[0.15em]">{ctx.sellerName}</p>
              {ctx.sellerActivity ? (
                <p className="mt-1 text-[0.75em] uppercase tracking-widest text-neutral-500">
                  {ctx.sellerActivity}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right text-[0.8em] leading-relaxed text-neutral-600">
            <p>{ctx.label}</p>
            <p className="font-bold" style={{ color: ctx.theme.primaryDark }}>
              N° {ctx.number}
            </p>
            <p>{ctx.dateFormatted}</p>
          </div>
        </div>
      </header>

      <section className="px-[6%] py-4">
        <p className="text-[0.7em] font-bold uppercase tracking-widest text-neutral-400">
          {ctx.counterpartyLabel}
        </p>
        <p className="mt-1 text-[1em] font-bold">{ctx.counterpartyName || "—"}</p>
        <CounterpartyRepLine ctx={ctx} />
        {ctx.addrLine ? <p className="text-[0.85em] text-neutral-500">{ctx.addrLine}</p> : null}
      </section>

      <div className="mx-[6%] shrink-0 border-t" style={{ borderColor: ctx.theme.primaryDark }}>
        {products.length === 0 ? (
          <p className="py-6 text-center italic text-neutral-400">—</p>
        ) : (
          products.map((line, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 border-b border-neutral-200 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{line.designation}</p>
                {!ctx.deliveryNote ? (
                  <p className="text-[0.75em] text-neutral-400">
                    {line.qty} × {ctx.money(line.unitPriceHt)} HT
                  </p>
                ) : (
                  <p className="text-[0.75em] text-neutral-400">
                    {line.qty} {line.unit}
                  </p>
                )}
              </div>
              {!ctx.deliveryNote ? (
                <p className="shrink-0 tabular-nums font-medium">{ctx.money(ctx.lineTtc(line))}</p>
              ) : null}
            </div>
          ))
        )}
      </div>

      {!ctx.deliveryNote ? (
        <dl className="mx-[6%] mb-4 space-y-1 text-right text-[0.85em]">
          <div className="flex justify-end gap-8">
            <dt className="text-neutral-500">Total HT</dt>
            <dd className="w-20 tabular-nums">{ctx.money(ctx.totalHt)}</dd>
          </div>
          <div className="flex justify-end gap-8">
            <dt className="text-neutral-500">TVA</dt>
            <dd className="w-20 tabular-nums">{ctx.money(ctx.vatAmount)}</dd>
          </div>
          <div
            className="flex justify-end gap-8 border-t-2 pt-2 font-bold"
            style={{ borderColor: ctx.theme.primaryDark }}
          >
            <dt>Net à payer</dt>
            <dd className="w-20 tabular-nums">{ctx.money(ctx.netToPay)}</dd>
          </div>
        </dl>
      ) : null}

      <NotesBlock
        ctx={ctx}
        className="mx-[6%] mb-3 border-l-2 pl-3 italic"
        style={{ borderColor: ctx.theme.primary }}
      />
      <footer
        className="mt-auto border-t-2 px-[6%] py-2 text-center text-neutral-400"
        style={{ borderColor: ctx.theme.primaryDark }}
      >
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 4 — Bandeau sombre, bloc NET central */
export function ExecutiveLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 px-[5%] py-5" style={primaryDarkBg(ctx)}>
        <div className="flex items-end justify-between">
          <div>
            <LogoMark ctx={ctx} className="mb-2 rounded-lg ring-1 ring-white/20" />
            <p className="text-[1em] font-semibold tracking-wide">{ctx.sellerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[1.6em] font-black leading-none" style={{ color: ctx.theme.accent }}>
              {ctx.label}
            </p>
            <p className="mt-1 text-[0.9em] opacity-70">Réf. {ctx.number}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 px-[5%] py-3">
        <div className="rounded-lg border p-3" style={clientBoxStyle(ctx)}>
          <p className="text-[0.65em] font-bold uppercase" style={accentMutedText(ctx)}>
            {ctx.counterpartyLabel}
          </p>
          <p className="text-[1.05em] font-bold">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
          {ctx.counterpartyIce ? <p className="text-[0.8em] text-slate-600">ICE {ctx.counterpartyIce}</p> : null}
        </div>
        <div className="space-y-2 text-[0.8em]">
          <p>
            <span className="text-slate-400">Date</span> <strong>{ctx.dateFormatted}</strong>
          </p>
          {ctx.dueDateFormatted ? (
            <p>
              <span className="text-slate-400">Échéance</span> <strong>{ctx.dueDateFormatted}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-[5%] mb-2 shrink-0 overflow-hidden">
        <table className="w-full text-[0.8em]">
          <thead>
            <tr className="border-b-2 text-left text-[0.7em] uppercase tracking-wider" style={{ borderColor: ctx.theme.primaryDark }}>
              <th className="py-1.5">Description</th>
              <th className="py-1.5 text-right">Qté</th>
              {!ctx.deliveryNote ? <th className="py-1.5 text-right">Montant</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center italic text-slate-400">
                  Aucune ligne
                </td>
              </tr>
            ) : (
              products.map((line, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-2">
                    <p className="font-medium">{line.designation}</p>
                    <p className="text-[0.85em] text-slate-400">{line.reference}</p>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {line.qty} {line.unit}
                  </td>
                  {!ctx.deliveryNote ? (
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {ctx.money(ctx.lineTtc(line))}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-3 rounded-xl py-4 text-center" style={primaryDarkBg(ctx)}>
          <p className="text-[0.7em] uppercase tracking-[0.2em]" style={{ color: ctx.theme.accent }}>
            Net à payer
          </p>
          <p className="text-[1.8em] font-black tabular-nums" style={{ color: ctx.theme.accent }}>
            {ctx.money(ctx.netToPay)} <span className="text-[0.5em]">MAD</span>
          </p>
        </div>
      ) : null}

      <footer className="mt-auto px-[5%] py-2 text-center text-neutral-500" style={primaryDarkBg(ctx)}>
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 5 — Cadre double, grille comptable */
export function CorporateLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <div
        className="flex h-full flex-col border-4 border-double m-2 p-3"
        style={{ borderColor: ctx.theme.primaryDark }}
      >
        <table className="mb-3 w-full border-collapse text-[0.8em]">
          <tbody>
            <tr>
              <td className="w-1/2 border p-3 align-top" style={surfaceStyle(ctx)}>
                <div className="mb-2 flex items-center gap-2">
                  <LogoMark ctx={ctx} />
                  <p className="font-bold uppercase" style={{ color: ctx.theme.primaryDark }}>
                    {ctx.sellerName}
                  </p>
                </div>
                {ctx.sellerActivity ? <p style={accentMutedText(ctx)}>{ctx.sellerActivity}</p> : null}
                {ctx.sellerAddress ? <p className="mt-1 text-slate-600">{ctx.sellerAddress}</p> : null}
              </td>
              <td className="w-1/2 border p-3 align-top" style={{ borderColor: ctx.theme.surfaceBorder }}>
                <p className="font-bold uppercase" style={{ color: ctx.theme.primaryDark }}>
                  {ctx.label}
                </p>
                <p>
                  N° document : <strong>{ctx.number}</strong>
                </p>
                <p>
                  Date : <strong>{ctx.dateFormatted}</strong>
                </p>
                {ctx.dueDateFormatted ? (
                  <p>
                    Échéance : <strong>{ctx.dueDateFormatted}</strong>
                  </p>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-2 border px-3 py-2" style={surfaceStyle(ctx)}>
          <span className="text-[0.7em] font-bold uppercase" style={accentMutedText(ctx)}>
            {ctx.counterpartyLabel} :{" "}
          </span>
          <span className="font-bold">{ctx.counterpartyName || "—"}</span>
          <CounterpartyRepLine ctx={ctx} />
          {ctx.counterpartyIce ? (
            <span className="ml-2 text-[0.85em] text-slate-600">ICE {ctx.counterpartyIce}</span>
          ) : null}
        </div>

        <div className="mb-2 max-h-[40%] shrink-0 overflow-auto">
          <LinesSpreadsheet ctx={ctx} stripeStyle={{ backgroundColor: ctx.theme.surface }} />
        </div>

        {!ctx.deliveryNote ? (
          <table className="mb-2 w-full border-collapse text-[0.8em]">
            <tbody>
              <tr className="font-bold" style={{ backgroundColor: ctx.theme.surface }}>
                <td className="border p-2" style={{ borderColor: ctx.theme.surfaceBorder }}>
                  Total HT
                </td>
                <td className="border p-2 text-right tabular-nums" style={{ borderColor: ctx.theme.surfaceBorder }}>
                  {ctx.money(ctx.totalHt)}
                </td>
                <td className="border p-2" style={{ borderColor: ctx.theme.surfaceBorder }}>
                  TVA
                </td>
                <td className="border p-2 text-right tabular-nums" style={{ borderColor: ctx.theme.surfaceBorder }}>
                  {ctx.money(ctx.vatAmount)}
                </td>
              </tr>
              <tr style={primaryDarkBg(ctx)}>
                <td colSpan={3} className="border p-2 font-bold" style={{ borderColor: ctx.theme.primaryDark }}>
                  NET À PAYER
                </td>
                <td
                  className="border p-2 text-right text-[1.1em] font-black tabular-nums"
                  style={{ borderColor: ctx.theme.primaryDark }}
                >
                  {ctx.money(ctx.netToPay)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}

        <NotesBlock ctx={ctx} className="mb-2 border p-2 text-[0.85em]" style={surfaceStyle(ctx)} />
        <footer className="mt-auto border-t pt-2 text-center" style={{ borderColor: ctx.theme.surfaceBorder, ...accentMutedText(ctx) }}>
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 6 — Cartes empilées */
export function FreshLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <div className="flex h-full flex-col p-3" style={{ background: `linear-gradient(to bottom, ${ctx.theme.surface}, white)` }}>
        <div className="mb-2 rounded-2xl bg-white p-3 shadow-sm ring-1" style={{ borderColor: ctx.theme.surfaceBorder }}>
          <div className="flex items-center gap-2">
            <LogoMark ctx={ctx} className="rounded-xl" />
            <div>
              <p className="font-bold" style={{ color: ctx.theme.primaryDark }}>
                {ctx.sellerName}
              </p>
              <p className="text-[0.75em]" style={accentText(ctx)}>
                {ctx.sellerActivity}
              </p>
            </div>
            <div className="ml-auto rounded-full px-3 py-1 text-[0.75em] font-bold" style={surfaceStyle(ctx)}>
              {ctx.label}
            </div>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1" style={{ borderColor: ctx.theme.surfaceBorder }}>
            <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
              {ctx.counterpartyLabel}
            </p>
            <p className="font-bold">{ctx.counterpartyName || "—"}</p>
            <CounterpartyRepLine ctx={ctx} />
          </div>
          <div className="rounded-2xl p-3 shadow-sm" style={primaryBg(ctx)}>
            <p className="text-[0.65em] uppercase opacity-80">Document</p>
            <p className="font-bold">#{ctx.number}</p>
            <p className="text-[0.8em]">{ctx.dateFormatted}</p>
          </div>
        </div>

        <div className="mb-2 max-h-[40%] shrink-0 space-y-1.5 overflow-y-auto">
          {products.length === 0 ? (
            <p className="py-6 text-center italic" style={accentText(ctx)}>
              Aucune ligne
            </p>
          ) : (
            products.map((line, i) => (
              <div key={i} className="flex justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1" style={lineCardStyle(ctx)}>
                <span className="truncate font-medium">{line.designation}</span>
                {!ctx.deliveryNote ? (
                  <span className="ml-2 shrink-0 font-bold tabular-nums" style={accentText(ctx)}>
                    {ctx.money(ctx.lineTtc(line))}
                  </span>
                ) : (
                  <span className="text-[0.85em]" style={accentText(ctx)}>
                    {line.qty} {line.unit}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {!ctx.deliveryNote ? (
          <div className="mb-2 rounded-2xl p-4 text-center shadow-md" style={gradientBannerStyle(ctx)}>
            <p className="text-[0.7em] uppercase opacity-90">Total TTC</p>
            <p className="text-[1.4em] font-black tabular-nums">{ctx.money(ctx.totalTtc)}</p>
            <p className="mt-1 text-[0.85em]">Net : {ctx.money(ctx.netToPay)} MAD</p>
          </div>
        ) : null}

        <footer className="text-center text-[0.75em]" style={accentMutedText(ctx)}>
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 7 — Style magazine */
export function WarmLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <div className="flex h-full flex-col p-4" style={{ backgroundColor: ctx.theme.primaryMuted }}>
        <div className="flex items-start gap-2 border-b-4 pb-3" style={{ borderColor: ctx.theme.primary }}>
          <LogoMark ctx={ctx} />
          <div>
            <p className="font-serif text-[1.4em] font-bold" style={{ color: ctx.theme.primaryDark }}>
              {ctx.sellerName}
            </p>
            {ctx.sellerActivity ? (
              <p className="font-serif text-[0.85em] italic" style={accentMutedText(ctx)}>
                {ctx.sellerActivity}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex justify-between text-[0.8em]">
          <p className="font-bold uppercase" style={{ color: ctx.theme.primaryDark }}>
            {ctx.label}
          </p>
          <p style={accentText(ctx)}>
            {ctx.dateFormatted} · N° {ctx.number}
          </p>
        </div>

        <blockquote className="my-3 border-l-4 py-2 pl-4 pr-2" style={{ ...clientBoxStyle(ctx), borderLeftColor: ctx.theme.primary }}>
          <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
            {ctx.counterpartyLabel}
          </p>
          <p className="font-serif text-[1.05em] font-bold italic" style={{ color: ctx.theme.primaryDark }}>
            {ctx.counterpartyName || "—"}
          </p>
          <CounterpartyRepLine ctx={ctx} />
        </blockquote>

        <div className="mb-2 max-h-[40%] shrink-0 space-y-3 overflow-y-auto">
          {products.length === 0 ? (
            <p className="italic" style={accentText(ctx)}>
              Aucune ligne
            </p>
          ) : (
            products.map((line, i) => (
              <div key={i} className="border-b pb-2" style={{ borderColor: ctx.theme.surfaceBorder }}>
                <p className="font-serif text-[1em] font-semibold" style={{ color: ctx.theme.primaryDark }}>
                  {line.designation}
                </p>
                <div className="mt-0.5 flex justify-between text-[0.8em]" style={accentMutedText(ctx)}>
                  <span>
                    {line.reference} · {line.qty} {line.unit}
                  </span>
                  {!ctx.deliveryNote ? (
                    <span className="font-bold tabular-nums">{ctx.money(ctx.lineTtc(line))}</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {!ctx.deliveryNote ? (
          <div className="flex items-center justify-end gap-3">
            <div className="text-right text-[0.85em]">
              <p>TTC {ctx.money(ctx.totalTtc)}</p>
            </div>
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-lg" style={primaryBg(ctx)}>
              <span className="text-[0.55em] uppercase">Net</span>
              <span className="text-[0.75em] font-bold tabular-nums leading-none">
                {ctx.money(ctx.netToPay)}
              </span>
            </div>
          </div>
        ) : null}

        <footer className="mt-auto pt-2 text-center text-[0.75em]" style={accentMutedText(ctx)}>
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 8 — Sidebar verticale + tableau */
export function OceanLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <div className="flex min-h-0 shrink-0 flex-col">
        <div className="flex shrink-0">
          <aside className="flex w-[14%] shrink-0 flex-col items-center py-4" style={bandStyleVertical(ctx)}>
            <p
              className="text-[0.65em] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180"
              style={{ letterSpacing: "0.2em" }}
            >
              {ctx.label}
            </p>
          </aside>

          <div className="relative min-w-0 flex-1 p-3">
            <div
              className="absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full shadow-lg ring-4"
              style={{ ...primaryBg(ctx), boxShadow: `0 0 0 4px ${ctx.theme.primaryMuted}` }}
            >
              <span className="text-[0.5em] uppercase opacity-80">N°</span>
              <span className="text-[0.65em] font-bold leading-tight">{ctx.number.split("/")[0]}</span>
            </div>

            <div className="flex items-center gap-2 pr-16">
              <LogoMark ctx={ctx} />
              <div>
                <p className="text-[1em] font-bold" style={{ color: ctx.theme.primaryDark }}>
                  {ctx.sellerName}
                </p>
                <p className="text-[0.75em]" style={accentText(ctx)}>
                  {ctx.dateFormatted}
                </p>
              </div>
            </div>

            <div className="my-2 rounded-lg border p-2" style={surfaceStyle(ctx)}>
              <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
                {ctx.counterpartyLabel}
              </p>
              <p className="font-bold" style={{ color: ctx.theme.primaryDark }}>
                {ctx.counterpartyName || "—"}
              </p>
              <CounterpartyRepLine ctx={ctx} />
              {ctx.addrLine ? <p className="text-[0.75em] text-neutral-500">{ctx.addrLine}</p> : null}
            </div>
          </div>
        </div>

        <div className={cn("mx-[5%]", linesTableClass)}>
          <LinesSpreadsheet ctx={ctx} headStyle={tableHeadStyle(ctx)} />
        </div>

        {!ctx.deliveryNote ? (
          <div className="mx-[5%] mb-2 ml-auto w-[55%] overflow-hidden rounded text-[0.8em]">
            <div className="flex justify-between border-b border-neutral-200 py-1">
              <span>Sous-total HT</span>
              <span className="tabular-nums">{ctx.money(ctx.totalHt)}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200 py-1">
              <span>TVA {ctx.vatRate}%</span>
              <span className="tabular-nums">{ctx.money(ctx.vatAmount)}</span>
            </div>
            <div
              className="flex justify-between px-2 py-1.5 font-bold text-white"
              style={{ ...primaryBg(ctx), borderRadius: "0 0 4px 4px" }}
            >
              <span>Total TTC</span>
              <span className="tabular-nums">{ctx.money(ctx.netToPay)} MAD</span>
            </div>
          </div>
        ) : null}

        <NotesBlock ctx={ctx} className="mx-[5%] mb-2 rounded border border-slate-100 bg-slate-50 p-2" />

        <footer className="mt-auto shrink-0 px-[5%] py-2 text-center text-[0.7em]" style={accentMutedText(ctx)}>
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 9 — Lettre commerciale */
export function SlateLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <div className="flex h-full flex-col px-[6%] py-4">
        <div className="flex justify-between text-[0.8em]">
          <div className="flex items-center gap-2">
            <LogoMark ctx={ctx} />
            <p className="font-bold" style={{ color: ctx.theme.primaryDark }}>
              {ctx.sellerName}
            </p>
          </div>
          <p className="text-slate-500">
            {ctx.dateFormatted}
            <br />
            Réf. {ctx.number}
          </p>
        </div>

        <div className="my-4 border-l-4 pl-3" style={{ borderColor: ctx.theme.primary }}>
          <p className="text-[0.7em] font-bold uppercase tracking-wider text-slate-500">Facturé à</p>
          <p className="text-[1em] font-bold text-slate-900">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
          {ctx.addrLine ? <p className="text-[0.85em] text-slate-600">{ctx.addrLine}</p> : null}
        </div>

        <p className="mb-2 text-[0.85em]">
          Objet : <strong>{ctx.label}</strong>
        </p>

        <ol className="mb-3 max-h-[40%] shrink-0 list-decimal space-y-2 overflow-y-auto pl-4 text-[0.85em]">
          {products.length === 0 ? (
            <li className="list-none italic text-slate-400">Aucune prestation listée.</li>
          ) : (
            products.map((line, i) => (
              <li key={i} className="pl-1">
                <span className="font-medium">{line.designation}</span>
                <span className="text-slate-500">
                  {" "}
                  — {line.qty} {line.unit}
                  {!ctx.deliveryNote ? ` — ${ctx.money(ctx.lineTtc(line))} TTC` : ""}
                </span>
              </li>
            ))
          )}
        </ol>

        {!ctx.deliveryNote ? (
          <p className="mb-3 text-[0.9em]">
            Montant total dû :{" "}
            <strong className="text-[1.1em] tabular-nums" style={{ color: ctx.theme.primaryDark }}>
              {ctx.money(ctx.netToPay)} MAD
            </strong>{" "}
            TTC.
          </p>
        ) : null}

        <NotesBlock ctx={ctx} className="mb-2 text-[0.85em] italic text-slate-600" />
        <footer className="mt-auto border-t border-slate-200 pt-2 text-center text-[0.75em] text-slate-400">
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 10 — Centré ornemental */
export function RoyalLayout({ ctx }: LayoutProps) {
  const products = renderProductLines(ctx);
  return (
    <PaperFrame ctx={ctx}>
      <div
        className="relative flex h-full flex-col border m-2 p-3"
        style={{ borderColor: ctx.theme.surfaceBorder }}
      >
        <div className="pointer-events-none absolute left-1 top-1" style={accentText(ctx)}>
          ◆
        </div>
        <div className="pointer-events-none absolute right-1 top-1" style={accentText(ctx)}>
          ◆
        </div>
        <div className="pointer-events-none absolute bottom-1 left-1" style={accentText(ctx)}>
          ◆
        </div>
        <div className="pointer-events-none absolute bottom-1 right-1" style={accentText(ctx)}>
          ◆
        </div>

        <header className="shrink-0 border-b pb-3 pt-2 text-center" style={{ borderColor: ctx.theme.surfaceBorder }}>
          <LogoMark ctx={ctx} className="mx-auto mb-2 rounded-full" />
          <p className="text-[1.15em] font-bold uppercase tracking-[0.2em]" style={{ color: ctx.theme.primaryDark }}>
            {ctx.sellerName}
          </p>
          {ctx.sellerActivity ? (
            <p className="text-[0.75em] uppercase tracking-widest" style={accentText(ctx)}>
              {ctx.sellerActivity}
            </p>
          ) : null}
          <div className="mx-auto mt-2 flex w-24 items-center gap-1">
            <span className="h-px flex-1" style={{ backgroundColor: ctx.theme.primaryLight }} />
            <span style={accentText(ctx)}>✦</span>
            <span className="h-px flex-1" style={{ backgroundColor: ctx.theme.primaryLight }} />
          </div>
        </header>

        <div className="my-2 text-center">
          <p className="text-[1.1em] font-bold" style={{ color: ctx.theme.primaryDark }}>
            {ctx.label}
          </p>
          <p className="text-[0.85em]" style={accentText(ctx)}>
            N° {ctx.number} · {ctx.dateFormatted}
          </p>
        </div>

        <div
          className="mx-auto mb-3 max-w-[90%] rounded-lg border-2 px-4 py-2 text-center"
          style={clientBoxStyle(ctx)}
        >
          <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
            {ctx.counterpartyLabel}
          </p>
          <p className="font-bold" style={{ color: ctx.theme.primaryDark }}>
            {ctx.counterpartyName || "—"}
          </p>
          <CounterpartyRepLine ctx={ctx} />
        </div>

        <div className="mb-2 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: ctx.theme.surfaceBorder }}>
          <table className="w-full text-[0.78em]">
            <thead>
              <tr style={tableHeadStyle(ctx)}>
                <th className="p-1.5 text-left">Article</th>
                <th className="p-1.5 text-right">Qté</th>
                {!ctx.deliveryNote ? <th className="p-1.5 text-right">Total</th> : null}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center italic" style={accentText(ctx)}>
                    Aucune ligne
                  </td>
                </tr>
              ) : (
                products.map((line, i) => (
                  <tr key={i} style={i % 2 === 1 ? { backgroundColor: ctx.theme.surface } : undefined}>
                    <td className="border-t p-1.5" style={{ borderColor: ctx.theme.surfaceBorder }}>
                      <p className="font-medium">{line.designation}</p>
                      <p className="text-[0.85em]" style={accentText(ctx)}>
                        {line.reference}
                      </p>
                    </td>
                    <td className="border-t p-1.5 text-right tabular-nums" style={{ borderColor: ctx.theme.surfaceBorder }}>
                      {line.qty}
                    </td>
                    {!ctx.deliveryNote ? (
                      <td className="border-t p-1.5 text-right font-semibold tabular-nums" style={{ borderColor: ctx.theme.surfaceBorder }}>
                        {ctx.money(ctx.lineTtc(line))}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!ctx.deliveryNote ? (
          <div
            className="mx-auto mb-2 w-[85%] border-2 border-double p-3 text-center"
            style={{ borderColor: ctx.theme.primary }}
          >
            <p className="text-[0.7em] uppercase tracking-widest" style={accentText(ctx)}>
              Net à payer
            </p>
            <p className="text-[1.35em] font-bold tabular-nums" style={{ color: ctx.theme.primaryDark }}>
              {ctx.money(ctx.netToPay)} MAD
            </p>
          </div>
        ) : null}

        <footer className="mt-auto border-t pt-2 text-center text-[0.75em]" style={{ borderColor: ctx.theme.surfaceBorder, ...accentText(ctx) }}>
          <FooterLegal ctx={ctx} />
        </footer>
      </div>
    </PaperFrame>
  );
}

/** 11 — Triangles décoratifs, meta boxes, tableau sombre */
export function GeometricLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="relative shrink-0 overflow-hidden bg-neutral-100 px-[5%] py-3">
        <div
          className="pointer-events-none absolute -right-2 top-0 h-14 w-20 bg-neutral-300/70"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />
        <div
          className="pointer-events-none absolute right-8 top-0 h-10 w-14 bg-neutral-400/40"
          style={{ clipPath: "polygon(100% 0, 20% 0, 100% 100%)" }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark ctx={ctx} />
            <div>
              <p className="text-[0.95em] font-black uppercase tracking-wide">{ctx.sellerName}</p>
              {ctx.sellerActivity ? (
                <p className="text-[0.7em] text-neutral-500">{ctx.sellerActivity}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[1.35em] font-black uppercase tracking-tight text-neutral-900">
              {ctx.label}
            </p>
            <p className="text-[0.75em] text-neutral-600">#{ctx.number}</p>
          </div>
        </div>
      </header>

      <div className="mx-[5%] mt-2 grid grid-cols-2 gap-2">
        <div className="rounded border border-neutral-200 bg-white p-2">
          <p className="text-[0.65em] font-bold uppercase text-neutral-500">{ctx.counterpartyLabel}</p>
          <p className="font-bold">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
          {ctx.addrLine ? <p className="text-[0.75em] text-neutral-500">{ctx.addrLine}</p> : null}
        </div>
        <div className="grid grid-cols-3 gap-1 text-center text-[0.65em]">
          {!ctx.deliveryNote ? (
            <div className="rounded bg-neutral-900 p-1.5 text-white">
              <p className="opacity-70">Total dû</p>
              <p className="font-bold tabular-nums">{ctx.money(ctx.netToPay)}</p>
            </div>
          ) : null}
          <div className="rounded border border-neutral-200 bg-neutral-50 p-1.5">
            <p className="text-neutral-400">Date</p>
            <p className="font-semibold">{ctx.dateFormatted}</p>
          </div>
          {ctx.dueDateFormatted ? (
            <div className="rounded border border-neutral-200 bg-neutral-50 p-1.5">
              <p className="text-neutral-400">Échéance</p>
              <p className="font-semibold">{ctx.dueDateFormatted}</p>
            </div>
          ) : (
            <div className="rounded border border-neutral-200 bg-neutral-50 p-1.5">
              <p className="text-neutral-400">N°</p>
              <p className="font-semibold">{ctx.number}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-[5%] my-2 shrink-0 overflow-hidden">
        <LinesSpreadsheet ctx={ctx} headStyle={{ backgroundColor: "#2563eb", color: "#fff" }} />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2 flex justify-end">
          <div className="rounded bg-neutral-900 px-4 py-2 text-right text-white">
            <p className="text-[0.65em] uppercase opacity-70">Net à payer</p>
            <p className="text-[1.15em] font-bold tabular-nums">{ctx.money(ctx.netToPay)} MAD</p>
          </div>
        </div>
      ) : null}

      <NotesBlock ctx={ctx} className="mx-[5%] mb-2 text-[0.85em] text-neutral-600" />
      <footer className="mt-auto border-t border-neutral-200 px-[5%] py-2 text-center text-neutral-400">
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 12 — Barre verticale + titre filigrane */
export function StripeLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <div className="flex shrink-0">
        <div className="w-[4%] shrink-0" style={bandStyleVertical(ctx)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative shrink-0 px-[5%] pb-2 pt-3">
            <p className="text-[0.75em] text-neutral-500">
              N° {ctx.number} · {ctx.dateFormatted}
              {ctx.dueDateFormatted ? ` · Éch. ${ctx.dueDateFormatted}` : ""}
            </p>
            <p
              className="pointer-events-none absolute right-[5%] top-1 text-[2em] font-black uppercase tracking-tight text-neutral-200"
              aria-hidden
            >
              {ctx.label}
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3 px-[5%] pb-2">
            <div>
              <p className="text-[0.65em] font-bold uppercase tracking-wider text-neutral-400">
                {ctx.counterpartyLabel}
              </p>
              <p className="font-bold">{ctx.counterpartyName || "—"}</p>
              <CounterpartyRepLine ctx={ctx} />
              {ctx.addrLine ? <p className="text-[0.8em] text-neutral-500">{ctx.addrLine}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-[0.65em] font-bold uppercase tracking-wider text-neutral-400">
                Émetteur
              </p>
              <p className="font-bold">{ctx.sellerName}</p>
              {ctx.sellerAddress ? (
                <p className="text-[0.8em] text-neutral-500">{ctx.sellerAddress}</p>
              ) : null}
            </div>
          </div>

          <div className="mx-[5%] mb-2 shrink-0 overflow-hidden">
            <LinesSpreadsheet ctx={ctx} headStyle={tableHeadStyle(ctx)} />
          </div>

          {!ctx.deliveryNote ? (
            <div className="mx-[5%] mb-2 ml-auto w-[55%] overflow-hidden rounded text-[0.8em]">
              <div className="flex justify-between border-b border-neutral-200 py-1">
                <span>Sous-total HT</span>
                <span className="tabular-nums">{ctx.money(ctx.totalHt)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 py-1">
                <span>TVA {ctx.vatRate}%</span>
                <span className="tabular-nums">{ctx.money(ctx.vatAmount)}</span>
              </div>
              <div
                className="flex justify-between px-2 py-1.5 font-bold"
                style={{ ...primaryBg(ctx), borderRadius: "0 0 4px 4px" }}
              >
                <span>Total TTC</span>
                <span className="tabular-nums">{ctx.money(ctx.netToPay)} MAD</span>
              </div>
            </div>
          ) : null}

          <footer className="mt-auto px-[5%] py-2 text-center text-[0.75em] text-neutral-400">
            <FooterLegal ctx={ctx} />
          </footer>
        </div>
      </div>
    </PaperFrame>
  );
}

/** 13 — Bandeaux dégradés haut / bas */
export function GradientLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 px-[5%] py-4" style={bandStyle(ctx)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[1.4em] font-black uppercase">{ctx.label}</p>
            <p className="text-[0.85em] opacity-90">#{ctx.number} · {ctx.dateFormatted}</p>
          </div>
          <div className="text-right">
            <LogoMark ctx={ctx} className="ml-auto bg-white/20 ring-1 ring-white/30" />
            <p className="mt-1 text-[0.9em] font-bold">{ctx.sellerName}</p>
          </div>
        </div>
      </header>

      <section className="mx-[5%] -mt-2 rounded-lg border bg-white p-3 shadow-sm ring-1 ring-black/5">
        <p className="text-[0.65em] font-bold uppercase" style={accentText(ctx)}>
          {ctx.counterpartyLabel}
        </p>
        <p className="font-bold">{ctx.counterpartyName || "—"}</p>
        <CounterpartyRepLine ctx={ctx} />
        {ctx.counterpartyIce ? <p className="text-[0.8em] text-neutral-500">ICE {ctx.counterpartyIce}</p> : null}
      </section>

      <div className="mx-[5%] my-2 shrink-0 overflow-hidden rounded border">
        <LinesSpreadsheet ctx={ctx} headStyle={tableHeadStyle(ctx)} />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2">
          <TotalsBanner ctx={ctx} style={gradientBannerStyle(ctx)} dark />
        </div>
      ) : null}

      <footer className="mt-auto px-[5%] py-3" style={bandStyle(ctx)}>
        <div className="text-center text-[0.7em] opacity-90">
          <FooterLegal ctx={ctx} />
        </div>
      </footer>
    </PaperFrame>
  );
}

/** 14 — Titre centré, tableau vert */
export function InterimLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 px-[5%] pt-4 text-center">
        <h1 className="text-[1.25em] font-bold text-neutral-800">{ctx.label}</h1>
        <div className="mt-3 flex justify-between text-left text-[0.75em]">
          <div>
            <p className="font-bold">{ctx.sellerName}</p>
            {ctx.sellerAddress ? <p className="text-neutral-500">{ctx.sellerAddress}</p> : null}
          </div>
          <LogoMark ctx={ctx} className="ml-auto" />
        </div>
      </header>

      <div className="mx-[5%] mt-2 grid grid-cols-2 gap-3 text-[0.8em]">
        <div>
          <p className="font-bold text-neutral-600">Facturé à :</p>
          <p className="font-semibold">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
          {ctx.addrLine ? <p className="text-neutral-500">{ctx.addrLine}</p> : null}
        </div>
        <div className="text-right">
          <p>
            <span className="text-neutral-500">N° </span>
            {ctx.number}
          </p>
          <p>
            <span className="text-neutral-500">Date </span>
            {ctx.dateFormatted}
          </p>
          {ctx.reference ? (
            <p>
              <span className="text-neutral-500">Réf. </span>
              {ctx.reference}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-[5%] my-2 shrink-0 overflow-hidden">
        <LinesSpreadsheet ctx={ctx} headStyle={{ backgroundColor: ctx.theme.primaryDark, color: "#fff" }} />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2 space-y-0.5 text-right text-[0.8em]">
          <div className="flex justify-end gap-6">
            <span className="text-neutral-500">Sous-total</span>
            <span className="w-16 tabular-nums">{ctx.money(ctx.totalHt)}</span>
          </div>
          <div className="flex justify-end gap-6">
            <span className="text-neutral-500">TVA</span>
            <span className="w-16 tabular-nums">{ctx.money(ctx.vatAmount)}</span>
          </div>
          <div className="mt-1 rounded px-3 py-2 font-bold text-white" style={primaryDarkBg(ctx)}>
            <div className="flex justify-end gap-6">
              <span>TOTAL</span>
              <span className="w-16 tabular-nums">{ctx.money(ctx.netToPay)} MAD</span>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="mt-auto border-t px-[5%] py-2 text-center text-[0.75em] text-neutral-400">
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 15 — Corporate bleu, blocs Facturé à / Livré à */
export function BlueproLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="shrink-0 px-[5%] pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded" style={primaryDarkBg(ctx)} />
            <div>
              <p className="text-[1.05em] font-bold" style={accentText(ctx)}>
                {ctx.sellerName}
              </p>
              {ctx.sellerAddress ? (
                <p className="text-[0.7em] text-neutral-500">{ctx.sellerAddress}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[1.2em] font-black uppercase" style={{ color: ctx.theme.primaryDark }}>
              {ctx.label}
            </p>
            <p className="text-[0.75em]">Date : {ctx.dateFormatted}</p>
            <p className="text-[0.75em]">N° : {ctx.number}</p>
          </div>
        </div>
      </header>

      <div className="mx-[5%] mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded border text-[0.75em]">
        <div>
          <div className="px-2 py-1 font-bold text-white" style={primaryDarkBg(ctx)}>
            Facturé à
          </div>
          <div className="border-t border-neutral-200 p-2">
            <p className="font-bold">{ctx.counterpartyName || "—"}</p>
            <CounterpartyRepLine ctx={ctx} />
            {ctx.addrLine ? <p className="text-neutral-500">{ctx.addrLine}</p> : null}
          </div>
        </div>
        <div className="border-l border-neutral-200">
          <div className="px-2 py-1 font-bold text-white" style={primaryDarkBg(ctx)}>
            {ctx.counterpartyLabel}
          </div>
          <div className="border-t border-neutral-200 p-2">
            <p className="font-bold">{ctx.counterpartyName || "—"}</p>
            {ctx.counterpartyIce ? <p>ICE : {ctx.counterpartyIce}</p> : null}
          </div>
        </div>
      </div>

      <div className="mx-[5%] my-2 shrink-0 overflow-hidden">
        <LinesSpreadsheet
          ctx={ctx}
          headStyle={primaryDarkBg(ctx)}
          stripeStyle={{ backgroundColor: ctx.theme.surface }}
        />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2 grid grid-cols-2 gap-2 text-[0.75em]">
          <NotesBlock ctx={ctx} className="rounded border border-neutral-200 p-2" />
          <div className="space-y-1 text-right">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span className="tabular-nums">{ctx.money(ctx.totalHt)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA</span>
              <span className="tabular-nums">{ctx.money(ctx.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t-2 pt-1 font-bold" style={accentBorder(ctx)}>
              <span>Total</span>
              <span className="tabular-nums">{ctx.money(ctx.netToPay)} MAD</span>
            </div>
          </div>
        </div>
      ) : (
        <NotesBlock ctx={ctx} className="mx-[5%] mb-2 rounded border p-2 text-[0.8em]" />
      )}

      <footer className="mt-auto border-t px-[5%] py-2 text-center text-[0.75em] text-neutral-400">
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

/** 16 — Bloc logo, filet accent, solde dû */
export function StudioLayout({ ctx }: LayoutProps) {
  return (
    <PaperFrame ctx={ctx}>
      <header className="flex shrink-0 items-center gap-2 px-[5%] pt-3">
        <LogoMark ctx={ctx} className="max-h-8 max-w-[72px] rounded object-contain" />
        <p className="text-[1em] font-black uppercase">{ctx.sellerName}</p>
      </header>

      <div className="mx-[5%] flex items-center gap-2 border-b-2 py-1" style={accentBorder(ctx)}>
        <span className="text-[1.1em] font-black uppercase">{ctx.label}</span>
      </div>

      <div className="mx-[5%] mt-2 grid grid-cols-2 gap-3 text-[0.75em]">
        <div>
          <p className="font-bold uppercase text-neutral-500">Facturé à :</p>
          <p className="font-bold">{ctx.counterpartyName || "—"}</p>
          <CounterpartyRepLine ctx={ctx} />
        </div>
        <div className="text-right text-neutral-600">
          <p>N° {ctx.number}</p>
          <p>Date : {ctx.dateFormatted}</p>
          {ctx.dueDateFormatted ? <p>Échéance : {ctx.dueDateFormatted}</p> : null}
        </div>
      </div>

      <div className="mx-[5%] my-2 shrink-0 overflow-hidden border-t-2" style={accentBorder(ctx)}>
        <LinesSpreadsheet ctx={ctx} headStyle={{ backgroundColor: "transparent", color: ctx.theme.primaryDark }} />
      </div>

      {!ctx.deliveryNote ? (
        <div className="mx-[5%] mb-2 space-y-1 text-right text-[0.75em]">
          <div className="flex justify-end gap-4">
            <span>Sous-total</span>
            <span className="tabular-nums">{ctx.money(ctx.totalHt)}</span>
          </div>
          <div className="flex justify-end gap-4">
            <span>TVA</span>
            <span className="tabular-nums">{ctx.money(ctx.vatAmount)}</span>
          </div>
          <div className="inline-flex min-w-[140px] justify-between rounded px-3 py-1.5 font-bold text-white" style={primaryBg(ctx)}>
            <span>Solde dû</span>
            <span className="tabular-nums">{ctx.money(ctx.netToPay)}</span>
          </div>
        </div>
      ) : null}

      <NotesBlock ctx={ctx} className="mx-[5%] mb-2 text-[0.8em]" />
      <footer className="mt-auto border-t-2 px-[5%] py-2 text-center" style={accentBorder(ctx)}>
        <FooterLegal ctx={ctx} />
      </footer>
    </PaperFrame>
  );
}

export const LAYOUT_REGISTRY = {
  classic: ClassicLayout,
  modern: ModernLayout,
  minimal: MinimalLayout,
  executive: ExecutiveLayout,
  corporate: CorporateLayout,
  fresh: FreshLayout,
  warm: WarmLayout,
  ocean: OceanLayout,
  slate: SlateLayout,
  royal: RoyalLayout,
  geometric: GeometricLayout,
  stripe: StripeLayout,
  gradient: GradientLayout,
  interim: InterimLayout,
  bluepro: BlueproLayout,
  studio: StudioLayout,
} as const;
