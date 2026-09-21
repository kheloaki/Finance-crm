import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { LandingPage } from "@/components/landing/LandingPage";

const landingDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-display",
});

export const metadata: Metadata = {
  title: "FINANCE CRM — Créez votre facture en quelques secondes",
  description:
    "Créez une facture rapidement : client, lignes, PDF. Simple et prêt pour le Maroc.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <div className={landingDisplay.variable}>
      <LandingPage />
    </div>
  );
}
