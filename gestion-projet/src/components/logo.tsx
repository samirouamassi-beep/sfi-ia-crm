export function Logo({ taille = 28 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <rect x="7" y="9" width="12" height="3.5" rx="1.75" fill="#fff" />
      <rect x="11" y="14.5" width="14" height="3.5" rx="1.75" fill="#c7d2fe" />
      <rect x="7" y="20" width="9" height="3.5" rx="1.75" fill="#fff" />
    </svg>
  );
}
