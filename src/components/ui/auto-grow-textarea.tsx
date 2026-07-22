"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
  /** Minimum visible rows (defaults to one line). */
  minRows?: number;
};

/** Text field that wraps like Excel and grows a new line when content fills the width. */
export function AutoGrowTextarea({
  className,
  value,
  minRows = 1,
  onChange,
  style,
  ...props
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;

    // Native content sizing when supported (Chrome/Safari recent).
    if (typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content")) {
      el.style.height = "";
      return;
    }

    const styles = window.getComputedStyle(el);
    const fontSize = Number.parseFloat(styles.fontSize) || 12;
    const rawLh = styles.lineHeight;
    const parsedLh = Number.parseFloat(rawLh);
    const lineHeight =
      rawLh === "normal" || !Number.isFinite(parsedLh)
        ? fontSize * 1.35
        : parsedLh < 8
          ? // Unitless line-height (e.g. "1.35") → convert to px
            parsedLh * fontSize
          : parsedLh;
    const padY =
      (Number.parseFloat(styles.paddingTop) || 0) +
      (Number.parseFloat(styles.paddingBottom) || 0);
    const minHeight = lineHeight * minRows + padY;

    // Collapse first so scrollHeight reflects wrapped content at current width.
    el.style.height = "0px";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }

  useLayoutEffect(() => {
    resize();
  }, [value, minRows]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => resize());
    ro.observe(el);
    // Parent width changes (table column) also need a remeasure.
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [minRows]);

  const mergedStyle: CSSProperties = {
    minHeight: `${minRows * 1.35}em`,
    ...style,
  };

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={minRows}
      wrap="soft"
      style={mergedStyle}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resize);
      }}
      className={cn(
        "box-border block w-full max-w-full resize-none overflow-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] [field-sizing:content]",
        className,
      )}
    />
  );
}
