"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@convex/_generated/api";

/** Applies Quill + navy once per org if they are still on an older default design. */
export function EnsureQuillDesign() {
  const org = useQuery(api.organizations.current);
  const settings = useQuery(api.companySettings.get);
  const ensureQuill = useMutation(api.companySettings.ensureQuillDesign);
  const ranForOrg = useRef<string | null>(null);

  useEffect(() => {
    if (!org?._id || settings === undefined || settings === null) return;
    if (typeof window === "undefined") return;

    const storageKey = `aga-plus-quill-default:${org._id}`;
    if (settings.documentTemplate === "quill") {
      window.localStorage.setItem(storageKey, "1");
      return;
    }
    // Already migrated once — respect a later template choice.
    if (window.localStorage.getItem(storageKey) === "1") return;
    if (ranForOrg.current === org._id) return;
    ranForOrg.current = org._id;

    void ensureQuill()
      .then(() => {
        window.localStorage.setItem(storageKey, "1");
      })
      .catch(() => {
        ranForOrg.current = null;
      });
  }, [org?._id, settings, ensureQuill]);

  return null;
}
