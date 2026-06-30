"use client";

import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "@convex/_generated/api";

/** Remounts page content when the active company changes so forms and lists stay in sync. */
export function OrgScopedContent({ children }: { children: ReactNode }) {
  const org = useQuery(api.organizations.current);
  const orgKey = org?._id ?? "pending";

  return (
    <div key={orgKey} className="contents">
      {children}
    </div>
  );
}
