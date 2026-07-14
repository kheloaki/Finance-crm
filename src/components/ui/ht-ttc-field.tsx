"use client";

import { useEffect, useState } from "react";
import { formatMoney, htToTtc, ttcToHt } from "@/lib/money";
import { inputClass, inputDenseClass, labelClass } from "@/lib/design";
import { cn } from "@/lib/utils";

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

export function HtTtcField({
  valueHt,
  vatRate,
  onChangeHt,
  disabled,
  className,
  compact,
  showLabels = true,
  hint,
  fieldClassName,
}: {
  valueHt: number;
  vatRate: number;
  onChangeHt: (v: number) => void;
  disabled?: boolean;
  className?: string;
  /** Dense inputs for table cells */
  compact?: boolean;
  showLabels?: boolean;
  hint?: string;
  fieldClassName?: string;
}) {
  const ttc = htToTtc(valueHt, vatRate);
  const [htDraft, setHtDraft] = useState("");
  const [ttcDraft, setTtcDraft] = useState("");
  const [editing, setEditing] = useState<"ht" | "ttc" | null>(null);

  useEffect(() => {
    if (editing !== "ht") {
      setHtDraft(valueHt === 0 ? "" : String(valueHt));
    }
    if (editing !== "ttc") {
      setTtcDraft(ttc === 0 ? "" : String(ttc));
    }
  }, [valueHt, ttc, editing]);

  function commitHt(raw: string) {
    const n = parseAmount(raw);
    onChangeHt(n ?? 0);
  }

  function commitTtc(raw: string) {
    const n = parseAmount(raw);
    onChangeHt(n == null ? 0 : ttcToHt(n, vatRate));
  }

  const fieldClass = cn(
    fieldClassName ?? (compact ? inputDenseClass : inputClass),
    "tabular-nums text-right",
  );

  return (
    <div
      className={cn(
        compact ? "grid grid-cols-2 gap-1" : "grid grid-cols-2 gap-2",
        className,
      )}
    >
      <div>
        {showLabels && !compact ? (
          <label className={cn(labelClass, "text-[10px]")}>HT</label>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className={cn(fieldClass, showLabels && !compact && "mt-0.5")}
          value={editing === "ht" ? htDraft : valueHt === 0 ? "" : String(valueHt)}
          onFocus={() => {
            setEditing("ht");
            setHtDraft(valueHt === 0 ? "" : String(valueHt));
          }}
          onBlur={() => {
            commitHt(htDraft);
            setEditing(null);
          }}
          onChange={(e) => {
            setHtDraft(e.target.value);
            const n = parseAmount(e.target.value);
            if (n != null) onChangeHt(n);
          }}
          placeholder="HT"
          title="Montant HT"
        />
      </div>
      <div>
        {showLabels && !compact ? (
          <label className={cn(labelClass, "text-[10px]")}>TTC</label>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className={cn(fieldClass, showLabels && !compact && "mt-0.5")}
          value={editing === "ttc" ? ttcDraft : ttc === 0 ? "" : String(ttc)}
          onFocus={() => {
            setEditing("ttc");
            setTtcDraft(ttc === 0 ? "" : String(ttc));
          }}
          onBlur={() => {
            commitTtc(ttcDraft);
            setEditing(null);
          }}
          onChange={(e) => {
            setTtcDraft(e.target.value);
            const n = parseAmount(e.target.value);
            if (n != null) onChangeHt(ttcToHt(n, vatRate));
          }}
          placeholder="TTC"
          title="Montant TTC"
        />
      </div>
      {!compact && (hint || valueHt > 0) ? (
        <p className="col-span-2 text-right text-[10px] tabular-nums text-[#9CA3AF]">
          {hint ??
            `TVA ${vatRate}% · HT ${formatMoney(valueHt)} → TTC ${formatMoney(ttc)}`}
        </p>
      ) : null}
    </div>
  );
}

/** Read-only HT + TTC display for tables */
export function HtTtcDisplay({ valueHt, vatRate }: { valueHt: number; vatRate: number }) {
  if (!valueHt) return <span className="text-[#9CA3AF]">—</span>;
  return (
    <div className="tabular-nums">
      <div className="text-sm">{formatMoney(valueHt)} HT</div>
      <div className="text-xs text-[#9CA3AF]">{formatMoney(htToTtc(valueHt, vatRate))} TTC</div>
    </div>
  );
}
