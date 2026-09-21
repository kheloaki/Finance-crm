"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import { AppLogo, APP_NAME } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CREATE_HREF = "/documents/facture/new";
const SIGNUP_HREF = `/sign-in?mode=signUp&next=${encodeURIComponent(CREATE_HREF)}`;

export function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const primaryHref = isAuthenticated ? CREATE_HREF : SIGNUP_HREF;

  return (
    <div className="landing-root relative min-h-[100dvh] overflow-hidden text-ink">
      <div className="landing-atmosphere" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <AppLogo size="lg" />
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Tableau de bord</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Se connecter</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="relative z-10 grid min-h-[calc(100dvh-5.5rem)] items-center gap-10 px-5 pb-12 pt-4 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8 lg:pb-16 lg:pt-0">
        <section className="landing-copy max-w-xl">
          <p className="landing-fade-1 mb-5 font-[family-name:var(--font-landing-display)] text-3xl font-medium tracking-tight text-brand sm:text-4xl">
            {APP_NAME}
          </p>
          <h1 className="landing-fade-2 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.15rem] lg:text-[2.35rem]">
            Créez votre facture en quelques secondes
          </h1>
          <p className="landing-fade-3 mt-4 max-w-md text-base leading-relaxed text-ink-secondary sm:text-lg">
            Saisissez le client, ajoutez vos lignes, téléchargez le PDF. Simple, clair, prêt pour le Maroc.
          </p>
          <div className="landing-fade-4 mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className={cn(
                "h-12 rounded-2xl px-6 text-[15px] shadow-md shadow-brand/25",
                isLoading && "pointer-events-none opacity-70",
              )}
            >
              <Link href={primaryHref}>
                Créer une facture
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!isAuthenticated ? (
              <Button asChild variant="secondary" size="lg" className="h-12 rounded-2xl px-5 text-[15px]">
                <Link href="/sign-in">J’ai déjà un compte</Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section
          className="landing-visual relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
          aria-hidden
        >
          <InvoiceHeroVisual />
        </section>
      </main>
    </div>
  );
}

function InvoiceHeroVisual() {
  return (
    <div className="landing-invoice relative">
      <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-sky-200/40 via-white/10 to-emerald-200/35 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Facture
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">FAC-2026-0142</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-brand">Votre société</p>
            <p className="mt-0.5 text-xs text-slate-400">Casablanca · ICE …</p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-5 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Client</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Atlas Distribution SARL</p>
            <p className="mt-0.5 text-xs text-slate-500">Maarif, Casablanca</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
            <p className="mt-1 text-sm tabular-nums text-slate-700">08/08/2026</p>
            <p className="mt-0.5 text-xs text-slate-500">Net 30</p>
          </div>
        </div>

        <div className="mx-6 overflow-hidden rounded-xl border border-slate-100 sm:mx-8">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Article</span>
            <span>Qté</span>
            <span>Montant</span>
          </div>
          {[
            ["Prestation conseil", "2", "4 000,00"],
            ["Licence annuelle", "1", "2 500,00"],
            ["Support prioritaire", "1", "800,00"],
          ].map(([item, qty, amount]) => (
            <div
              key={item}
              className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-slate-100 px-3 py-2.5 text-sm"
            >
              <span className="truncate text-slate-700">{item}</span>
              <span className="w-8 text-right tabular-nums text-slate-500">{qty}</span>
              <span className="w-20 text-right font-medium tabular-nums text-slate-800">{amount}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 px-6 pb-6 sm:px-8">
          <p className="text-xs text-slate-400">TVA 20% incluse</p>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Solde dû
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              8 760,00 <span className="text-sm font-semibold text-slate-500">MAD</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
