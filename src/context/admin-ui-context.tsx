"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error";

type ToastItem = { id: string; kind: ToastKind; message: string };

type Ctx = {
  busy: boolean;
  toast: (kind: ToastKind, message: string) => void;
  run: (fn: () => Promise<{ ok: boolean; errorMessage?: string }>, messages: {
    ok: string;
    fail: string;
  }) => Promise<void>;
};

const AdminUiContext = createContext<Ctx | null>(null);

function Spinner() {
  return (
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-[#ececec] border-t-[#0c78ed]"
      aria-hidden
    />
  );
}

export function AdminUiProvider({ children }: { children: React.ReactNode }) {
  const [busyCount, setBusyCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = `t-${++idRef.current}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const run = useCallback(
    async (
      fn: () => Promise<{ ok: boolean; errorMessage?: string }>,
      messages: { ok: string; fail: string },
    ) => {
      setBusyCount((c) => c + 1);
      try {
        const r = await fn();
        if (r.ok) toast("success", messages.ok);
        else toast("error", r.errorMessage ?? messages.fail);
      } catch {
        toast("error", messages.fail);
      } finally {
        setBusyCount((c) => Math.max(0, c - 1));
      }
    },
    [toast],
  );

  const value = useMemo(
    () => ({
      busy: busyCount > 0,
      toast,
      run,
    }),
    [busyCount, toast, run],
  );

  return (
    <AdminUiContext.Provider value={value}>
      {busyCount > 0 && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25"
          role="status"
          aria-live="polite"
          aria-label="Сохранение"
        >
          <div className="flex flex-col items-center gap-3 rounded-[8px] bg-white px-8 py-6 shadow-lg">
            <Spinner />
            <span className="text-sm text-[#444]">Сохранение…</span>
          </div>
        </div>
      )}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[301] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-[8px] border px-4 py-3 text-sm shadow-lg ${
              t.kind === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
      {children}
    </AdminUiContext.Provider>
  );
}

export function useAdminUi() {
  const ctx = useContext(AdminUiContext);
  if (!ctx) throw new Error("useAdminUi outside AdminUiProvider");
  return ctx;
}
