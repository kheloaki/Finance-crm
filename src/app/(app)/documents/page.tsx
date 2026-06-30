import { Suspense } from "react";
import { AllDocumentsPage } from "@/components/documents/AllDocumentsPage";
import { DocumentListPageSkeleton } from "@/components/ui/loading-skeletons";

export default function DocumentsHubPage() {
  return (
    <Suspense fallback={<DocumentListPageSkeleton />}>
      <AllDocumentsPage />
    </Suspense>
  );
}
