"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { trimImageDataUrl } from "@/lib/image-trim";
import { cn } from "@/lib/utils";

const logoCache = new Map<string, string>();

/**
 * Renders a company logo after trimming empty white/transparent padding
 * so the graphic fills the display box.
 */
export function TrimmedLogoImage({
  src,
  className,
  style,
  alt = "",
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}) {
  const [displaySrc, setDisplaySrc] = useState(() => logoCache.get(src) ?? src);

  useEffect(() => {
    let cancelled = false;
    const cached = logoCache.get(src);
    if (cached) {
      setDisplaySrc(cached);
      return;
    }

    setDisplaySrc(src);

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : null);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (!dataUrl || cancelled) return;
        const trimmed = await trimImageDataUrl(dataUrl);
        if (!trimmed || cancelled) return;
        logoCache.set(src, trimmed.dataUrl);
        setDisplaySrc(trimmed.dataUrl);
      } catch {
        /* keep original */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={displaySrc} alt={alt} className={cn(className)} style={style} />
  );
}
