/** Matrice probabilité × impact (4 × 4) : nombre de risques par case. */
export function MatriceRisques({ risques }: { risques: { id: string; probabilite: number; impact: number }[] }) {
  const niveaux = [4, 3, 2, 1];
  return (
    <div>
      <div className="flex">
        <div className="flex w-6 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
            Probabilité
          </span>
        </div>
        <div className="grid flex-1 grid-cols-4 gap-1">
          {niveaux.map((p) =>
            [1, 2, 3, 4].map((i) => {
              const n = risques.filter((r) => r.probabilite === p && r.impact === i).length;
              const score = p * i;
              const fond = score >= 9 ? "bg-red-200" : score >= 4 ? "bg-amber-100" : "bg-emerald-50";
              return (
                <div key={`${p}-${i}`} className={`flex aspect-square items-center justify-center rounded ${fond}`}>
                  {n > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {n}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-1 pl-6 text-center text-[10px] uppercase tracking-wide text-slate-500">Impact</div>
    </div>
  );
}
