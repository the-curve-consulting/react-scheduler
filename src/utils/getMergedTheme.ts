import { darkTheme, theme, Theme } from "@/styles";
import { Config } from "@/types/global";

export type ThemeOptions = Pick<Config, "theme" | "headerFonts" | "headerUppercase" | "tileStyle">;

export const getMergedTheme = (mode: "light" | "dark", options: ThemeOptions): Theme => {
  const baseTheme = mode === "light" ? theme : darkTheme;

  return {
    ...baseTheme,
    colors: { ...baseTheme.colors, ...options.theme?.[mode] },
    headerFonts: { ...baseTheme.headerFonts, ...options.headerFonts },
    headerUppercase: options.headerUppercase ?? baseTheme.headerUppercase,
    tileStyle: options.tileStyle ?? baseTheme.tileStyle
  };
};
