/** Событие для мгновенного обновления счётчика избранного в шапке. */
export const FAVORITES_COUNT_INVALIDATE = "homenova:favorites-count-invalidate";

export function invalidateFavoritesCount(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVORITES_COUNT_INVALIDATE));
}
