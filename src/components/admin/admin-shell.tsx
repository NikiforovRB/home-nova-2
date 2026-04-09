"use client";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminUiProvider } from "@/context/admin-ui-context";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminUiProvider>
      <main className="flex-1 py-8">
        <div className="container-1600">
          <h1 className="mb-2 text-3xl font-semibold">Панель администратора</h1>
          <AdminTabs />
          {children}
        </div>
      </main>
    </AdminUiProvider>
  );
}
