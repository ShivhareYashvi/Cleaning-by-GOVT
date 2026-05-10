export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse rounded-3xl p-5">
      <div className="mb-4 h-5 w-1/3 rounded-full bg-slate-200" />
      <div className="h-8 w-2/3 rounded-full bg-slate-200" />
      <div className="mt-6 h-24 rounded-2xl bg-slate-200" />
    </div>
  );
}
