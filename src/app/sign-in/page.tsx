"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/AppLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

type AuthMode = "signIn" | "signUp" | "forgot" | "reset";

function SignInForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const modeParam = searchParams.get("mode");

  const [mode, setMode] = useState<AuthMode>(
    modeParam === "signUp" ? "signUp" : modeParam === "forgot" ? "forgot" : "signIn",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (modeParam === "signUp") setMode("signUp");
    else if (modeParam === "signIn") setMode("signIn");
    else if (modeParam === "forgot") setMode("forgot");
  }, [modeParam]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && mode !== "forgot" && mode !== "reset") {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, router, nextPath, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "forgot") {
        const formData = new FormData();
        formData.set("email", normalizedEmail);
        formData.set("flow", "reset");
        await signIn("password", formData);
        setInfo("Si un compte existe pour cet e-mail, un code a été envoyé.");
        setMode("reset");
        return;
      }

      if (mode === "reset") {
        const formData = new FormData();
        formData.set("email", normalizedEmail);
        formData.set("code", code.trim());
        formData.set("newPassword", newPassword);
        formData.set("flow", "reset-verification");
        await signIn("password", formData);
        router.replace(nextPath);
        return;
      }

      const formData = new FormData();
      formData.set("email", normalizedEmail);
      formData.set("password", password);
      formData.set("flow", mode);
      await signIn("password", formData);
      if (mode === "signUp" && orgName.trim()) {
        sessionStorage.setItem("aga-plus-org-name", orgName.trim());
      }
      router.replace(nextPath);
    } catch {
      if (mode === "forgot") {
        setError("Impossible d’envoyer le code. Vérifiez l’e-mail et réessayez.");
      } else if (mode === "reset") {
        setError("Code invalide ou expiré, ou mot de passe trop court (8 caractères min.).");
      } else {
        setError(mode === "signIn" ? "Identifiants invalides" : "Impossible de créer le compte");
      }
    } finally {
      setPending(false);
    }
  }

  const title =
    mode === "signUp"
      ? "Créer un compte"
      : mode === "forgot"
        ? "Mot de passe oublié"
        : mode === "reset"
          ? "Nouveau mot de passe"
          : "Connexion";

  return (
    <div className="app-backdrop flex min-h-[100dvh] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-panel)]">
        <CardHeader className="items-center text-center">
          <AppLogo size="lg" className="mb-1 justify-center" />
          <CardTitle className="text-lg">{title}</CardTitle>
          {mode === "forgot" ? (
            <p className="text-sm text-[#6B7280]">
              Entrez votre e-mail pour recevoir un code de réinitialisation.
            </p>
          ) : null}
          {mode === "reset" ? (
            <p className="text-sm text-[#6B7280]">
              Saisissez le code reçu par e-mail et choisissez un nouveau mot de passe.
            </p>
          ) : null}
          {mode === "signIn" || mode === "signUp"
            ? nextPath.startsWith("/documents/facture") && (
                <p className="text-sm text-[#6B7280]">
                  {mode === "signUp"
                    ? "Créez votre compte pour générer votre facture."
                    : "Connectez-vous pour continuer votre facture."}
                </p>
              )
            : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signUp" ? (
              <div className="space-y-2">
                <Label htmlFor="orgName">Nom de votre société</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex. : Ma Société SARL"
                  required
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
                disabled={mode === "reset"}
                autoComplete="email"
              />
            </div>

            {mode === "signIn" || mode === "signUp" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  {mode === "signIn" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand hover:underline"
                      onClick={() => {
                        setError("");
                        setInfo("");
                        setMode("forgot");
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  ) : null}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                />
              </div>
            ) : null}

            {mode === "reset" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Code reçu</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="8 chiffres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-700">{info}</p> : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Chargement…"
                : mode === "signIn"
                  ? "Se connecter"
                  : mode === "signUp"
                    ? nextPath.startsWith("/documents/facture")
                      ? "Créer mon compte et ma facture"
                      : "Créer le compte"
                    : mode === "forgot"
                      ? "Envoyer le code"
                      : "Réinitialiser le mot de passe"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[#6B7280]">
            {mode === "signIn" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  className="font-medium text-ink hover:underline"
                  onClick={() => {
                    setError("");
                    setInfo("");
                    setMode("signUp");
                  }}
                >
                  S&apos;inscrire
                </button>
              </>
            ) : mode === "signUp" ? (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  className="font-medium text-ink hover:underline"
                  onClick={() => {
                    setError("");
                    setInfo("");
                    setMode("signIn");
                  }}
                >
                  Se connecter
                </button>
              </>
            ) : (
              <button
                type="button"
                className="font-medium text-ink hover:underline"
                onClick={() => {
                  setError("");
                  setInfo("");
                  setCode("");
                  setNewPassword("");
                  setMode("signIn");
                }}
              >
                Retour à la connexion
              </button>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="app-backdrop flex min-h-[100dvh] items-center justify-center p-4 text-sm text-ink-muted">
          Chargement…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
