import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
  SkeletonIcon,
  SkeletonInput,
  SkeletonLine,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cardClass, innerCardClass, panelClass } from "@/lib/design";
import { cn } from "@/lib/utils";

const ROW_WIDTHS = ["w-[72%]", "w-[58%]", "w-[84%]", "w-[65%]", "w-[78%]", "w-[52%]", "w-[70%]", "w-[61%]"];

function SkeletonActionIcons({ count = 3 }: { count?: number }) {
  return (
    <div className="ml-auto flex items-center justify-end gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonIcon key={i} size="sm" className="h-8 w-8 rounded-xl" />
      ))}
    </div>
  );
}

function DocumentTableRowSkeleton({ index }: { index: number }) {
  const w = ROW_WIDTHS[index % ROW_WIDTHS.length];
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <SkeletonLine size="sm" className={cn("max-w-[88px]", w)} />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <SkeletonLine size="sm" className="max-w-[100px]" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <SkeletonLine size="xs" className="max-w-[72px]" />
      </TableCell>
      <TableCell>
        <SkeletonBadge className="w-[52px]" />
      </TableCell>
      <TableCell className="text-right">
        <SkeletonLine size="sm" className="ml-auto max-w-[64px]" />
      </TableCell>
      <TableCell className="w-[120px]">
        <SkeletonActionIcons />
      </TableCell>
    </TableRow>
  );
}

function RecentDocRowSkeleton({ index }: { index: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <SkeletonBadge className="w-[56px]" />
      </TableCell>
      <TableCell>
        <SkeletonLine size="sm" className={cn("max-w-[80px]", ROW_WIDTHS[index % ROW_WIDTHS.length])} />
      </TableCell>
      <TableCell>
        <SkeletonLine size="sm" className="max-w-[120px]" />
      </TableCell>
      <TableCell>
        <SkeletonLine size="xs" className="max-w-[68px]" />
      </TableCell>
      <TableCell>
        <SkeletonBadge className="w-[48px]" />
      </TableCell>
      <TableCell className="text-right">
        <SkeletonLine size="sm" className="ml-auto max-w-[72px]" />
      </TableCell>
    </TableRow>
  );
}

function EntityTableRowSkeleton({ index }: { index: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <SkeletonLine size="sm" className={cn("max-w-[140px]", ROW_WIDTHS[index % ROW_WIDTHS.length])} />
      </TableCell>
      <TableCell>
        <SkeletonLine size="xs" className="max-w-[88px]" />
      </TableCell>
      <TableCell>
        <SkeletonLine size="xs" className="max-w-[72px]" />
      </TableCell>
      <TableCell>
        <SkeletonLine size="xs" className="max-w-[64px]" />
      </TableCell>
      <TableCell className="text-right">
        <div className="ml-auto flex justify-end gap-2">
          <SkeletonLine size="xs" className="w-14" />
          <SkeletonLine size="xs" className="w-16" />
        </div>
      </TableCell>
    </TableRow>
  );
}

/** A4 document preview placeholder */
function SkeletonDocumentPreview() {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className={cn(cardClass, "overflow-hidden p-0")}>
        <div className="border-b border-black/[0.06] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-10 w-10" rounded="lg" />
            <div className="flex-1 space-y-2">
              <SkeletonLine size="xs" className="ml-auto max-w-[80px]" />
              <SkeletonLine size="sm" className="ml-auto max-w-[100px]" />
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <SkeletonLine size="xs" className="w-12" />
              <SkeletonLine size="sm" className="w-full" />
              <SkeletonLine size="xs" className="w-[80%]" />
            </div>
            <div className="space-y-1.5">
              <SkeletonLine size="xs" className="w-14" />
              <SkeletonLine size="sm" className="w-full" />
            </div>
          </div>
          <Skeleton className="mt-2 h-24 w-full" rounded="lg" />
          <div className="flex justify-end pt-2">
            <Skeleton className="h-16 w-28" rounded="lg" />
          </div>
        </div>
        <div className="border-t border-black/[0.06] px-4 py-2">
          <SkeletonLine size="xs" className="mx-auto max-w-[180px]" />
        </div>
      </div>
    </div>
  );
}

export function DataTableSkeleton({
  rows = 6,
  headers,
  className,
  variant = "default",
}: {
  rows?: number;
  headers: string[];
  className?: string;
  variant?: "default" | "documents" | "recent" | "entity";
}) {
  const Row =
    variant === "documents"
      ? DocumentTableRowSkeleton
      : variant === "recent"
        ? RecentDocRowSkeleton
        : variant === "entity"
          ? EntityTableRowSkeleton
          : ({ index }: { index: number }) => (
              <TableRow className="hover:bg-transparent">
                {headers.map((head, col) => (
                  <TableCell key={`${index}-${head}`}>
                    <SkeletonLine
                      size="sm"
                      className={cn(
                        col === 0 && "max-w-[100px]",
                        col === headers.length - 1 && "ml-auto max-w-[72px]",
                        col > 0 && col < headers.length - 1 && "max-w-[110px]",
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            );

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {headers.map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, row) => (
          <Row key={row} index={row} />
        ))}
      </TableBody>
    </Table>
  );
}

export function EntityCrudSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader actions={1} />
      <div className={panelClass}>
        <SkeletonInput className="mb-4 max-w-sm" />
        <DataTableSkeleton
          variant="entity"
          headers={["Nom", "ICE", "Ville", "Actions"]}
          rows={7}
          className="rounded-none border-0"
        />
      </div>
    </div>
  );
}

export function DocumentListSkeleton() {
  return (
    <DataTableSkeleton
      variant="documents"
      headers={["Numéro", "Contrepartie", "Date", "Statut", "Montant", "Actions"]}
      rows={8}
      className="rounded-none border-0"
    />
  );
}

export function RecentDocumentsTableSkeleton() {
  return (
    <DataTableSkeleton
      variant="recent"
      headers={["Type", "Numéro", "Contrepartie", "Date", "Statut", "Montant TTC"]}
      rows={6}
    />
  );
}

export function SettingsFormSkeleton() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SkeletonLine size="md" className="max-w-[160px]" />
        <SkeletonLine size="sm" className="max-w-[320px]" />
        <div className="flex items-start gap-4 rounded-xl border border-black/[0.08] bg-[#FAFBFC] p-4">
          <Skeleton className="h-[120px] w-[140px] shrink-0" rounded="xl" />
          <div className="min-w-0 flex-1 space-y-3 pt-1">
            <SkeletonLine size="sm" className="max-w-[140px]" />
            <SkeletonLine size="xs" className="max-w-full" />
            <SkeletonLine size="xs" className="max-w-[85%]" />
            <div className="flex gap-2 pt-1">
              <SkeletonButton size="sm" className="w-[100px]" />
              <Skeleton className="h-7 w-7" rounded="full" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine size="xs" className="max-w-[88px]" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
        ))}
      </section>

      <div className="flex gap-3 border-t border-black/[0.06] pt-6">
        <SkeletonButton className="w-36" />
        <SkeletonButton className="w-24" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={panelClass}>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 shrink-0 bg-emerald-100/80" rounded="xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine size="lg" className="max-w-[56px]" />
              <SkeletonLine size="xs" className="max-w-[96px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  const heights = [88, 132, 64, 148, 96, 112];
  return (
    <div className="flex h-52 items-end gap-2 border-t border-[#F3F4F6] pt-4">
      {heights.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="w-full max-w-[48px] rounded-t-md rounded-b-sm" style={{ height: h }} />
          <SkeletonLine size="xs" className="max-w-[28px]" />
          <SkeletonLine size="xs" className="max-w-[16px]" />
        </div>
      ))}
    </div>
  );
}

export function ShellLoadingSkeleton() {
  return (
    <div className="app-backdrop flex h-[100dvh] flex-col gap-1 p-1">
      {/* Top bar */}
      <div className="glass-panel flex h-11 shrink-0 items-center justify-between rounded-2xl px-2.5 sm:h-12 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-8 w-8" rounded="lg" />
          <Skeleton className="h-8 w-[120px]" rounded="full" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonIcon size="sm" />
          <Skeleton className="h-8 w-[min(140px,28vw)]" rounded="full" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-1">
        {/* Desktop sidebar */}
        <div className="hidden w-[240px] shrink-0 lg:block">
          <div className="glass-panel-subtle h-full overflow-hidden rounded-2xl p-2">
            <SkeletonInput className="mb-3 mx-1" />
            <div className="space-y-1 px-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
                  <SkeletonIcon size="sm" className="h-[18px] w-[18px] rounded-md" />
                  <SkeletonLine size="sm" className={cn("flex-1", i % 3 === 0 ? "max-w-[80%]" : "max-w-[65%]")} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="glass-main min-w-0 flex-1 overflow-hidden rounded-xl">
          <div className="h-full overflow-y-auto p-4 sm:p-5">
            <SkeletonPageHeader actions={3} />
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={innerCardClass}>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-9 w-9 shrink-0" rounded="xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonLine size="sm" className="max-w-[120px]" />
                      <SkeletonLine size="xs" className="max-w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <DashboardStatsSkeleton />
            </div>
            <div className={cn(cardClass, "mt-6 p-5")}>
              <ChartSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="shrink-0 lg:hidden">
        <div className="glass-panel-subtle flex justify-around rounded-2xl px-1 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1 py-2">
              <SkeletonIcon size="sm" />
              <SkeletonLine size="xs" className="max-w-[40px]" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageContentSkeleton() {
  return (
    <div className="space-y-6 p-1 sm:p-1.5">
      <EntityCrudSkeleton />
    </div>
  );
}

export function InlineDatasheetSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FAFBFC] px-3 py-2">
        <SkeletonIcon size="sm" className="h-3.5 w-3.5 rounded-md" />
        <Skeleton className="h-4 flex-1" rounded="sm" />
        <SkeletonButton size="sm" className="h-7 w-[72px]" />
      </div>
      <div className="divide-y divide-black/[0.04]">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="flex items-center gap-2 px-3 py-2.5">
            <Skeleton className="h-4 w-4 shrink-0" rounded="sm" />
            {Array.from({ length: Math.max(1, columns - 1) }).map((__, col) => (
              <Skeleton
                key={col}
                className={cn("h-8 flex-1", col === 0 && "max-w-[120px]")}
                rounded="lg"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentListPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SkeletonPageHeader compact actions={1} />
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-black/[0.06] p-4">
            <SkeletonInput className="max-w-full" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <DocumentListSkeleton />
          </div>
        </section>
        <section className="hidden min-h-0 w-[min(520px,46%)] shrink-0 border-l border-black/[0.06] bg-[#F8F9FA] lg:flex lg:flex-col">
          <div className="border-b border-black/[0.06] bg-white/80 px-3 py-2">
            <SkeletonLine size="xs" className="max-w-[80px]" />
          </div>
          <div className="flex flex-1 items-start justify-center p-4">
            <SkeletonDocumentPreview />
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <ul className="py-1" role="presentation">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center gap-2 px-3 py-2.5">
          <SkeletonLine size="sm" className={cn("flex-1", ROW_WIDTHS[i % ROW_WIDTHS.length], "max-w-[180px]")} />
          {i === 0 ? <Skeleton className="h-4 w-4 shrink-0" rounded="full" /> : null}
        </li>
      ))}
    </ul>
  );
}
