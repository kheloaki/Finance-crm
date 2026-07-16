"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Eye, FileDown, FileText, Folder, FolderOpen, Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentListSkeleton } from "@/components/ui/loading-skeletons";
import { NewDocumentMenu } from "@/components/documents/NewDocumentMenu";
import { dashboardCardClass } from "@/components/dashboard/dashboard-ui";
import {
  DOCUMENT_BADGE_CLASS,
  DOCUMENT_LABELS,
  DOCUMENT_SLUGS,
  DOCUMENT_TYPES,
  isSupplierDocument,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type DocumentType,
} from "@/lib/documents";
import type { CompanySettings, EnrichedDocument } from "@/lib/convex-types";
import { exportDocumentPdf } from "@/lib/pdf/document-pdf";
import { cn, formatDate, formatMoney } from "@/lib/utils";

function documentEditPath(doc: EnrichedDocument) {
  return `/documents/${DOCUMENT_SLUGS[doc.documentType]}/${doc._id}`;
}

export function AllDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProject = searchParams.get("project") ?? "";
  const urlSansProject = searchParams.get("sans-projet") === "1";

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(urlProject);
  const [unfiledOnly, setUnfiledOnly] = useState(urlSansProject);
  const [typeFilter, setTypeFilter] = useState<DocumentType | "">("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createPending, setCreatePending] = useState(false);

  const projectStats = useQuery(api.folders.listWithStats);
  const docs = useQuery(api.documents.listAll, {
    folderId: projectFilter && !unfiledOnly ? (projectFilter as Id<"documentFolders">) : undefined,
    unfiledOnly: unfiledOnly || undefined,
    documentType: typeFilter || undefined,
    search: search || undefined,
  }) as EnrichedDocument[] | undefined;
  const settings = useQuery(api.companySettings.get) as CompanySettings | null | undefined;
  const createProject = useMutation(api.folders.create);

  useEffect(() => {
    if (urlSansProject) {
      setUnfiledOnly(true);
      setProjectFilter("");
    } else if (urlProject) {
      setProjectFilter(urlProject);
      setUnfiledOnly(false);
    }
  }, [urlProject, urlSansProject]);

  const newDocumentProjectId =
    projectFilter && !unfiledOnly ? projectFilter : undefined;

  function selectProject(projectId: string | null, unfiled = false) {
    setUnfiledOnly(unfiled);
    setProjectFilter(projectId ?? "");
    const params = new URLSearchParams();
    if (unfiled) params.set("sans-projet", "1");
    else if (projectId) params.set("project", projectId);
    const qs = params.toString();
    router.replace(qs ? `/documents?${qs}` : "/documents", { scroll: false });
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    setCreatePending(true);
    try {
      const id = await createProject({ name });
      setNewProjectName("");
      setCreateOpen(false);
      selectProject(id);
    } finally {
      setCreatePending(false);
    }
  }

  const openDocument = useCallback(
    (doc: EnrichedDocument, mode: "view" | "edit") => {
      if (mode === "view") {
        router.push(`/documents/${DOCUMENT_SLUGS[doc.documentType]}?id=${doc._id}`);
      } else {
        router.push(documentEditPath(doc));
      }
    },
    [router],
  );

  async function handleExportPdf(doc: EnrichedDocument) {
    const counterparty = doc.client ?? doc.supplier;
    if (!settings || !counterparty || exportingId) return;

    setExportingId(doc._id);
    try {
      await exportDocumentPdf({
        documentType: doc.documentType,
        number: doc.number,
        date: doc.date,
        dueDate: doc.dueDate,
        reference: doc.reference,
        vatRate: doc.vatRate,
        discount: doc.discount,
        deposit: doc.deposit,
        notes: doc.notes,
        lines: doc.lines.map((l) => ({
          catalogItemId: l.catalogItemId,
          reference: l.reference,
          designation: l.designation,
          unit: l.unit,
          qty: l.qty,
          unitPriceHt: l.unitPriceHt,
          sortOrder: l.sortOrder,
          isNote: l.isNote,
        })),
        isSupplier: isSupplierDocument(doc.documentType),
        showCachet: doc.showCachet ?? false,
        amountDisplay: doc.amountDisplay === "ht" ? "ht" : "ht_ttc",
        counterparty: {
          name: counterparty.name,
          ice: counterparty.ice || undefined,
          representative: counterparty.representative || undefined,
          address: counterparty.address || undefined,
          city: counterparty.city || undefined,
        },
        settings,
      });
    } finally {
      setExportingId(null);
    }
  }

  function handleProjectSelectChange(value: string) {
    if (value === "__unfiled__") selectProject(null, true);
    else if (value === "") selectProject(null, false);
    else selectProject(value, false);
  }

  const projectSelectValue = unfiledOnly ? "__unfiled__" : projectFilter;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-3">
      <PageHeader
        title="Documents"
        compact
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Button>
            <NewDocumentMenu projectId={newDocumentProjectId} />
          </div>
        }
      />

      {projectStats === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(dashboardCardClass, "h-28 animate-pulse bg-[#F3F4F6]")} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => selectProject(null, false)}
            className={cn(
              dashboardCardClass,
              "flex flex-col items-start gap-2 p-4 text-left transition hover:border-black/[0.12] hover:shadow-sm",
              !projectFilter && !unfiledOnly && "ring-2 ring-brand/10",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-ink">All</span>
            <span className="text-xs text-[#9CA3AF]">
              {(projectStats.unfiledCount ?? 0) +
                projectStats.folders.reduce((n, f) => n + f.documentCount, 0)}{" "}
              docs
            </span>
          </button>

          {projectStats.unfiledCount > 0 ? (
            <button
              type="button"
              onClick={() => selectProject(null, true)}
              className={cn(
                dashboardCardClass,
                "flex flex-col items-start gap-2 p-4 text-left transition hover:border-black/[0.12] hover:shadow-sm",
                unfiledOnly && "ring-2 ring-brand/10",
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#6B7280]">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-ink">No project</span>
              <span className="text-xs text-[#9CA3AF]">{projectStats.unfiledCount} docs</span>
            </button>
          ) : null}

          {projectStats.folders.map((project) => {
            const active = projectFilter === project._id && !unfiledOnly;
            return (
              <button
                key={project._id}
                type="button"
                onClick={() => selectProject(project._id)}
                className={cn(
                  dashboardCardClass,
                  "flex flex-col items-start gap-2 p-4 text-left transition hover:border-black/[0.12] hover:shadow-sm",
                  active && "ring-2 ring-brand/10",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    active ? "bg-brand text-white" : "bg-amber-50 text-amber-700",
                  )}
                >
                  {active ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                </div>
                <span className="w-full truncate text-sm font-semibold text-ink">{project.name}</span>
                <span className="text-xs text-[#9CA3AF]">
                  {project.documentCount} doc{project.documentCount !== 1 ? "s" : ""}
                  {project.draftCount > 0 ? ` · ${project.draftCount} draft` : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white">
        <div className="shrink-0 space-y-3 border-b border-black/[0.06] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search by number, client or project…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-ink outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              value={projectSelectValue}
              onChange={(e) => handleProjectSelectChange(e.target.value)}
            >
              <option value="">All projects</option>
              <option value="__unfiled__">No project</option>
              {projectStats?.folders.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-ink outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType | "")}
            >
              <option value="">All types</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {docs === undefined ? (
            <DocumentListSkeleton />
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm text-[#6B7280]">No documents found.</p>
              <div className="mt-4">
                <NewDocumentMenu projectId={newDocumentProjectId} label="Create document" />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <Badge className={cn("font-medium", DOCUMENT_BADGE_CLASS[doc.documentType])}>
                        {DOCUMENT_LABELS[doc.documentType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-ink">{doc.number}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-[#6B7280]">
                      {doc.projectName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">{doc.counterpartyName}</TableCell>
                    <TableCell className="text-[#6B7280]">{formatDate(doc.date)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE_CLASS[doc.status]}>
                        {STATUS_LABELS[doc.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {doc.documentType === "bon_livraison" ? "—" : formatMoney(doc.totalTtc)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview"
                          onClick={() => openDocument(doc, "view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => openDocument(doc, "edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!settings || exportingId === doc._id}
                          title="Export PDF"
                          onClick={() => void handleExportPdf(doc)}
                        >
                          {exportingId === doc._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-[#6B7280] hover:bg-black/[0.04]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-ink">New project</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Name a folder to group documents (e.g. &quot;Marrakech Villa&quot;, &quot;Client X&quot;).
            </p>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Site Casa"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPending || !newProjectName.trim()}>
                  {createPending ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
