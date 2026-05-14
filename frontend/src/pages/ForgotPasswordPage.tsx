import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse, OTPResponse } from '../lib/types';
import { useSessionStore } from '../store/session';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleRequestOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const response = await api.post<OTPResponse>('/auth/forgot-password', { phone });
      setStatusMessage(response.data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to request OTP.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const response = await api.post<LoginResponse>('/auth/forgot-password/reset', {
        phone,
        code: otpCode,
        new_password: newPassword
      });
      setSession(response.data.access_token, response.data.user);
      navigate(dashboardPathForRole(response.data.user.role));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10">
      <section className="glass-card w-full max-w-md rounded-[2rem] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">Reset password</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Recover access with OTP</h1>
        <form className="mt-8 grid gap-4" onSubmit={handleReset}>
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
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white" type="button" onClick={handleRequestOtp} disabled={!phone || isBusy}>
              Request OTP
            </button>
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="OTP code"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            New password
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
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
          <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60" type="submit" disabled={!phone || !otpCode || !newPassword || isBusy}>
            Reset password
          </button>
        </form>
        {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <p className="mt-6 text-sm text-slate-600">Remembered your password? <Link className="font-bold text-emerald-700" to="/login">Login</Link>.</p>
      </section>
    </main>
  );
}
