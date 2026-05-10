import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'green' | 'blue' | 'amber' | 'rose';
};

const toneClasses = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700'
};

export function StatCard({ label, value, icon: Icon, tone = 'green' }: StatCardProps) {
  return (
    <article className="glass-card rounded-3xl p-5">
      <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
    </article>
  );
}
