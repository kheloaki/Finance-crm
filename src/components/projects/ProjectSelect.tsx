"use client";

import { useMutation, useQuery } from "convex/react";
import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { inputClass } from "@/lib/design";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (projectId: string) => void;
  readOnly?: boolean;
  fieldClassName?: string;
};

export function ProjectSelect({ value, onChange, readOnly, fieldClassName }: Props) {
  const projects = useQuery(api.folders.list);
  const createProject = useMutation(api.folders.create);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setPending(true);
    try {
      const id = await createProject({ name });
      onChange(id);
      setNewName("");
      setCreating(false);
    } finally {
      setPending(false);
    }
  }

  const fieldClass = fieldClassName ?? inputClass;

  if (projects === undefined) {
    return (
      <div className={cn(fieldClass, "flex items-center gap-2 bg-[#F9FAFB] text-[#9CA3AF]")}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        className={cn(fieldClass, readOnly && "bg-[#F9FAFB]")}
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">No project</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>

      {!readOnly ? (
        creating ? (
          <form onSubmit={handleCreate} className="rounded-xl border border-black/[0.06] bg-[#FAFBFC] p-3">
            <Label htmlFor="inlineProjectName">New project</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="inlineProjectName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                autoFocus
                required
              />
              <Button type="submit" size="sm" disabled={pending || !newName.trim()}>
                {pending ? "…" : "Create"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 text-sm text-[#6B7280] transition hover:text-ink"
          >
            <FolderPlus className="h-4 w-4" />
            Create project
          </button>
        )
      ) : null}
    </div>
  );
}

export function projectIdForSave(value: string): Id<"documentFolders"> | null | undefined {
  if (value === "") return null;
  return value as Id<"documentFolders">;
}
