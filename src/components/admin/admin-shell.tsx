"use client";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminUiProvider } from "@/context/admin-ui-context";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminUiProvider>
      <main className="w-full max-w-none flex-1 px-5 py-8 sm:px-8 lg:px-12">
        <h1 className="mb-2 text-3xl font-semibold">Панель администратора</h1>
        <AdminTabs />
        {children}
      </main>
    </AdminUiProvider>
  );
}
