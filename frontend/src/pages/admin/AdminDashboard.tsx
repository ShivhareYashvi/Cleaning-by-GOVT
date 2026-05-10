import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CircleAlert, Download, Truck, UsersRound } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '../../components/StatCard';
import { API_BASE_URL, api } from '../../lib/api';
import type { AnalyticsSummary, Driver, Pickup } from '../../lib/types';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [pickupId, setPickupId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyticsQuery = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await api.get<AnalyticsSummary>('/analytics/summary');
      return response.data;
    }
  });
  const pickupsQuery = useQuery({
    queryKey: ['admin-pickups'],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups');
      return response.data;
    }
  });
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get<Driver[]>('/drivers');
      return response.data;
    }
  });

  const assignPickup = useMutation({
    mutationFn: async () => {
      await api.patch(`/pickups/${pickupId}/assign`, { driver_id: Number(driverId) });
    },
    onSuccess: async () => {
      setMessage('Pickup assigned to driver.');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-pickups'] }),
        queryClient.invalidateQueries({ queryKey: ['drivers'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      ]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to assign pickup.');
    }
  });

  const analytics = analyticsQuery.data;
  const pickups = useMemo(() => pickupsQuery.data ?? [], [pickupsQuery.data]);
  const drivers = driversQuery.data ?? [];
  const unassignedPickups = pickups.filter((pickup) => pickup.driver_id === null);
  const uniqueUserCount = useMemo(() => new Set(pickups.map((pickup) => pickup.user_id)).size, [pickups]);

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Verified users" value={String(uniqueUserCount)} icon={UsersRound} />
        <StatCard label="Active drivers" value={String(drivers.filter((driver) => driver.availability === 'on_route').length)} icon={Truck} tone="blue" />
        <StatCard label="Open complaints" value={String(analytics?.complaint_trends.find((item) => item.label === 'open')?.value ?? 0)} icon={CircleAlert} tone="rose" />
        <StatCard label="Pickup efficiency" value={`${analytics?.pickup_efficiency.value ?? 0}%`} icon={BarChart3} tone="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Area-wise analytics</h2>
              <p className="text-slate-600">Pandas-powered summary of persisted pickups and complaints.</p>
            </div>
            <a className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white" href={`${API_BASE_URL}/analytics/export.csv`} target="_blank" rel="noreferrer">
              <Download className="mr-2 inline h-4 w-4" />CSV export
            </a>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.area_wise_pickups ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-slate-950">Dispatch console</h2>
          <div className="mt-6 grid gap-3">
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={pickupId} onChange={(event) => setPickupId(event.target.value)}>
              <option value="">Select pickup</option>
              {unassignedPickups.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>#{pickup.id} · {pickup.waste_type} · {pickup.scheduled_date}</option>
              ))}
            </select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={driverId} onChange={(event) => setDriverId(event.target.value)}>
              <option value="">Select driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>Driver #{driver.id} · {driver.vehicle_number} · {driver.availability}</option>
              ))}
            </select>
            <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white" type="button" onClick={() => void assignPickup.mutateAsync()} disabled={!pickupId || !driverId}>
              Assign pickup
            </button>
          </div>
          {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-6 grid gap-3">
            {(analytics?.waste_distribution ?? []).map((point) => (
              <div key={point.waste_type} className="rounded-2xl bg-white/80 p-4">
                <p className="font-bold text-slate-900">{point.waste_type}</p>
                <p className="text-sm text-slate-500">{point.requests} requests</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
