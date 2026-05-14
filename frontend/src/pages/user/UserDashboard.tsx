import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, LocateFixed, MapPinned, MessageSquareWarning, Recycle, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { TrackingMap } from '../../components/TrackingMap';
import { api, buildTrackingSocketUrl } from '../../lib/api';
import type { Complaint, DriverLocation, Pickup, PickupStatus, Reward, WasteType } from '../../lib/types';
import { useSessionStore } from '../../store/session';

const activePickupStatuses: PickupStatus[] = ['assigned', 'in_progress'];

const initialSchedule = {
  waste_type: 'wet' as WasteType,
  scheduled_date: '',
  scheduled_time: '',
  latitude: '',
  longitude: '',
  notes: ''
};

export function UserDashboard() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [liveLocation, setLiveLocation] = useState<DriverLocation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackedPickupId, setTrackedPickupId] = useState<number | null>(null);
  const trackingPanelRef = useRef<HTMLElement | null>(null);

  const pickupsQuery = useQuery({
    queryKey: ['pickups', user?.id],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });
  const rewardsQuery = useQuery({
    queryKey: ['rewards', user?.id],
    queryFn: async () => {
      const response = await api.get<Reward[]>('/rewards', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });
  const complaintsQuery = useQuery({
    queryKey: ['complaints', user?.id],
    queryFn: async () => {
      const response = await api.get<Complaint[]>('/complaints', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });

  // Default tracked pickup: first active one, or first overall
  const defaultTrackedPickup = useMemo(
    () => pickupsQuery.data?.find((p) => activePickupStatuses.includes(p.status)) ?? pickupsQuery.data?.[0] ?? null,
    [pickupsQuery.data]
  );

  const trackedPickup = useMemo(
    () => pickupsQuery.data?.find((p) => p.id === trackedPickupId) ?? defaultTrackedPickup,
    [pickupsQuery.data, trackedPickupId, defaultTrackedPickup]
  );

  useEffect(() => {
    if (!trackedPickupId && defaultTrackedPickup) {
      setTrackedPickupId(defaultTrackedPickup.id);
    }
  }, [defaultTrackedPickup, trackedPickupId]);

  const trackingQuery = useQuery({
    queryKey: ['tracking', trackedPickup?.id],
    queryFn: async () => {
      const response = await api.get<DriverLocation[]>(`/tracking/pickups/${trackedPickup?.id}/locations`);
      return response.data;
    },
    enabled: Boolean(trackedPickup),
    refetchInterval: 5000
  });

  useEffect(() => {
    setLiveLocation(null);
    if (!trackedPickup?.id) return undefined;
    let socket: WebSocket;
    let alive = true;

    function connect() {
      if (!alive) return;
      socket = new WebSocket(buildTrackingSocketUrl(trackedPickup!.id));
      socket.onopen = () => { try { socket.send('subscribe'); } catch { /* ignore */ } };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; payload?: DriverLocation };
          if (data.type === 'driver-location' && data.payload) {
            setLiveLocation(data.payload);
          }
        } catch { /* ignore malformed frames */ }
      };
      socket.onclose = () => {
        // Reconnect after 3 s if component is still mounted
        if (alive) setTimeout(connect, 3000);
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      alive = false;
      socket?.close();
    };
  }, [trackedPickup?.id]);

  const createPickup = useMutation({
    mutationFn: async () => {
      if (!user) return;
      setError(null);
      setMessage(null);
      await api.post('/pickups', {
        user_id: user.id,
        waste_type: schedule.waste_type,
        scheduled_date: schedule.scheduled_date,
        scheduled_time: schedule.scheduled_time,
        coordinates: schedule.latitude && schedule.longitude ? {
          latitude: Number(schedule.latitude),
          longitude: Number(schedule.longitude)
        } : null,
        notes: schedule.notes || null
      });
    },
    onSuccess: async () => {
      setMessage('Pickup scheduled successfully.');
      setSchedule(initialSchedule);
      await queryClient.invalidateQueries({ queryKey: ['pickups', user?.id] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to schedule pickup.');
    }
  });

  if (!user) {
    return <EmptyState title="Login required" description="Sign in to schedule pickups, upload bills, and watch live driver tracking." />;
  }

  const rewards = rewardsQuery.data ?? [];
  const complaints = complaintsQuery.data ?? [];
  const pickups = pickupsQuery.data ?? [];
  const latestDriverLocation = liveLocation ?? trackingQuery.data?.at(-1) ?? null;
  const rewardPoints = rewards.reduce((total, reward) => total + reward.points, 0);
  const pickupLocation = trackedPickup?.coordinates ?? null;

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Upcoming pickups" value={String(pickups.length)} icon={Truck} />
        <StatCard label="Reward points" value={String(rewardPoints)} icon={Gift} tone="amber" />
        <StatCard label="Tracked routes" value={latestDriverLocation ? 'Live' : 'Pending'} icon={MapPinned} tone="blue" />
        <StatCard label="Open complaints" value={String(complaints.filter((item) => item.status === 'open').length)} icon={MessageSquareWarning} tone="rose" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-slate-950">Schedule Pickup</h2>
          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createPickup.mutateAsync();
            }}
          >
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={schedule.waste_type} onChange={(event) => setSchedule((current) => ({ ...current, waste_type: event.target.value as WasteType }))}>
              <option value="wet">Wet waste</option>
              <option value="dry">Dry waste</option>
              <option value="e-waste">E-waste</option>
              <option value="bulky">Bulky</option>
            </select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={schedule.scheduled_date} onChange={(event) => setSchedule((current) => ({ ...current, scheduled_date: event.target.value }))} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="time" value={schedule.scheduled_time} onChange={(event) => setSchedule((current) => ({ ...current, scheduled_time: event.target.value }))} />
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:col-span-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Latitude" value={schedule.latitude} onChange={(event) => setSchedule((current) => ({ ...current, latitude: event.target.value }))} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Longitude" value={schedule.longitude} onChange={(event) => setSchedule((current) => ({ ...current, longitude: event.target.value }))} />
              <button
                className="rounded-2xl bg-slate-200 px-4 py-3 font-bold text-slate-900 whitespace-nowrap"
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage('Fetching your current GPS location...');

                    if (!window.isSecureContext) {
                      setError('Location access requires HTTPS or localhost.');
                      setMessage(null);
                      return;
                    }

                    if (!navigator.geolocation) {
                      setError('Geolocation is not supported in this browser.');
                      setMessage(null);
                      return;
                    }

                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const latitude = position.coords.latitude.toFixed(6);
                        const longitude = position.coords.longitude.toFixed(6);

                        if (
                          !latitude ||
                          !longitude ||
                          Number.isNaN(Number(latitude)) ||
                          Number.isNaN(Number(longitude))
                        ) {
                          setError('Invalid GPS coordinates received.');
                          setMessage(null);
                          return;
                        }

                        setSchedule((current) => ({
                          ...current,
                          latitude,
                          longitude
                        }));

                        setError(null);
                        setMessage('Location captured successfully.');
                      },
                      (geoError) => {
                        let msg = 'Unable to fetch your current location.';

                        switch (geoError.code) {
                          case geoError.PERMISSION_DENIED:
                            msg = 'Location permission denied. Please allow GPS access.';
                            break;
                          case geoError.POSITION_UNAVAILABLE:
                            msg = 'GPS signal unavailable. Try moving outdoors.';
                            break;
                          case geoError.TIMEOUT:
                            msg = 'Location request timed out. Try again.';
                            break;
                        }

                        setError(msg);
                        setMessage(null);
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 10000
                      }
                    )
                }}
              >
                <LocateFixed className="mr-2 inline h-4 w-4" />Use my location
              </button>
            </div>
            <textarea className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Pickup notes" rows={3} value={schedule.notes} onChange={(event) => setSchedule((current) => ({ ...current, notes: event.target.value }))} />
            <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white sm:col-span-2" disabled={createPickup.isPending}>
              Schedule
            </button>
          </form>
          {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        </article>
        <article ref={trackingPanelRef} className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Live route tracking</h2>
              <p className="text-slate-600">OpenStreetMap live view — select a pickup to track its driver.</p>
            </div>
            <Recycle className="h-10 w-10 text-emerald-600" />
          </div>
          {pickups.length > 0 ? (
            <select
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              value={trackedPickupId ?? ''}
              onChange={(event) => setTrackedPickupId(Number(event.target.value))}
            >
              {pickups.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>
                  #{pickup.id} · {pickup.waste_type} · {pickup.status} · {pickup.scheduled_date}
                </option>
              ))}
            </select>
          ) : null}
          <div className="mt-4">
            <TrackingMap
              pickupLocation={pickupLocation}
              driverLocation={latestDriverLocation ? { latitude: latestDriverLocation.latitude, longitude: latestDriverLocation.longitude } : null}
              history={(trackingQuery.data ?? []).map((item) => ({ latitude: item.latitude, longitude: item.longitude }))}
              focusMode="driver"
            />
          </div>
          {trackedPickup && !trackedPickup.coordinates ? (
            <p className="mt-3 text-xs text-slate-500">No pickup coordinates set for this request. Ask the citizen to re-schedule with a location.</p>
          ) : null}
        </article>
      </div>
      {pickups.length ? (
        <article className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-slate-950">Scheduled pickups</h2>
          <div className="mt-5 grid gap-3">
            {pickups.map((pickup) => (
              <div key={pickup.id} className="flex flex-col gap-2 rounded-2xl bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{pickup.waste_type} · {pickup.status}</p>
                  <p className="text-sm text-slate-600">{pickup.scheduled_date} at {pickup.scheduled_time}</p>
                  <p className="text-sm text-slate-500">Driver: {pickup.driver_id ?? 'Auto-assignment pending'}</p>
                </div>
                <button
                  className={`rounded-2xl px-5 py-2 text-sm font-bold ${trackedPickupId === pickup.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}
                  type="button"
                  onClick={() => {
                    setTrackedPickupId(pickup.id);
                    trackingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <MapPinned className="mr-1 inline h-4 w-4" />{trackedPickupId === pickup.id ? 'Tracking' : 'Track'}
                </button>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <EmptyState title="No pickups yet" description="Schedule your first pickup to unlock live tracking and analytics." />
      )}
      <article className="glass-card rounded-[2rem] p-6">
        <div className="flex items-center gap-3">
          <MessageSquareWarning className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-black text-slate-950">In-App Chat (SMS)</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">Send an instant SMS to any registered driver or official using Fast2SMS.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-[1fr_2fr_auto]" onSubmit={async (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          const phone = (target.elements.namedItem('phone') as HTMLInputElement).value;
          const msg = (target.elements.namedItem('message') as HTMLInputElement).value;
          try {
            await api.post('/chat/send', { phone, message: msg, user_id: user.id });
            alert('SMS Message Sent successfully!');
            target.reset();
          } catch {
            alert('Failed to send SMS message.');
          }
        }}>
          <input name="phone" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone Number (10 digits)" required />
          <input name="message" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Type your message..." required />
          <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white">Send SMS</button>
        </form>
      </article>
      <p className="text-sm text-slate-500">Need a driver account to push live coordinates? <Link className="font-bold text-emerald-700" to="/register">Create one here.</Link></p>
    </section>
  );
}

