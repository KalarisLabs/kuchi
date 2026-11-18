/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import type { ReactNode } from "react";
import { createContext, createElement, useContext } from "react";

export interface KuchiTheme {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: number;
}

export const defaultLightTheme: KuchiTheme = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.145 0 0)",
  primary: "oklch(0.205 0 0)",
  primaryForeground: "oklch(0.985 0 0)",
  secondary: "oklch(0.97 0 0)",
  secondaryForeground: "oklch(0.205 0 0)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.556 0 0)",
  accent: "oklch(0.97 0 0)",
  accentForeground: "oklch(0.205 0 0)",
  destructive: "oklch(0.577 0.245 27.325)",
  destructiveForeground: "oklch(0.985 0 0)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  radius: 10,
};

export const defaultDarkTheme: KuchiTheme = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  cardForeground: "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  popoverForeground: "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  primaryForeground: "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  secondaryForeground: "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  mutedForeground: "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  accentForeground: "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  destructiveForeground: "oklch(0.985 0 0)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
  radius: 10,
};

interface KuchiThemeContextValue {
  theme?: Partial<KuchiTheme>;
  mode?: "light" | "dark";
}

const KuchiThemeContext = createContext<KuchiThemeContextValue>({});

export interface KuchiUIProviderProps {
  theme?: Partial<KuchiTheme>;
  mode?: "light" | "dark";
  children: ReactNode;
}

export function KuchiUIProvider({
  theme,
  mode,
  children,
}: KuchiUIProviderProps) {
  return createElement(
    KuchiThemeContext.Provider,
    { value: { theme, mode } },
    children,
  );
}

export function useKuchiTheme(
  override?: Partial<KuchiTheme>,
  modeOverride?: "light" | "dark",
): KuchiTheme {
  const ctx = useContext(KuchiThemeContext);
  const mode = modeOverride ?? ctx.mode ?? "light";
  const base = mode === "dark" ? defaultDarkTheme : defaultLightTheme;
  return { ...base, ...ctx.theme, ...override };
}
