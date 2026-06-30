import type { CSSProperties } from "react";
import type { DocumentTheme } from "@/lib/document-theme";
import { themeGradient } from "@/lib/document-theme";
import type { PreviewContext } from "./types";

export function bandStyle(ctx: PreviewContext): CSSProperties {
  return { background: themeGradient(ctx.theme, "to-r"), color: ctx.theme.onPrimary };
}

export function bandStyleVertical(ctx: PreviewContext): CSSProperties {
  return { background: themeGradient(ctx.theme, "to-b"), color: ctx.theme.onPrimary };
}

export function primaryBg(ctx: PreviewContext): CSSProperties {
  return { backgroundColor: ctx.theme.primary, color: ctx.theme.onPrimary };
}

export function primaryDarkBg(ctx: PreviewContext): CSSProperties {
  return { backgroundColor: ctx.theme.primaryDark, color: ctx.theme.onPrimary };
}

export function surfaceStyle(ctx: PreviewContext): CSSProperties {
  return {
    backgroundColor: ctx.theme.surface,
    borderColor: ctx.theme.surfaceBorder,
  };
}

export function accentBorder(ctx: PreviewContext): CSSProperties {
  return { borderColor: ctx.theme.primary };
}

export function accentText(ctx: PreviewContext): CSSProperties {
  return { color: ctx.theme.primary };
}

export function accentMutedText(ctx: PreviewContext): CSSProperties {
  return { color: ctx.theme.primaryDark };
}

export function tableHeadStyle(ctx: PreviewContext): CSSProperties {
  return { backgroundColor: ctx.theme.primaryDark, color: ctx.theme.onPrimary };
}

export function dividerStyle(ctx: PreviewContext): CSSProperties {
  return { borderColor: ctx.theme.primary, backgroundColor: ctx.theme.primary };
}

export function gradientBannerStyle(ctx: PreviewContext): CSSProperties {
  return { background: themeGradient(ctx.theme, "to-r"), color: ctx.theme.onPrimary };
}

export function clientBoxStyle(ctx: PreviewContext): CSSProperties {
  return {
    backgroundColor: ctx.theme.primaryMuted,
    borderColor: ctx.theme.surfaceBorder,
  };
}

export function lineCardStyle(ctx: PreviewContext): CSSProperties {
  return {
    borderColor: ctx.theme.surfaceBorder,
    backgroundColor: ctx.theme.surface,
  };
}

export type { DocumentTheme };
