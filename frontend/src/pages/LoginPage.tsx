import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse, UserRole } from '../lib/types';
import { useSessionStore } from '../store/session';

export function LoginPage() {
  const navigate = useNavigate();
  const { role } = useParams<{ role?: string }>();
  const setSession = useSessionStore((state) => state.setSession);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedRole = useMemo(() => {
    const candidate = role as UserRole | undefined;
    return candidate === 'citizen' || candidate === 'driver' || candidate === 'admin' ? candidate : undefined;
  }, [role]);

  const headingText = requestedRole ? `Login as ${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)}` : 'Login to EcoSync';
  const helperText = requestedRole
    ? `Use your ${requestedRole} credentials and the system will route you to the correct dashboard.`
    : 'Use your phone number and password to sign in.';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await api.post<LoginResponse>('/auth/login', { phone, password });
      setSession(response.data.access_token, response.data.user);
      navigate(dashboardPathForRole(response.data.user.role));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10">
      <section className="glass-card w-full max-w-md rounded-[2rem] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">Welcome back</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">{headingText}</h1>
        <p className="mt-2 text-sm text-slate-600">{helperText}</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Phone
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <div className="flex items-center justify-between gap-4">
            <Link className="text-sm font-bold text-emerald-700" to="/forgot-password">Forgot password?</Link>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>Login</button>
          </div>
        </form>
        {errorMessage ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <p className="mt-6 text-sm text-slate-600">New household? <Link className="font-bold text-emerald-700" to="/register">Register here</Link>.</p>
      </section>
    </main>
  );
}
