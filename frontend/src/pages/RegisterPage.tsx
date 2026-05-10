import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse, OTPResponse, UploadResponse, UserRole } from '../lib/types';
import { useSessionStore } from '../store/session';

type RegisterForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  role: UserRole;
  vehicle_number: string;
};

const initialForm: RegisterForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  address: '',
  role: 'citizen',
  vehicle_number: ''
};

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPath, setBillPath] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpResponse, setOtpResponse] = useState<OTPResponse | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canRegister = useMemo(() => otpVerified && !isBusy, [isBusy, otpVerified]);

  function updateField<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadBillIfNeeded(): Promise<string | null> {
    if (!billFile || billPath) {
      return billPath;
    }
    const data = new FormData();
    data.append('file', billFile);
    const response = await api.post<UploadResponse>('/uploads/electricity-bills', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setBillPath(response.data.public_url);
    return response.data.public_url;
  }

  async function handleRequestOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const response = await api.post<OTPResponse>('/auth/otp/request', { phone: form.phone });
      setOtpResponse(response.data);
      setStatusMessage(response.data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to request OTP.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const response = await api.post<OTPResponse>('/auth/otp/verify', { phone: form.phone, code: otpCode });
      setOtpVerified(true);
      setStatusMessage(response.data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpVerified) {
      setErrorMessage('Verify the OTP before creating the account.');
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const electricity_bill_path = await uploadBillIfNeeded();
      await api.post('/auth/register', {
        ...form,
        email: form.email || null,
        vehicle_number: form.role === 'driver' ? form.vehicle_number : null,
        electricity_bill_path
      });
      const loginResponse = await api.post<LoginResponse>('/auth/login', {
        phone: form.phone,
        password: form.password
      });
      setSession(loginResponse.data.access_token, loginResponse.data.user);
      navigate(dashboardPathForRole(loginResponse.data.user.role));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsBusy(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBillFile(file);
    setBillPath(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="glass-card mx-auto max-w-2xl rounded-[2rem] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">Household verification</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Register for smart waste pickups</h1>
        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(event) => updateField('password', event.target.value)} />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.role} onChange={(event) => updateField('role', event.target.value as UserRole)}>
            <option value="citizen">Citizen</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === 'driver' ? (
            <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Vehicle number" value={form.vehicle_number} onChange={(event) => updateField('vehicle_number', event.target.value)} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">Driver registration requires a vehicle number.</div>
          )}
          <textarea className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Household address" rows={4} value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-2">
            Electricity bill upload
            <input className="mt-2 block w-full text-sm font-normal" type="file" accept=".pdf,image/*" onChange={handleFileChange} />
            <span className="mt-2 block text-xs font-normal text-slate-500">{billFile ? billFile.name : billPath ? `Uploaded: ${billPath}` : 'PDF or image proof accepted.'}</span>
          </label>
          <div className="sm:col-span-2">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter OTP" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} />
              <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white" type="button" onClick={handleRequestOtp} disabled={!form.phone || isBusy}>
                Request OTP
              </button>
              <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white" type="button" onClick={handleVerifyOtp} disabled={!otpCode || isBusy || !otpResponse}>
                Verify OTP
              </button>
            </div>
          </div>
          <button className="rounded-2xl bg-cyan-600 px-5 py-3 font-bold text-white sm:col-span-2 disabled:opacity-60" type="submit" disabled={!canRegister}>
            Complete registration
          </button>
        </form>
        {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <p className="mt-2 text-xs text-slate-500">{otpResponse ? `Delivery channel: ${otpResponse.delivery_channel}` : 'Request an OTP to begin phone verification.'}</p>
        <p className="mt-6 text-sm text-slate-600">Already registered? <Link className="font-bold text-emerald-700" to="/login">Login</Link>.</p>
      </section>
    </main>
  );
}
