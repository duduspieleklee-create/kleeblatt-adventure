export const UI_CONFIG = {
  MARGIN: 32,
  SPACING: 16,
  FONT_FAMILY: "GameFont, 'Courier New', monospace",
  TEXT_COLOR: "#ffffff",
  PANEL_COLOR: 0x1a1a2e,
  PANEL_ALPHA: 0.95,
  PARCHMENT_BG: 0xf5e6c8,
  PARCHMENT_BORDER: 0x8b6914,
  PARCHMENT_TEXT: "#3d2914",
  PARCHMENT_MUTED: "#8b6914",
} as const;

export const TEXT_STYLES = {
  title: {
    fontFamily: UI_CONFIG.FONT_FAMILY,
    fontSize: "24px",
    color: UI_CONFIG.TEXT_COLOR,
    padding: { left: 4, right: 4, top: 4, bottom: 4 },
  },
  body: {
    fontFamily: UI_CONFIG.FONT_FAMILY,
    fontSize: "16px",
    color: UI_CONFIG.TEXT_COLOR,
    lineSpacing: 6,
  },
  small: {
    fontFamily: UI_CONFIG.FONT_FAMILY,
    fontSize: "12px",
    color: UI_CONFIG.TEXT_COLOR,
  },
} as const;
