import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function AppShell({
  children,
  showHeader = true,
}: {
  children: ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {showHeader ? <Header /> : null}
      <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
