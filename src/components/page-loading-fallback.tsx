/** Плейсхолдер под шапкой во время подгрузки сегмента страницы. */
export function PageLoadingFallback() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#ececec] border-t-[#0c78ed]"
        aria-hidden
      />
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}
