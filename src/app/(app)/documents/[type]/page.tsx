import { Suspense } from "react";
import { DocumentListPageSkeleton } from "@/components/ui/loading-skeletons";
import { notFound } from "next/navigation";
import { DocumentListPage } from "@/components/documents/DocumentListPage";
import { SLUG_TO_TYPE } from "@/lib/documents";

export default async function DocumentTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const documentType = SLUG_TO_TYPE[type];
  if (!documentType) notFound();
  return (
    <Suspense fallback={<DocumentListPageSkeleton />}>
      <DocumentListPage documentType={documentType} />
    </Suspense>
  );
}
