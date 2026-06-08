'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut, Menu, X, Shield } from 'lucide-react';
import { apiFetch, publicPath } from '@/app/lib/client-api';

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isActive = (path) => pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/map" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
             <Image src={publicPath('/img/logo.png')} alt="AED Icon" width={40} height={40} className="w-10 h-10" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">ระบบติดตามจุดบริการสาธารณสุข จังหวัดสตูล</p>
              <p className="text-xs text-slate-500 leading-tight">สำนักงานสาธารณสุขจังหวัดสตูล</p>
            </div>
          </Link>

     
        

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-slate-600">{user.fullName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 transition-all duration-200 shadow-lg hover:shadow-sky-500/25"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden min-h-11 min-w-11 rounded-xl text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={menuOpen}
            aria-controls="mobile-main-menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id="mobile-main-menu" className="md:hidden pb-4 space-y-1 border-t border-slate-200 pt-3">
          
            {user ? (
              <button
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-700 transition-all hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-sky-700 transition-all hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
