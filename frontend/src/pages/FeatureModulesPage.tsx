import { Gift, MapPinned, MessageSquareWarning, Recycle, Truck } from 'lucide-react';

const modules = [
  { title: 'Pickup scheduling', icon: Truck, text: 'Create pickup requests with duplicate prevention by date and waste type.' },
  { title: 'Complaint management', icon: MessageSquareWarning, text: 'Submit civic complaints with image references and status tracking.' },
  { title: 'Rewards', icon: Gift, text: 'Earn and redeem points for recycling participation and completed pickups.' },
  { title: 'Route visualization', icon: MapPinned, text: 'View collection routes and driver assignment progress.' },
  { title: 'Recycling analytics', icon: Recycle, text: 'Monitor waste distribution, efficiency, area trends, and participation.' }
];

export function FeatureModulesPage() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map(({ title, icon: Icon, text }) => (
        <article key={title} className="glass-card rounded-[2rem] p-6">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon className="h-6 w-6" /></div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-slate-600">{text}</p>
        </article>
      ))}
    </section>
  );
}
