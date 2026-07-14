"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { HtTtcDisplay, HtTtcField } from "@/components/ui/ht-ttc-field";
import { Input, Label } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/ui/loading-skeletons";
import { DEFAULT_VAT_RATE } from "@/lib/money";

export type EntityField = {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "htTtc";
};

type EntityCrudPanelProps<T extends { _id: string }> = {
  title: string;
  description?: string;
  items: T[] | undefined;
  fields: EntityField[];
  emptyLabel: string;
  getLabel: (item: T) => string;
  onCreate: (values: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, values: Record<string, string>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  initialOpen?: boolean;
  vatRate?: number;
};

function renderCellValue(field: EntityField, raw: unknown, vatRate: number) {
  if (field.type === "htTtc") {
    const ht = parseFloat(String(raw ?? "")) || 0;
    return <HtTtcDisplay valueHt={ht} vatRate={vatRate} />;
  }
  return String(raw ?? "—") || "—";
}

export function EntityCrudPanel<T extends { _id: string }>({
  title,
  description,
  items,
  fields,
  emptyLabel,
  getLabel,
  onCreate,
  onUpdate,
  onRemove,
  initialOpen = false,
  vatRate = DEFAULT_VAT_RATE,
}: EntityCrudPanelProps<T>) {
  const [showForm, setShowForm] = useState(initialOpen);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function resetForm() {
    setValues({});
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(item: T) {
    setEditingId(item._id);
    const next: Record<string, string> = {};
    for (const field of fields) {
      next[field.key] = String((item as Record<string, unknown>)[field.key] ?? "");
    }
    setValues(next);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      resetForm();
    } finally {
      setPending(false);
    }
  }

  const filtered =
    items?.filter((item) => getLabel(item).toLowerCase().includes(search.toLowerCase())) ?? [];

  const tableFields = fields.filter((f) => f.key !== "name" && f.key !== "designation");

  return (
    <div className="pb-4">
      <PageHeader
        title={title}
        {...(description ? { description } : {})}
        actions={
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setValues({});
            }}
          >
            Ajouter
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) =>
                field.type === "htTtc" ? (
                  <div key={field.key} className="space-y-2 sm:col-span-2">
                    <Label>{field.label}</Label>
                    <HtTtcField
                      valueHt={parseFloat(values[field.key] ?? "") || 0}
                      vatRate={vatRate}
                      onChangeHt={(v) =>
                        setValues((prev) => ({ ...prev, [field.key]: String(v) }))
                      }
                    />
                  </div>
                ) : (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  </div>
                ),
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  {editingId ? "Enregistrer" : "Créer"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="px-4 py-4">
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 max-w-sm"
          />
          {items === undefined ? (
            <DataTableSkeleton headers={["Nom", ...tableFields.slice(0, 3).map((f) => f.label), "Actions"]} rows={7} />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500">{emptyLabel}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  {tableFields.slice(0, 3).map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{getLabel(item)}</TableCell>
                    {tableFields.slice(0, 3).map((f) => (
                      <TableCell key={f.key}>
                        {renderCellValue(
                          f,
                          (item as Record<string, unknown>)[f.key],
                          vatRate,
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            setDeleteTarget({ id: item._id, label: getLabel(item) })
                          }
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer définitivement ?"
        description={
          deleteTarget
            ? `« ${deleteTarget.label} » sera supprimé de votre base. Cette action est irréversible.`
            : ""
        }
        requireTypedConfirm
        pending={deletePending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeletePending(true);
          try {
            await onRemove(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setDeletePending(false);
          }
        }}
      />
    </div>
  );
}
