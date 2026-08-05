/** Basis-Viewport (16:9). Map-Größe kommt aus game-config.json (match.mapSize). */
export const GAME_VIEWPORT = { width: 960, height: 540 } as const;

/**
 * Minimaler, unterstützter Viewport (Landscape, 16:9).
 * Darunter (oder in Portrait) zeigt MatchPage ein "Bitte Gerät drehen"-Overlay.
 * Das Spiel erzwingt Querformat – Spieler müssen das Gerät dafür drehen.
 */
export const MIN_VIEWPORT = { width: 640, height: 360 } as const;

/**
 * Standard-Kameradistanz für Top-Down-RPGs: Zoom 2.0 auf 32px-Tiles
 * zeigt ca. 15×8,4 Tiles (480×270px Welt) – die klassische "Zelda-like"-Nähe.
 */
export const CAMERA_ZOOM = 2.0;

/**
 * Totzone der Kamera (in Weltpixeln): Die Kamera folgt erst, wenn der Spieler
 * die Zone verlässt → ruhiger, fokussierter Blick statt ständigem Nachziehen.
 */
export const CAMERA_DEADZONE = { width: 120, height: 68 } as const;
