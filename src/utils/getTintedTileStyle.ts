import { CSSProperties } from "react";
import { Theme } from "@/styles";

const tintShare = 0.18;

/** Where a run of days the resource does not work sits inside a tile, in pixels. */
export type NonWorkingBand = {
  left: number;
  width: number;
};

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

/**
 * Paints each band as its own background layer, so one bar can mark the days
 * inside it that the resource does not work. A layer holds the hatch, and its
 * size and position keep the hatch within the band.
 */
const bandLayers = (bands: NonWorkingBand[], color: string): CSSProperties =>
  bands.length === 0
    ? {}
    : {
        backgroundImage: bands.map(() => hatch(color)).join(", "),
        backgroundPosition: bands.map((band) => `${band.left}px 0`).join(", "),
        backgroundSize: bands.map((band) => `${band.width}px 100%`).join(", "),
        backgroundRepeat: "no-repeat"
      };

export const getTintedTileStyle = (
  color: string,
  working: boolean,
  theme: Theme,
  nonWorkingBands: NonWorkingBand[] = []
): CSSProperties =>
  working
    ? {
        backgroundColor: tint(color),
        boxShadow: `inset 4px 0 0 ${color}`,
        color: theme.colors.textPrimary,
        ...bandLayers(nonWorkingBands, theme.colors.notWorkingTile)
      }
    : { backgroundColor: "transparent", backgroundImage: hatch(theme.colors.notWorkingTile) };

export const getPlainTileStyle = (
  backgroundColor: string,
  textColor: string,
  theme: Theme,
  nonWorkingBands: NonWorkingBand[] = []
): CSSProperties => ({
  backgroundColor,
  color: textColor,
  ...bandLayers(nonWorkingBands, theme.colors.notWorkingTile)
});

export const getTintedHolidayTileStyle = (theme: Theme): CSSProperties => ({
  backgroundColor: theme.colors.holidayTile,
  backgroundImage: hatch(theme.colors.border),
  color: theme.colors.textPrimary
});
