'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function VisitorCounterBadge() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalVisits: 0,
    activeIps5m: 0,
    todayUniqueIps: 0,
  });

  const displayPath = useMemo(() => pathname || '/', [pathname]);

  useEffect(() => {
    let cancelled = false;

    const logVisit = async () => {
      try {
        await fetch(`${BASE}/api/security/visits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: displayPath }),
          cache: 'no-store',
        });
      } catch {
        // Ignore logging failures in the UI layer.
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(`${BASE}/api/security/visits`, { cache: 'no-store' });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        setStats({
          totalVisits: Number(data.totalVisits || 0),
          activeIps5m: Number(data.activeIps5m || 0),
          todayUniqueIps: Number(data.todayUniqueIps || 0),
        });
      } catch {
        // Ignore errors to avoid interrupting user experience.
      }
    };

    logVisit().then(fetchStats);

    const intervalId = setInterval(fetchStats, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [displayPath]);

  return (
    <aside
      aria-label="website visitor counter"
      className="fixed bottom-3 right-3 z-[80] rounded-xl border border-white/20 bg-slate-950/85 text-slate-100 shadow-xl backdrop-blur-md px-3 py-2"
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Website Traffic</p>
      <div className="mt-1 flex items-center gap-3">
        <div>
          <p className="text-[10px] text-slate-400">ทั้งหมด</p>
          <p className="text-sm font-bold leading-none">{stats.totalVisits.toLocaleString('th-TH')}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Active 5m</p>
          <p className="text-sm font-bold leading-none text-emerald-300">{stats.activeIps5m.toLocaleString('th-TH')}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Unique วันนี้</p>
          <p className="text-sm font-bold leading-none text-sky-300">{stats.todayUniqueIps.toLocaleString('th-TH')}</p>
        </div>
      </div>
    </aside>
  );
}
