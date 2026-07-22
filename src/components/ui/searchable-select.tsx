"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { inputClass } from "@/lib/design";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; hint?: string };

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner…",
  disabled,
  className,
  triggerClassName,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.value.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          triggerClassName ?? inputClass,
          "flex items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={selected ? "text-ink" : "text-[#9CA3AF]"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
      </button>

      {open && !disabled ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
            <div className="border-b border-[#F3F4F6] p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-8 w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] pl-8 pr-2 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[#9CA3AF]">Aucun résultat</li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-[#F9FAFB]",
                        opt.value === value && "bg-[#F3F4F6] font-medium",
                      )}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      {opt.label}
                      {opt.hint ? (
                        <span className="ml-1 text-xs text-[#9CA3AF]">({opt.hint})</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
