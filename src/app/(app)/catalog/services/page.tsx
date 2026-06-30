import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";
import CatalogPageClient from "../articles/CatalogPageClient";

export default function ServicesPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <CatalogPageClient kind="service" />
    </Suspense>
  );
}
