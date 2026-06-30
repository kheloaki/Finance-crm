import { cn } from "@/lib/utils";

type SkeletonRounded = "none" | "sm" | "md" | "lg" | "xl" | "full";

const roundedClass: Record<SkeletonRounded, string> = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({
  className,
  rounded = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rounded?: SkeletonRounded }) {
  return (
    <div
      className={cn("skeleton-shimmer bg-[#E8EBF0]", roundedClass[rounded], className)}
      aria-hidden
      {...props}
    />
  );
}

/** Single text line — width varies like real copy */
export function SkeletonLine({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const h =
    size === "xs"
      ? "h-2.5"
      : size === "sm"
        ? "h-3.5"
        : size === "md"
          ? "h-4"
          : size === "lg"
            ? "h-5"
            : "h-7";
  return <Skeleton className={cn(h, "w-full", className)} rounded="sm" />;
}

export function SkeletonIcon({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return <Skeleton className={cn(dim, "shrink-0", className)} rounded="lg" />;
}

export function SkeletonBadge({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-16", className)} rounded="full" />;
}

export function SkeletonButton({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "sm" ? "h-7" : size === "lg" ? "h-10" : "h-9";
  return <Skeleton className={cn(h, "w-24", className)} rounded="xl" />;
}

export function SkeletonInput({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <SkeletonIcon size="sm" className="absolute left-3 top-1/2 z-[1] -translate-y-1/2 opacity-70" />
      <Skeleton className="h-9 w-full pl-10" rounded="xl" />
    </div>
  );
}

/** Page title block — title + optional subtitle lines */
export function SkeletonPageHeader({
  compact,
  actions = 1,
}: {
  compact?: boolean;
  actions?: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <SkeletonLine size={compact ? "lg" : "xl"} className="max-w-[220px]" />
        <SkeletonLine size="sm" className="max-w-[min(100%,420px)]" />
        {!compact ? <SkeletonLine size="xs" className="max-w-[280px]" /> : null}
      </div>
      {actions > 0 ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actions }).map((_, i) => (
            <SkeletonButton key={i} size="sm" className={i === 0 ? "w-28" : "w-20"} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
