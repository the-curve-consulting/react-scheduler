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

const stripes = (color: string) =>
  `repeating-linear-gradient(45deg, ${color} 0 6px, transparent 6px 12px)`;

// A tinted tile stripes in its own colour. A plain tile is its colour already,
// so it stripes in white.
const tintedStripeColor = (color: string) => `color-mix(in srgb, ${color} 35%, transparent)`;
const plainStripeColor = "rgb(255 255 255 / 0.3)";

/**
 * Paints each band as its own background layer, so one bar can mark the days
 * inside it that the resource does not work. A layer holds the hatch, and its
 * size and position keep the hatch within the band.
 */
const bandLayers = (
  bands: NonWorkingBand[],
  color: string,
  stripeColor?: string
): CSSProperties => {
  const layers = bands.map((band) => ({
    image: hatch(color),
    position: `${band.left}px 0`,
    size: `${band.width}px 100%`
  }));
  // The stripes go last, so the hatch of a day off paints over them.
  if (stripeColor) layers.push({ image: stripes(stripeColor), position: "0 0", size: "100% 100%" });
  if (layers.length === 0) return {};

  return {
    backgroundImage: layers.map((layer) => layer.image).join(", "),
    backgroundPosition: layers.map((layer) => layer.position).join(", "),
    backgroundSize: layers.map((layer) => layer.size).join(", "),
    backgroundRepeat: "no-repeat"
  };
};

export const getTintedTileStyle = (
  color: string,
  working: boolean,
  theme: Theme,
  nonWorkingBands: NonWorkingBand[] = [],
  striped = false
): CSSProperties =>
  working
    ? {
        backgroundColor: tint(color),
        boxShadow: `inset 4px 0 0 ${color}`,
        color: theme.colors.textPrimary,
        ...bandLayers(
          nonWorkingBands,
          theme.colors.notWorkingTile,
          striped ? tintedStripeColor(color) : undefined
        )
      }
    : { backgroundColor: "transparent", backgroundImage: hatch(theme.colors.notWorkingTile) };

export const getPlainTileStyle = (
  backgroundColor: string,
  textColor: string,
  theme: Theme,
  nonWorkingBands: NonWorkingBand[] = [],
  striped = false
): CSSProperties => ({
  backgroundColor,
  color: textColor,
  ...bandLayers(
    nonWorkingBands,
    theme.colors.notWorkingTile,
    striped ? plainStripeColor : undefined
  )
});

export const getTintedHolidayTileStyle = (theme: Theme): CSSProperties => ({
  backgroundColor: theme.colors.holidayTile,
  backgroundImage: hatch(theme.colors.border),
  color: theme.colors.textPrimary
});
