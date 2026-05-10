import { Recycle } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session';

const links = [
  { to: '/dashboard/user', label: 'Citizen' },
  { to: '/dashboard/driver', label: 'Driver' },
  { to: '/dashboard/admin', label: 'Admin' },
  { to: '/features', label: 'Features' }
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="glass-card mb-6 flex flex-col gap-4 rounded-[2rem] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">EcoSync Command Center</p>
              <h1 className="text-xl font-black text-slate-950">Municipal waste operations</h1>
              <p className="text-sm text-slate-500">{user ? `${user.name} · ${user.role}` : 'Sign in to enable live workflows.'}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-slate-950 text-white' : 'bg-white/70 text-slate-700 hover:bg-white'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex gap-2">
              <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700" type="button" onClick={() => navigate('/login')}>
                {user ? 'Switch account' : 'Login'}
              </button>
              {user ? (
                <button
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white"
                  type="button"
                  onClick={() => {
                    clearSession();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </main>
  );
}
