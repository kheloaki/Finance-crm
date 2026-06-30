"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export const APP_NAME = "FINANCE CRM";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show wordmark beside the mark (default: true for md/lg, false for sm) */
  showWordmark?: boolean;
};

function LogoMark({ className, gradientId }: { className?: string; gradientId: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${gradientId}-accent`} x1="22" y1="28" x2="36" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
      <path d="M12 10h14v3.2H15.2v4.8H25v3.2H15.2V30H12V10Z" fill="white" />
      <rect x="25.5" y="27" width="2.75" height="5" rx="0.75" fill="#34d399" opacity="0.9" />
      <rect x="29.25" y="23.5" width="2.75" height="8.5" rx="0.75" fill="#10b981" />
      <rect x="33" y="19.5" width="2.75" height="12.5" rx="0.75" fill={`url(#${gradientId}-accent)`} />
    </svg>
  );
}

export function AppLogo({ size = "md", className, showWordmark }: AppLogoProps) {
  const gradientId = useId().replace(/:/g, "");
  const wordmark = showWordmark ?? size !== "sm";

  const markSize =
    size === "sm" ? "h-8 w-8" : size === "md" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label={APP_NAME}
      role="img"
    >
      <LogoMark className={markSize} gradientId={gradientId} />

      {wordmark ? (
        <div className="min-w-0 leading-none">
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.18em] text-[#6B7280]",
              size === "lg" ? "text-[10px]" : "text-[8px]",
            )}
          >
            Finance
          </p>
          <p
            className={cn(
              "font-black uppercase tracking-[0.06em] text-brand",
              size === "lg" ? "mt-1 text-lg" : "mt-0.5 text-sm",
            )}
          >
            CRM
          </p>
        </div>
      ) : null}
    </div>
  );
}
