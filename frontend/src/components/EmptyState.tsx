import { Inbox } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
