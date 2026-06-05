"use client";

import "drag-drop-touch";

/**
 * Loads the `drag-drop-touch` polyfill on the client so the admin's
 * native HTML5 drag-and-drop code (`draggable`, `onDragStart`,
 * `onDrop`, …) also fires on touch screens. Without it, the spec
 * doesn't dispatch any drag events for touchstart / touchmove /
 * touchend, which is why DnD didn't work on mobile.
 *
 * Imported synchronously (not via a useEffect dynamic import) so the
 * singleton is wired up BEFORE the user's first touch — otherwise
 * landing directly on a draggable page (banners, categories) and
 * poking the handle before the chunk loads would silently no-op.
 *
 * The polyfill short-circuits on devices without touch, so loading
 * it everywhere is harmless. `"use client"` keeps the import out of
 * any server bundle.
 */
export function DragDropTouchPolyfill() {
  return null;
}
