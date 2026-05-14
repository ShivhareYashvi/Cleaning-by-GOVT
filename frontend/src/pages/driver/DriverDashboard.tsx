import { useEffect, useRef, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LocateFixed, MapPinned, Navigation, PackageCheck, Truck } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { TrackingMap } from '../../components/TrackingMap';
import { api } from '../../lib/api';
import type { DriverLocation, Pickup, PickupStatus } from '../../lib/types';
import { useSessionStore } from '../../store/session';

export function DriverDashboard() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState<PickupStatus>('in_progress');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latRef = useRef('');
  const lngRef = useRef('');

  const pickupsQuery = useQuery({
    queryKey: ['driver-pickups', user?.driver_id],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups', { params: { driver_id: user?.driver_id } });
      return response.data;
    },
    enabled: Boolean(user?.driver_id)
  });

  const selectedPickup = useMemo(
    () => pickupsQuery.data?.find((pickup) => pickup.id === selectedPickupId) ?? pickupsQuery.data?.[0] ?? null,
    [pickupsQuery.data, selectedPickupId]
  );

  useEffect(() => {
    if (!selectedPickupId && pickupsQuery.data?.length) {
      setSelectedPickupId(pickupsQuery.data[0].id);
      setStatus(pickupsQuery.data[0].status);
    }
  }, [pickupsQuery.data, selectedPickupId]);

  // Keep refs in sync with state so the interval always reads current coords
  useEffect(() => { latRef.current = latitude; }, [latitude]);
  useEffect(() => { lngRef.current = longitude; }, [longitude]);

  // Start/stop continuous GPS tracking
  useEffect(() => {
      // Always clear existing watches/intervals first
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!trackingActive) {
        return;
      }
      if (!selectedPickup || !user?.driver_id) return;
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            setLatitude(lat);
            setLongitude(lng);
            latRef.current = lat;
            lngRef.current = lng;
            setError(null);
          },
          (geoError) => setMessage(`GPS: ${geoError.message}. Using last known coordinates.`),
          { enableHighAccuracy: false, maximumAge: 10000 }
        );
      } else {
        setMessage('GPS unavailable. Auto-tracking will use the coordinates entered above.');
      }
      intervalRef.current = setInterval(async () => {
        if (!latRef.current || !lngRef.current) return;
        try {
          await api.post(`/tracking/pickups/${selectedPickup.id}/locations`, {
            driver_id: user.driver_id,
            latitude: Number(latRef.current),
            longitude: Number(lngRef.current),
            status,
            note: note || null
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['driver-tracking', selectedPickup.id] }),
            queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] })
          ]);
        } catch {
          // silently ignore intermittent push failures during auto-track
        }
      }, 10000); // push every 10 seconds
      return () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (intervalRef.current !== null) clearInterval(intervalRef.current);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackingActive, selectedPickup?.id, user?.driver_id, status, note]);
    queryKey: ['driver-tracking', selectedPickup?.id],
    queryFn: async () => {
      const response = await api.get<DriverLocation[]>(`/tracking/pickups/${selectedPickup?.id}/locations`);
      return response.data;
    },
    enabled: Boolean(selectedPickup)
  });

  const updateStatus = useMutation({
    mutationFn: async (nextStatus: PickupStatus) => {
      if (!selectedPickup) {
        return;
      }
      await api.patch(`/pickups/${selectedPickup.id}/status`, { status: nextStatus, notes: note || null });
    },
    onSuccess: async () => {
      setMessage('Pickup status updated.');
      await queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update pickup status.');
    }
  });

  const sendLocation = useMutation({
    mutationFn: async () => {
      if (!selectedPickup || !user?.driver_id) {
        return;
      }
      await api.post(`/tracking/pickups/${selectedPickup.id}/locations`, {
        driver_id: user.driver_id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status,
        note: note || null
      });
    },
    onSuccess: async () => {
      setMessage('Live location pushed to subscribers.');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver-tracking', selectedPickup?.id] }),
        queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] })
      ]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to publish the live location.');
    }
  });

  if (!user) {
    return <EmptyState title="Login required" description="Sign in as a driver to stream live route updates." />;
  }

  if (!user.driver_id) {
    return <EmptyState title="Driver profile missing" description="Register a driver account with a vehicle number to access live tracking tools." />;
  }

  const pickups = pickupsQuery.data ?? [];
  const history = trackingQuery.data ?? [];
  const latestLocation = history.at(-1);
  const completed = pickups.filter((pickup) => pickup.status === 'completed').length;

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned pickups" value={String(pickups.length)} icon={Truck} />
        <StatCard label="Completed today" value={String(completed)} icon={PackageCheck} tone="blue" />
        <StatCard label="Route efficiency" value={pickups.length ? `${Math.round((completed / pickups.length) * 100)}%` : '0%'} icon={Navigation} tone="amber" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Route Management</h2>
              <p className="text-slate-600">Push live coordinates and update pickup status in real time.</p>
            </div>
            <MapPinned className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="mt-6 grid gap-3">
            {pickups.map((pickup) => (
              <button
                key={pickup.id}
                className={`flex items-center justify-between rounded-2xl p-4 text-left ${selectedPickup?.id === pickup.id ? 'bg-slate-950 text-white' : 'bg-white/80 text-slate-800'}`}
                type="button"
                onClick={() => {
                  setSelectedPickupId(pickup.id);
                  setStatus(pickup.status);
                }}
              >
                <span className="font-bold">#{pickup.id} · {pickup.waste_type}</span>
                <span className="text-sm">{pickup.status}</span>
              </button>
            ))}
          </div>
          {selectedPickup ? (
            <div className="mt-6 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={status} onChange={(event) => setStatus(event.target.value as PickupStatus)}>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-900"
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
                        const lat = position.coords.latitude.toFixed(6);
                        const lng = position.coords.longitude.toFixed(6);

                        if (
                          !lat ||
                          !lng ||
                          Number.isNaN(Number(lat)) ||
                          Number.isNaN(Number(lng))
                        ) {
                          setError('Invalid GPS coordinates received.');
                          setMessage(null);
                          return;
                        }

                        setLatitude(lat);
                        setLongitude(lng);

                        latRef.current = lat;
                        lngRef.current = lng;

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
                    );
                  }}
                >
                  <LocateFixed className="mr-2 inline h-4 w-4" />Use my location
                </button>
              </div>
              <textarea className="rounded-2xl border border-slate-200 px-4 py-3" rows={3} placeholder="Status note" value={note} onChange={(event) => setNote(event.target.value)} />
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  className={`rounded-2xl px-5 py-3 font-bold text-white ${trackingActive ? 'bg-rose-600' : 'bg-emerald-600'}`}
                  type="button"
                  onClick={() => {
                    setTrackingActive((prev) => {
                      if (!prev) setMessage('Auto-tracking started. Location is pushed every 10 s.');
                      else setMessage('Auto-tracking stopped.');
                      return !prev;
                    });
                  }}
                >
                  {trackingActive ? 'Stop auto-tracking' : 'Start auto-tracking'}
                </button>
                <button className="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-900" type="button" onClick={() => void sendLocation.mutateAsync()}>
                  Send once
                </button>
              </div>
              <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white" type="button" onClick={() => void updateStatus.mutateAsync(status)}>
                Save status
              </button>
            </div>
          ) : null}
          {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        </article>
        <article className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-slate-950">Live map</h2>
          <p className="text-slate-600">Driver route renders on OpenStreetMap with streamed coordinates.</p>
          <div className="mt-6">
            <TrackingMap
              pickupLocation={selectedPickup?.coordinates ?? null}
              driverLocation={latestLocation ? { latitude: latestLocation.latitude, longitude: latestLocation.longitude } : null}
              history={history.map((item) => ({ latitude: item.latitude, longitude: item.longitude }))}
              focusMode="both"
              showHistory={false}
            />
          </div>
          {selectedPickup && !selectedPickup.coordinates ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              Pickup coordinates are missing for this request. Ask the citizen to schedule with location so routing can lock onto the waste pickup point.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
