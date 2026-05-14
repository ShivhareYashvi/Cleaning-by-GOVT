import { ArrowRight, BarChart3, MapPinned, Recycle, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';

const metrics = [
  { label: 'Smart pickups', value: '24/7', icon: Truck, tone: 'green' as const },
  { label: 'Verified households', value: '18k+', icon: ShieldCheck, tone: 'blue' as const },
  { label: 'Waste streams', value: '4', icon: Recycle, tone: 'green' as const },
  { label: 'Live insights', value: '99%', icon: BarChart3, tone: 'amber' as const }
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <section className="relative isolate px-6 py-10 sm:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-ecosync-gradient opacity-90" />
        <div className="absolute left-1/2 top-10 -z-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-xl">
          <Link className="flex items-center gap-3" to="/">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-emerald-600">
              <Recycle className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">EcoSync</span>
          </Link>
          <Link className="hidden rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-civic-mint sm:inline-flex" to="/login">
            Login
            <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Cleaner neighborhoods with intelligent pickup coordination.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-50/90">
              EcoSync connects citizens, drivers, and municipal administrators with verified households, pickup scheduling, complaints, rewards, route visibility, and analytics.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white shadow-xl transition hover:-translate-y-0.5" to="/register">
                Register household <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="grid gap-3">
                <Link className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25" to="/login/citizen">
                  Citizen login
                </Link>
                <Link className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25" to="/login/driver">
                  Driver login
                </Link>
                <Link className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25" to="/login/admin">
                  Municipal login
                </Link>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 text-slate-900">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-200">Live route</p>
                  <h2 className="text-2xl font-bold">Ward 12 Collection</h2>
                </div>
                <MapPinned className="h-8 w-8 text-emerald-300" />
              </div>
              <div className="grid gap-3">
                {['Verified request', 'Driver assigned', 'Wet waste collected', 'Reward issued'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400 font-bold text-slate-950">{index + 1}</span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
