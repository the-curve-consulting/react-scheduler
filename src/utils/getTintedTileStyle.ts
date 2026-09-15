import { CSSProperties } from "react";
import { Theme } from "@/styles";

const tintShare = 0.18;

const tint = (hexColor: string) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor);
  if (!match) return hexColor;

  const channels = match.slice(1).map((channel) =>
    Math.round(255 - (255 - parseInt(channel, 16)) * tintShare)
      .toString(16)
      .padStart(2, "0")
  );

  return `#${channels.join("")}`;
};

const hatch = (color: string) =>
  `repeating-linear-gradient(135deg, ${color} 0 4px, transparent 4px 8px)`;

export const getTintedTileStyle = (color: string, working: boolean, theme: Theme): CSSProperties =>
  working
    ? {
        backgroundColor: tint(color),
        boxShadow: `inset 4px 0 0 ${color}`,
        color: theme.colors.textPrimary
      }
    : { backgroundColor: "transparent", backgroundImage: hatch(theme.colors.notWorkingTile) };

export const getTintedHolidayTileStyle = (theme: Theme): CSSProperties => ({
  backgroundColor: theme.colors.holidayTile,
  backgroundImage: hatch(theme.colors.border),
  color: theme.colors.textPrimary
});
