import { Suspense } from "react";
import { ExportMenu } from "@/components/export-menu";
import { Nav } from "@/components/nav";
import { requireUserId } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();
  return (
    <div className="md:pl-56">
      <Nav />
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 md:justify-end md:px-8">
          <p className="text-sm font-semibold tracking-wide md:hidden">
            RETRO<span className="text-accent">VAULT</span>
          </p>
          <Suspense>
            <ExportMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:px-8 md:pb-10">{children}</main>
    </div>
  );
}
