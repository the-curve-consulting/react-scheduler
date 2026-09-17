import { Theme } from "@/styles";

export const getHeaderLabel = (label: string, theme: Theme) =>
  theme.headerUppercase ? label.toUpperCase() : label.charAt(0).toUpperCase() + label.slice(1);
