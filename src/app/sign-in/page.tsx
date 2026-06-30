"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/AppLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("My company");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", mode);
      await signIn("password", formData);
      if (mode === "signUp" && orgName.trim()) {
        sessionStorage.setItem("aga-plus-org-name", orgName.trim());
      }
      router.replace("/dashboard");
    } catch {
      setError(mode === "signIn" ? "Identifiants invalides" : "Impossible de créer le compte");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="app-backdrop flex min-h-[100dvh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-panel)]">
        <CardHeader className="items-center text-center">
          <AppLogo size="lg" className="mb-1 justify-center" />
          <CardTitle className="text-lg">{mode === "signIn" ? "Connexion" : "Créer un compte"}</CardTitle>
          <CardDescription>
            Accédez à votre espace Finance CRM — devis, factures et documents commerciaux.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signUp" ? (
              <div className="space-y-2">
                <Label htmlFor="orgName">Your company name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My company"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Chargement…" : mode === "signIn" ? "Se connecter" : "Créer le compte"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[#6B7280]">
            {mode === "signIn" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              type="button"
              className="font-medium text-ink hover:underline"
              onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            >
              {mode === "signIn" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
