import { Theme } from "@/styles";
import { DrawRowConfig } from "@/types/global";

const labelEdgePadding = 8;

/**
 * Keeps the label of a row on the screen while part of the row is on it.
 *
 * A month is wider than the viewport, so a label in the middle of the whole
 * month is off the screen for most of that month. The label follows the middle
 * of the part that is on the screen instead, and it stops at the edges of that
 * part, so two neighbouring labels cannot meet.
 */
const getStickyTextXPos = (x: number, width: number, textWidth: number, viewportWidth: number) => {
  const visibleStart = Math.max(x, 0);
  const visibleEnd = Math.min(x + width, viewportWidth);
  const centred = visibleStart + (visibleEnd - visibleStart - textWidth) / 2;
  const lowerBound = visibleStart + labelEdgePadding;
  const upperBound = visibleEnd - textWidth - labelEdgePadding;

  // The part on the screen is narrower than the label, so there is nothing to
  // centre it in. Start it at the leading edge and let the canvas clip it.
  if (upperBound < lowerBound) return lowerBound;

  return Math.min(Math.max(centred, lowerBound), upperBound);
};

export const drawRow = (config: DrawRowConfig, theme: Theme) => {
  const {
    ctx,
    x,
    y,
    width,
    height,
    textYPos,
    label,
    font,
    isBottomRow,
    fillStyle,
    topText,
    bottomText,
    labelBetweenCells
  } = config;

  ctx.beginPath();
  ctx.strokeStyle = theme.colors.border;
  ctx.setLineDash([]);

  if (label && font && textYPos) {
    ctx.fillStyle = theme.colors.gridBackground;
    ctx.fillRect(x, y, width, height);

    if (labelBetweenCells) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();

      ctx.moveTo(x, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();

      ctx.moveTo(x + width / 2, y + height);
      ctx.lineTo(x + width / 2, y + height - 5);
      ctx.stroke();
    } else {
      ctx.strokeRect(x + 0.5, y + 0.5, width, height);
    }

    ctx.font = font;

    const textWidth = ctx.measureText(label).width;
    // The canvas is scaled for the pixel ratio of the device, so its own width
    // is in device pixels and the drawing here is not.
    const viewportWidth = ctx.canvas.width / (ctx.getTransform().a || 1);
    const textXPos = labelBetweenCells
      ? x + width / 2 - textWidth / 2
      : getStickyTextXPos(x, width, textWidth, viewportWidth);
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme.colors.placeholder;
    ctx.fillText(label, textXPos, textYPos);
  }
  if (isBottomRow && fillStyle && topText && bottomText) {
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);

    ctx.font = topText.font;

    const dayNameXPos = x + width / 2 - ctx.measureText(topText.label).width / 2;

    ctx.fillStyle = topText.color;
    ctx.fillText(topText.label, dayNameXPos, topText.y);

    ctx.font = bottomText.font;

    const dayNumXPos = x + width / 2 - ctx.measureText(bottomText.label).width / 2;

    ctx.fillStyle = bottomText.color;
    ctx.fillText(bottomText.label, dayNumXPos, bottomText.y);
  }
};
