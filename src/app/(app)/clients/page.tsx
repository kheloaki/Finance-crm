import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";
import ClientsPageClient from "./ClientsPageClient";

export default function ClientsPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ClientsPageClient />
    </Suspense>
  );
}
