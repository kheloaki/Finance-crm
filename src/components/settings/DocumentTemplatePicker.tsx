"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_TEMPLATES,
  type DocumentTemplateId,
  type DocumentTemplateMeta,
} from "@/lib/document-templates";

export function DocumentTemplatePicker({
  value,
  onChange,
}: {
  value: DocumentTemplateId;
  onChange: (id: DocumentTemplateId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {DOCUMENT_TEMPLATES.map((tpl) => {
        const selected = value === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={cn(
              "group relative rounded-2xl border-2 p-3 text-left transition-all duration-200",
              selected
                ? "border-brand bg-[#FAFBFC] shadow-md ring-2 ring-brand/10 scale-[1.02]"
                : "border-black/[0.08] bg-white hover:border-black/20 hover:shadow-md",
            )}
          >
            <TemplateThumbnail meta={tpl} />
            <p className="mt-3 text-sm font-semibold text-ink">{tpl.label}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {tpl.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[9px] font-medium text-[#6B7280]"
                >
                  {tag}
                </span>
              ))}
            </div>
            {selected ? (
              <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TemplateThumbnail({ meta }: { meta: DocumentTemplateMeta }) {
  switch (meta.layoutKind) {
    case "classic":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex gap-1 px-1.5 pt-1.5">
            <div className="h-3 w-3 rounded-sm bg-slate-800" />
            <div className="mx-auto h-2 w-10 rounded-sm bg-slate-200" />
            <div className="h-4 w-7 rounded border border-amber-300 bg-amber-50" />
          </div>
          <div className="mx-1.5 mt-1 h-1 w-8 rounded-sm bg-amber-500" />
          <TableMini head="bg-slate-900" />
          <div className="mx-1.5 mt-1 flex gap-0.5">
            <div className="h-2 flex-1 rounded-sm bg-slate-100" />
            <div className="h-2 w-8 rounded-sm bg-slate-900" />
          </div>
        </ThumbFrame>
      );
    case "modern":
      return (
        <ThumbFrame body="bg-white">
          <div className="h-[38%] bg-gradient-to-r from-sky-500 to-blue-600 px-1.5 pt-1">
            <div className="flex justify-between">
              <div className="h-2 w-8 rounded-sm bg-white/40" />
              <div className="h-3 w-6 rounded-sm bg-white/30" />
            </div>
          </div>
          <div className="mx-1.5 -mt-1 rounded-md bg-white shadow ring-1 ring-slate-200">
            <div className="h-3 px-1 pt-0.5 text-[5px] text-sky-600">Client</div>
          </div>
          <ListMini />
          <BannerMini className="bg-sky-600" />
        </ThumbFrame>
      );
    case "minimal":
      return (
        <ThumbFrame body="bg-white">
          <div className="border-b-2 border-black px-1.5 py-1">
            <div className="h-2 w-10 rounded-sm bg-neutral-800" />
          </div>
          <div className="space-y-1 px-1.5 pt-1">
            <RuleMini />
            <RuleMini />
            <RuleMini short />
          </div>
          <div className="mx-1.5 mt-auto border-t-2 border-black pt-1">
            <div className="ml-auto h-1.5 w-8 rounded-sm bg-neutral-900" />
          </div>
        </ThumbFrame>
      );
    case "executive":
      return (
        <ThumbFrame body="bg-neutral-50">
          <div className="h-[32%] bg-neutral-900 px-1.5 pt-1">
            <div className="ml-auto h-2 w-8 rounded-sm bg-amber-400/80" />
          </div>
          <div className="mx-1.5 mt-1 grid grid-cols-2 gap-0.5">
            <div className="h-4 rounded border border-amber-200 bg-amber-50" />
            <div className="h-4 rounded bg-slate-100" />
          </div>
          <TableMini head="bg-neutral-900" compact />
          <div className="mx-4 mt-1 h-4 rounded-md bg-neutral-900" />
        </ThumbFrame>
      );
    case "corporate":
      return (
        <ThumbFrame body="bg-white ring-2 ring-indigo-950/20">
          <div className="m-0.5 grid grid-cols-2 gap-px border border-indigo-200">
            <div className="h-4 bg-indigo-50" />
            <div className="h-4 bg-white" />
          </div>
          <div className="mx-0.5 h-2 bg-indigo-950/10" />
          <TableMini head="bg-indigo-950" />
          <div className="mx-0.5 mt-0.5 h-2 bg-indigo-950" />
        </ThumbFrame>
      );
    case "fresh":
      return (
        <ThumbFrame body="bg-emerald-50/40">
          <div className="mx-0.5 mt-0.5 rounded-lg bg-white p-1 shadow-sm">
            <div className="flex items-center gap-0.5">
              <div className="h-2.5 w-2.5 rounded-md bg-emerald-500" />
              <div className="h-1.5 flex-1 rounded-sm bg-emerald-100" />
              <div className="h-2 w-5 rounded-full bg-emerald-100" />
            </div>
          </div>
          <div className="mx-0.5 mt-0.5 grid grid-cols-2 gap-0.5">
            <div className="h-3 rounded-lg bg-white ring-1 ring-emerald-100" />
            <div className="h-3 rounded-lg bg-emerald-500" />
          </div>
          <PillsMini />
          <BannerMini className="rounded-lg bg-emerald-500" />
        </ThumbFrame>
      );
    case "warm":
      return (
        <ThumbFrame body="bg-[#fffaf5]">
          <div className="border-b-2 border-orange-500 px-1.5 py-0.5">
            <div className="h-2 w-12 rounded-sm bg-orange-900/80" />
          </div>
          <div className="mx-1.5 my-1 border-l-2 border-orange-500 pl-1">
            <div className="h-1.5 w-8 rounded-sm bg-orange-200" />
          </div>
          <ListMini warm />
          <div className="mr-1.5 mt-auto flex justify-end">
            <div className="h-4 w-4 rounded-full bg-orange-600" />
          </div>
        </ThumbFrame>
      );
    case "ocean":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex h-full">
            <div className="w-[18%] bg-gradient-to-b from-teal-800 to-cyan-900" />
            <div className="relative flex-1 p-1">
              <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-cyan-500" />
              <div className="mt-2 h-3 rounded bg-cyan-50" />
              <ListMini className="mt-1" />
              <BannerMini className="mt-auto bg-teal-700" />
            </div>
          </div>
        </ThumbFrame>
      );
    case "slate":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex justify-between px-1.5 pt-1">
            <div className="h-1.5 w-8 rounded-sm bg-slate-700" />
            <div className="h-2 w-5 rounded-sm bg-slate-200" />
          </div>
          <div className="mx-1.5 mt-1 border-l-2 border-slate-500 pl-1">
            <div className="h-1.5 w-6 rounded-sm bg-slate-300" />
          </div>
          <ol className="mx-2 mt-1 list-decimal space-y-0.5 text-[4px] text-slate-400">
            <li>—</li>
            <li>—</li>
            <li>—</li>
          </ol>
          <div className="mx-1.5 mt-auto h-1.5 w-14 rounded-sm bg-slate-700" />
        </ThumbFrame>
      );
    case "royal":
      return (
        <ThumbFrame body="bg-violet-50/30 ring-1 ring-violet-200">
          <div className="pt-1 text-center">
            <div className="mx-auto h-3 w-3 rounded-full bg-violet-600" />
            <div className="mx-auto mt-0.5 h-1 w-10 rounded-sm bg-violet-300" />
          </div>
          <div className="mx-3 my-0.5 rounded border border-violet-200 py-0.5">
            <div className="mx-auto h-1 w-6 rounded-sm bg-violet-200" />
          </div>
          <TableMini head="bg-gradient-to-r from-violet-700 to-purple-700" />
          <div className="mx-4 mt-0.5 border border-double border-violet-400 py-0.5">
            <div className="mx-auto h-1 w-6 rounded-sm bg-violet-400" />
          </div>
        </ThumbFrame>
      );
    case "geometric":
      return (
        <ThumbFrame body="bg-white">
          <div className="relative flex justify-between px-1.5 pt-1">
            <div className="h-2 w-8 rounded-sm bg-neutral-800" />
            <div className="h-0 w-0 border-b-[14px] border-l-[14px] border-b-neutral-300 border-l-transparent opacity-60" />
          </div>
          <div className="mx-1.5 mt-0.5 flex gap-0.5">
            <div className="h-3 flex-1 rounded-sm bg-neutral-100" />
            <div className="h-3 w-6 rounded-sm bg-neutral-900" />
          </div>
          <TableMini head="bg-neutral-900" compact />
          <div className="mx-1.5 mt-0.5 h-2.5 rounded-sm bg-neutral-900" />
        </ThumbFrame>
      );
    case "stripe":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex h-full">
            <div className="w-[14%] bg-teal-600" />
            <div className="flex flex-1 flex-col p-1">
              <div className="ml-auto h-2 w-8 rounded-sm bg-neutral-200/80" />
              <div className="mt-1 grid grid-cols-2 gap-0.5">
                <div className="h-3 rounded-sm bg-teal-50" />
                <div className="h-3 rounded-sm bg-neutral-100" />
              </div>
              <TableMini head="bg-teal-600" compact />
              <BannerMini className="mt-auto bg-teal-700" />
            </div>
          </div>
        </ThumbFrame>
      );
    case "gradient":
      return (
        <ThumbFrame body="bg-white">
          <div className="h-[30%] bg-gradient-to-br from-emerald-300 to-cyan-400 px-1 pt-0.5">
            <div className="h-2 w-8 rounded-sm bg-white/50" />
          </div>
          <div className="mx-1 -mt-0.5 h-2 rounded-sm bg-emerald-700/80" />
          <TableMini head="bg-emerald-700" compact />
          <div className="mt-auto h-[18%] bg-gradient-to-r from-cyan-400 to-emerald-300" />
        </ThumbFrame>
      );
    case "interim":
      return (
        <ThumbFrame body="bg-white">
          <div className="pt-1 text-center">
            <div className="mx-auto h-1.5 w-10 rounded-sm bg-neutral-700" />
          </div>
          <div className="mx-1.5 mt-1 grid grid-cols-2 gap-0.5">
            <div className="h-3 rounded-sm bg-neutral-100" />
            <div className="h-3 rounded-sm bg-neutral-50" />
          </div>
          <TableMini head="bg-emerald-800" />
          <BannerMini className="bg-emerald-800" />
        </ThumbFrame>
      );
    case "bluepro":
      return (
        <ThumbFrame body="bg-white">
          <div className="grid grid-cols-2 gap-px bg-blue-900/20 p-px">
            <div className="h-3 bg-blue-900" />
            <div className="h-3 bg-blue-900" />
          </div>
          <TableMini head="bg-blue-900" />
          <div className="mx-1.5 mt-0.5 grid grid-cols-2 gap-0.5">
            <div className="h-3 rounded-sm bg-blue-50" />
            <div className="h-3 rounded-sm bg-neutral-100" />
          </div>
        </ThumbFrame>
      );
    case "studio":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex items-center gap-1 px-1.5 pt-1">
            <div className="h-3 w-4 rounded-sm bg-indigo-500" />
            <div className="h-2 flex-1 rounded-sm bg-neutral-800" />
          </div>
          <div className="mx-1.5 h-0.5 bg-indigo-500" />
          <div className="mx-1.5 mt-0.5 h-2 w-8 rounded-sm bg-neutral-800" />
          <ListMini className="mt-0.5" />
          <BannerMini className="bg-indigo-500" />
        </ThumbFrame>
      );
    case "ledger":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex justify-between px-1.5 pt-1">
            <div className="h-3 w-3 rounded-full bg-teal-800" />
            <div className="space-y-0.5 text-right">
              <div className="ml-auto h-1.5 w-8 rounded-sm bg-neutral-800" />
              <div className="ml-auto h-1 w-10 rounded-sm bg-neutral-300" />
            </div>
          </div>
          <div className="mx-auto mt-0.5 h-1.5 w-8 rounded-sm bg-neutral-500" />
          <div className="mx-1.5 mt-0.5 h-2 bg-teal-950" />
          <TableMini head="bg-teal-950" compact />
          <div className="mx-1.5 mt-0.5 ml-auto h-2 w-8 rounded-sm bg-neutral-800" />
        </ThumbFrame>
      );
    case "folio":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex h-[28%] items-center justify-between gap-1 bg-amber-500/90 px-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
            <div className="h-1.5 w-6 rounded-sm bg-white/80" />
            <div className="h-2 w-7 rounded-sm bg-white/50" />
          </div>
          <div className="flex justify-end bg-neutral-100 px-1.5 py-0.5">
            <div className="h-1.5 w-10 rounded-sm bg-neutral-800" />
          </div>
          <div className="mx-1.5 mt-0.5 grid grid-cols-2 gap-1">
            <div className="h-3 rounded-sm bg-neutral-100" />
            <div className="space-y-0.5">
              <div className="ml-auto h-1 w-8 rounded-sm bg-neutral-300" />
              <div className="ml-auto h-1 w-6 rounded-sm bg-neutral-400" />
            </div>
          </div>
          <div className="mx-1.5 mt-0.5 h-px bg-neutral-200" />
          <ListMini className="mt-0.5" />
          <div className="mx-1.5 mt-0.5 ml-auto h-3 w-10 rounded-sm bg-neutral-100" />
        </ThumbFrame>
      );
    case "ruby":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex justify-between px-1.5 pt-1.5">
            <div className="space-y-0.5">
              <div className="h-1 w-6 rounded-sm bg-rose-600" />
              <div className="h-1.5 w-8 rounded-sm bg-neutral-800" />
            </div>
            <div className="space-y-0.5 text-right">
              <div className="ml-auto h-2 w-8 rounded-sm bg-rose-600" />
              <div className="ml-auto h-1 w-6 rounded-sm bg-neutral-300" />
            </div>
          </div>
          <div className="mx-1.5 mt-1 grid grid-cols-2 gap-1">
            <div className="space-y-0.5">
              <div className="h-1 w-7 rounded-sm bg-rose-500/80" />
              <div className="h-1 w-5 rounded-sm bg-neutral-300" />
            </div>
            <div className="border-t border-r border-rose-600 p-0.5">
              <div className="h-1 w-full rounded-sm bg-rose-600" />
              <div className="mt-0.5 h-1.5 w-full rounded-sm bg-neutral-800" />
            </div>
          </div>
          <div className="mx-1.5 mt-1 h-px bg-rose-600/70" />
          <ListMini className="mt-0.5" />
          <div className="mx-1.5 mt-0.5 ml-auto h-2.5 w-10 rounded-sm bg-rose-600" />
        </ThumbFrame>
      );
    case "quill":
      return (
        <ThumbFrame body="bg-white">
          <div className="flex justify-between px-1.5 pt-1.5">
            <div className="h-4 w-4 rounded-sm border border-dashed border-slate-300 bg-slate-50" />
            <div className="space-y-0.5 text-right">
              <div className="ml-auto h-2 w-9 rounded-sm bg-slate-900" />
              <div className="ml-auto h-1 w-5 rounded-sm bg-slate-400" />
            </div>
          </div>
          <div className="mx-1.5 mt-1 space-y-0.5">
            <div className="h-1 w-10 rounded-sm bg-slate-700" />
            <div className="h-1 w-8 rounded-sm bg-slate-300" />
          </div>
          <div className="mx-1.5 mt-1 grid grid-cols-2 gap-1">
            <div className="space-y-0.5">
              <div className="h-1 w-6 rounded-sm bg-slate-400" />
              <div className="h-1.5 w-9 rounded-sm bg-slate-200" />
            </div>
            <div className="space-y-0.5">
              <div className="ml-auto h-1 w-8 rounded-sm bg-slate-300" />
              <div className="ml-auto h-1 w-7 rounded-sm bg-slate-300" />
              <div className="ml-auto h-1 w-6 rounded-sm bg-slate-300" />
            </div>
          </div>
          <TableMini head="bg-slate-900" compact />
          <div className="mx-1.5 mt-0.5 flex justify-between">
            <div className="h-2 w-8 rounded-sm bg-slate-100" />
            <div className="h-2 w-7 rounded-sm bg-slate-800" />
          </div>
        </ThumbFrame>
      );
    default:
      return null;
  }
}

function ThumbFrame({ body, children }: { body: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-[88px] flex-col overflow-hidden rounded-xl border border-black/[0.06] shadow-inner",
        body,
      )}
    >
      {children}
    </div>
  );
}

function TableMini({ head, compact }: { head: string; compact?: boolean }) {
  return (
    <div className={cn("mx-1.5 space-y-px", compact ? "mt-0.5" : "mt-1")}>
      <div className={cn("h-2 rounded-sm", head)} />
      <div className="h-1 rounded-sm bg-slate-100" />
      <div className="h-1 rounded-sm bg-slate-50" />
    </div>
  );
}

function ListMini({ warm, className }: { warm?: boolean; className?: string }) {
  return (
    <div className={cn("space-y-0.5 px-1.5 pt-1", className)}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "flex justify-between rounded-sm px-0.5 py-0.5",
            warm ? "border-b border-orange-100" : "bg-sky-50/50",
          )}
        >
          <div className="h-1 w-8 rounded-sm bg-slate-200" />
          <div className="h-1 w-3 rounded-sm bg-slate-300" />
        </div>
      ))}
    </div>
  );
}

function PillsMini() {
  return (
    <div className="space-y-0.5 px-1 pt-1">
      {[1, 2].map((i) => (
        <div key={i} className="mx-0.5 flex justify-between rounded-full bg-white px-1 py-0.5 ring-1 ring-emerald-50">
          <div className="h-1 w-10 rounded-full bg-emerald-100" />
          <div className="h-1 w-3 rounded-full bg-emerald-300" />
        </div>
      ))}
    </div>
  );
}

function BannerMini({ className }: { className: string }) {
  return <div className={cn("mx-1.5 mt-1 h-2.5 rounded-sm", className)} />;
}

function RuleMini({ short }: { short?: boolean }) {
  return (
    <div className="flex justify-between border-b border-neutral-200 pb-0.5">
      <div className={cn("h-1 rounded-sm bg-neutral-300", short ? "w-6" : "w-10")} />
      <div className="h-1 w-3 rounded-sm bg-neutral-400" />
    </div>
  );
}
