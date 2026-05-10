import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse } from '../lib/types';
import { useSessionStore } from '../store/session';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <h1 className="mt-3 text-3xl font-black text-slate-950">Login to EcoSync</h1>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">Phone<input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="+1 555 0100" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">Password<input className="rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>Login</button>
        </form>
        {errorMessage ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <p className="mt-6 text-sm text-slate-600">New household? <Link className="font-bold text-emerald-700" to="/register">Register here</Link>.</p>
      </section>
    </main>
  );
}
