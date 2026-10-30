"use client";

import { useState } from "react";
import { Button } from "./ui";

/** Partage natif du PNG (Web Share API niveau 2, iOS/Android) avec repli téléchargement. */
export function ShareActions({ src }: { src: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], "ma-collection-retro.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Ma collection rétro" });
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus("Partage impossible, utilisez le téléchargement.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={share}>Partager</Button>
        <a href={src} download="ma-collection-retro.png" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-sm">
          Télécharger
        </a>
      </div>
      {status && <p className="text-xs text-bad">{status}</p>}
    </div>
  );
}
