"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, ChevronDown, FolderPlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProjectListSkeleton } from "@/components/ui/loading-skeletons";
import { cn } from "@/lib/utils";

function truncateName(name: string, max = 18) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export function ProjectSwitcher() {
  const router = useRouter();
  const org = useQuery(api.organizations.current);
  const projects = useQuery(api.organizations.list);
  const switchActive = useMutation(api.organizations.switchActive);
  const createProject = useMutation(api.organizations.create);

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState(false);
  const [switchingId, setSwitchingId] = useState<Id<"organizations"> | null>(null);

  const orgName = org?.name ?? "Company";

  async function handleSwitch(organizationId: Id<"organizations">) {
    if (org?._id === organizationId) {
      setOpen(false);
      return;
    }
    setSwitchingId(organizationId);
    try {
      await switchActive({ organizationId });
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setPending(true);
    try {
      await createProject({ name });
      setNewName("");
      setCreateOpen(false);
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pill-btn min-w-0 max-w-[140px] sm:max-w-none"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="truncate">{truncateName(orgName)}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[#9CA3AF] transition", open && "rotate-180")} />
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xl">
              <div className="border-b border-black/[0.06] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Mes sociétés
                </p>
              </div>
              <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
                {projects === undefined ? (
                  <li>
                    <ProjectListSkeleton />
                  </li>
                ) : projects.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-[#6B7280]">Aucune société</li>
                ) : (
                  projects.map((project) => (
                    <li key={project._id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={project.isActive}
                        disabled={switchingId === project._id}
                        onClick={() => void handleSwitch(project._id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-black/[0.04]",
                          project.isActive && "bg-black/[0.03] font-medium",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate text-ink">{project.name}</span>
                        {switchingId === project._id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#9CA3AF]" />
                        ) : project.isActive ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-black/[0.06] p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(true);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-black/[0.04]"
                >
                  <FolderPlus className="h-4 w-4 text-[#6B7280]" />
                  Nouvelle société
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            aria-label="Fermer"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-[#6B7280] hover:bg-black/[0.04]"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-ink">Nouvelle société</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Chaque société a ses propres documents, clients, catalogue et paramètres.
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Company name</Label>
                <Input
                  id="projectName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Aga Plus LLC"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={pending || !newName.trim()}>
                  {pending ? "Création…" : "Créer la société"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
