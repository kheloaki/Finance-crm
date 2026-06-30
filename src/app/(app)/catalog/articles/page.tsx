import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";
import CatalogPageClient from "./CatalogPageClient";

export default function ArticlesPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <CatalogPageClient kind="article" />
    </Suspense>
  );
}
