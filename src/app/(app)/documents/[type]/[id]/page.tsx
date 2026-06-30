import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DocumentFormPage } from "@/components/documents/DocumentFormPage";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { SLUG_TO_TYPE } from "@/lib/documents";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const documentType = SLUG_TO_TYPE[type];
  if (!documentType) notFound();
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <DocumentFormPage documentType={documentType} documentId={id} />
    </Suspense>
  );
}
