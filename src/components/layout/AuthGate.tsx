"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import { AppShell } from "@/components/layout/AppShell";
import { ShellLoadingSkeleton } from "@/components/ui/loading-skeletons";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const needsBootstrap = useQuery(api.organizations.needsBootstrap);
  const bootstrap = useMutation(api.organizations.bootstrap);
  const bootstrapStarted = useRef(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || needsBootstrap !== true || bootstrapStarted.current) {
      return;
    }
    bootstrapStarted.current = true;
    setBootstrapError(null);
    void bootstrap({
      organizationName:
        typeof window !== "undefined"
          ? sessionStorage.getItem("aga-plus-org-name") ?? undefined
          : undefined,
    })
      .then(() => {
        sessionStorage.removeItem("aga-plus-org-name");
      })
      .catch((err: unknown) => {
        bootstrapStarted.current = false;
        setBootstrapError(
          err instanceof Error ? err.message : "Impossible d'initialiser l'organisation",
        );
      });
  }, [isAuthenticated, needsBootstrap, bootstrap]);

  if (isLoading || !isAuthenticated) {
    return <ShellLoadingSkeleton />;
  }

  if (bootstrapError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F9FAFB] p-6">
        <p className="text-sm text-red-600">{bootstrapError}</p>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => {
            bootstrapStarted.current = false;
            setBootstrapError(null);
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Wait until org membership exists before rendering app (avoids query race)
  if (needsBootstrap !== false) {
    return <ShellLoadingSkeleton />;
  }

  return <AppShell>{children}</AppShell>;
}
