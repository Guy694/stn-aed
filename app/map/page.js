'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { Heart, Search, X, MapPin, Activity } from 'lucide-react';

const MapView = dynamic(() => import('@/app/components/MapView'), { ssr: false });

export default function MapPage() {
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    // Fetch current user (silent fail if not logged in)
    fetch('/stn-aed/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => {});

    // Fetch facilities
    fetch('/stn-aed/api/facilities')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFacilities(data);
          setStats({ total: data.length, active: data.filter((f) => f.is_active).length });
        }
      })
      .catch(console.error);
  }, []);

  const filtered = facilities.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.district_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.tambon?.toLowerCase().includes(search.toLowerCase()) ||
      f.typecode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar user={user} />

      {/* Hero stats bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              แผนที่ AED จังหวัดสตูล
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              ค้นหาจุดบริการเครื่อง Automated External Defibrillator ใกล้คุณ
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">{stats.active}</span>
              <span className="text-xs text-slate-600">ใช้งาน</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-100">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-semibold text-sky-600">{stats.total}</span>
              <span className="text-xs text-slate-600">จุดทั้งหมด</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 gap-4">
        {/* Sidebar */}
        <aside className="w-72 hidden lg:flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาจุด AED..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-280px)]">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                ไม่พบข้อมูล
              </div>
            ) : (
              filtered.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">
                          {f.typecode}
                        </span>
                        <span className={`text-xs w-2 h-2 rounded-full ${f.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                      {(f.district_name || f.tambon) && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {[f.tambon, f.district_name].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 min-h-[500px] lg:min-h-0 h-[calc(100vh-200px)]">
          <MapView facilities={filtered} />
        </div>
      </div>
    </div>
  );
}
