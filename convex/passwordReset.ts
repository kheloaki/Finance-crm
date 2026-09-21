import Resend from "@auth/core/providers/resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendAPI } from "resend";

function generateOtp(): string {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(random, "0123456789", 8);
}

/**
 * OTP provider used by Password({ reset }).
 * Set Convex env AUTH_RESEND_KEY (and optionally AUTH_EMAIL).
 */
export const PasswordResetOTP = Resend({
  id: "password-reset-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  from: process.env.AUTH_EMAIL?.trim() || "FINANCE CRM <onboarding@resend.dev>",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateOtp();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = provider.apiKey ?? process.env.AUTH_RESEND_KEY;
    if (!apiKey) {
      console.warn(
        `[password-reset] AUTH_RESEND_KEY missing — code for ${email}: ${token}`,
      );
      return;
    }

    const from =
      provider.from?.trim() ||
      process.env.AUTH_EMAIL?.trim() ||
      "FINANCE CRM <onboarding@resend.dev>";
    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Réinitialisation du mot de passe — FINANCE CRM",
      text: [
        "Bonjour,",
        "",
        `Votre code de réinitialisation est : ${token}`,
        "",
        "Il expire dans 15 minutes.",
        "Si vous n’avez pas demandé cette réinitialisation, ignorez cet e-mail.",
        "",
        "— FINANCE CRM",
      ].join("\n"),
    });

    if (error) {
      console.error("[password-reset] Resend error:", error);
      throw new Error("Impossible d’envoyer l’e-mail de réinitialisation");
    }
  },
});
