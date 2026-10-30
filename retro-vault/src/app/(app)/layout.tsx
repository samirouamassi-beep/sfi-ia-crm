import { Nav } from "@/components/nav";
import { requireUserId } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();
  return (
    <div className="md:pl-56">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-8 md:pb-10">
        {children}
      </main>
    </div>
  );
}
